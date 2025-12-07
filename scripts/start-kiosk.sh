#!/bin/bash

# Log file location
LOGFILE="$HOME/kiosk-startup.log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "=========================================="
echo "GoldenMunch Kiosk Starting..."
echo "Time: $(date)"
echo "=========================================="

# Wait for X server to be ready
echo "Waiting for X server..."
MAX_WAIT=30
WAIT_COUNT=0
while ! xset q &>/dev/null; do
    echo "  Still waiting for X server... ($WAIT_COUNT seconds)"
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ $WAIT_COUNT -gt $MAX_WAIT ]; then
        echo "ERROR: X server did not start within $MAX_WAIT seconds"
        exit 1
    fi
done
echo "✓ X server is ready"

# Check display
echo "Display: $DISPLAY"
echo "User: $USER"
echo "Home: $HOME"

# Disable screen blanking and power management
echo "Disabling screen blanking..."
xset s off
xset -dpms
xset s noblank
echo "✓ Screen blanking disabled"

# Detect script location and navigate to Kiosk directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KIOSK_DIR="$REPO_ROOT/client/Kiosk"

echo "Script location: $SCRIPT_DIR"
echo "Repository root: $REPO_ROOT"
echo "Kiosk directory: $KIOSK_DIR"

if [ ! -d "$KIOSK_DIR" ]; then
    echo "ERROR: Directory not found: $KIOSK_DIR"
    exit 1
fi
cd "$KIOSK_DIR" || exit 1
echo "✓ Changed to Kiosk directory"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "WARNING: node_modules not found. Running npm install..."
    npm install
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm command not found"
    echo "Attempting to load nvm..."
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    if ! command -v npm &> /dev/null; then
        echo "ERROR: Still cannot find npm"
        exit 1
    fi
fi

echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

# Start the Electron app
echo "Starting Electron app..."
echo "Command: npm run electron:dev"
npm run electron:dev
