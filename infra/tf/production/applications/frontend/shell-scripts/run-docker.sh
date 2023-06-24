#!/bin/bash

registry_url="$1"
cicd_path="$2"
env="$3"

docker run -d --net host --pid host \
  -v /:/host:ro,rslave \
  -v "${cicd_path}"/web-config.yml:/web-config.yml \
  -v "${cicd_path}"/certs:"${cicd_path}"/certs \
  quay.io/prometheus/node-exporter:latest \
  --web.config.file=web-config.yml \
  --path.rootfs=/host

docker run -itd \
  -p 443:443 \
  -p 80:80 \
  --env-file="$cicd_path"/env/."$env".env \
  -v "$cicd_path"/certs:/etc/nginx/certs/:ro \
  -v "$cicd_path"/nginx.conf:/etc/nginx/templates/nginx.conf.template \
  -v "$cicd_path"/public:/public:ro \
  --name=frontend \
  --restart=on-failure \
  --add-host=host.docker.internal:host-gateway \
  "$registry_url"/pipe-timer-frontend:"$env"

sleep 5

docker ps -a
