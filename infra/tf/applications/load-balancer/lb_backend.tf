resource "aws_lb" "backend" {
  name               = "lb-backend"
  internal           = false
  load_balancer_type = "application"
  subnets            = [for subnet in data.aws_subnet.public : subnet.id]
  security_groups = [
    data.terraform_remote_state.vpc.outputs.sg_https_common_id,
    data.terraform_remote_state.vpc.outputs.sg_node_exporter_common_id,
    data.terraform_remote_state.vpc.outputs.sg_ssh_common_id
  ]
}

resource "aws_lb_target_group" "backend_production" {
  name     = "production-tg-backend-lb"
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
}

resource "aws_lb_target_group" "backend_staging" {
  name     = "staging-tg-backend-lb"
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
}

locals {
  backend_ec2_count_production = try(data.terraform_remote_state.backend_production.outputs.backend_instance_count_production, 0)
  backend_ec2_count_staging    = try(data.terraform_remote_state.backend_staging.outputs.backend_instance_count_staging, 0)
}

resource "aws_lb_target_group_attachment" "backend_production" {
  count = local.backend_ec2_count_production > 0 ? local.backend_ec2_count_production : 0

  target_group_arn = aws_lb_target_group.backend_production.arn
  target_id        = data.terraform_remote_state.backend_production.outputs.backend_production_instance[count.index].id
  port             = 443
}

resource "aws_lb_target_group_attachment" "backend_staging" {
  count = local.backend_ec2_count_staging > 0 ? local.backend_ec2_count_staging : 0

  target_group_arn = aws_lb_target_group.backend_staging.arn
  target_id        = data.terraform_remote_state.backend_staging.outputs.backend_staging_instance[count.index].id
  port             = 443
}

resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.backend.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = data.aws_acm_certificate.certificate.arn

  default_action {
    type = "forward"

    forward {
      dynamic "target_group" {
        for_each = length(aws_lb_target_group.backend_production) > 0 ? [1] : []
        content {
          arn    = aws_lb_target_group.backend_production.arn
          weight = lookup(local.traffic_dist_map[var.traffic], "production", 100)
        }
      }

      dynamic "target_group" {
        for_each = length(aws_lb_target_group.backend_staging) > 0 ? [1] : []
        content {
          arn    = aws_lb_target_group.backend_staging.arn
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
resource "cloudflare_record" "backend" {
  zone_id = local.envs["CF_ZONE_ID"]
  name    = local.envs["UPSTREAM_BACKEND"]
  value   = aws_lb.backend.dns_name
  type    = "CNAME"
  proxied = local.envs["PROXIED"]
}
