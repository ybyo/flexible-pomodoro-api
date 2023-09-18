terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.9.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.10.0"
    }
  }

  backend "s3" {
    bucket         = "terraform-pt-state"
    key            = "pt/applications/load-balancer/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-pt-state-lock"
    encrypt        = true
  }

  required_version = "~> 1.5.3"
}

provider "aws" {
  region = local.envs["REGION"]
}

###################################
# CloudFlare DNS
###################################
provider "cloudflare" {
  api_token = local.envs["CF_TOKEN"]
}
