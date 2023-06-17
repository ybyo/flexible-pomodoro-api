#!/bin/bash

registry_url="${1:-${REGISTRY_URL}}"
registry_id="${2:-${REGISTRY_ID}}"
registry_password="${3:-${REGISTRY_PASSWORD}}"

echo "$registry_password" | docker login -u "$registry_id" "$registry_url" --registry_password-stdin
