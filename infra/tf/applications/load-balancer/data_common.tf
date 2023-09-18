locals {
  envs = {
    for tuple in regexall("(.*)=(.*)", file("../../../../env/.${terraform.workspace}.env")) :
    tuple[0] => trim(tuple[1], "\r")
  }

  cidr_vpc     = terraform.workspace == "production" ? "172.31.0.0/16" : "172.16.0.0/16"
  cidr_subnet1 = terraform.workspace == "production" ? "172.31.0.0/18" : "172.16.0.0/18"
  cidr_subnet2 = terraform.workspace == "production" ? "172.31.64.0/18" : "172.16.64.0/18"
}

data "aws_subnets" "vpc" {
  filter {
    name   = "vpc-id"
    values = [data.terraform_remote_state.vpc.outputs.vpc_id]
  }
}

data "aws_subnet" "public" {
  for_each = toset(data.aws_subnets.vpc.ids)
  id       = each.value
}

data "aws_acm_certificate" "certificate" {
  domain      = local.envs["BASE_DOMAIN"]
  statuses    = ["ISSUED"]
  most_recent = true
}

###################################
# VPC
###################################
data "terraform_remote_state" "vpc" {
  backend = "s3"

  config = {
    bucket         = "terraform-pt-state"
    key            = "env:/production/pt/modules/vpc/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-pt-state-lock"
    encrypt        = true
  }
}

###################################
# Remote State - Instances
###################################
data "terraform_remote_state" "backend_production" {
  backend = "s3"

  config = {
    bucket         = "terraform-pt-state"
    key            = "env:/production/pt/applications/backend/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-pt-state-lock"
    encrypt        = true
  }
}

data "terraform_remote_state" "frontend_production" {
  backend = "s3"

  config = {
    bucket         = "terraform-pt-state"
    key            = "env:/production/pt/applications/frontend/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-pt-state-lock"
    encrypt        = true
  }
}

data "terraform_remote_state" "backend_staging" {
  backend = "s3"

  config = {
    bucket         = "terraform-pt-state"
    key            = "env:/staging/pt/applications/backend/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-pt-state-lock"
    encrypt        = true
  }
}

data "terraform_remote_state" "frontend_staging" {
  backend = "s3"

  config = {
    bucket         = "terraform-pt-state"
    key            = "env:/staging/pt/applications/frontend/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-pt-state-lock"
    encrypt        = true
  }
}


