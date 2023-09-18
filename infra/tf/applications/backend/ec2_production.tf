###################################
# AWS EC2 Backend(Production)
###################################
resource "aws_instance" "backend_production" {
  count = terraform.workspace == "production" ? 1 : 0

  ami           = data.aws_ami.ubuntu.id
  instance_type = local.envs["EC2_FLAVOR"]
  subnet_id     = local.subnet_id
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
    host        = aws_instance.backend_production[count.index].public_ip
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

  provisioner "remote-exec" {
    inline = [
      "sudo apt update",
      "sudo apt install -y mariadb-client",
      "sudo mysql -h ${local.envs["DB_BASE_URL"]} -u ${local.envs["DB_USERNAME"]} -p${local.envs["DB_PASSWORD"]} -e 'CREATE DATABASE IF NOT EXISTS ${local.envs["DB_NAME"]};' || true",
    ]
  }

  depends_on = [null_resource.build_docker]

  tags = {
    Name        = "backend"
    Environment = terraform.workspace
  }
}
