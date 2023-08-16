#!/bin/bash

echo "${registry_password}" | sudo docker login -u "${registry_id}" "${registry_url}" --password-stdin

docker run -itd \
  --name promtail \
  -v "${cicd_path}"/promtail-config.yml:/mnt/config/promtail-config.yml \
  -v /var/log:/var/log \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --config.file=/mnt/config/promtail-config.yml \
  grafana/promtail:2.8.0

docker run -d \
  --name node-exporter \
  --net host \
  --pid host \
  -v /:/host:ro,rslave \
  -v "${cicd_path}"/web-config-exporter.yml:/web-config-exporter.yml \
  -v "${cicd_path}"/certs:"${cicd_path}"/certs \
  quay.io/prometheus/node-exporter:latest \
  --web.config.file=web-config-exporter.yml \
  --path.rootfs=/host

docker run -itd \
  -p 80:80 \
  -p 443:443 \
  -v "${cicd_path}"/certs:/etc/nginx/certs/:ro \
  -v "${cicd_path}"/nginx.conf:/etc/nginx/templates/nginx.conf.template \
  -v "${cicd_path}"/public:/public:ro \
  --env-file="${cicd_path}"/env/."${env}".env \
  --name=frontend \
  --restart=always \
  --add-host=host.docker.internal:host-gateway \
  "${registry_url}"/pipe-timer-frontend:"${env}"

sleep 5
