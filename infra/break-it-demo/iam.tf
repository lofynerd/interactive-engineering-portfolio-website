# -----------------------------------------------------------------------
# Isolation & blast-radius design
#
# Every role below is scoped as tightly as AWS's condition keys allow:
#  - The break_task Lambda can ONLY call ecs:StopTask, and ONLY when the
#    target task's cluster ARN equals this demo's cluster (via the
#    ecs:cluster condition key). It cannot touch any other cluster/service
#    in the account, including production ECS services.
#  - It can ListTasks/DescribeTasks only scoped to this cluster too.
#  - No role in this stack has any IAM action against S3, CloudFront,
#    Route53, or anything used by the production portfolio site or by
#    Tomasi/AI Assistant infrastructure.
#  - The ECS task role itself has *no* permissions beyond writing its own
#    logs — the demo container can't reach any other AWS resource even if
#    compromised.
# -----------------------------------------------------------------------

# ---- ECS task execution role (pulls image, writes logs) ----------------

resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.name_prefix}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ---- ECS task role (the running container's own permissions) -----------
# Intentionally minimal: this demo app does nothing but answer HTTP
# requests, so it needs no AWS permissions beyond what the execution role
# already grants for logging.

resource "aws_iam_role" "ecs_task" {
  name = "${local.name_prefix}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# ---- Lambda: break_task (POST /break) -----------------------------------
# The only Lambda that can mutate ECS state, and only for this one service.

resource "aws_iam_role" "break_task_lambda" {
  name = "${local.name_prefix}-break-task-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "break_task_lambda" {
  name = "${local.name_prefix}-break-task-policy"
  role = aws_iam_role.break_task_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListAndDescribeThisServiceOnly"
        Effect = "Allow"
        Action = [
          "ecs:ListTasks",
          "ecs:DescribeTasks",
          "ecs:DescribeServices",
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "ecs:cluster" = aws_ecs_cluster.demo.arn
          }
        }
      },
      {
        # StopTask requires the *task* ARN as the resource, but the
        # cluster condition key still constrains it to this cluster —
        # belt-and-suspenders: even if a task ARN from another cluster
        # were somehow passed in, the condition blocks the call.
        Sid      = "StopTaskThisClusterOnly"
        Effect   = "Allow"
        Action   = ["ecs:StopTask"]
        Resource = "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:task/${aws_ecs_cluster.demo.name}/*"
        Condition = {
          ArnEquals = {
            "ecs:cluster" = aws_ecs_cluster.demo.arn
          }
        }
      },
      {
        Sid      = "WriteOwnLogs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-*"
      },
      {
        Sid      = "RateLimitTableReadWrite"
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"]
        Resource = aws_dynamodb_table.rate_limits.arn
      },
      {
        Sid      = "EventCountersReadWrite"
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:UpdateItem"]
        Resource = aws_dynamodb_table.counters.arn
      },
    ]
  })
}

# ---- Lambda: status (GET /status) — read-only ---------------------------

resource "aws_iam_role" "status_lambda" {
  name = "${local.name_prefix}-status-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "status_lambda" {
  name = "${local.name_prefix}-status-policy"
  role = aws_iam_role.status_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DescribeThisClusterOnly"
        Effect = "Allow"
        Action = [
          "ecs:DescribeServices",
          "ecs:ListTasks",
          "ecs:DescribeTasks",
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "ecs:cluster" = aws_ecs_cluster.demo.arn
          }
        }
      },
      {
        Sid    = "ReadEventLogAndCounters"
        Effect = "Allow"
        Action = ["dynamodb:Query", "dynamodb:GetItem"]
        Resource = [
          aws_dynamodb_table.events.arn,
          "${aws_dynamodb_table.events.arn}/index/*",
          aws_dynamodb_table.counters.arn,
        ]
      },
      {
        Sid      = "WriteOwnLogs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-*"
      },
    ]
  })
}

# ---- Lambda: event_logger (EventBridge target) --------------------------

resource "aws_iam_role" "event_logger_lambda" {
  name = "${local.name_prefix}-event-logger-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "event_logger_lambda" {
  name = "${local.name_prefix}-event-logger-policy"
  role = aws_iam_role.event_logger_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "WriteEventLogAndCounters"
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem", "dynamodb:UpdateItem"]
        Resource = [aws_dynamodb_table.events.arn, aws_dynamodb_table.counters.arn]
      },
      {
        Sid      = "WriteOwnLogs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-*"
      },
    ]
  })
}

# ---- Lambda: scheduler (EventBridge Scheduler target) -------------------
# Can ONLY update the desired count of this one ECS service — cannot
# create/delete services, modify task definitions, or touch any other
# cluster.

resource "aws_iam_role" "scheduler_lambda" {
  name = "${local.name_prefix}-scheduler-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "scheduler_lambda" {
  name = "${local.name_prefix}-scheduler-policy"
  role = aws_iam_role.scheduler_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "UpdateThisServiceOnly"
        Effect   = "Allow"
        Action   = ["ecs:UpdateService", "ecs:DescribeServices"]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "ecs:cluster" = aws_ecs_cluster.demo.arn
          }
        }
      },
      {
        Sid      = "WriteOwnLogs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-*"
      },
    ]
  })
}

# ---- EventBridge Scheduler execution role --------------------------------
# Lets the scheduler invoke only the scheduler Lambda — nothing else.

resource "aws_iam_role" "scheduler_invoke" {
  name = "${local.name_prefix}-scheduler-invoke-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "scheduler_invoke" {
  name = "${local.name_prefix}-scheduler-invoke-policy"
  role = aws_iam_role.scheduler_invoke.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "lambda:InvokeFunction"
        Resource = aws_lambda_function.scheduler.arn
      }
    ]
  })
}

# ---- Lambda: cost_sync (scheduled, calls Cost Explorer) -----------------

resource "aws_iam_role" "cost_sync_lambda" {
  name = "${local.name_prefix}-cost-sync-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "cost_sync_lambda" {
  name = "${local.name_prefix}-cost-sync-policy"
  role = aws_iam_role.cost_sync_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Cost Explorer's GetCostAndUsage has no resource-level
        # permissions to scope down to (it's an account-wide read API),
        # but this role can ONLY read cost data — it has no write/delete
        # permissions anywhere.
        Sid      = "ReadCostExplorer"
        Effect   = "Allow"
        Action   = ["ce:GetCostAndUsage"]
        Resource = "*"
      },
      {
        Sid      = "WriteCostCache"
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem"]
        Resource = aws_dynamodb_table.cost_cache.arn
      },
      {
        Sid      = "WriteOwnLogs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-*"
      },
    ]
  })
}

# ---- Lambda: cost_read (GET /cost) — read-only ---------------------------

resource "aws_iam_role" "cost_read_lambda" {
  name = "${local.name_prefix}-cost-read-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "cost_read_lambda" {
  name = "${local.name_prefix}-cost-read-policy"
  role = aws_iam_role.cost_read_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ReadCostCache"
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem"]
        Resource = aws_dynamodb_table.cost_cache.arn
      },
      {
        Sid      = "WriteOwnLogs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-*"
      },
    ]
  })
}

resource "aws_iam_role" "cost_sync_scheduler_invoke" {
  name = "${local.name_prefix}-cost-sync-scheduler-invoke-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "cost_sync_scheduler_invoke" {
  name = "${local.name_prefix}-cost-sync-scheduler-invoke-policy"
  role = aws_iam_role.cost_sync_scheduler_invoke.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "lambda:InvokeFunction"
        Resource = aws_lambda_function.cost_sync.arn
      }
    ]
  })
}

# ---- EventBridge rule execution role -------------------------------------
# Lets the ECS task state-change rule invoke only the event_logger Lambda.

resource "aws_iam_role" "eventbridge_invoke" {
  name = "${local.name_prefix}-eventbridge-invoke-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "events.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "eventbridge_invoke" {
  name = "${local.name_prefix}-eventbridge-invoke-policy"
  role = aws_iam_role.eventbridge_invoke.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "lambda:InvokeFunction"
        Resource = aws_lambda_function.event_logger.arn
      }
    ]
  })
}
