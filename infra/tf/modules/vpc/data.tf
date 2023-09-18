data "cloudflare_ip_ranges" "cloudflare" {}

data "aws_availability_zones" "available" {
  state = "available"
}

data "http" "ip" {
  url = "https://ifconfig.me/ip"
}

locals {
  envs = {
    for tuple in regexall("(.*)=(.*)", file("../../../../env/.${terraform.workspace}.env")) :
    tuple[0] => trim(tuple[1], "\r")
  }

  vpc_cidr        = terraform.workspace == "production" ? "172.31.0.0/16" : "172.16.0.0/16"
  production_cidr = terraform.workspace == "production" ? "172.31.0.0/18" : "172.16.0.0/18"
  staging_cidr    = terraform.workspace == "production" ? "172.31.64.0/18" : "172.16.64.0/18"
}
