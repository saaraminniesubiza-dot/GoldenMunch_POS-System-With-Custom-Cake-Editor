#!/bin/bash

# Find the GoldenMunch repository
REPO_NAME="GoldenMunch_POS-System-With-Custom-Cake-Editor"

# Search in common locations
if [ -d "$HOME/$REPO_NAME" ]; then
    REPO_PATH="$HOME/$REPO_NAME"
elif [ -d "/home/pi/$REPO_NAME" ]; then
    REPO_PATH="/home/pi/$REPO_NAME"
elif [ -d "/home/saarasubiza/$REPO_NAME" ]; then
    REPO_PATH="/home/saarasubiza/$REPO_NAME"
else
    # Try to find it anywhere in home directory
    REPO_PATH=$(find "$HOME" -maxdepth 3 -type d -name "$REPO_NAME" 2>/dev/null | head -1)
fi

if [ -z "$REPO_PATH" ] || [ ! -d "$REPO_PATH" ]; then
    echo "ERROR: Could not find $REPO_NAME repository"
    echo "Searched in: $HOME, /home/pi, /home/saarasubiza"
    exit 1
fi

# Run the start script
exec bash "$REPO_PATH/scripts/start-kiosk.sh"
