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
  }

  required_version = ">= 1.2.0"
}

locals {
  envs = {
    for tuple in regexall("(.*)=(.*)", file("../../../../../env/.production.env")) : tuple[0] => trim(tuple[1], "\r")
  }
  flavor_amd = "t2.nano"
  flavor_arm = "t4g.nano"
  ami_arm    = "ami-0ac62099928d25fec" # Canonical, Ubuntu, 20.04 LTS, arm64
  ami_amd    = "ami-04341a215040f91bb" # Canonical, Ubuntu, 20.04 LTS, amd64
}

provider "cloudflare" {
  api_token = local.envs["CF_TOKEN"]
}

provider "aws" {
  region = local.envs["REGION"]
}

resource "null_resource" "remove_docker" {
  provisioner "local-exec" {
    command     = "../common-scripts/remove-images.sh ${local.envs["REGISTRY_URL"]}"
    working_dir = path.module
    interpreter = ["/bin/bash", "-c"]
  }
}

resource "null_resource" "build_docker" {
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

# EC2 Essentials
data "http" "ip" {
  url = "https://ifconfig.me/ip"
}

data "aws_ami" "ubuntu" {
  filter {
    name   = "image-id"
    values = [local.ami_arm]
  }
}

data "terraform_remote_state" "network" {
  backend = "local"

  config = {
    path = "../../modules/network/vpc/terraform.tfstate"
  }
}

data "cloudflare_ip_ranges" "cloudflare" {}

resource "aws_security_group" "sg_pipe_timer_frontend" {
  name   = "sg_pipe_timer_frontend"
  vpc_id = data.terraform_remote_state.network.outputs.vpc_id

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
    cidr_blocks = ["${data.http.ip.response_body}/32"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "ingress" {
    for_each = data.cloudflare_ip_ranges.cloudflare.ipv4_cidr_blocks

    content {
      from_port   = local.envs["NODE_EXPORTER_PORT"]
      to_port     = local.envs["NODE_EXPORTER_PORT"]
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
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

data "template_file" "node_exporter_config" {
  template = file("../../../../monitoring/config/web-config.yml")

  vars = {
    PROM_ID     = local.envs["PROM_ID"]
    PROM_PW     = local.envs["PROM_PW"]
    WORKDIR     = local.envs["WORKDIR"]
    BASE_DOMAIN = local.envs["BASE_DOMAIN"]
  }
}

data "template_file" "user_data" {
  template = file("../scripts/add-ssh-web-app.yaml")
}

resource "aws_instance" "pipe-timer-frontend" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = local.flavor_arm
  subnet_id                   = data.terraform_remote_state.network.outputs.public_subnet_1_id
  vpc_security_group_ids      = [aws_security_group.sg_pipe_timer_frontend.id]
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
    user        = local.envs["USER"]
    private_key = file("../scripts/ssh")
    host        = aws_instance.pipe-timer-frontend.public_ip
  }

  provisioner "remote-exec" {
    inline = [
      "mkdir -p ${local.envs["WORKDIR"]}",
      "chmod 755 ${local.envs["WORKDIR"]}",
    ]
  }

  provisioner "file" {
    source      = "./certs"
    destination = local.envs["WORKDIR"]
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
    source      = "../../../../../frontend/templates/nginx.conf"
    destination = "${local.envs["WORKDIR"]}/nginx.conf"
  }

  provisioner "file" {
    source      = "../../../../../env"
    destination = "${local.envs["WORKDIR"]}/env"
  }

  provisioner "file" {
    source      = "../../../../../frontend/public"
    destination = "${local.envs["WORKDIR"]}/public"
  }

  provisioner "file" {
    content     = data.template_file.node_exporter_config.rendered
    destination = "${local.envs["WORKDIR"]}/web-config.yml"
  }

  provisioner "remote-exec" {
    inline = [
      "sudo curl -JLO 'https://dl.filippo.io/mkcert/latest?for=linux/arm64'",
      "sudo chmod +x mkcert-v*-linux-arm64",
      "sudo cp mkcert-v*-linux-arm64 /usr/local/bin/mkcert",
      "sudo mkcert -install",
    ]
  }

  provisioner "remote-exec" {
    inline = [
      "chmod 644 ${local.envs["WORKDIR"]}/certs/*",
      "chmod -R +x ${local.envs["WORKDIR"]}/shell-scripts/*",
      "${local.envs["WORKDIR"]}/shell-scripts/install-docker.sh",
    ]
  }

  provisioner "remote-exec" {
    inline = [
      "${local.envs["WORKDIR"]}/shell-scripts/login-docker-registry.sh ${local.envs["REGISTRY_URL"]} ${local.envs["REGISTRY_ID"]} ${local.envs["REGISTRY_PASSWORD"]}",
      "${local.envs["WORKDIR"]}/shell-scripts/run-docker.sh ${local.envs["REGISTRY_URL"]} ${local.envs["WORKDIR"]} ${local.envs["NODE_ENV"]}",
    ]
  }

  tags = {
    Name = "pipe-timer-frontend"
  }

  depends_on = [null_resource.build_docker]
}

resource "cloudflare_record" "frontend" {
  zone_id = local.envs["CF_ZONE_ID"]
  name    = local.envs["HOST_URL"]
  value   = aws_instance.pipe-timer-frontend.public_ip
  type    = "A"
  proxied = local.envs["PROXIED"]
}
