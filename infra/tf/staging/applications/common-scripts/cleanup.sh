#!/bin/sh

touch cleanup_tunnel.sh
cat > cleanup_tunnel.sh << EOF
if command -v cloudflared >/dev/null 2>&1; then
  sudo systemctl stop cloudflared
fi
EOF
chmod +x cleanup_tunnel.sh
mv cleanup_tunnel.sh /home/ubuntu

touch cleanup_tunnel.service
cat > cleanup_tunnel.service << EOF
[Unit]
Description=Run cleanup_tunnel script at shutdown
DefaultDependencies=no
Before=shutdown.target reboot.target halt.target

[Service]
Type=oneshot
ExecStart=/home/ubuntu/cleanup_tunnel.sh
TimeoutStartSec=0

[Install]
WantedBy=halt.target reboot.target shutdown.target
EOF
sudo mv cleanup_tunnel.service /etc/systemd/system/cleanup_tunnel.service
sudo systemctl enable cleanup_tunnel.service
sudo systemctl start cleanup_tunnel.service
