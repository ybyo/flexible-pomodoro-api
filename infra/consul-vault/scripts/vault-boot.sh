#!/bin/sh

vault server -config=/vault/config/config.json &

while true
do
  sh /data/generate-secret.sh
  sleep 30
done
