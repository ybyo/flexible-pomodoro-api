#!/bin/bash

echo "${registry_password}" | sudo docker login -u "${registry_id}" "${registry_url}" --password-stdin

docker network create pipe-timer || { echo 'Failed to create network'; }

docker run -d \
  --restart=always \
  -v "${cicd_path}"/promtail-config.yml:/mnt/config/promtail-config.yml \
  -v /var/log:/var/log \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --name promtail \
  --network=pipe-timer \
  grafana/promtail:2.8.0 \
  --config.file=/mnt/config/promtail-config.yml || { echo 'Failed to run promtail'; }

docker run -d \
  --restart=always \
  -p "${api_port}":"${api_port}" \
  -v "${cicd_path}"/certs:/app/certs:ro \
  -v "${cicd_path}"/env:/env:ro \
  --name=nestjs \
  --env-file="${cicd_path}"/env/."${env}".env \
  --network=pipe-timer \
  --network-alias=nestjs \
  --restart=on-failure \
  "${registry_url}"/pipe-timer-backend:"${env}" || { echo 'Failed to run nestjs'; }

docker run -d \
  --restart=always \
  -v /:/host:ro,rslave \
  -v "${cicd_path}"/web-config-exporter.yml:/web-config-exporter.yml:ro \
  -v "${cicd_path}"/certs:"${cicd_path}"/certs:ro \
  --name=node-exporter \
  --net=host \
  --pid=host \
  quay.io/prometheus/node-exporter:latest \
  --web.config.file=web-config-exporter.yml \
  --path.rootfs=/host || { echo 'Failed to run node-exporter'; }

docker run -d \
  --restart=always \
  -p 443:443 \
  -v "${cicd_path}"/nginx.conf:/etc/nginx/templates/nginx.conf.template:ro \
  -v "${cicd_path}"/certs:/etc/nginx/certs:ro \
  --name=nginx \
  --env-file="${cicd_path}"/env/."${env}".env \
  --network=pipe-timer \
  --network-alias=nginx \
  --add-host=host.docker.internal:host-gateway \
  nginx || { echo 'Failed to run nginx'; }

sleep 5

docker ps -a
