output "vpc_id" {
  value = aws_vpc.app.id
}

output "cidr_block" {
  value = aws_vpc.app.cidr_block
}

output "subnet1_cidr" {
  value = aws_subnet.public1.cidr_block
}

output "subnet1_id" {
  value = aws_subnet.public1.id
}

output "subnet2_id" {
  value = aws_subnet.public2.id
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
