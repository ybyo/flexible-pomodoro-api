output "vpc_id" {
  value = try(aws_vpc.app.id, null)
}

output "cidr_block" {
  value = try(aws_vpc.app.cidr_block, null)
}

output "subnet_production_cidr" {
  value = try(aws_subnet.production.cidr_block, null)
}

output "subnet_production_id" {
  value = try(aws_subnet.production.id, null)
}

output "subnet_staging_cidr" {
  value = try(aws_subnet.staging.cidr_block, null)
}

output "subnet_staging_id" {
  value = try(aws_subnet.staging.id, null)
}

output "route_table_id" {
  value = try(aws_route_table.rtb_public.id, null)
}
