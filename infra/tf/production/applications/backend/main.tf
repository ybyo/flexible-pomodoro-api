terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.64"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.4"
    }
    vault = {
      source  = "hashicorp/vault"
      version = "~> 3.17"
    }
  }
  backend "s3" {
    bucket         = "terraform-pt-state"
    key            = "pt/production/applications/backend/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-pt-state-lock"
    encrypt        = true
  }
}

locals {
  envs = {
    for tuple in regexall("(.*)=(.*)", file("../../../../../env/.${var.env}.env")) : tuple[0] => trim(sensitive(tuple[1], "\r"))
  }
}

###################################
# Remote Docker Container Setup
###################################
resource "null_resource" "remove-docker" {
  provisioner "local-exec" {
    command     = "../common-scripts/remove-images.sh ${local.envs["REGISTRY_URL"]}"
    working_dir = path.module
    interpreter = ["/bin/bash", "-c"]
  }
}

resource "null_resource" "build-docker" {
  provisioner "local-exec" {
    command     = "../common-scripts/login-docker-registry.sh ${local.envs["REGISTRY_URL"]} ${local.envs["REGISTRY_ID"]} ${local.envs["REGISTRY_PASSWORD"]}"
    working_dir = path.module
    interpreter = ["/bin/bash", "-c"]
  }

  provisioner "local-exec" {
    command = templatefile("./shell-scripts/build-push-registry.sh",
      {
        "REGISTRY_URL" = local.envs["REGISTRY_URL"]
        "NODE_ENV"     = local.envs["NODE_ENV"]
      })
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
    bucket  = "terraform-pt-state"
    key     = "pt/production/modules/vpc/terraform.tfstate"
    region  = "ap-northeast-2"
    encrypt = true
  }
}

resource "aws_security_group" "pt_backend_production" {
  name   = "pt_backend_production"
  vpc_id = data.terraform_remote_state.vpc.outputs.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["${data.http.ip.response_body}/32"]
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

  dynamic "ingress" {
    for_each = data.cloudflare_ip_ranges.cloudflare.ipv4_cidr_blocks

    content {
      from_port   = 443
      to_port     = 443
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

###################################
# Vault
###################################
provider "vault" {
  address = "https://vault.yidoyoon.com"
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
# Node Exporter, Promtail Config
###################################
data "template_file" "node_exporter_config" {
  template = file("../../../../monitoring/config/web-config-exporter.yml")

  vars = {
    PROM_ID     = local.envs["PROM_ID"]
    PROM_PW     = data.vault_generic_secret.env.data["PROM_PW"]
    WORKDIR     = local.envs["WORKDIR"]
    BASE_DOMAIN = local.envs["BASE_DOMAIN"]
  }
}

data "template_file" "promtail_config" {
  template = file("../../../../monitoring/config/promtail-config.yml")

  vars = {
    LOKI_URL      = local.envs["LOKI_URL"]
    PROMTAIL_PORT = local.envs["PROMTAIL_PORT"]
  }
}

###################################
# AWS EC2
###################################
provider "aws" {
  region = local.envs["REGION"]
}

data "template_file" "user_data" {
  template = file("../scripts/add-ssh-web-app.yaml")

  vars = {
    ssh_public_key  = base64decode(data.vault_generic_secret.ssh.data["SSH_PUBLIC_KEY"])
    ssl_public_key  = data.vault_generic_secret.ssl.data["SSL_PUBLIC_KEY"]
    ssl_private_key = data.vault_generic_secret.ssl.data["SSL_PRIVATE_KEY"]
    workdir         = local.envs["WORKDIR"]
  }
}

data "aws_ami" "ubuntu" {
  filter {
    name   = "image-id"
    values = [local.envs["EC2_AMI"]]
  }
}

resource "aws_instance" "pipe-timer-backend" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = local.envs["EC2_FLAVOR"]
  subnet_id                   = data.terraform_remote_state.vpc.outputs.public_subnet_1_id
  vpc_security_group_ids      = [aws_security_group.pt_backend_production.id]
  associate_public_ip_address = true
  user_data                   = data.template_file.user_data.rendered

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
    host        = aws_instance.pipe-timer-backend.public_ip
  }

  provisioner "file" {
    source      = "./shell-scripts"
    destination = local.envs["WORKDIR"]
  }

  provisioner "file" {
    source      = "../common-scripts/"
    destination = "${local.envs["WORKDIR"]}/shell-scripts/"
  }

  provisioner "file" {
    source      = "../../../../../backend/templates/nginx.conf"
    destination = "${local.envs["WORKDIR"]}/nginx.conf"
  }

  provisioner "file" {
    source      = "../../../../../env"
    destination = "${local.envs["WORKDIR"]}/env"
  }

  provisioner "file" {
    content     = data.template_file.node_exporter_config.rendered
    destination = "${local.envs["WORKDIR"]}/web-config-exporter.yml"
  }

  provisioner "file" {
    content     = data.template_file.promtail_config.rendered
    destination = "${local.envs["WORKDIR"]}/promtail-config.yml"
  }

  provisioner "remote-exec" {
    inline = [
      "sudo curl -JLO 'https://dl.filippo.io/mkcert/latest?for=linux/${local.envs["LINUX_PLATFORM"]}'",
      "sudo chmod +x mkcert-v*-linux-${local.envs["LINUX_PLATFORM"]}",
      "sudo cp mkcert-v*-linux-${local.envs["LINUX_PLATFORM"]} /usr/local/bin/mkcert",
      "sudo mkcert -install",
    ]
  }

  provisioner "remote-exec" {
    inline = [
      "sudo chmod 644 ${local.envs["WORKDIR"]}/certs/*",
      "sudo chmod -R +x ${local.envs["WORKDIR"]}/shell-scripts/*",
      "${local.envs["WORKDIR"]}/shell-scripts/install-docker.sh",
    ]
  }

  provisioner "remote-exec" {
    inline = [
      "sudo mysql -h ${local.envs["DB_BASE_URL"]} -u ${local.envs["DB_USERNAME"]} -p${local.envs["DB_PASSWORD"]} -e 'CREATE DATABASE IF NOT EXISTS ${local.envs["DB_NAME"]};'"
    ]
  }

  provisioner "remote-exec" {
    inline = [
      "${local.envs["WORKDIR"]}/shell-scripts/login-docker-registry.sh ${local.envs["REGISTRY_URL"]} ${local.envs["REGISTRY_ID"]} ${local.envs["REGISTRY_PASSWORD"]}",
      "${local.envs["WORKDIR"]}/shell-scripts/run-docker.sh ${local.envs["REGISTRY_URL"]} ${local.envs["WORKDIR"]} ${local.envs["NODE_ENV"]} ${local.envs["API_PORT_0"]} ${local.envs["LOKI_URL"]}",
    ]
  }

  tags = {
    Name = "pt-${var.env}-backend"
  }

  depends_on = [null_resource.build-docker]
}

###################################
# CloudFlare DNS
###################################
provider "cloudflare" {
  api_token = local.envs["CF_TOKEN"]
}

resource "cloudflare_record" "backend-production" {
  zone_id = local.envs["CF_ZONE_ID"]
  name    = local.envs["UPSTREAM_BACKEND"]
  value   = aws_instance.pipe-timer-backend.public_ip
  type    = "A"
  proxied = local.envs["PROXIED"]
}
