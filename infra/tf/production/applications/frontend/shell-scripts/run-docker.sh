#!/bin/bash

registry_url="${1:-${REGISTRY_URL}}"
cicd_path="${2:-${CICD_PATH}}"
node_env="${3:-${NODE_ENV}}"

docker pull "$registry_url"/pipe-timer-frontend:production
docker run -itd \
  -p 443:443 \
  -p 80:80 \
  --node_env-file "$cicd_path"/node_env/."$node_env".node_env \
  -v "$cicd_path"/certs:/etc/nginx/certs \
  -v "$cicd_path"/nginx.conf:/etc/nginx/nginx.conf \
  -v "$cicd_path"/public:/public \
  --name frontend \
  --restart=always \
  "$registry_url"/pipe-timer-frontend:"$node_env"

docker ps -a
