# Three small on-demand DynamoDB tables:
#  - events: append-only log of break/reschedule/healthy transitions,
#    used to render the live recovery log in the UI.
#  - counters: a single-item running total of "times broken" / "times
#    healed" (and lifetime totals since stack creation) for the stats
#    display.
#  - rate_limits: per-IP cooldown tracking for the /break endpoint,
#    enforced inside the Lambda in addition to WAF's rate-based rule.

resource "aws_dynamodb_table" "events" {
  name         = "${local.name_prefix}-events"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  # TTL keeps the event log from growing forever — old entries expire
  # automatically after 30 days, bounding storage cost.
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = { Name = "${local.name_prefix}-events" }
}

resource "aws_dynamodb_table" "counters" {
  name         = "${local.name_prefix}-counters"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = { Name = "${local.name_prefix}-counters" }
}

resource "aws_dynamodb_table" "cost_cache" {
  name         = "${local.name_prefix}-cost-cache"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = { Name = "${local.name_prefix}-cost-cache" }
}

resource "aws_dynamodb_table" "rate_limits" {
  name         = "${local.name_prefix}-rate-limits"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ipHash"

  attribute {
    name = "ipHash"
    type = "S"
  }

  # Cooldown records expire on their own shortly after the cooldown window
  # closes — no cleanup job needed.
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = { Name = "${local.name_prefix}-rate-limits" }
}
