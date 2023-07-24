#!/bin/bash

cd ../../../../

PLATFORM=linux/amd64 npm run production:compose:build backend-pt

docker push "$1/pipe-timer-backend:$2"
