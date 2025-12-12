#!/bin/bash

echo "=========================================="
echo "GoldenMunch Kiosk - Wayland Autostart Setup"
echo "=========================================="
echo ""

# Detect script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KIOSK_DIR="$REPO_ROOT/client/Kiosk"

echo "Detected configuration:"
echo "  Repository: $REPO_ROOT"
echo "  Kiosk directory: $KIOSK_DIR"
echo "  Current user: $USER"
echo "  Home directory: $HOME"
echo ""

# Check if Kiosk directory exists
if [ ! -d "$KIOSK_DIR" ]; then
    echo "ERROR: Kiosk directory not found at $KIOSK_DIR"
    exit 1
fi

# Make startup script executable
echo "1. Making startup script executable..."
chmod +x "$SCRIPT_DIR/start-kiosk-wayland.sh"
echo "   ✓ Done"
echo ""

# Create systemd user directory
echo "2. Setting up systemd user service..."
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
mkdir -p "$SYSTEMD_USER_DIR"
echo "   ✓ Created directory: $SYSTEMD_USER_DIR"

# Copy service file
SERVICE_FILE="$SYSTEMD_USER_DIR/kiosk-wayland.service"
cp "$SCRIPT_DIR/kiosk-wayland.service" "$SERVICE_FILE"
echo "   ✓ Installed service file: $SERVICE_FILE"
echo ""

# Reload systemd
echo "3. Reloading systemd daemon..."
systemctl --user daemon-reload
echo "   ✓ Done"
echo ""

# Enable the service
echo "4. Enabling kiosk service to start on boot..."
systemctl --user enable kiosk-wayland.service
echo "   ✓ Service enabled"
echo ""

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "The kiosk will automatically start when you log in."
echo ""
echo "Useful commands:"
echo ""
echo "  Start kiosk now (without rebooting):"
echo "    systemctl --user start kiosk-wayland.service"
echo ""
echo "  Stop kiosk:"
echo "    systemctl --user stop kiosk-wayland.service"
echo ""
echo "  Check status:"
echo "    systemctl --user status kiosk-wayland.service"
echo ""
echo "  View logs:"
echo "    journalctl --user -u kiosk-wayland.service -f"
echo "    cat ~/kiosk-startup.log"
echo ""
echo "  Disable autostart:"
echo "    systemctl --user disable kiosk-wayland.service"
echo ""
echo "  Restart kiosk:"
echo "    systemctl --user restart kiosk-wayland.service"
echo ""
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Reboot your Raspberry Pi, OR"
echo "  2. Run: systemctl --user start kiosk-wayland.service"
echo ""
