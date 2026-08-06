# Captures ECS task state-change events ONLY for the demo cluster (the
# event pattern filters on this cluster's ARN), so this rule can never see
# or react to events from any other ECS cluster in the account.

resource "aws_cloudwatch_event_rule" "ecs_task_state_change" {
  name        = "${local.name_prefix}-task-state-change"
  description = "Captures ECS task state changes for the break-it demo cluster only."

  event_pattern = jsonencode({
    source        = ["aws.ecs"]
    "detail-type" = ["ECS Task State Change"]
    detail = {
      clusterArn = [aws_ecs_cluster.demo.arn]
    }
  })
}

resource "aws_cloudwatch_event_target" "event_logger" {
  rule      = aws_cloudwatch_event_rule.ecs_task_state_change.name
  target_id = "event-logger-lambda"
  arn       = aws_lambda_function.event_logger.arn
}
