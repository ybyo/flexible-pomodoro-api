#!/bin/bash

registry_url="$1"
cicd_path="$2"
env="$3"
api_port="$4"
loki_url="$5"

docker network create pipe-timer || { echo 'Failed to create network'; exit 1; }

docker run -itd \
  --name promtail \
  --network=pipe-timer \
  -v "${cicd_path}"/promtail-config.yml:/mnt/config/promtail-config.yml \
  -v /var/log:/var/log \
  -v /var/run/docker.sock:/var/run/docker.sock \
  grafana/promtail:2.8.0 \
  --config.file=/mnt/config/promtail-config.yml || { echo 'Failed to run promtail'; exit 1; }

docker run -itd \
  --name nestjs \
  -p "${api_port}":"${api_port}" \
  --env-file "${cicd_path}"/env/."${env}".env \
  --network=pipe-timer \
  --network-alias=nestjs \
  -v "$cicd_path"/certs:/certs:ro \
  -v "$cicd_path"/env:/env:ro \
  --restart on-failure \
  "$registry_url"/pipe-timer-backend:"$env" || { echo 'Failed to run nestjs'; exit 1; }

docker run -d \
  --name node-exporter \
  --net host \
  --pid host \
  -v /:/host:ro,rslave \
  -v "${cicd_path}"/web-config-exporter.yml:/web-config-exporter.yml:ro \
  -v "${cicd_path}"/certs:"${cicd_path}"/certs:ro \
  quay.io/prometheus/node-exporter:latest \
  --web.config.file=web-config-exporter.yml \
  --path.rootfs=/host || { echo 'Failed to run node-exporter'; exit 1; }

docker run -itd \
  --name nginx \
  -p 443:443 \
  --env-file "${cicd_path}"/env/."$env".env \
  --network=pipe-timer \
  --network-alias=nginx \
  -v "${cicd_path}"/nginx.conf:/etc/nginx/templates/nginx.conf.template:ro \
  -v "${cicd_path}"/certs:/etc/nginx/certs:ro \
  --add-host=host.docker.internal:host-gateway \
  nginx || { echo 'Failed to run nginx'; exit 1; }

sleep 5

docker ps -a
