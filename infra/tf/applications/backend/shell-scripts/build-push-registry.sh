#!/bin/bash

cd ../../../

PLATFORM=linux/$1 TAG=$2 pnpm run "$4:compose:build" pt-backend

docker push "$3/pt-backend-$4:$2"
