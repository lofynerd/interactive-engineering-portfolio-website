output "api_endpoint" {
  description = "Base URL for the demo API. Set this as REACT_APP_BREAK_IT_API_URL for the frontend."
  value       = aws_api_gateway_stage.demo.invoke_url
}

output "api_key_value" {
  description = "Public demo API key value (not a secret — used only to bucket usage-plan quota, not for access control). Set as REACT_APP_BREAK_IT_API_KEY."
  value       = aws_api_gateway_api_key.public_demo_key.value
  sensitive   = true
}

output "ecr_repository_url" {
  description = "Push the demo-app image here before the ECS service can start successfully."
  value       = aws_ecr_repository.demo_app.repository_url
}

output "alb_dns_name" {
  description = "Direct ALB DNS name (for debugging; the frontend should use api_endpoint, not this, for the demo UI)."
  value       = aws_lb.demo.dns_name
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.demo.name
}

output "ecs_service_name" {
  value = aws_ecs_service.demo.name
}

output "budget_note" {
  description = "Reminder to activate the Project cost allocation tag."
  value       = "After first apply, activate the 'Project' cost allocation tag in AWS Billing preferences so aws_budgets_budget's tag filter picks up spend, and so cost_sync's Cost Explorer query returns data."
}
