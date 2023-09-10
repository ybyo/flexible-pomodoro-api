#!/bin/bash

registry_url="$1"
registry_id="$2"
registry_password="$3"

echo "$registry_password" | docker login -u "$registry_id" "$registry_url" --password-stdin
