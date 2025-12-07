# Raspberry Pi Kiosk Setup Guide

This guide will help you set up your Raspberry Pi to automatically start the GoldenMunch Kiosk app in portrait mode on boot.

## Prerequisites

1. Raspberry Pi with Raspberry Pi OS installed
2. The repository cloned to your home directory (works with any username)
3. Node.js and npm installed
4. All dependencies installed (`cd client/Kiosk && npm install`)

**Note:** The setup scripts automatically detect your repository location - you don't need to use the `pi` username!

## Step 1: Set Display to Portrait Mode

Edit the boot configuration:
```bash
sudo nano /boot/config.txt
```

Add or modify this line at the end of the file:
```
display_rotate=1
```

**Rotation Options:**
- `0` = Normal (landscape)
- `1` = 90 degrees (portrait)
- `2` = 180 degrees (upside down)
- `3` = 270 degrees (portrait, rotated the other way)

For **Raspberry Pi 4 with dual monitors** or **Wayland**, you may need:
```
display_hdmi_rotate=1
```

Save and exit (Ctrl+X, then Y, then Enter).

## Step 2: Choose Your Autostart Method

### **Method A: LXDE Autostart (RECOMMENDED)**

This is the most reliable method for GUI applications.

**Easy Setup - Just run this one command:**

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
bash scripts/setup-autostart.sh
```

This script will:
- Make all scripts executable
- Create the LXDE autostart directory
- Generate autostart configuration with the correct paths for your system
- Show you the configuration it created

**Optional:** Install unclutter to hide the mouse cursor:
```bash
sudo apt-get install unclutter
```

**Then reboot:**
```bash
sudo reboot
```

### **Method B: systemd Service (ALTERNATIVE)**

Use this if you prefer systemd management.

**Easy Setup - Just run this one command:**

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
bash scripts/setup-systemd.sh
```

This script will:
- Make all scripts executable
- Generate systemd service file with the correct paths for your system
- Install and enable the service
- Show you how to manage the service

**Then reboot:**
```bash
sudo reboot
```

**To check service status:**
```bash
sudo systemctl status kiosk.service
```

**To view logs:**
```bash
sudo journalctl -u kiosk.service -f
```

## Step 3: Additional Kiosk Configuration (Optional)

### Disable Screen Blanking Permanently

Edit the lightdm configuration:
```bash
sudo nano /etc/lightdm/lightdm.conf
```

Find the `[Seat:*]` section and add:
```
xserver-command=X -s 0 -dpms
```

### Auto-login (Skip Login Screen)

Use raspi-config:
```bash
sudo raspi-config
```

Navigate to: `System Options` → `Boot / Auto Login` → `Desktop Autologin`

### Hide Boot Messages

Edit cmdline.txt:
```bash
sudo nano /boot/cmdline.txt
```

Add these to the end of the line (on the same line):
```
logo.nologo quiet splash vt.global_cursor_default=0
```

## Loading Screen

When the kiosk starts, you will see a beautiful loading screen with the GoldenMunch logo and a spinner. This indicates the app is starting up. The loading screen will automatically close once the app is fully loaded.

If you see the loading screen but the app never loads, check the logs (see Troubleshooting section below).

## Troubleshooting

### 🔧 Quick Diagnostic Tool

**FIRST: Run the diagnostic script to check your setup!**

```bash
bash ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts/check-kiosk-setup.sh
```

This will check:
- Repository location
- Node.js and npm installation
- Kiosk dependencies
- Startup script configuration
- LXDE autostart settings
- systemd service status
- Display rotation
- X server status
- Recent error logs
- Running processes

### 📋 Check the Startup Log

The startup script now creates a detailed log file:

```bash
cat ~/kiosk-startup.log
```

This log shows:
- When the app started
- X server status
- Environment variables
- Directory changes
- Node/npm versions
- Any errors that occurred

### App doesn't start on boot

1. **Run the diagnostic tool (see above)**

2. Check if the script is executable:
   ```bash
   ls -l ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts/start-kiosk.sh
   ```

3. Test the script manually:
   ```bash
   bash ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts/start-kiosk.sh
   ```

4. Check the startup log:
   ```bash
   tail -50 ~/kiosk-startup.log
   ```

5. Check for errors in the autostart log (for LXDE method):
   ```bash
   cat ~/.xsession-errors
   ```

6. Verify dependencies are installed:
   ```bash
   cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
   ls -la node_modules
   ```

### Loading screen appears but app never loads

1. Check if the Next.js dev server is starting:
   ```bash
   tail -50 ~/kiosk-startup.log | grep "localhost:3002"
   ```

2. Try accessing the app manually:
   ```bash
   curl http://localhost:3002
   ```

3. Check for port conflicts:
   ```bash
   sudo netstat -tulpn | grep 3002
   ```

4. Check npm and node paths:
   ```bash
   which node
   which npm
   ```

### Display not rotating
1. Make sure you saved `/boot/config.txt` correctly
2. Try `display_hdmi_rotate=1` instead of `display_rotate=1`
3. For newer Pi OS, check `/boot/firmware/config.txt` instead

### npm command not found
Add Node.js to your PATH in the startup script by editing:
```bash
nano ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts/start-kiosk.sh
```

Add at the top:
```bash
export PATH="/home/pi/.nvm/versions/node/v18.17.0/bin:$PATH"
```
(Adjust the Node version path to match your installation)

## Testing Without Reboot

To test the kiosk without rebooting:

**LXDE Method:**
```bash
bash ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts/start-kiosk.sh
```

**systemd Method:**
```bash
sudo systemctl start kiosk.service
```

## Stopping the Kiosk

**LXDE Method:**
- Press `Alt+F4` or `Ctrl+Q` (if not in kiosk mode)
- Or: `pkill -f electron`

**systemd Method:**
```bash
sudo systemctl stop kiosk.service
```

## Production Build (Optional)

For better performance, build the app for production:

1. Build the Electron app:
```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
npm run build
npm run electron:build:linux
```

2. Update the startup script to run the built executable instead of `npm run electron:dev`

---

**Need help?** Check the logs in `~/.xsession-errors` or `/var/log/syslog`
