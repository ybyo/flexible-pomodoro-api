###################################
# CloudFlare Tunnel
###################################
resource "cloudflare_tunnel" "ssh" {
  account_id = local.envs["CF_ACCOUNT_ID"]
  name       = "backend-${local.envs["NODE_ENV"]}"
  secret     = random_password.ssh_tunnel.result
}

resource "cloudflare_tunnel_config" "ssh" {
  account_id = local.envs["CF_ACCOUNT_ID"]
  tunnel_id  = cloudflare_tunnel.ssh.id

  config {
    warp_routing {
      enabled = false
    }
    ingress_rule {
      service = "ssh://localhost:22"
    }
  }
}

resource "cloudflare_record" "ssh_tunnel" {
  zone_id = local.envs["CF_ZONE_ID"]
  name    = "ssh-${terraform.workspace == "production" ? "" : "staging-"}api"
  value   = cloudflare_tunnel.ssh.cname
  type    = "CNAME"
  proxied = local.envs["PROXIED"]
}
