#!/bin/bash

cd ../../../../

PLATFORM=linux/arm64 npm run production:compose:build nginx-pt

docker push "$1/pipe-timer-frontend:$2"
