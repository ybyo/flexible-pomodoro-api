#!/bin/bash

cd ../../../../

PLATFORM=linux/arm64 npm run production:compose:build backend-pt

docker push "$1/pipe-timer-backend:$2"
