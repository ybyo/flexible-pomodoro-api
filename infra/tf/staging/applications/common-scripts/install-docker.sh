#!/bin/bash

if ! docker --version; then
  retry_count=1
  while ! sudo apt update -y; do
    echo "Failed to update package list, retrying in 5 seconds... (attempt $retry_count)"
    sleep 5
    retry_count=$((retry_count+1))
    if [ $retry_count -gt 20 ]; then
      echo "Failed to update package list after 20 attempts, exiting..."
      exit 1
    fi
  done

  sudo apt install -y ca-certificates curl gnupg
  sudo mkdir -m 0755 -p /etc/apt/keyrings

  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" |
    sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

  sudo apt update -y
  sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo systemctl enable docker
  sudo systemctl start docker
  sudo usermod -aG docker ubuntu
  sudo -u ubuntu newgrp docker

else
  echo "Docker is already installed"
fi