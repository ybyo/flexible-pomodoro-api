#!/bin/bash

cd ../../../../../

PLATFORM=linux/amd64 npm run staging:compose:build backend-pt

docker push "${REGISTRY_URL}/pipe-timer-backend:${NODE_ENV}"
