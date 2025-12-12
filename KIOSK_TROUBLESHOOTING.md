# Kiosk Troubleshooting Guide

## Common Issue: npm Exits During Autostart

### Problem
When the kiosk starts automatically via systemd, npm exits immediately or the application fails to load.

### Root Causes

#### 1. **NODE_ENV Mismatch** ⚠️ MOST COMMON
**Symptoms:**
- Electron window opens but shows blank screen or error
- Logs show "Failed to load URL"
- npm process exits quickly

**Cause:**
The systemd service was set to `NODE_ENV=production`, but the startup script runs `npm run electron:dev` (development mode). In production mode, Electron expects a pre-built static site at `out/index.html`, but the dev server runs on `localhost:3002`.

**Solution:**
✅ **FIXED** - The service files now use `NODE_ENV=development`

Files updated:
- `scripts/kiosk-wayland.service`
- `scripts/kiosk.service`

#### 2. **Network Connectivity Issues**
**Symptoms:**
- npm install fails
- git clone fails with "Could not resolve host"
- Dev server won't start

**Diagnosis:**
```bash
ping -c 1 8.8.8.8
ping -c 1 registry.npmjs.org
```

**Solutions:**
- Check `/etc/resolv.conf` for DNS servers
- Verify network interface is up: `ip addr`
- Check router/WiFi connection
- Try using Google DNS: `nameserver 8.8.8.8` in `/etc/resolv.conf`

#### 3. **Missing Dependencies**
**Symptoms:**
- "Cannot find module" errors
- "npm: command not found"
- "node: command not found"

**Solutions:**
```bash
# Install Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.nvm/nvm.sh
nvm install --lts

# Install dependencies
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
npm install
```

#### 4. **Process Management Issues**
**Symptoms:**
- Service restarts repeatedly
- Logs show exit code 1 or 137
- Electron crashes

**Solutions:**
- Check logs: `journalctl --user -u kiosk-wayland.service -f`
- View startup log: `cat ~/kiosk-startup.log`
- Check for memory issues: `free -h`
- Monitor CPU: `top` or `htop`

---

## Diagnostic Tools

### Quick Diagnostic
```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts
./diagnose-kiosk.sh
```

This script checks:
- ✅ System information
- ✅ Network connectivity
- ✅ Node.js & npm installation
- ✅ Directory structure
- ✅ Service status
- ✅ Recent logs

### Manual Checks

#### Check Service Status
```bash
systemctl --user status kiosk-wayland.service
```

#### View Logs
```bash
# System journal
journalctl --user -u kiosk-wayland.service -n 100 --no-pager

# Startup log
cat ~/kiosk-startup.log

# Follow logs in real-time
journalctl --user -u kiosk-wayland.service -f
```

#### Check Environment
```bash
# View service configuration
systemctl --user cat kiosk-wayland.service

# Check NODE_ENV
systemctl --user show kiosk-wayland.service -p Environment
```

#### Test Manually
```bash
# Run startup script directly
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts
./start-kiosk-wayland.sh

# Or run the app directly
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
npm run electron:dev
```

---

## Service Management

### Start/Stop/Restart
```bash
# Start
systemctl --user start kiosk-wayland.service

# Stop
systemctl --user stop kiosk-wayland.service

# Restart
systemctl --user restart kiosk-wayland.service

# Reload configuration after editing service file
systemctl --user daemon-reload
systemctl --user restart kiosk-wayland.service
```

### Enable/Disable Autostart
```bash
# Enable autostart on boot
systemctl --user enable kiosk-wayland.service

# Disable autostart
systemctl --user disable kiosk-wayland.service

# Check if enabled
systemctl --user is-enabled kiosk-wayland.service
```

### Reinstall Service
```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts
./setup-wayland-autostart.sh
```

---

## Development vs Production Mode

### Development Mode (Current Setup) ✅
**When to use:** During development, testing, or when you need hot-reload

**Configuration:**
- `NODE_ENV=development` in service file
- Runs: `npm run electron:dev`
- Starts Next.js dev server on `localhost:3002`
- Electron connects to dev server
- Hot-reload enabled

**Pros:**
- ✅ No build step needed
- ✅ Live code updates
- ✅ Better debugging
- ✅ DevTools available

**Cons:**
- ⚠ Higher memory usage
- ⚠ Slower startup
- ⚠ Network required for npm

### Production Mode
**When to use:** Final deployment on dedicated kiosk

**Configuration:**
1. Build the application:
   ```bash
   cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
   npm run build
   ```

2. Update service file:
   ```bash
   # Edit: ~/.config/systemd/user/kiosk-wayland.service
   # Change:
   Environment="NODE_ENV=production"
   ```

3. Reload:
   ```bash
   systemctl --user daemon-reload
   systemctl --user restart kiosk-wayland.service
   ```

**Pros:**
- ✅ Faster startup
- ✅ Lower memory usage
- ✅ More stable

**Cons:**
- ⚠ Rebuild needed for code changes
- ⚠ No hot-reload

---

## Emergency Recovery

### Kiosk Won't Start
```bash
# 1. Stop the service
systemctl --user stop kiosk-wayland.service

# 2. Check what's wrong
journalctl --user -u kiosk-wayland.service -n 50

# 3. Run diagnostic
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts
./diagnose-kiosk.sh

# 4. Try manual start
./start-kiosk-wayland.sh
```

### Reset Everything
```bash
# Stop service
systemctl --user stop kiosk-wayland.service
systemctl --user disable kiosk-wayland.service

# Reinstall dependencies
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
rm -rf node_modules package-lock.json
npm install

# Reinstall service
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts
./setup-wayland-autostart.sh

# Start fresh
systemctl --user start kiosk-wayland.service
```

### Exit Kiosk Mode
If stuck in fullscreen kiosk mode:

**Method 1:** SSH from another device
```bash
ssh user@raspberry-pi-ip
systemctl --user stop kiosk-wayland.service
```

**Method 2:** Virtual terminal
- Press `Ctrl+Alt+F2` (switch to TTY2)
- Login
- Run: `systemctl --user stop kiosk-wayland.service`
- Press `Ctrl+Alt+F1` (switch back to GUI)

**Method 3:** Remote desktop
- Use VNC or RDP to connect
- Open terminal
- Stop service

---

## Performance Optimization

### Reduce Startup Time
```bash
# Edit service file
nano ~/.config/systemd/user/kiosk-wayland.service

# Reduce sleep time (but ensure session is ready)
ExecStartPre=/bin/sleep 3  # Instead of 5
```

### Reduce Memory Usage
Switch to production mode (see above) or:
```bash
# Limit Next.js memory
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
# Edit package.json, change "dev" script:
"dev": "NODE_OPTIONS='--max-old-space-size=512' next dev --turbopack -p 3002"
```

---

## Monitoring

### Continuous Monitoring
```bash
# Monitor service status
watch -n 1 systemctl --user status kiosk-wayland.service

# Monitor logs
journalctl --user -u kiosk-wayland.service -f

# Monitor system resources
htop
```

### Health Checks
Create a cron job to check if kiosk is running:
```bash
crontab -e

# Add:
*/5 * * * * systemctl --user is-active kiosk-wayland.service || systemctl --user restart kiosk-wayland.service
```

---

## Getting Help

### Collect Diagnostic Information
```bash
# Run diagnostic
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts
./diagnose-kiosk.sh > ~/kiosk-diagnostic.txt

# Collect logs
journalctl --user -u kiosk-wayland.service -n 200 --no-pager > ~/kiosk-journal.txt
cp ~/kiosk-startup.log ~/kiosk-startup-backup.log

# Share these files when asking for help
```

### Useful Information to Include
- Output of `./diagnose-kiosk.sh`
- Last 50 lines of journal: `journalctl --user -u kiosk-wayland.service -n 50`
- Startup log: `~/kiosk-startup.log`
- Service configuration: `systemctl --user cat kiosk-wayland.service`
- System info: `uname -a`, `cat /etc/os-release`
