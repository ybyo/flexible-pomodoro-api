output "tg_arn_production" {
  value = aws_lb_target_group.backend_production.arn
}

output "tg_arn_staging" {
  value = aws_lb_target_group.backend_staging.arn
}
