output "vpc_id" {
  value = aws_vpc.vpc.id
}

output "cidr_block" {
  value = aws_vpc.vpc.cidr_block
}

output "public_subnet_1_cidr_block" {
  value = aws_subnet.public_1.cidr_block
}

output "public_subnet_1_id" {
  value = aws_subnet.public_1.id
}

output "public_subnet_2_id" {
  value = aws_subnet.public_2.id
}

output "route_table_id" {
  value = aws_route_table.rtb_public.id
}
