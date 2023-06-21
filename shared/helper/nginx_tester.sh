#!/bin/bash

rootPath=$1
nginxVersion=latest

result=$(MSYS_NO_PATHCONV=1  docker run --rm -t -a stdout --name my-nginx -v ${rootPath}/:/etc/nginx/:ro nginx:$nginxVersion nginx -c /etc/nginx/nginx.conf -t)

successful=$(echo $result | grep successful | wc -l)

if [ $successful = 0 ]; then
    echo FAILED
    echo "$result"
    exit 1
else
    echo SUCCESS
fi