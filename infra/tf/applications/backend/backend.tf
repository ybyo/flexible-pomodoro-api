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
# CloudFlare DNS
###################################
resource "random_password" "ssh_tunnel" {
  length  = 32
  special = false
}

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

resource "cloudflare_record" "backend" {
  zone_id = local.envs["CF_ZONE_ID"]
  name    = local.envs["UPSTREAM_BACKEND"]
  value   = aws_instance.pt_backend.public_ip
  type    = "A"
  proxied = local.envs["PROXIED"]
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

###################################
# AWS EC2
###################################
resource "aws_instance" "pt_backend" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = local.envs["EC2_FLAVOR"]
  subnet_id     = data.terraform_remote_state.vpc.outputs.subnet1_id
  vpc_security_group_ids = [
    data.terraform_remote_state.vpc.outputs.sg_https_common_id,
    data.terraform_remote_state.vpc.outputs.sg_node_exporter_common_id,
    data.terraform_remote_state.vpc.outputs.sg_ssh_common_id,
  ]
  associate_public_ip_address = true
  user_data                   = data.template_cloudinit_config.setup.rendered

  lifecycle {
    create_before_destroy = true
  }

  root_block_device {
    volume_size = 15
    volume_type = "gp2"
  }

  connection {
    type        = "ssh"
    user        = local.envs["SSH_USER"]
    private_key = base64decode(data.vault_generic_secret.ssh.data["SSH_PRIVATE_KEY"])
    host        = aws_instance.pt_backend.public_ip
    agent       = false
  }

  provisioner "file" {
    source      = "../../../../backend/templates/nginx.conf"
    destination = "/tmp/nginx.conf"
  }

  provisioner "file" {
    source      = "../../../../env"
    destination = "/tmp/env"
  }

  provisioner "remote-exec" {
    inline = [
      "mkdir -p ${local.envs["WORKDIR"]}/certs",
      "sudo mv /tmp/nginx.conf ${local.envs["WORKDIR"]}/",
      "sudo mv /tmp/env ${local.envs["WORKDIR"]}/",
      "sudo curl -JLO https://dl.filippo.io/mkcert/latest?for=linux/${local.envs["LINUX_PLATFORM"]}",
      "sudo chmod +x mkcert-v*-linux-${local.envs["LINUX_PLATFORM"]}",
      "sudo cp mkcert-v*-linux-${local.envs["LINUX_PLATFORM"]} /usr/local/bin/mkcert",
      "sudo mkcert -install"
    ]
  }

  #  provisioner "remote-exec" {
  #    inline = [
  #      "sudo mysql -h ${local.envs["DB_BASE_URL"]} -u ${local.envs["DB_USERNAME"]} -p${local.envs["DB_PASSWORD"]} -e 'CREATE DATABASE IF NOT EXISTS ${local.envs["DB_NAME"]};'",
  #    ]
  #  }

  depends_on = [null_resource.build_docker]

  tags = {
    Name = "pt-${terraform.workspace}-backend"
  }
}
