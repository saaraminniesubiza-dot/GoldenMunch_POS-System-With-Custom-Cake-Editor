#!/bin/bash

# Log file location
LOGFILE="$HOME/kiosk-startup.log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "=========================================="
echo "GoldenMunch Kiosk Starting (Wayland)..."
echo "Time: $(date)"
echo "Process ID: $$"
echo "=========================================="

# Wait for Wayland session to be ready
echo "Waiting for Wayland session..."
MAX_WAIT=30
WAIT_COUNT=0
while [ -z "$WAYLAND_DISPLAY" ] && [ -z "$XDG_RUNTIME_DIR" ]; do
    echo "  Still waiting for Wayland session... ($WAIT_COUNT seconds)"
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ $WAIT_COUNT -gt $MAX_WAIT ]; then
        echo "WARNING: Wayland session variables not set, continuing anyway..."
        break
    fi
done
echo "✓ Session is ready"

# Check environment
echo "Display: $WAYLAND_DISPLAY"
echo "XDG Runtime: $XDG_RUNTIME_DIR"
echo "Desktop Session: $DESKTOP_SESSION"
echo "User: $USER"
echo "Home: $HOME"

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
echo "NODE_ENV: $NODE_ENV"

# Check network connectivity (non-blocking)
echo ""
echo "Checking network connectivity..."
if ping -c 1 -W 2 8.8.8.8 &> /dev/null; then
    echo "✓ Network is accessible"
else
    echo "⚠ WARNING: Network may not be available"
    echo "  This could affect npm operations but will continue anyway..."
fi

# Verify package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found in $KIOSK_DIR"
    exit 1
fi

# Start the Electron app
echo ""
echo "=========================================="
echo "Starting Electron app..."
echo "Command: npm run electron:dev"
echo "=========================================="
echo ""

# Set up trap to log exit
trap 'echo "========================================"; echo "Kiosk process exited at $(date)"; echo "Exit code: $?"; echo "=========================================="' EXIT

# Run with proper error handling
npm run electron:dev

# Capture exit code
EXIT_CODE=$?
echo ""
echo "npm run electron:dev exited with code: $EXIT_CODE"
exit $EXIT_CODE
