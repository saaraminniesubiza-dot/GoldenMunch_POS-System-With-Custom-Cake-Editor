#!/bin/bash

# GoldenMunch Kiosk systemd Service Setup Script
# This script configures systemd to automatically start the kiosk on boot

echo "=========================================="
echo "GoldenMunch Kiosk systemd Setup"
echo "=========================================="
echo ""

# Detect repository location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Repository location: $REPO_ROOT"
echo "Current user: $USER"
echo ""

# Make scripts executable
echo "Making scripts executable..."
chmod +x "$REPO_ROOT/scripts/start-kiosk.sh"
chmod +x "$REPO_ROOT/scripts/kiosk-launcher.sh"
chmod +x "$REPO_ROOT/scripts/check-kiosk-setup.sh"
echo "✓ Scripts are now executable"
echo ""

# Create systemd service file
SERVICE_FILE="/tmp/kiosk.service"
echo "Creating systemd service file..."

cat > "$SERVICE_FILE" << EOF
[Unit]
Description=GoldenMunch Kiosk Application
After=graphical.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
Group=$USER
Environment="DISPLAY=:0"
Environment="XAUTHORITY=$HOME/.Xauthority"
Environment="NODE_ENV=production"
WorkingDirectory=$REPO_ROOT/client/Kiosk
ExecStartPre=/bin/sleep 10
ExecStart=$REPO_ROOT/scripts/start-kiosk.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=graphical.target
EOF

echo "✓ Service file created: $SERVICE_FILE"
echo ""

# Show the configuration
echo "Service configuration:"
echo "----------------------------------------"
cat "$SERVICE_FILE"
echo "----------------------------------------"
echo ""

# Install the service
echo "Installing systemd service..."
echo "This requires sudo privileges."
echo ""

sudo cp "$SERVICE_FILE" /etc/systemd/system/kiosk.service
sudo systemctl daemon-reload
sudo systemctl enable kiosk.service

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "The kiosk service has been installed and enabled."
echo ""
echo "To start the service now:"
echo "  sudo systemctl start kiosk.service"
echo ""
echo "To check service status:"
echo "  sudo systemctl status kiosk.service"
echo ""
echo "To view service logs:"
echo "  sudo journalctl -u kiosk.service -f"
echo ""
echo "To stop the service:"
echo "  sudo systemctl stop kiosk.service"
echo ""
echo "To disable autostart:"
echo "  sudo systemctl disable kiosk.service"
echo ""
