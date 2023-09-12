locals {
  envs = {
    for tuple in regexall("(.*)=(.*)", file("../../../../env/.${terraform.workspace}.env")) :
    tuple[0] =>
    trim(tuple[1], "\r")
  }

  flavor_mysql = "db.t2.micro"
  flavor_redis = "cache.t2.micro"
}

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

data "aws_availability_zones" "available" {
  state = "available"
}
