# Scale the demo service up at scale_up_hour_ist and down to 0 at
# scale_down_hour_ist, every day, evaluated directly in Asia/Kolkata time
# (no manual UTC conversion needed). This is the primary cost control for
# the demo — the ALB keeps running (its hourly cost applies regardless),
# but compute cost drops to zero outside these hours, and there are no
# tasks to break/heal or to inflate the "healed" counter overnight.

resource "aws_scheduler_schedule" "scale_up" {
  name       = "${local.name_prefix}-scale-up"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(0 ${var.scale_up_hour_ist} * * ? *)"
  schedule_expression_timezone = "Asia/Kolkata"

  target {
    arn      = aws_lambda_function.scheduler.arn
    role_arn = aws_iam_role.scheduler_invoke.arn
    input    = jsonencode({ desiredCount = var.desired_task_count })

    retry_policy {
      maximum_retry_attempts       = 2
      maximum_event_age_in_seconds = 300
    }
  }
}

# Refreshes the FinOps cost panel's cached data every 4 hours. Cost
# Explorer bills $0.01/request — at 6 syncs/day this is ~$0.06/day
# (~$1.80/month), far cheaper and faster than calling it from every page
# load.
resource "aws_scheduler_schedule" "cost_sync" {
  name       = "${local.name_prefix}-cost-sync"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "rate(4 hours)"

  target {
    arn      = aws_lambda_function.cost_sync.arn
    role_arn = aws_iam_role.cost_sync_scheduler_invoke.arn

    retry_policy {
      maximum_retry_attempts       = 2
      maximum_event_age_in_seconds = 3600
    }
  }
}

resource "aws_scheduler_schedule" "scale_down" {
  name       = "${local.name_prefix}-scale-down"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(0 ${var.scale_down_hour_ist} * * ? *)"
  schedule_expression_timezone = "Asia/Kolkata"

  target {
    arn      = aws_lambda_function.scheduler.arn
    role_arn = aws_iam_role.scheduler_invoke.arn
    input    = jsonencode({ desiredCount = 0 })

    retry_policy {
      maximum_retry_attempts       = 2
      maximum_event_age_in_seconds = 300
    }
  }
}
