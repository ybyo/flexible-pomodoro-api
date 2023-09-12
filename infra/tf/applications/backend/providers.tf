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
    vault = {
      source  = "hashicorp/vault"
      version = "~> 3.18"
    }
    github = {
      source  = "integrations/github"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "terraform-pt-state"
    key            = "pt/applications/backend/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-pt-state-lock"
    encrypt        = true
  }

  required_version = "~> 1.5.3"
}

provider "aws" {
  region = local.envs["REGION"]
}

provider "github" {
  token = local.envs["GITHUB_TOKEN"]
}

provider "cloudflare" {
  api_token = local.envs["CF_TOKEN"]
}

provider "vault" {
  address = "https://${local.envs["VAULT_URL"]}"
  token   = local.envs["VAULT_TOKEN"]
}
