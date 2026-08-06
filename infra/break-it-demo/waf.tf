# WAFv2 Web ACL in front of the API Gateway stage. This is the first line
# of abuse/cost defense — it blocks high-volume callers before they even
# reach API Gateway's usage plan or the Lambda's own per-IP cooldown.
#
# Two rules:
#   1. Rate-based: blocks any single IP exceeding waf_rate_limit_per_5min
#      requests in a rolling 5-minute window, for 5 minutes.
#   2. AWS Managed "Core rule set" + "Anonymous IP list" — baseline
#      protection against common exploit patterns and known
#      anonymizing proxies, at negligible extra cost (managed rule
#      groups are billed per request evaluated, a few cents/month at
#      this traffic volume).

resource "aws_wafv2_web_acl" "demo" {
  name        = "${local.name_prefix}-web-acl"
  description = "Rate limiting and baseline protection for the break-it demo API."
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimitPerIp"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit_per_5min
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedCoreRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-core-rule-set"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedAnonymousIpList"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAnonymousIpList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-anonymous-ip"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-web-acl"
    sampled_requests_enabled   = true
  }
}

resource "aws_wafv2_web_acl_association" "demo_api" {
  resource_arn = aws_api_gateway_stage.demo.arn
  web_acl_arn  = aws_wafv2_web_acl.demo.arn
}
