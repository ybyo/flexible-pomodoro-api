#!/bin/sh

if [ ! -z "${TUNNEL_ID}" ]; then
  curl -X DELETE https://api.cloudflare.com/client/v4/accounts/"${CF_ACCOUNT_ID}"/cfd_tunnel/"${TUNNEL_ID}"/connections \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${CF_TOKEN}"

  echo "Tunnel ${TUNNEL_ID} deleted."
fi

if [ -z "${TUNNEL_ID}" ]; then
  echo "Tunnel ID not found."
fi
