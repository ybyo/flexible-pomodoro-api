locals {
  envs = {
    for tuple in regexall("(.*)=(.*)", file("../../../../env/.${terraform.workspace}.env")) :
    tuple[0] => trim(tuple[1], "\r")
  }

  cidr_vpc     = terraform.workspace == "production" ? "172.31.0.0/16" : "172.16.0.0/16"
  cidr_subnet1 = terraform.workspace == "production" ? "172.31.0.0/18" : "172.16.0.0/18"
  cidr_subnet2 = terraform.workspace == "production" ? "172.31.64.0/18" : "172.16.64.0/18"
}


data "aws_ami" "ubuntu" {
  filter {
    name   = "image-id"
    values = [local.envs["EC2_AMI"]]
  }
}

###################################
# GitHub Branch Revision Number
###################################
data "github_branch" "revision_number" {
  repository = "pipe-timer"
  branch     = "main"
}

###################################
# Vault
###################################
data "vault_generic_secret" "ssh" {
  path = "/pt/ssh"
}

data "vault_generic_secret" "ssl" {
  path = "/pt/ssl"
}

data "vault_generic_secret" "env" {
  path = "/pt/env/${local.envs["NODE_ENV"]}"
}

###################################
# VPC
###################################
data "terraform_remote_state" "vpc" {
  backend = "s3"

  config = {
    bucket         = "terraform-pt-state"
    key            = "env:/${terraform.workspace}/pt/modules/vpc/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-pt-state-lock"
    encrypt        = true
  }
}

