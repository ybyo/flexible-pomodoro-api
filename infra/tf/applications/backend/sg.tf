locals {
  production_cidr = try(data.terraform_remote_state.vpc.outputs.subnet_production_cidr, null)
  staging_cidr    = try(data.terraform_remote_state.vpc.outputs.subnet_staging_cidr, null)
}

resource "aws_security_group" "ssh" {
  name   = "sg_ssh_backend_${terraform.workspace}"
  vpc_id = data.terraform_remote_state.vpc.outputs.vpc_id
}

resource "aws_security_group" "https" {
  name   = "sg_https_backend_${terraform.workspace}"
  vpc_id = data.terraform_remote_state.vpc.outputs.vpc_id
}

resource "aws_security_group" "node_exporter" {
  name   = "sg_node_exporter_backend_${terraform.workspace}"
  vpc_id = data.terraform_remote_state.vpc.outputs.vpc_id
}
