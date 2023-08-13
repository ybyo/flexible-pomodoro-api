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
    vault = {
      source  = "hashicorp/vault"
      version = "~> 3.18"
    }
  }
  backend "s3" {
    bucket         = "terraform-pt-state"
    key            = "pt/staging/applications/backend/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-pt-state-lock"
    encrypt        = true
  }

  required_version = "~> 1.5.3"
}

locals {
  envs = {
    for tuple in regexall("(.*)=(.*)", file("../../../../../env/.${var.env}.env")) : tuple[0] => trim(tuple[1], "\r")
  }
}

###################################
# Remote Docker Container Setup
###################################
resource "null_resource" "remove-docker" {
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
    command     = "chmod +x ./shell-scripts/build-push-registry.sh; ./shell-scripts/build-push-registry.sh ${local.envs["LINUX_PLATFORM"]} ${local.envs["REGISTRY_URL"]} ${local.envs["NODE_ENV"]}"
    working_dir = path.module
    interpreter = ["/bin/bash", "-c"]
  }
}


###################################
# Security Groups
###################################
data "http" "ip" {
  url = "https://ifconfig.me/ip"
}

data "cloudflare_ip_ranges" "cloudflare" {}

data "terraform_remote_state" "vpc" {
  backend = "s3"

  config = {
    bucket         = "terraform-pt-state"
    key            = "pt/staging/modules/vpc/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-pt-state-lock"
    encrypt        = true
  }
}

resource "aws_security_group" "pt_backend_staging" {
  name   = "pt_backend_staging"
  vpc_id = data.terraform_remote_state.vpc.outputs.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["${data.http.ip.response_body}/32"]
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

  ingress {
    from_port   = local.envs["NODE_EXPORTER_PORT"]
    to_port     = local.envs["NODE_EXPORTER_PORT"]
    protocol    = "tcp"
    cidr_blocks = [data.terraform_remote_state.vpc.outputs.public_subnet_1_cidr_block]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["${data.http.ip.response_body}/32"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [data.terraform_remote_state.vpc.outputs.public_subnet_1_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

###################################
# Vault
###################################
provider "vault" {
  address = "https://${local.envs["VAULT_URL"]}"
  token   = local.envs["VAULT_TOKEN"]
}

data "vault_generic_secret" "ssh" {
  path = "/pt/ssh"
}

data "vault_generic_secret" "ssl" {
  path = "/pt/ssl"
}

data "vault_generic_secret" "env" {
  path = "/pt/env/${var.env}"
}

###################################
# CloudFlare DNS
###################################
provider "cloudflare" {
  api_token = local.envs["CF_TOKEN"]
}

resource "random_password" "ssh_tunnel" {
  length  = 32
  special = false
}

resource "cloudflare_tunnel" "ssh" {
  account_id = local.envs["CF_ACCOUNT_ID"]
  name       = "backend-${local.envs["CF_ACCOUNT_ID"]}"
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
  name    = "ssh-${local.envs["UPSTREAM_BACKEND"]}"
  value   = cloudflare_tunnel.ssh.cname
  type    = "CNAME"
  proxied = "true"
}

resource "cloudflare_record" "frontend_staging" {
  zone_id = local.envs["CF_ZONE_ID"]
  name    = local.envs["HOST_URL"]
  value   = aws_instance.pipe_timer_backend.public_ip
  type    = "A"
  proxied = local.envs["PROXIED"]
}

data "template_cloudinit_config" "setup" {
  gzip          = true
  base64_encode = true

  part {
    content_type = "text/cloud-config"
    content = yamlencode({
      write_files = [
        {
          path        = "${local.envs["WORKDIR"]}/web-config-exporter.yml"
          permissions = "0644"
          content = templatefile("../../../../monitoring/config/web-config-exporter.yml", {
            PROM_ID     = local.envs["PROM_ID"]
            PROM_PW     = data.vault_generic_secret.env.data["PROM_PW"]
            WORKDIR     = local.envs["WORKDIR"]
            BASE_DOMAIN = local.envs["BASE_DOMAIN"]
          })
        },
        {
          path        = "${local.envs["WORKDIR"]}/promtail-config.yml"
          permissions = "0644"
          content = templatefile("../../../../monitoring/config/promtail-config.yml", {
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
    content_type = "text/cloud-config"
    content = templatefile("../scripts/cloud-init.yaml", {
      linux_platform = local.envs["LINUX_PLATFORM"]
      ssh_public_key = base64decode(data.vault_generic_secret.ssh.data["SSH_PUBLIC_KEY"])
      workdir        = local.envs["WORKDIR"]
    })
  }

  part {
    content_type = "text/x-shellscript"
    content = templatefile("../common-scripts/cleanup.sh", {
      tunnel_id   = cloudflare_tunnel.ssh.id
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
      registry_id       = local.envs["REGISTRY_ID"]
      api_port          = local.envs["API_PORT_0"]
    })
  }
}

###################################
# AWS EC2
###################################
provider "aws" {
  region = local.envs["REGION"]
}

data "aws_ami" "ubuntu" {
  filter {
    name   = "image-id"
    values = [local.envs["EC2_AMI"]]
  }
}

resource "aws_instance" "pipe_timer_backend" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = local.envs["EC2_FLAVOR"]
  subnet_id                   = data.terraform_remote_state.vpc.outputs.public_subnet_1_id
  vpc_security_group_ids      = [aws_security_group.pt_backend_staging.id]
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
    host        = aws_instance.pipe_timer_backend.public_ip
    agent       = false
  }

#  provisioner "file" {
#    source      = "./shell-scripts"
#    destination = local.envs["WORKDIR"]
#  }

#  provisioner "file" {
#    source      = "../common-scripts/"
#    destination = "${local.envs["WORKDIR"]}/shell-scripts/"
#  }

  provisioner "file" {
    source      = "../../../../../backend/templates/nginx.conf"
    destination = "/tmp/"
  }

  provisioner "file" {
    source      = "../../../../../env"
    destination = "/tmp/"
  }

  provisioner "remote-exec" {
    inline = [
      "sudo mv /tmp/nginx.conf ${local.envs["WORKDIR"]}/",
      "sudo mv /tmp/env ${local.envs["WORKDIR"]}/",
    ]
  }

#  provisioner "file" {
#    content     = data.template_file.node_exporter_config.rendered
#    destination = "${local.envs["WORKDIR"]}/web-config-exporter.yml"
#  }
#
#  provisioner "file" {
#    content     = data.template_file.promtail_config.rendered
#    destination = "${local.envs["WORKDIR"]}/promtail-config.yml"
#  }

#  provisioner "remote-exec" {
#    inline = [
#      "chmod 644 ${local.envs["WORKDIR"]}/certs/*",
#      "chmod -R +x ${local.envs["WORKDIR"]}/shell-scripts/*",
#      "sh ${local.envs["WORKDIR"]}/shell-scripts/install-docker.sh",
#    ]
#  }

#  provisioner "remote-exec" {
#    inline = [
#      "sudo curl -JLO 'https://dl.filippo.io/mkcert/latest?for=linux/${local.envs["LINUX_PLATFORM"]}'",
#      "sudo chmod +x mkcert-v*-linux-${local.envs["LINUX_PLATFORM"]}",
#      "sudo cp mkcert-v*-linux-${local.envs["LINUX_PLATFORM"]} /usr/local/bin/mkcert",
#      "sudo mkcert -install",
#    ]
#  }

#  provisioner "remote-exec" {
#    inline = [
#      "mysql -h ${local.envs["DB_BASE_URL"]} -u ${local.envs["DB_USERNAME"]} -p${local.envs["DB_PASSWORD"]} -e 'CREATE DATABASE IF NOT EXISTS ${local.envs["DB_NAME"]};'",
#      "echo ${local.envs["REGISTRY_PASSWORD"]} | docker login -u ${local.envs["REGISTRY_ID"]} ${local.envs["REGISTRY_URL"]} --password-stdin",
#      "${local.envs["WORKDIR"]}/shell-scripts/run-docker.sh ${local.envs["REGISTRY_URL"]} ${local.envs["WORKDIR"]} ${local.envs["NODE_ENV"]} ${local.envs["API_PORT_0"]} ${local.envs["LOKI_URL"]}",
#    ]
#  }

  provisioner "remote-exec" {
    inline = [
      "mysql -h ${local.envs["DB_BASE_URL"]} -u ${local.envs["DB_USERNAME"]} -p${local.envs["DB_PASSWORD"]} -e 'CREATE DATABASE IF NOT EXISTS ${local.envs["DB_NAME"]};'",
    ]
  }

  tags = {
    Name = "pt-${var.env}-backend"
  }

  depends_on = [null_resource.build_docker]
}
