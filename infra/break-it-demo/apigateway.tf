# REST API (v1), chosen over HTTP API specifically because it supports
# native usage plans (daily request quota) and API Gateway-level
# throttling — both part of the abuse/cost protection story — in addition
# to WAFv2 association, which both API types support.
#
# The public /break and /status routes use a shared, publicly-known API
# key purely to attach the usage plan's quota/throttle limits to a single
# bucket (it is NOT a secret / not meant to gate access — the endpoints
# are intentionally public). Real access control against abuse is WAF +
# the Lambda-side per-IP cooldown.

resource "aws_api_gateway_rest_api" "demo" {
  name        = "${local.name_prefix}-api"
  description = "Public API for the break-it self-healing infrastructure demo."

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# ---- /break (POST) ---------------------------------------------------------

resource "aws_api_gateway_resource" "break" {
  rest_api_id = aws_api_gateway_rest_api.demo.id
  parent_id   = aws_api_gateway_rest_api.demo.root_resource_id
  path_part   = "break"
}

resource "aws_api_gateway_method" "break_post" {
  rest_api_id      = aws_api_gateway_rest_api.demo.id
  resource_id      = aws_api_gateway_resource.break.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "break_post" {
  rest_api_id             = aws_api_gateway_rest_api.demo.id
  resource_id             = aws_api_gateway_resource.break.id
  http_method             = aws_api_gateway_method.break_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.break_task.invoke_arn
}

resource "aws_api_gateway_method" "break_options" {
  rest_api_id   = aws_api_gateway_rest_api.demo.id
  resource_id   = aws_api_gateway_resource.break.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "break_options" {
  rest_api_id             = aws_api_gateway_rest_api.demo.id
  resource_id             = aws_api_gateway_resource.break.id
  http_method             = aws_api_gateway_method.break_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.break_task.invoke_arn
}

# ---- /status (GET) ----------------------------------------------------------

resource "aws_api_gateway_resource" "status" {
  rest_api_id = aws_api_gateway_rest_api.demo.id
  parent_id   = aws_api_gateway_rest_api.demo.root_resource_id
  path_part   = "status"
}

resource "aws_api_gateway_method" "status_get" {
  rest_api_id      = aws_api_gateway_rest_api.demo.id
  resource_id      = aws_api_gateway_resource.status.id
  http_method      = "GET"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "status_get" {
  rest_api_id             = aws_api_gateway_rest_api.demo.id
  resource_id             = aws_api_gateway_resource.status.id
  http_method             = aws_api_gateway_method.status_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.status.invoke_arn
}

resource "aws_api_gateway_method" "status_options" {
  rest_api_id   = aws_api_gateway_rest_api.demo.id
  resource_id   = aws_api_gateway_resource.status.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "status_options" {
  rest_api_id             = aws_api_gateway_rest_api.demo.id
  resource_id             = aws_api_gateway_resource.status.id
  http_method             = aws_api_gateway_method.status_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.status.invoke_arn
}

# ---- /cost (GET) ------------------------------------------------------------

resource "aws_api_gateway_resource" "cost" {
  rest_api_id = aws_api_gateway_rest_api.demo.id
  parent_id   = aws_api_gateway_rest_api.demo.root_resource_id
  path_part   = "cost"
}

resource "aws_api_gateway_method" "cost_get" {
  rest_api_id      = aws_api_gateway_rest_api.demo.id
  resource_id      = aws_api_gateway_resource.cost.id
  http_method      = "GET"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "cost_get" {
  rest_api_id             = aws_api_gateway_rest_api.demo.id
  resource_id             = aws_api_gateway_resource.cost.id
  http_method             = aws_api_gateway_method.cost_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.cost_read.invoke_arn
}

resource "aws_api_gateway_method" "cost_options" {
  rest_api_id   = aws_api_gateway_rest_api.demo.id
  resource_id   = aws_api_gateway_resource.cost.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "cost_options" {
  rest_api_id             = aws_api_gateway_rest_api.demo.id
  resource_id             = aws_api_gateway_resource.cost.id
  http_method             = aws_api_gateway_method.cost_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.cost_read.invoke_arn
}

resource "aws_lambda_permission" "cost_read_from_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cost_read.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.demo.execution_arn}/*/*"
}

# ---- Deployment / stage ------------------------------------------------------

resource "aws_api_gateway_deployment" "demo" {
  rest_api_id = aws_api_gateway_rest_api.demo.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.break.id,
      aws_api_gateway_method.break_post.id,
      aws_api_gateway_integration.break_post.id,
      aws_api_gateway_method.break_options.id,
      aws_api_gateway_integration.break_options.id,
      aws_api_gateway_resource.status.id,
      aws_api_gateway_method.status_get.id,
      aws_api_gateway_integration.status_get.id,
      aws_api_gateway_method.status_options.id,
      aws_api_gateway_integration.status_options.id,
      aws_api_gateway_resource.cost.id,
      aws_api_gateway_method.cost_get.id,
      aws_api_gateway_integration.cost_get.id,
      aws_api_gateway_method.cost_options.id,
      aws_api_gateway_integration.cost_options.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "demo" {
  deployment_id = aws_api_gateway_deployment.demo.id
  rest_api_id   = aws_api_gateway_rest_api.demo.id
  stage_name    = "prod"
}

resource "aws_api_gateway_method_settings" "demo" {
  rest_api_id = aws_api_gateway_rest_api.demo.id
  stage_name  = aws_api_gateway_stage.demo.stage_name
  method_path = "*/*"

  settings {
    throttling_burst_limit = 10
    throttling_rate_limit  = 5
    logging_level          = "OFF" # keep cost/noise minimal for a demo
  }
}

resource "aws_lambda_permission" "break_task_from_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.break_task.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.demo.execution_arn}/*/*"
}

resource "aws_lambda_permission" "status_from_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.status.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.demo.execution_arn}/*/*"
}

# ---- Usage plan: daily quota + per-second throttle (abuse/cost control) -----

resource "aws_api_gateway_api_key" "public_demo_key" {
  name    = "${local.name_prefix}-public-key"
  enabled = true
}

resource "aws_api_gateway_usage_plan" "demo" {
  name = "${local.name_prefix}-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.demo.id
    stage  = aws_api_gateway_stage.demo.stage_name
  }

  quota_settings {
    limit  = var.daily_request_quota
    period = "DAY"
  }

  throttle_settings {
    burst_limit = 10
    rate_limit  = 5
  }
}

resource "aws_api_gateway_usage_plan_key" "demo" {
  key_id        = aws_api_gateway_api_key.public_demo_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.demo.id
}
