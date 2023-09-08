#!/bin/bash

cd ../../../../

PLATFORM=linux/$1 TAG=$2 pnpm run "$4:compose:build" pt-frontend

docker push "$3/pt-frontend-$4:$2"
