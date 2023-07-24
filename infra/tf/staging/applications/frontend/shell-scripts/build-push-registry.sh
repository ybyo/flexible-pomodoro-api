#!/bin/bash

cd ../../../../

PLATFORM=linux/amd64 npm run staging:compose:build nginx-pt

docker push "$1/pipe-timer-frontend:$2"
