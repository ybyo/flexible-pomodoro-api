#!/bin/bash

image_name="${REGISTRY_URL}/pipe-timer-backend"
image_tag="${ENV}"
path="${PATH}"

docker buildx build --platform linux/arm64 \
  --build-arg NODE_ENV="$image_tag" \
  -t "$image_name":"$image_tag" \
  -o type=docker \
  --no-cache "$path"

docker push "$image_name":"$image_tag"
