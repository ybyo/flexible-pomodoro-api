#!/bin/bash

cd ../../../../

PLATFORM=linux/$1 pnpm run production:compose:build backend-pt

docker push "$2/pipe-timer-backend:$3"
