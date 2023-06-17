#!/bin/bash

cd ../../../../

PLATFORM=linux/amd64 npm run staging:compose:build nginx-pt

docker push "${REGISTRY_URL}/pipe-timer-frontend:${NODE_ENV}"
