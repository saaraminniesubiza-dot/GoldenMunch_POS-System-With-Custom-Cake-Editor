#!/bin/bash

# Wait for X server to be ready
while ! xset q &>/dev/null; do
    echo "Waiting for X server..."
    sleep 1
done

# Disable screen blanking and power management
xset s off
xset -dpms
xset s noblank

# Change to the Kiosk directory
cd /home/pi/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk

# Start the Electron app
npm run electron:dev
