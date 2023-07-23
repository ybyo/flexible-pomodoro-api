#!/bin/bash

cd ../../../../

PLATFORM=linux/arm64 npm run production:compose:build nginx-pt

docker push "${REGISTRY_URL}/pipe-timer-frontend:${NODE_ENV}"
