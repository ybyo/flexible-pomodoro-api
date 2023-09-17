output "vpc_id" {
  value = aws_vpc.app.id
}

output "cidr_block" {
  value = aws_vpc.app.cidr_block
}

output "subnet_production_cidr" {
  value = aws_subnet.production.cidr_block
}

output "subnet_production_id" {
  value = aws_subnet.production.id
}

output "subnet_staging_id" {
  value = aws_subnet.staging.id
}

output "route_table_id" {
  value = aws_route_table.rtb_public.id
}

output "sg_ssh_common_id" {
  value = aws_security_group.ssh_common.id
}

output "sg_node_exporter_common_id" {
  value = aws_security_group.node_exporter_common.id
}

output "sg_https_common_id" {
  value = aws_security_group.https_common.id
}

output "sg_frontend_dns_id" {
  value = aws_security_group.frontend_dns.id
}
