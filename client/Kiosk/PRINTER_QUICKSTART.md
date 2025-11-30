# Thermal Printer Quick Start - LABEL-9X00

## 🚀 5-Minute Setup

### Step 1: Detect Your Printer
```powershell
cd client\Kiosk
.\electron\find-label-printer.ps1
```

### Step 2: Copy Configuration
```powershell
# Automatically use detected config
Copy-Item electron\printer-config-detected.json electron\printer-config.json
```

### Step 3: Install Dependencies
```powershell
npm install
```

### Step 4: Test Printer
```powershell
# Test connection
node electron\test-printer.js test

# Print sample receipt
node electron\test-printer.js receipt
```

### Step 5: Run in Electron
```powershell
npm run electron:dev
```

## 📝 Quick Commands

```powershell
# Detect printer USB IDs
.\electron\find-label-printer.ps1

# Test connection
node electron\test-printer.js test

# Print sample receipt
node electron\test-printer.js receipt

# Check status
node electron\test-printer.js status
```

## ⚠️ Troubleshooting

**Printer not found?**
- Make sure printer is powered on
- Check USB cable is connected
- Try: `.\electron\detect-printer.ps1` for full scan

**"Failed to open device"?**
- Install WinUSB driver using [Zadig](https://zadig.akeo.ie/)
- Run Zadig as Administrator
- Select LABEL-9X00 → Install WinUSB driver

**Wrong characters printing?**
- Edit `electron/printer-config.json`
- Try different encoding: `"encoding": "CP437"` or `"UTF-8"`

## 📚 Full Documentation

See `THERMAL_PRINTER_TEST_GUIDE.md` for complete guide.

## ✅ Expected Results

After running tests, your printer should print:
- ✓ Test receipt with date/time
- ✓ Sample order receipt with items, prices, QR code
- ✓ Properly formatted text and alignment

---

**For Help**: See THERMAL_PRINTER_TEST_GUIDE.md
**Your Printer**: LABEL-9X00 (USB)
**Platform**: Windows
