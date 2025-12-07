#!/bin/bash

echo "======================================"
echo "Quick Kiosk Test Script"
echo "======================================"
echo ""

# Test 1: Check current location
echo "1. Current directory:"
pwd
echo ""

# Test 2: Check if we're in the right repo
echo "2. Git repository check:"
git rev-parse --show-toplevel 2>/dev/null || echo "Not a git repository"
echo ""

# Test 3: Check if scripts exist
echo "3. Checking for scripts:"
if [ -f "scripts/start-kiosk.sh" ]; then
    echo "✓ scripts/start-kiosk.sh exists"
    ls -l scripts/start-kiosk.sh
else
    echo "✗ scripts/start-kiosk.sh NOT FOUND"
fi
echo ""

if [ -f "scripts/check-kiosk-setup.sh" ]; then
    echo "✓ scripts/check-kiosk-setup.sh exists"
    ls -l scripts/check-kiosk-setup.sh
else
    echo "✗ scripts/check-kiosk-setup.sh NOT FOUND"
fi
echo ""

# Test 4: Check git status
echo "4. Git status:"
git status --short
echo ""

# Test 5: Check current branch
echo "5. Current branch:"
git branch --show-current
echo ""

# Test 6: Check for merge conflicts
echo "6. Checking for merge conflicts:"
git diff --name-only --diff-filter=U 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ No merge conflicts"
else
    echo "! Possible merge conflicts"
fi
echo ""

# Test 7: Node and npm
echo "7. Node.js and npm:"
which node && node --version || echo "✗ Node not found in PATH"
which npm && npm --version || echo "✗ npm not found in PATH"
echo ""

# Test 8: Check if Kiosk directory exists
echo "8. Checking Kiosk directory:"
if [ -d "client/Kiosk" ]; then
    echo "✓ client/Kiosk directory exists"
    if [ -d "client/Kiosk/node_modules" ]; then
        echo "✓ node_modules exists"
    else
        echo "✗ node_modules NOT found - run: cd client/Kiosk && npm install"
    fi
else
    echo "✗ client/Kiosk directory NOT FOUND"
fi
echo ""

# Test 9: Check electron files
echo "9. Checking Electron files:"
if [ -f "client/Kiosk/electron/main.js" ]; then
    echo "✓ main.js exists"
else
    echo "✗ main.js NOT FOUND"
fi

if [ -f "client/Kiosk/electron/splash.html" ]; then
    echo "✓ splash.html exists"
else
    echo "✗ splash.html NOT FOUND"
fi
echo ""

echo "======================================"
echo "Test complete!"
echo "======================================"
