# Cost alarm scoped to this stack's cost allocation tag (Project =
# portfolio-break-it-demo, set via default_tags in main.tf). Emails you
# if forecasted or actual spend crosses the threshold — this does not
# auto-shutdown anything, it's a notification safety net on top of the
# scheduled scale-to-zero.
#
# Note: AWS Budgets requires cost allocation tags to be activated in
# Billing preferences before tag-based budgets pick up spend reliably;
# activate the "Project" tag there after the first apply.

resource "aws_budgets_budget" "break_it_demo" {
  name         = "${local.name_prefix}-monthly-budget"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "TagKeyValue"
    values = ["user:Project$portfolio-break-it-demo"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.budget_alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }
}
