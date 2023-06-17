#!/bin/bash

cd ../../../../

PLATFORM=linux/arm64 npm run production:compose:build backend-pt

docker push "${REGISTRY_URL}/pipe-timer-backend:${NODE_ENV}"
