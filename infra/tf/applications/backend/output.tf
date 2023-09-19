# EC2
output "backend_production_ip" {
  value = aws_instance.backend_production[*].public_ip
}

output "backend_staging_ip" {
  value = aws_instance.backend_staging[*].public_ip
}

output "backend_production_instance" {
  value = aws_instance.backend_production
}

output "backend_staging_instance" {
  value = aws_instance.backend_staging
}

output "backend_instance_count_production" {
  value = length(aws_instance.backend_production) > 0 ? length(aws_instance.backend_production) : null
}

output "backend_instance_count_staging" {
  value = length(aws_instance.backend_staging) > 0 ? length(aws_instance.backend_staging) : null
}

output "ssh_id" {
  value = aws_security_group.ssh.id
}

output "https_id" {
  value = aws_security_group.https.id
}

output "node_exporter_id" {
  value = aws_security_group.node_exporter.id
}
