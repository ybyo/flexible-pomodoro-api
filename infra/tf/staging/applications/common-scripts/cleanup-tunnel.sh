#!/bin/sh

if [ ! -z "${TUNNEL_ID}" ]; then
  curl --request DELETE \
    --url https://api.cloudflare.com/client/v4/accounts/"${CF_ACCOUNT_ID}"/cfd_tunnel/"${TUNNEL_ID}" \
    --header "Content-Type: application/json" \
    --header "X-Auth-Email: ${CF_EMAIL}" \
    --header "X-Auth-Key: ${TUNNEL_TOKEN}"
  echo "Tunnel ${TUNNEL_ID} deleted."
fi

if [ -z "${TUNNEL_ID}" ]; then
  echo "Tunnel ID not found."
fi
