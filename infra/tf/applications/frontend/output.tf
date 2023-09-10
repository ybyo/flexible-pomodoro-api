# EC2
output "frontend_public_ip" {
  value = aws_instance.pipe_timer_frontend.public_ip
}
