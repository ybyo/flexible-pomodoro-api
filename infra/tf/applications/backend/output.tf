output "backend_public_ip" {
  value = aws_instance.pipe_timer_backend.public_ip
}
