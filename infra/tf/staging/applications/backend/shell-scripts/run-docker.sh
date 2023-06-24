#!/bin/bash

registry_url="$1"
cicd_path="$2"
env="$3"
api_port="$4"

docker network create pipe-timer

docker run -d --net host --pid host \
  -v /:/host:ro,rslave \
  -v "${cicd_path}"/web-config.yml:/web-config.yml:ro \
  -v "${cicd_path}"/certs:"${cicd_path}"/certs:ro \
  quay.io/prometheus/node-exporter:latest \
  --web.config.file=web-config.yml \
  --path.rootfs=/host

docker run -itd \
  -p "${api_port}":"${api_port}" \
  --env-file "$cicd_path"/env/."$env".env \
  --network=pipe-timer \
  --network-alias=backend \
  -v "$cicd_path"/certs:/certs:ro \
  -v "$cicd_path"/env:/env:ro \
  --name backend \
  --restart on-failure \
  "$registry_url"/pipe-timer-backend:"$env"

docker run --name nginx \
  -p 443:443 \
  --env-file "${cicd_path}"/env/."$env".env \
  --network=pipe-timer \
  --network-alias=nginx \
  -v "${cicd_path}"/nginx.conf:/etc/nginx/templates/nginx.conf.template:ro \
  -v "${cicd_path}"/certs:/etc/nginx/certs:ro \
  --add-host=host.docker.internal:host-gateway \
  -d nginx

sleep 5

docker ps -a
