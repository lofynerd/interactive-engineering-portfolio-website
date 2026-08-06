# Each Lambda's dependencies must be installed (npm install) inside its
# lambda/<name>/ directory before `terraform apply` — the archive_file
# data source just zips whatever's already there. See README for the
# build step.

locals {
  lambda_common_env = {
    AWS_REGION_OVERRIDE = var.aws_region # not used directly; AWS_REGION is reserved and set automatically by Lambda
  }
  allowed_origins_csv = join(",", concat([var.allowed_origin], var.additional_allowed_origins))
}

# ---- break_task ----------------------------------------------------------

data "archive_file" "break_task" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/break_task"
  output_path = "${path.module}/build/break_task.zip"
  excludes    = ["package.json", "package-lock.json"]
}

resource "aws_lambda_function" "break_task" {
  function_name    = "${local.name_prefix}-break-task"
  role             = aws_iam_role.break_task_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 10
  memory_size      = 128
  filename         = data.archive_file.break_task.output_path
  source_code_hash = data.archive_file.break_task.output_base64sha256

  environment {
    variables = {
      ECS_CLUSTER_ARN        = aws_ecs_cluster.demo.arn
      ECS_SERVICE_NAME       = aws_ecs_service.demo.name
      RATE_LIMIT_TABLE       = aws_dynamodb_table.rate_limits.name
      COUNTERS_TABLE         = aws_dynamodb_table.counters.name
      BREAK_COOLDOWN_SECONDS = tostring(var.break_cooldown_seconds)
      ALLOWED_ORIGINS        = local.allowed_origins_csv
    }
  }
}

resource "aws_cloudwatch_log_group" "break_task_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.break_task.function_name}"
  retention_in_days = 14
}

# ---- status ---------------------------------------------------------------

data "archive_file" "status" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/status"
  output_path = "${path.module}/build/status.zip"
  excludes    = ["package.json", "package-lock.json"]
}

resource "aws_lambda_function" "status" {
  function_name    = "${local.name_prefix}-status"
  role             = aws_iam_role.status_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 10
  memory_size      = 128
  filename         = data.archive_file.status.output_path
  source_code_hash = data.archive_file.status.output_base64sha256

  environment {
    variables = {
      ECS_CLUSTER_ARN  = aws_ecs_cluster.demo.arn
      ECS_SERVICE_NAME = aws_ecs_service.demo.name
      EVENTS_TABLE     = aws_dynamodb_table.events.name
      COUNTERS_TABLE   = aws_dynamodb_table.counters.name
      ALLOWED_ORIGINS  = local.allowed_origins_csv
    }
  }
}

resource "aws_cloudwatch_log_group" "status_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.status.function_name}"
  retention_in_days = 14
}

# ---- event_logger -----------------------------------------------------------

data "archive_file" "event_logger" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/event_logger"
  output_path = "${path.module}/build/event_logger.zip"
  excludes    = ["package.json", "package-lock.json"]
}

resource "aws_lambda_function" "event_logger" {
  function_name    = "${local.name_prefix}-event-logger"
  role             = aws_iam_role.event_logger_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 10
  memory_size      = 128
  filename         = data.archive_file.event_logger.output_path
  source_code_hash = data.archive_file.event_logger.output_base64sha256

  environment {
    variables = {
      EVENTS_TABLE    = aws_dynamodb_table.events.name
      COUNTERS_TABLE  = aws_dynamodb_table.counters.name
      EVENTS_TTL_DAYS = "30"
    }
  }
}

resource "aws_cloudwatch_log_group" "event_logger_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.event_logger.function_name}"
  retention_in_days = 14
}

resource "aws_lambda_permission" "event_logger_from_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_logger.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ecs_task_state_change.arn
}

# ---- scheduler --------------------------------------------------------------

data "archive_file" "scheduler" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/scheduler"
  output_path = "${path.module}/build/scheduler.zip"
  excludes    = ["package.json", "package-lock.json"]
}

resource "aws_lambda_function" "scheduler" {
  function_name    = "${local.name_prefix}-scheduler"
  role             = aws_iam_role.scheduler_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 10
  memory_size      = 128
  filename         = data.archive_file.scheduler.output_path
  source_code_hash = data.archive_file.scheduler.output_base64sha256

  environment {
    variables = {
      ECS_CLUSTER_ARN  = aws_ecs_cluster.demo.arn
      ECS_SERVICE_NAME = aws_ecs_service.demo.name
    }
  }
}

resource "aws_cloudwatch_log_group" "scheduler_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.scheduler.function_name}"
  retention_in_days = 14
}

resource "aws_lambda_permission" "scheduler_from_eventbridge_scheduler" {
  statement_id  = "AllowSchedulerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scheduler.function_name
  principal     = "scheduler.amazonaws.com"
  source_arn    = "arn:aws:scheduler:${var.aws_region}:${data.aws_caller_identity.current.account_id}:schedule/*"
}

# ---- cost_sync (scheduled, writes the cost cache) --------------------------

data "archive_file" "cost_sync" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/cost_sync"
  output_path = "${path.module}/build/cost_sync.zip"
  excludes    = ["package.json", "package-lock.json"]
}

resource "aws_lambda_function" "cost_sync" {
  function_name    = "${local.name_prefix}-cost-sync"
  role             = aws_iam_role.cost_sync_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 128
  filename         = data.archive_file.cost_sync.output_path
  source_code_hash = data.archive_file.cost_sync.output_base64sha256

  environment {
    variables = {
      COST_CACHE_TABLE = aws_dynamodb_table.cost_cache.name
      COST_TAG_VALUE   = "portfolio-break-it-demo"
    }
  }
}

resource "aws_cloudwatch_log_group" "cost_sync_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.cost_sync.function_name}"
  retention_in_days = 14
}

resource "aws_lambda_permission" "cost_sync_from_scheduler" {
  statement_id  = "AllowSchedulerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cost_sync.function_name
  principal     = "scheduler.amazonaws.com"
  source_arn    = "arn:aws:scheduler:${var.aws_region}:${data.aws_caller_identity.current.account_id}:schedule/*"
}

# ---- cost_read (GET /cost) --------------------------------------------------

data "archive_file" "cost_read" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/cost_read"
  output_path = "${path.module}/build/cost_read.zip"
  excludes    = ["package.json", "package-lock.json"]
}

resource "aws_lambda_function" "cost_read" {
  function_name    = "${local.name_prefix}-cost-read"
  role             = aws_iam_role.cost_read_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 10
  memory_size      = 128
  filename         = data.archive_file.cost_read.output_path
  source_code_hash = data.archive_file.cost_read.output_base64sha256

  environment {
    variables = {
      COST_CACHE_TABLE   = aws_dynamodb_table.cost_cache.name
      MONTHLY_BUDGET_USD = tostring(var.monthly_budget_usd)
      ALLOWED_ORIGINS    = local.allowed_origins_csv
    }
  }
}

resource "aws_cloudwatch_log_group" "cost_read_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.cost_read.function_name}"
  retention_in_days = 14
}
