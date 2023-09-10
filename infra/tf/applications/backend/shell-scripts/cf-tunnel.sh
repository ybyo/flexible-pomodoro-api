#!/bin/bash

mkdir /etc/cloudflared
touch /etc/cloudflared/cert.json
touch /etc/cloudflared/config.yml

cat > /etc/cloudflared/cert.json << EOF
{
    "AccountTag"   : "${account}",
    "TunnelID"     : "${tunnel_id}",
    "TunnelName"   : "${tunnel_name}",
    "TunnelSecret" : "${secret}"
}
EOF

cat > /etc/cloudflared/config.yml << EOF
tunnel: ${tunnel_id}
credentials-file: /etc/cloudflared/cert.json
logfile: /var/log/cloudflared.log
url: ssh://localhost:22
loglevel: info
EOF

wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb

sudo cloudflared --config /etc/cloudflared/config.yml service install
sudo cloudflared start &
