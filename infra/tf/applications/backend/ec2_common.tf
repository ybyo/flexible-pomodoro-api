###################################
# Remote Docker Container Setup
###################################
resource "null_resource" "remove_docker" {
  provisioner "local-exec" {
    command     = "chmod +x ../common-scripts/remove-images.sh; ../common-scripts/remove-images.sh ${local.envs["REGISTRY_URL"]}"
    working_dir = path.module
    interpreter = ["/bin/bash", "-c"]
  }
}

resource "null_resource" "build_docker" {
  provisioner "local-exec" {
    command     = "chmod +x ../common-scripts/login-docker-registry.sh; ../common-scripts/login-docker-registry.sh ${local.envs["REGISTRY_URL"]} ${local.envs["REGISTRY_ID"]} ${local.envs["REGISTRY_PASSWORD"]}"
    working_dir = path.module
    interpreter = ["/bin/bash", "-c"]
  }

  provisioner "local-exec" {
    command     = "chmod +x ./shell-scripts/build-push-registry.sh; ./shell-scripts/build-push-registry.sh ${local.envs["LINUX_PLATFORM"]} ${data.github_branch.revision_number.sha} ${local.envs["REGISTRY_URL"]} ${local.envs["NODE_ENV"]}"
    working_dir = path.module
    interpreter = ["/bin/bash", "-c"]
  }
}

###################################
# Cloud-init Template
###################################
data "template_cloudinit_config" "setup" {
  gzip          = true
  base64_encode = true

  part {
    content_type = "text/cloud-config"
    content = templatefile("../scripts/cloud-init.yaml", {
      linux_platform = local.envs["LINUX_PLATFORM"]
      ssh_public_key = base64decode(data.vault_generic_secret.ssh.data["SSH_PUBLIC_KEY"])
      workdir        = local.envs["WORKDIR"]
    })
  }

  part {
    content_type = "text/x-shellscript"
    content      = file("../common-scripts/add-dns.sh")
  }

  part {
    content_type = "text/cloud-config"
    content = yamlencode({
      write_files = [
        {
          path        = "${local.envs["WORKDIR"]}/web-config-exporter.yml"
          permissions = "0644"
          content = templatefile("../../../monitoring/config/web-config-exporter.yml", {
            PROM_ID     = local.envs["PROM_ID"]
            PROM_PW     = data.vault_generic_secret.env.data["PROM_PW"]
            WORKDIR     = local.envs["WORKDIR"]
            BASE_DOMAIN = local.envs["BASE_DOMAIN"]
          })
        },
        {
          path        = "${local.envs["WORKDIR"]}/promtail-config.yml"
          permissions = "0644"
          content = templatefile("../../../monitoring/config/promtail-config.yml", {
            LOKI_URL      = local.envs["LOKI_URL"]
            PROMTAIL_PORT = local.envs["PROMTAIL_PORT"]
          })
        },
        {
          path        = "${local.envs["WORKDIR"]}/certs/pipetimer.com.pem"
          permissions = "0644"
          content     = base64decode(data.vault_generic_secret.ssl.data["SSL_PUBLIC_KEY"])
        },
        {
          path        = "${local.envs["WORKDIR"]}/certs/pipetimer.com.key"
          permissions = "0644"
          content     = base64decode(data.vault_generic_secret.ssl.data["SSL_PRIVATE_KEY"])
        },
      ]
    })
  }

  part {
    content_type = "text/x-shellscript"
    content      = file("../common-scripts/install-docker.sh")
  }

  part {
    content_type = "text/x-shellscript"
    content = templatefile("./shell-scripts/cf-tunnel.sh", {
      account     = local.envs["CF_ACCOUNT_ID"]
      tunnel_id   = cloudflare_tunnel.ssh.id
      tunnel_name = cloudflare_tunnel.ssh.name
      secret      = cloudflare_tunnel.ssh.secret
      web_zone    = local.envs["HOST_URL"]
    })
  }

  part {
    content_type = "text/x-shellscript"
    content = templatefile("./shell-scripts/run-docker.sh", {
      registry_url      = local.envs["REGISTRY_URL"]
      cicd_path         = local.envs["WORKDIR"]
      env               = local.envs["NODE_ENV"]
      loki_url          = local.envs["LOKI_URL"]
      registry_password = local.envs["REGISTRY_PASSWORD"]
      registry_id       = local.envs["REGISTRY_ID"]
      registry_url      = local.envs["REGISTRY_URL"]
      api_port          = local.envs["API_PORT_0"]
      revision_number   = data.github_branch.revision_number.sha
    })
  }
}
