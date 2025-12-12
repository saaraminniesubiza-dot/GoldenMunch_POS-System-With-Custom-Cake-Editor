#!/bin/bash

echo "=========================================="
echo "GoldenMunch Kiosk Diagnostics"
echo "=========================================="
echo ""

# Detect script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KIOSK_DIR="$REPO_ROOT/client/Kiosk"

echo "📁 Directory Information:"
echo "   Repository: $REPO_ROOT"
echo "   Kiosk: $KIOSK_DIR"
echo ""

echo "👤 User Information:"
echo "   User: $USER"
echo "   Home: $HOME"
echo "   Groups: $(groups)"
echo ""

echo "💻 System Information:"
echo "   OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "   Kernel: $(uname -r)"
echo "   Architecture: $(uname -m)"
echo "   Desktop Session: $DESKTOP_SESSION"
echo ""

echo "🖥️  Display Information:"
echo "   DISPLAY: $DISPLAY"
echo "   WAYLAND_DISPLAY: $WAYLAND_DISPLAY"
echo "   XDG_SESSION_TYPE: $XDG_SESSION_TYPE"
echo "   XDG_RUNTIME_DIR: $XDG_RUNTIME_DIR"
echo ""

echo "🌐 Network Connectivity:"
if ping -c 1 -W 2 8.8.8.8 &> /dev/null; then
    echo "   ✓ Internet is reachable (ping 8.8.8.8)"
else
    echo "   ✗ Cannot reach internet (ping 8.8.8.8 failed)"
fi

if ping -c 1 -W 2 registry.npmjs.org &> /dev/null; then
    echo "   ✓ npm registry is reachable"
else
    echo "   ⚠ Cannot reach npm registry"
fi
echo ""

echo "📦 Node.js & npm:"
if command -v node &> /dev/null; then
    echo "   ✓ Node: $(node --version)"
else
    echo "   ✗ Node.js not found"
fi

if command -v npm &> /dev/null; then
    echo "   ✓ npm: $(npm --version)"
else
    echo "   ✗ npm not found"
    if [ -d "$HOME/.nvm" ]; then
        echo "   ℹ nvm detected at $HOME/.nvm"
        echo "   Try running: source ~/.nvm/nvm.sh"
    fi
fi
echo ""

echo "📂 Kiosk Directory:"
if [ -d "$KIOSK_DIR" ]; then
    echo "   ✓ Directory exists"
    cd "$KIOSK_DIR"

    if [ -f "package.json" ]; then
        echo "   ✓ package.json found"
    else
        echo "   ✗ package.json NOT found"
    fi

    if [ -d "node_modules" ]; then
        echo "   ✓ node_modules exists"
        MODULE_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
        echo "      ($MODULE_COUNT packages)"
    else
        echo "   ⚠ node_modules NOT found - need to run: npm install"
    fi

    if [ -d "electron" ]; then
        echo "   ✓ electron/ directory exists"
    else
        echo "   ✗ electron/ directory NOT found"
    fi
else
    echo "   ✗ Kiosk directory NOT found at: $KIOSK_DIR"
fi
echo ""

echo "⚙️  Systemd Service (Wayland):"
if systemctl --user list-unit-files | grep -q kiosk-wayland.service; then
    echo "   ✓ Service file installed"

    if systemctl --user is-enabled kiosk-wayland.service &> /dev/null; then
        echo "   ✓ Service is enabled"
    else
        echo "   ⚠ Service is NOT enabled"
        echo "      Run: systemctl --user enable kiosk-wayland.service"
    fi

    if systemctl --user is-active kiosk-wayland.service &> /dev/null; then
        echo "   ✓ Service is running"
    else
        echo "   ⚠ Service is NOT running"
        echo "      Run: systemctl --user start kiosk-wayland.service"
    fi
else
    echo "   ⚠ Service NOT installed"
    echo "      Run: $SCRIPT_DIR/setup-wayland-autostart.sh"
fi
echo ""

echo "📋 Recent Logs:"
if [ -f "$HOME/kiosk-startup.log" ]; then
    echo "   Startup log: $HOME/kiosk-startup.log"
    echo "   Last 10 lines:"
    tail -n 10 "$HOME/kiosk-startup.log" | sed 's/^/      /'
else
    echo "   ⚠ No startup log found at $HOME/kiosk-startup.log"
fi
echo ""

echo "🔍 Service Status:"
if systemctl --user list-unit-files | grep -q kiosk-wayland.service; then
    systemctl --user status kiosk-wayland.service --no-pager -l | head -n 20 | sed 's/^/   /'
fi
echo ""

echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
echo ""
echo "💡 Common Solutions:"
echo ""
echo "1. If npm is missing:"
echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
echo "   source ~/.nvm/nvm.sh"
echo "   nvm install --lts"
echo ""
echo "2. If node_modules is missing:"
echo "   cd $KIOSK_DIR"
echo "   npm install"
echo ""
echo "3. If service is not installed:"
echo "   cd $SCRIPT_DIR"
echo "   ./setup-wayland-autostart.sh"
echo ""
echo "4. If service won't start:"
echo "   journalctl --user -u kiosk-wayland.service -n 50"
echo "   cat $HOME/kiosk-startup.log"
echo ""
echo "5. If npm exits immediately:"
echo "   Check that NODE_ENV=development in the service file"
echo "   systemctl --user cat kiosk-wayland.service | grep NODE_ENV"
echo ""
