# EC2
output "frontend_production_ip" {
  value = aws_instance.frontend_production[*].public_ip
}

output "frontend_staging_ip" {
  value = aws_instance.frontend_staging[*].public_ip
}

output "frontend_production_instance" {
  value = aws_instance.frontend_production
}

output "frontend_staging_instance" {
  value = aws_instance.frontend_staging
}

output "frontend_instance_count_production" {
  value = length(aws_instance.frontend_production) > 0 ? length(aws_instance.frontend_production) : null
}

output "frontend_instance_count_staging" {
  value = length(aws_instance.frontend_staging) > 0 ? length(aws_instance.frontend_staging) : null
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

output "public_dns_id" {
  value = aws_security_group.public_dns.id
}
