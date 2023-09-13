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
    key            = "pt/modules/acm/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-pt-state-lock"
    encrypt        = true
  }

  required_version = "~> 1.5.3"
}

locals {
  envs = {
    for tuple in regexall("(.*)=(.*)", file("../../../../env/.${terraform.workspace}.env")) :
    tuple[0] => trim(tuple[1], "\r")
  }
}

provider "aws" {
  alias  = "virginia"
  region = "us-east-1"
}

provider "cloudflare" {
  api_token = local.envs["CF_TOKEN"]
}

module "acm" {
  source = "terraform-aws-modules/acm/aws"

  domain_name = local.envs["BASE_DOMAIN"]
  zone_id     = local.envs["CF_ZONE_ID"]

  subject_alternative_names = [
    "*.${local.envs["BASE_DOMAIN"]}"
  ]

  create_route53_records  = false
  validation_record_fqdns = cloudflare_record.validation[*].hostname

  tags = {
    Name = "lb-certificate"
  }
}

resource "cloudflare_record" "validation" {
  count = length(module.acm.distinct_domain_names)

  zone_id = local.envs["CF_ZONE_ID"]
  name    = element(module.acm.validation_domains, count.index)["resource_record_name"]
  type    = element(module.acm.validation_domains, count.index)["resource_record_type"]
  value   = trimsuffix(element(module.acm.validation_domains, count.index)["resource_record_value"], ".")
  ttl     = 60
  proxied = false

  allow_overwrite = true
}


