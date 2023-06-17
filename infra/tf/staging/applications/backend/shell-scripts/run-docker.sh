#!/bin/bash

registry_url="${1:-${REGISTRY_URL}}"
cicd_path="${2:-${CICD_PATH}}"
env="${3:-${ENV}}"

docker pull "$registry_url"/pipe-timer-backend:"$env"
docker run -itd \
  -p 443:443 \
  -e NODE_ENV="$env" \
  --env-file "$cicd_path"/env/."$env".env \
  -v "$cicd_path"/certs:/certs/:ro \
  -v "$cicd_path"/env:/env \
  --name backend \
  "$registry_url"/pipe-timer-backend:"$env"
docker ps -a
