variable "aws_region" {
  description = "AWS region for the demo stack (should match the rest of the portfolio infra)."
  type        = string
  default     = "ap-south-1"
}

variable "allowed_origin" {
  description = "Origin allowed to call the demo API (your portfolio site)."
  type        = string
  default     = "https://arpanraj.space"
}

variable "additional_allowed_origins" {
  description = "Extra origins to allow (e.g. www subdomain, local dev)."
  type        = list(string)
  default = [
    "https://www.arpanraj.space",
    "http://localhost:3000",
  ]
}

variable "desired_task_count" {
  description = "Number of Fargate tasks to run during active hours."
  type        = number
  default     = 2
}

variable "break_cooldown_seconds" {
  description = "Minimum seconds between successful 'break' actions from the same IP."
  type        = number
  default     = 30
}

variable "waf_rate_limit_per_5min" {
  description = "Max requests per 5-minute window per IP before WAF blocks it (WAF's minimum is 10)."
  type        = number
  default     = 60
}

variable "daily_request_quota" {
  description = "Max total requests/day allowed by the API Gateway usage plan across all callers."
  type        = number
  default     = 5000
}

variable "monthly_budget_usd" {
  description = "Monthly USD threshold for the demo stack's cost alarm. Estimated actual spend for a 9am-9pm IST window is ~$25-26/mo (ALB ~$9-11 + WAF Web ACL/rules $8 flat + Fargate Spot ~$3.65 + Cost Explorer sync ~$1.80 + misc); this leaves headroom before alerting."
  type        = number
  default     = 32
}

variable "budget_alert_email" {
  description = "Email address to notify when the demo stack's spend crosses the budget threshold."
  type        = string
  default     = "workwitharpanraj@gmail.com"
}

variable "demo_container_image_tag" {
  description = "Tag of the demo-app image to deploy from the dedicated ECR repo created by this stack (build/push demo-app/ first — see README)."
  type        = string
  default     = "latest"
}

variable "scale_up_hour_ist" {
  description = "Hour (24h, IST) to scale the demo service up to desired_task_count. Demo is 'online' from this hour."
  type        = number
  default     = 9
}

variable "scale_down_hour_ist" {
  description = "Hour (24h, IST) to scale the demo service down to 0 tasks. Demo goes offline at this hour."
  type        = number
  default     = 21
}

variable "demo_always_on" {
  description = "TEMPORARY testing toggle. When true, disables the 9am/9pm IST scale schedules (service stays up 24/7 regardless of hour) and the frontend hides the '9am-9pm IST' disclaimer. Meant to be flipped back to false after the trial window — set desired_task_count manually to 0/2 as needed when toggling."
  type        = bool
  default     = false
}
