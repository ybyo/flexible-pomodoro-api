locals {
  production_cidr = try(data.terraform_remote_state.vpc.outputs.subnet_production_cidr, null)
  staging_cidr    = try(data.terraform_remote_state.vpc.outputs.subnet_staging_cidr, null)
}

resource "aws_security_group" "ssh" {
  name   = "sg_ssh_frontend"
  vpc_id = data.terraform_remote_state.vpc.outputs.vpc_id

  ingress {
    from_port = 22
    to_port   = 22
    protocol  = "tcp"
    cidr_blocks = compact([
      "${data.http.ip.response_body}/32", "${local.envs["DEV_SERVER"]}/32",
      local.production_cidr, local.staging_cidr
    ])
  }

  dynamic "ingress" {
    for_each = data.cloudflare_ip_ranges.cloudflare.ipv4_cidr_blocks
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "node_exporter" {
  name   = "sg_node_exporter_frontend"
  vpc_id = data.terraform_remote_state.vpc.outputs.vpc_id

  dynamic "ingress" {
    for_each = data.cloudflare_ip_ranges.cloudflare.ipv4_cidr_blocks
    content {
      from_port   = local.envs["NODE_EXPORTER_PORT"]
      to_port     = local.envs["NODE_EXPORTER_PORT"]
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  ingress {
    from_port   = local.envs["NODE_EXPORTER_PORT"]
    to_port     = local.envs["NODE_EXPORTER_PORT"]
    protocol    = "tcp"
    cidr_blocks = ["${data.http.ip.response_body}/32"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "https" {
  name   = "sg_https_frontend"
  vpc_id = data.terraform_remote_state.vpc.outputs.vpc_id

  dynamic "ingress" {
    for_each = data.cloudflare_ip_ranges.cloudflare.ipv4_cidr_blocks
    content {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  ingress {
    from_port = 443
    to_port   = 443
    protocol  = "tcp"
    cidr_blocks = compact([
      "${data.http.ip.response_body}/32", "${local.envs["DEV_SERVER"]}/32",
      local.production_cidr, local.staging_cidr
    ])
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "public_dns" {
  name   = "sg_dns_frontend"
  vpc_id = data.terraform_remote_state.vpc.outputs.vpc_id

  dynamic "ingress" {
    for_each = data.cloudflare_ip_ranges.cloudflare.ipv4_cidr_blocks
    content {
      from_port   = 53
      to_port     = 53
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  dynamic "ingress" {
    for_each = data.cloudflare_ip_ranges.cloudflare.ipv4_cidr_blocks
    content {
      from_port   = 53
      to_port     = 53
      protocol    = "udp"
      cidr_blocks = [ingress.value]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
