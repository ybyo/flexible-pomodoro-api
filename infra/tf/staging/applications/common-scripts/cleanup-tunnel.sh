#!/bin/sh

CLOUDFLARE_AUTH_HEADER="Authorization: Bearer ${CF_TOKEN}"

if [ ! -z "$TUNNEL_ID" ]; then
  curl -s -H "${CLOUDFLARE_AUTH_HEADER}" -X DELETE "https://api.cloudflare.com/client/v4/tunnels/$TUNNEL_ID"
  echo "Tunnel $TUNNEL_ID deleted."
else
  echo "Tunnel $TUNNEL_ID not found."
fi
