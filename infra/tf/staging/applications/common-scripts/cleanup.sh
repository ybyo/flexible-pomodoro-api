#!/bin/sh

touch cleanup_tunnel.service
cat > cleanup_tunnel.service << EOF
[Unit]
Description=Run cleanup_tunnel script at shutdown
DefaultDependencies=no
Before=shutdown.target reboot.target halt.target

[Service]
Type=oneshot
ExecStart=sudo systemctl stop cloudflared
TimeoutStartSec=0

[Install]
WantedBy=halt.target reboot.target shutdown.target
EOF
sudo mv cleanup_tunnel.service /etc/systemd/system/cleanup_tunnel.service
sudo systemctl enable cleanup_tunnel.service
