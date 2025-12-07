#!/bin/bash

# GoldenMunch Kiosk Autostart Setup Script
# This script configures LXDE to automatically start the kiosk on boot

echo "=========================================="
echo "GoldenMunch Kiosk Autostart Setup"
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

# Create LXDE autostart directory
AUTOSTART_DIR="$HOME/.config/lxsession/LXDE-pi"
echo "Creating autostart directory..."
mkdir -p "$AUTOSTART_DIR"
echo "✓ Directory created: $AUTOSTART_DIR"
echo ""

# Create autostart file with correct path
AUTOSTART_FILE="$AUTOSTART_DIR/autostart"
echo "Creating autostart configuration..."

cat > "$AUTOSTART_FILE" << EOF
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi

# Disable screen blanking and power management
@xset s off
@xset -dpms
@xset s noblank

# Hide mouse cursor after inactivity (optional - requires unclutter)
@unclutter -idle 0.5 -root

# Start GoldenMunch Kiosk
@bash $REPO_ROOT/scripts/start-kiosk.sh
EOF

echo "✓ Autostart file created: $AUTOSTART_FILE"
echo ""

# Show the configuration
echo "Autostart configuration:"
echo "----------------------------------------"
cat "$AUTOSTART_FILE"
echo "----------------------------------------"
echo ""

# Check if unclutter is installed
if ! command -v unclutter &> /dev/null; then
    echo "⚠ WARNING: unclutter is not installed"
    echo "  To hide the mouse cursor, install it with:"
    echo "  sudo apt-get install unclutter"
    echo ""
fi

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "The kiosk will now start automatically when you log in."
echo ""
echo "To test without rebooting, run:"
echo "  bash $REPO_ROOT/scripts/start-kiosk.sh"
echo ""
echo "To check your configuration, run:"
echo "  bash $REPO_ROOT/scripts/check-kiosk-setup.sh"
echo ""
echo "To view startup logs after reboot:"
echo "  cat ~/kiosk-startup.log"
echo ""
