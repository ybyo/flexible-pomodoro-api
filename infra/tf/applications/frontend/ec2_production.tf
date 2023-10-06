###################################
# AWS EC2
###################################
resource "aws_instance" "frontend_production" {
  count = terraform.workspace == "production" ? 1 : 0

  ami           = data.aws_ami.ubuntu.id
  instance_type = local.envs["EC2_FLAVOR"]
  subnet_id     = local.subnet_id
  vpc_security_group_ids = [
    aws_security_group.ssh.id,
    aws_security_group.https.id,
    aws_security_group.node_exporter.id,
    aws_security_group.public_dns.id,
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
    host        = aws_instance.frontend_production[count.index].public_ip
    agent       = false
  }

  provisioner "file" {
    source      = "../../../../frontend/templates/nginx.conf"
    destination = "/tmp/nginx.conf"
  }

  provisioner "file" {
    source      = "../../../../env"
    destination = "/tmp/env"
  }

  provisioner "file" {
    source      = "../../../../frontend/public"
    destination = "/tmp/public"
  }

  provisioner "remote-exec" {
    inline = [
      "sudo mv /tmp/nginx.conf ${local.envs["WORKDIR"]}/",
      "sudo mv /tmp/env ${local.envs["WORKDIR"]}/",
      "sudo mv /tmp/public ${local.envs["WORKDIR"]}/",
      "sudo curl -JLO https://dl.filippo.io/mkcert/latest?for=linux/${local.envs["LINUX_PLATFORM"]}",
      "sudo chmod +x mkcert-v*-linux-${local.envs["LINUX_PLATFORM"]}",
      "sudo cp mkcert-v*-linux-${local.envs["LINUX_PLATFORM"]} /usr/local/bin/mkcert",
      "sudo mkcert -install"
    ]
  }

  depends_on = [null_resource.build_docker]

  tags = {
    Name        = "frontend-${terraform.workspace}-${count.index}"
    Environment = terraform.workspace
  }
}
