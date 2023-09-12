resource "aws_security_group" "ssh_common" {
  name   = "sg_ssh_common"
  vpc_id = aws_vpc.app.id

  ingress {
    from_port = 22
    to_port   = 22
    protocol  = "tcp"
    cidr_blocks = [
      "${data.http.ip.response_body}/32", "${local.envs["DEV_SERVER"]}/32"
    ]
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

resource "aws_security_group" "node_exporter_common" {
  name   = "sg_node_exporter_common"
  vpc_id = aws_vpc.app.id

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

resource "aws_security_group" "https_common" {
  name   = "sg_https_common"
  vpc_id = aws_vpc.app.id

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
    cidr_blocks = [
      "${data.http.ip.response_body}/32", "${local.envs["DEV_SERVER"]}/32",
      aws_vpc.app.cidr_block
    ]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "frontend_dns" {
  name   = "sg_frontend_dns"
  vpc_id = aws_vpc.app.id

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
