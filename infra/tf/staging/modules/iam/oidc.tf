terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.9.0"
    }
  }
  backend "s3" {
    bucket         = "terraform-pt-state"
    key            = "pt/staging/modules/iam/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-pt-state-lock"
    encrypt        = true
  }
}

###################################
# Terraform AWS GitHub OIDC
###################################
module "oidc_provider" {
  source = "github.com/philips-labs/terraform-aws-github-oidc//modules/provider?ref=v0.7.1"
}

data "aws_caller_identity" "current" {}

module "pt_oidc_staging" {
  source                      = "github.com/philips-labs/terraform-aws-github-oidc?ref=v0.7.1"
  openid_connect_provider_arn = module.oidc_provider.openid_connect_provider.arn
  repo                        = "yidoyoon/pipe-timer"
  account_ids                 = [data.aws_caller_identity.current.account_id]
}

resource "aws_iam_role_policy" "ec2_s3_dynamodb" {
  role   = module.pt_oidc_staging.role.name
  policy = data.aws_iam_policy_document.ec2.json
}

data "aws_iam_policy_document" "ec2" {
  statement {
    actions = [
      "ec2:Describe*",
      "ec2:RunInstances",
      "ec2:TerminateInstances",
      "ec2:StopInstances",
      "ec2:StartInstances",
      "ec2:RebootInstances",
      "s3:GetObject",
      "s3:PutObject",
      "dynamodb:GetItem",
      "dynamodb:PutItem"
    ]
    resources = ["*"]
  }
}
