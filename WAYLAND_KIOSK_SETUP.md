# Raspberry Pi Kiosk Setup for Wayland (rpd-labwc)

This guide is specifically for **Raspberry Pi OS with Wayland** (using rpd-labwc compositor). If you're using the older LXDE/X11 setup, see `RASPBERRY_PI_KIOSK_SETUP.md` instead.

## Detecting Your Desktop Environment

To check which desktop environment you're using:

```bash
echo $DESKTOP_SESSION
```

- If it shows `rpd-labwc` or `wayland` → Use this guide
- If it shows `LXDE` or `lxde-pi` → Use `RASPBERRY_PI_KIOSK_SETUP.md`

## Prerequisites

1. Raspberry Pi with Raspberry Pi OS (Wayland) installed
2. This repository cloned to your home directory
3. Node.js and npm installed
4. All dependencies installed:
   ```bash
   cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
   npm install
   ```

## Quick Setup (Recommended)

### One-Command Installation

Just run this single command from the repository root:

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
bash scripts/setup-wayland-autostart.sh
```

This script will:
- Make all necessary scripts executable
- Create systemd user service directory
- Install and enable the kiosk service
- Show you useful management commands

### Reboot or Start Now

After running the setup script:

**Option 1: Reboot** (kiosk will start automatically on login)
```bash
sudo reboot
```

**Option 2: Start immediately** (without rebooting)
```bash
systemctl --user start kiosk-wayland.service
```

## Managing the Kiosk

### Check Status
```bash
systemctl --user status kiosk-wayland.service
```

### View Logs
```bash
# View systemd journal logs
journalctl --user -u kiosk-wayland.service -f

# View startup log file
cat ~/kiosk-startup.log

# View last 50 lines of startup log
tail -50 ~/kiosk-startup.log
```

### Stop the Kiosk
```bash
systemctl --user stop kiosk-wayland.service
```

### Restart the Kiosk
```bash
systemctl --user restart kiosk-wayland.service
```

### Disable Autostart
```bash
systemctl --user disable kiosk-wayland.service
```

### Re-enable Autostart
```bash
systemctl --user enable kiosk-wayland.service
```

## Display Rotation (Portrait Mode)

To set your display to portrait mode:

```bash
sudo nano /boot/firmware/config.txt
```

Add at the end:
```
display_rotate=1
```

**Rotation Options:**
- `0` = Normal (landscape)
- `1` = 90 degrees (portrait)
- `2` = 180 degrees (upside down)
- `3` = 270 degrees (portrait, rotated the other way)

Save and reboot:
```bash
sudo reboot
```

**Note:** On newer Raspberry Pi OS, the config file is in `/boot/firmware/config.txt` (not `/boot/config.txt`)

## Additional Kiosk Configuration (Optional)

### Auto-login (Skip Login Screen)

Use raspi-config:
```bash
sudo raspi-config
```

Navigate to: `System Options` → `Boot / Auto Login` → `Desktop Autologin`

### Hide Boot Messages

Edit cmdline.txt:
```bash
sudo nano /boot/firmware/cmdline.txt
```

Add to the end of the line (keep everything on one line):
```
logo.nologo quiet splash vt.global_cursor_default=0
```

### Disable Screen Blanking

For Wayland, create or edit:
```bash
mkdir -p ~/.config/labwc
nano ~/.config/labwc/rc.xml
```

Add:
```xml
<?xml version="1.0"?>
<labwc_config>
  <core>
    <gap>0</gap>
  </core>
  <keyboard>
    <default />
  </keyboard>
</labwc_config>
```

## Troubleshooting

### Check System Information

Run these commands to understand your system:

```bash
# Check desktop session
echo $DESKTOP_SESSION

# Check architecture
uname -m

# Check OS version
cat /etc/os-release
```

### Service Not Starting

1. **Check service status:**
   ```bash
   systemctl --user status kiosk-wayland.service
   ```

2. **View detailed logs:**
   ```bash
   journalctl --user -u kiosk-wayland.service -n 100 --no-pager
   ```

3. **Check startup log:**
   ```bash
   cat ~/kiosk-startup.log
   ```

4. **Test startup script manually:**
   ```bash
   bash ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts/start-kiosk-wayland.sh
   ```

### Dependencies Missing

If you see npm or node errors:

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
npm install
```

### Port Already in Use

If you see "port 3002 already in use":

```bash
# Find what's using port 3002
sudo lsof -i :3002

# Kill the process (replace PID with actual process ID)
kill -9 PID
```

### Electron Not Starting

Check Electron installation:
```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
npm run verify
```

If Electron is missing or broken:
```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
npm install electron --save-dev
```

## Files Created

The setup script creates/uses these files:

- `~/.config/systemd/user/kiosk-wayland.service` - systemd service
- `~/kiosk-startup.log` - startup logs
- `scripts/start-kiosk-wayland.sh` - startup script
- `scripts/kiosk-wayland.service` - service template

## Uninstalling

To remove the kiosk autostart:

```bash
# Stop and disable service
systemctl --user stop kiosk-wayland.service
systemctl --user disable kiosk-wayland.service

# Remove service file
rm ~/.config/systemd/user/kiosk-wayland.service

# Reload systemd
systemctl --user daemon-reload
```

## Differences from X11/LXDE Setup

This Wayland setup:
- Uses systemd user services instead of LXDE autostart
- Doesn't use X11 commands (xset, etc.)
- Works with the rpd-labwc Wayland compositor
- Automatically detects your username and paths
- Logs to both journald and ~/kiosk-startup.log

## Need Help?

1. Check logs: `journalctl --user -u kiosk-wayland.service -f`
2. Check startup log: `cat ~/kiosk-startup.log`
3. Test manually: `bash ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts/start-kiosk-wayland.sh`
4. Check service status: `systemctl --user status kiosk-wayland.service`
