#!/bin/bash

registry_url="${1:-${REGISTRY_URL}}"
cicd_path="${2:-${CICD_PATH}}"
node_env="${3:-${NODE_ENV}}"

docker pull "$registry_url"/pipe-timer-backend:"$node_env"
docker run -itd \
  -p 443:443 \
  -e NODE_ENV="$node_env" \
  --node_env-file "$cicd_path"/node_env/."$node_env".node_env \
  -v "$cicd_path"/certs:/certs/:ro \
  --name backend \
  "$registry_url"/pipe-timer-backend:"$node_env"
docker ps -a
