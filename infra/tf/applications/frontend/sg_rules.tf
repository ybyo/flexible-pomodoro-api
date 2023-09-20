resource "aws_security_group_rule" "ssh" {
  for_each = toset(concat(data.cloudflare_ip_ranges.cloudflare.ipv4_cidr_blocks, [
    "${data.http.ip.response_body}/32",
    "${local.envs["DEV_SERVER"]}/32",
    local.production_cidr,
    local.staging_cidr
  ]))

  type              = "ingress"
  security_group_id = aws_security_group.ssh.id
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = [each.value]
}

resource "aws_security_group_rule" "node_exporter" {
  for_each = toset(concat(data.cloudflare_ip_ranges.cloudflare.ipv4_cidr_blocks, [
    "${data.http.ip.response_body}/32"
  ]))

  type              = "ingress"
  security_group_id = aws_security_group.node_exporter.id
  from_port         = local.envs["NODE_EXPORTER_PORT"]
  to_port           = local.envs["NODE_EXPORTER_PORT"]
  protocol          = "tcp"
  cidr_blocks       = [each.value]
}

resource "aws_security_group_rule" "https_ingress" {
  for_each = toset(concat(data.cloudflare_ip_ranges.cloudflare.ipv4_cidr_blocks, [
    "${data.http.ip.response_body}/32",
    "${local.envs["DEV_SERVER"]}/32",
    local.production_cidr,
    local.staging_cidr
  ]))

  type              = "ingress"
  security_group_id = aws_security_group.https.id
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = [each.value]
}

resource "aws_security_group_rule" "dns_tcp" {
  for_each = toset(data.cloudflare_ip_ranges.cloudflare.ipv4_cidr_blocks)

  type              = "ingress"
  security_group_id = aws_security_group.public_dns.id
  from_port         = 53
  to_port           = 53
  protocol          = "tcp"
  cidr_blocks       = [each.value]
}

resource "aws_security_group_rule" "dns_udp" {
  for_each = toset(data.cloudflare_ip_ranges.cloudflare.ipv4_cidr_blocks)

  type              = "ingress"
  security_group_id = aws_security_group.public_dns.id
  from_port         = 53
  to_port           = 53
  protocol          = "udp"
  cidr_blocks       = [each.value]
}

resource "aws_security_group_rule" "allow_all_egress" {
  type              = "egress"
  security_group_id = aws_security_group.public_dns.id
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
}
