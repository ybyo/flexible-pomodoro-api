#!/bin/sh
set -e

touch /tmp/99-cloudflare-dns.yaml
cat > /tmp/99-cloudflare-dns.yaml << EOF
network:
  version: 2
  ethernets:
    eth0:
      nameservers:
        addresses: [1.1.1.1, 1.1.1.2, 1.1.1.3]
EOF

mv /tmp/99-cloudflare-dns.yaml /etc/netplan/99-cloudflare-dns.yaml
netplan apply
