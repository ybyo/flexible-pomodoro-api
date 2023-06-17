#!/bin/bash

registry_url="${1:-${REGISTRY_URL}}"

IMAGE_IDS=$(docker images --filter=reference="$registry_url/pipe-*" --format="{{.ID}}")

for IMAGE_ID in $IMAGE_IDS
do
  docker rmi "$IMAGE_ID"
done
