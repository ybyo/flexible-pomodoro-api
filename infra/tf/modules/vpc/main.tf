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
    bucket  = "terraform-pt-state"
    key     = "pt/${terraform.workspace}/modules/vpc/terraform.tfstate"
    region  = "ap-northeast-2"
    encrypt = true
  }
}

locals {
  envs = {
    for tuple in regexall("(.*)=(.*)", file("../../../../env/.${terraform.workspace}.env")) :
    tuple[0] => trim(tuple[1], "\r")
  }
}

provider "aws" {
  region = local.envs["REGION"]
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "vpc" {
  cidr_block           = var.cidr_vpc
  enable_dns_support   = true
  enable_dns_hostnames = true
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.vpc.id
}

resource "aws_subnet" "public_1" {
  vpc_id            = aws_vpc.vpc.id
  cidr_block        = var.cidr_subnet_1
  availability_zone = data.aws_availability_zones.available.names[0]
}

resource "aws_subnet" "public_2" {
  vpc_id            = aws_vpc.vpc.id
  cidr_block        = var.cidr_subnet_2
  availability_zone = data.aws_availability_zones.available.names[1]
}

resource "aws_route_table" "rtb_public" {
  vpc_id = aws_vpc.vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

resource "aws_route_table_association" "rta_subnet_public" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.rtb_public.id
}
