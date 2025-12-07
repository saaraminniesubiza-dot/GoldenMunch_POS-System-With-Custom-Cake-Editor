#!/bin/bash

echo "========================================"
echo "GoldenMunch Kiosk Setup Diagnostic Tool"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect repository location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check 1: Repository location
echo "1. Checking repository location..."
echo -e "${GREEN}✓${NC} Repository found at: $REPO_ROOT"
echo "   Current user: $USER"
echo "   Home directory: $HOME"
echo ""

# Check 2: Node.js and npm
echo "2. Checking Node.js and npm..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js NOT installed"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm NOT installed"
fi
echo ""

# Check 3: Kiosk dependencies
echo "3. Checking Kiosk dependencies..."
KIOSK_DIR="$REPO_ROOT/client/Kiosk"
if [ -d "$KIOSK_DIR/node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists in Kiosk directory"
else
    echo -e "${RED}✗${NC} node_modules NOT found"
    echo "   Run: cd $KIOSK_DIR && npm install"
fi
echo ""

# Check 4: Startup script
echo "4. Checking startup script..."
START_SCRIPT="$REPO_ROOT/scripts/start-kiosk.sh"
if [ -f "$START_SCRIPT" ]; then
    echo -e "${GREEN}✓${NC} start-kiosk.sh exists"
    if [ -x "$START_SCRIPT" ]; then
        echo -e "${GREEN}✓${NC} start-kiosk.sh is executable"
    else
        echo -e "${RED}✗${NC} start-kiosk.sh is NOT executable"
        echo "   Run: chmod +x $START_SCRIPT"
    fi
else
    echo -e "${RED}✗${NC} start-kiosk.sh NOT found"
fi
echo ""

# Check 5: LXDE autostart
echo "5. Checking LXDE autostart configuration..."
if [ -f "$HOME/.config/lxsession/LXDE-pi/autostart" ]; then
    echo -e "${GREEN}✓${NC} LXDE autostart file exists"
    if grep -q "start-kiosk.sh" "$HOME/.config/lxsession/LXDE-pi/autostart"; then
        echo -e "${GREEN}✓${NC} Kiosk script is in autostart"
        echo "   Autostart contents:"
        cat "$HOME/.config/lxsession/LXDE-pi/autostart" | grep "start-kiosk"
    else
        echo -e "${RED}✗${NC} Kiosk script NOT in autostart file"
    fi
else
    echo -e "${RED}✗${NC} LXDE autostart file NOT found at ~/.config/lxsession/LXDE-pi/autostart"
fi
echo ""

# Check 6: systemd service
echo "6. Checking systemd service..."
if [ -f "/etc/systemd/system/kiosk.service" ]; then
    echo -e "${GREEN}✓${NC} systemd service file exists"
    if systemctl is-enabled kiosk.service &> /dev/null; then
        echo -e "${GREEN}✓${NC} kiosk.service is enabled"
    else
        echo -e "${YELLOW}!${NC} kiosk.service exists but is NOT enabled"
    fi
    if systemctl is-active kiosk.service &> /dev/null; then
        echo -e "${GREEN}✓${NC} kiosk.service is currently running"
    else
        echo -e "${YELLOW}!${NC} kiosk.service is NOT running"
    fi
else
    echo -e "${YELLOW}!${NC} systemd service NOT configured (this is OK if using LXDE autostart)"
fi
echo ""

# Check 7: Display rotation
echo "7. Checking display rotation..."
if [ -f "/boot/config.txt" ]; then
    if grep -q "display_rotate" /boot/config.txt; then
        ROTATION=$(grep "display_rotate" /boot/config.txt | tail -1)
        echo -e "${GREEN}✓${NC} Display rotation configured: $ROTATION"
    else
        echo -e "${YELLOW}!${NC} Display rotation NOT configured in /boot/config.txt"
    fi
elif [ -f "/boot/firmware/config.txt" ]; then
    if grep -q "display_rotate" /boot/firmware/config.txt; then
        ROTATION=$(grep "display_rotate" /boot/firmware/config.txt | tail -1)
        echo -e "${GREEN}✓${NC} Display rotation configured: $ROTATION"
    else
        echo -e "${YELLOW}!${NC} Display rotation NOT configured in /boot/firmware/config.txt"
    fi
else
    echo -e "${YELLOW}!${NC} Could not find boot config file"
fi
echo ""

# Check 8: X server
echo "8. Checking X server..."
if xset q &>/dev/null; then
    echo -e "${GREEN}✓${NC} X server is running"
    echo "   Display: $DISPLAY"
else
    echo -e "${RED}✗${NC} X server NOT running or DISPLAY not set"
fi
echo ""

# Check 9: Recent logs
echo "9. Checking recent error logs..."
if [ -f "$HOME/.xsession-errors" ]; then
    echo "Last 10 lines of .xsession-errors:"
    tail -10 "$HOME/.xsession-errors"
else
    echo -e "${YELLOW}!${NC} No .xsession-errors file found"
fi
echo ""

# Check 10: Running processes
echo "10. Checking if Electron is running..."
if pgrep -f "electron.*Kiosk" > /dev/null; then
    echo -e "${GREEN}✓${NC} Electron process found:"
    ps aux | grep -i "[e]lectron.*Kiosk"
else
    echo -e "${RED}✗${NC} Electron NOT running"
fi
echo ""

echo "========================================"
echo "Diagnostic complete!"
echo "========================================"
echo ""
echo "To test the kiosk manually, run:"
echo "  bash $START_SCRIPT"
echo ""
echo "Repository location: $REPO_ROOT"
echo ""
