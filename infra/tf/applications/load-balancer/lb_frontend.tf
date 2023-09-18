resource "aws_lb" "frontend" {
  name               = "lb-frontend"
  internal           = false
  load_balancer_type = "application"
  subnets = [
    for subnet in data.aws_subnet.public : subnet.id
  ]
  enable_cross_zone_load_balancing = true
  security_groups = [
    data.terraform_remote_state.vpc.outputs.sg_frontend_dns_id,
    data.terraform_remote_state.vpc.outputs.sg_https_common_id,
    data.terraform_remote_state.vpc.outputs.sg_node_exporter_common_id,
    data.terraform_remote_state.vpc.outputs.sg_ssh_common_id
  ]
}

resource "random_pet" "app" {}

resource "aws_lb_target_group" "frontend_production" {
  name     = "production-tg-frontend-lb"
  port     = 443
  protocol = "HTTPS"
  vpc_id   = data.terraform_remote_state.vpc.outputs.vpc_id

  health_check {
    port     = 443
    protocol = "HTTPS"
    timeout  = 5
    interval = 10
    matcher  = "200-499"
    path     = "/"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_target_group" "frontend_staging" {
  name     = "staging-tg-frontend-lb"
  port     = 443
  protocol = "HTTPS"
  vpc_id   = data.terraform_remote_state.vpc.outputs.vpc_id

  health_check {
    port     = 443
    protocol = "HTTPS"
    timeout  = 5
    interval = 10
    matcher  = "200-499"
    path     = "/"
  }

  lifecycle {
    create_before_destroy = true
  }
}

locals {
  frontend_ec2_count_production = try(data.terraform_remote_state.frontend_production.outputs.frontend_instance_count_production, 0)
  frontend_ec2_count_staging    = try(data.terraform_remote_state.frontend_staging.outputs.frontend_instance_count_staging, 0)
}

resource "aws_lb_target_group_attachment" "frontend_production" {
  count = local.frontend_ec2_count_production > 0 ? local.frontend_ec2_count_production : 0

  target_group_arn = aws_lb_target_group.frontend_production.arn
  target_id        = data.terraform_remote_state.frontend_production.outputs.frontend_production_instance[count.index].id
  port             = 443
}

resource "aws_lb_target_group_attachment" "frontend_staging" {
  count = local.frontend_ec2_count_staging > 0 ? local.frontend_ec2_count_staging : 0

  target_group_arn = aws_lb_target_group.frontend_staging.arn
  target_id        = data.terraform_remote_state.frontend_staging.outputs.frontend_staging_instance[count.index].id
  port             = 443
}

resource "aws_lb_listener" "frontend" {
  load_balancer_arn = aws_lb.frontend.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = data.aws_acm_certificate.certificate.arn

  default_action {
    type = "forward"

    forward {
      dynamic "target_group" {
        for_each = length(aws_lb_target_group.frontend_production) > 0 ? [
          1
        ] : []
        content {
          arn    = aws_lb_target_group.frontend_production.arn
          weight = lookup(local.traffic_dist_map[var.traffic], "production", 100)
        }
      }

      dynamic "target_group" {
        for_each = length(aws_lb_target_group.frontend_staging) > 0 ? [1] : []
        content {
          arn    = aws_lb_target_group.frontend_staging.arn
          weight = lookup(local.traffic_dist_map[var.traffic], "staging", 0)
        }
      }

      stickiness {
        enabled  = false
        duration = 1
      }
    }
  }
}

###################################
# CloudFlare DNS
###################################
resource "cloudflare_record" "front_lb_wildcard" {
  zone_id = local.envs["CF_ZONE_ID"]
  name    = local.envs["HOST_URL"]
  value   = aws_lb.frontend.dns_name
  type    = "CNAME"
  proxied = local.envs["PROXIED"]
}

resource "cloudflare_record" "front_lb_root" {
  count = terraform.workspace == "production" ? 1 : 0

  zone_id = local.envs["CF_ZONE_ID"]
  name    = "www"
  value   = aws_lb.frontend.dns_name
  type    = "CNAME"
  proxied = local.envs["PROXIED"]
}
