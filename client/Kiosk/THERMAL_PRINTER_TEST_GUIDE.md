# Thermal Printer Testing Guide for LABEL-9X00

## Overview

This guide will help you configure and test your **LABEL-9X00** thermal printer with the GoldenMunch POS Kiosk application.

## Your Current Setup

Based on your system scan, you have:
- **Printer**: LABEL-9X00 (detected as USB device and Software Device)
- **Operating System**: Windows
- **Connection Type**: USB
- **Status**: Printer is connected but VID/PID needs to be detected

## Quick Start (5 Steps)

### Step 1: Detect Your Printer's USB IDs

Run the PowerShell detection script:

```powershell
cd C:\Users\Shem Joshua\Desktop\Golden\client\Kiosk
.\electron\find-label-printer.ps1
```

This will:
- ✅ Automatically detect your LABEL-9X00 printer
- ✅ Find the USB Vendor ID (VID) and Product ID (PID)
- ✅ Generate a configuration file: `printer-config-detected.json`
- ✅ Show you exactly what to copy

**Expected Output:**
```
=== FINDING LABEL-9X00 PRINTER ===

✓ Found: LABEL-9X00

USB Vendor ID:  0x[XXXX]
USB Product ID: 0x[YYYY]

Copy this configuration to printer-config.json:
...
```

### Step 2: Update Printer Configuration

Copy the generated configuration:

**Option A - Use Auto-Generated File:**
```powershell
# Backup existing config
Copy-Item electron\printer-config.json electron\printer-config.backup.json

# Use detected configuration
Copy-Item electron\printer-config-detected.json electron\printer-config.json
```

**Option B - Manual Edit:**
Edit `client/Kiosk/electron/printer-config.json` and update the VID/PID values:

```json
{
  "printerType": "usb",
  "usb": {
    "vid": "0xXXXX",  // Replace with your detected VID
    "pid": "0xYYYY",  // Replace with your detected PID
    "comment": "LABEL-9X00"
  },
  "settings": {
    "width": 48,
    "encoding": "GB18030"
  }
}
```

### Step 3: Install Dependencies (If Not Already Done)

```powershell
cd client\Kiosk
npm install
```

This installs:
- `escpos` - ESC/POS printer library
- `escpos-usb` - USB printer adapter
- `serialport` - Serial communication
- `usb` - USB device detection

### Step 4: Test Printer Connection

Run the test utility:

```powershell
cd client\Kiosk
node electron\test-printer.js test
```

**Expected Success Output:**
```
╔════════════════════════════════════════════════════════════╗
║     GOLDENMUNCH POS - THERMAL PRINTER TEST UTILITY         ║
╚════════════════════════════════════════════════════════════╝

=== PRINTER CONNECTION TEST ===

Initializing printer service...

Configuration:
  Type: usb
  VID: 0xXXXX
  PID: 0xYYYY

Connecting to printer...
✓ Printer connected successfully!

Printing test receipt...
✓ Test receipt sent to printer!

Test completed successfully!
```

The printer should print a test receipt:
```
=== TEST PRINT ===

Printer is working correctly!

[Current Date/Time]
```

### Step 5: Test Sample Receipt

Print a full order receipt:

```powershell
node electron\test-printer.js receipt
```

This will print a complete sample receipt with:
- Header and branding
- Order number and date
- Multiple items with prices
- Tax and totals
- QR code
- Footer information

## All Available Test Commands

```powershell
# Detect available USB printers
node electron\test-printer.js detect

# Test basic printer connection
node electron\test-printer.js test

# Print sample order receipt
node electron\test-printer.js receipt

# Print sample daily sales report
node electron\test-printer.js report

# Show current printer configuration
node electron\test-printer.js status
```

## Troubleshooting

### Problem: "Printer service not available"

**Cause**: Incorrect VID/PID in configuration

**Solution**:
1. Re-run the detection script: `.\electron\find-label-printer.ps1`
2. Verify VID/PID match what's in `printer-config.json`
3. Make sure printer is powered on

### Problem: "Failed to open device" or "LIBUSB_ERROR_ACCESS"

**Cause**: USB permissions or driver issues

**Windows Solutions**:

1. **Install WinUSB Driver** (Recommended):
   - Download [Zadig](https://zadig.akeo.ie/)
   - Run Zadig as Administrator
   - Options → List All Devices
   - Select "LABEL-9X00" from dropdown
   - Select "WinUSB" driver
   - Click "Replace Driver"
   - Wait for installation to complete
   - Restart the test

2. **Check USB Port**:
   - Try a different USB port
   - Use a USB 2.0 port (not USB 3.0)
   - Try direct connection (avoid USB hubs)

3. **Disable Exclusive Access**:
   - Open Device Manager
   - Find your printer under USB devices
   - Right-click → Properties
   - Uncheck "Allow programs to have exclusive access"

### Problem: "Device not found"

**Cause**: Printer not connected or not recognized

**Solution**:
```powershell
# Check if printer is detected by Windows
Get-PnpDevice -PresentOnly | Where-Object { $_.FriendlyName -match 'LABEL' }
```

If not found:
- Check USB cable connection
- Try a different USB cable
- Power cycle the printer (turn off/on)
- Check printer is not in sleep mode

### Problem: Garbled or Incorrect Characters

**Cause**: Wrong encoding setting

**Solution**:
Try different encodings in `printer-config.json`:

```json
{
  "settings": {
    "width": 48,
    "encoding": "GB18030"  // Try: UTF-8, EUC-KR, CP437, ISO-8859-1
  }
}
```

Common encodings:
- `GB18030` - Chinese characters support
- `UTF-8` - Universal (may not work with all printers)
- `CP437` - Standard ESC/POS encoding
- `ISO-8859-1` - Latin alphabet

### Problem: Text Cut Off or Wrapping Incorrectly

**Cause**: Wrong paper width setting

**Solution**:
Adjust width in `printer-config.json`:

```json
{
  "settings": {
    "width": 48  // 48 for 80mm paper, 32 for 58mm paper
  }
}
```

Common widths:
- **58mm paper**: 32 characters
- **80mm paper**: 48 characters
- **110mm paper**: 64 characters (label printers)

### Problem: Printer Prints But Cuts Off Too Early

**Cause**: Paper sensor or cut settings

**Solution**:
This is normal - thermal printers auto-cut. If cutting in wrong place:
- Check paper roll is installed correctly
- Clean the paper sensor (small black dot near paper path)
- Check printer manual for feed/cut settings

## Advanced Configuration

### Using Network Printer (If Your LABEL-9X00 Has Ethernet)

1. Find your printer's IP address (check printer display or router)

2. Update `printer-config.json`:
```json
{
  "printerType": "network",
  "network": {
    "address": "192.168.1.100",  // Your printer's IP
    "port": 9100  // Standard ESC/POS port
  },
  "settings": {
    "width": 48,
    "encoding": "GB18030"
  }
}
```

3. Test: `node electron\test-printer.js test`

### Using Serial/COM Port (If Available)

1. Find COM port in Device Manager → Ports (COM & LPT)

2. Update `printer-config.json`:
```json
{
  "printerType": "serial",
  "serial": {
    "path": "COM3",  // Your printer's COM port
    "baudRate": 9600  // Common: 9600, 115200
  },
  "settings": {
    "width": 48,
    "encoding": "GB18030"
  }
}
```

## Testing in the Electron App

### Method 1: Developer Console

1. Start the Kiosk app:
```powershell
cd client\Kiosk
npm run electron:dev
```

2. Open DevTools (F12 or Ctrl+Shift+I)

3. Run in console:
```javascript
// Test printer
await window.electron.printer.printTest();

// Check status
await window.electron.printer.getStatus();

// Print sample order
await window.electron.printer.printReceipt({
  orderNumber: 'TEST-001',
  orderDate: new Date().toLocaleDateString(),
  items: [
    { name: 'Chocolate Cake', quantity: 1, price: 450 }
  ],
  subtotal: 450,
  tax: 54,
  discount: 0,
  total: 504,
  paymentMethod: 'Cash'
});
```

### Method 2: Integration with Order Flow

The printer automatically triggers when an order is completed. To test:

1. Start the Kiosk app
2. Create a test order
3. Complete payment
4. Receipt should print automatically

## Verifying Print Quality

### Test Checklist

Print a test receipt and verify:

- [ ] Logo/Header prints clearly
- [ ] All text is readable (no garbled characters)
- [ ] Line alignment is correct
- [ ] Numbers align properly in columns
- [ ] Special characters (₱, etc.) display correctly
- [ ] QR code is scannable (if enabled)
- [ ] Paper cuts at correct position
- [ ] No missing lines or gaps

### Sample Receipt Should Show

```
    GOLDENMUNCH BAKERY

  Thank you for your order!

Order #:           TEST-001
Date:              11/30/2025
Time:              2:30 PM

Verification Code:
     ABC123

---------------------------------
Item             Qty    Price
---------------------------------
Chocolate Cake   x1     ₱450.00
Coffee (Hot)     x2     ₱240.00
Croissant        x3     ₱255.00
---------------------------------
Subtotal:               ₱945.00
Tax (12%):              ₱113.40
---------------------------------
TOTAL:                 ₱1058.40
---------------------------------
Payment:                   GCASH

     Visit us again!
    www.goldenmunch.com

For inquiries: (02) 1234-5678

      [QR CODE HERE]
```

## Common LABEL-9X00 Specifications

Based on typical LABEL-9X00 series:
- **Print Method**: Direct thermal
- **Print Width**: 72mm - 80mm
- **Print Speed**: 127mm/sec
- **Resolution**: 203 DPI
- **Interface**: USB, Serial (RS-232), Ethernet (some models)
- **Paper Width**: 80mm (58mm compatible)
- **ESC/POS Compatible**: Yes

## Next Steps After Successful Testing

1. **Test with Real Orders**:
   - Run the full Kiosk app in development mode
   - Create test orders and verify receipts print correctly

2. **Configure Receipt Content**:
   - Edit `client/Kiosk/electron/printer.js`
   - Customize header, footer, branding
   - Add your logo (see PRINTER_SETUP.md)

3. **Production Deployment**:
   - Build the Electron app: `npm run electron:build`
   - Test in kiosk mode
   - Set up auto-start for the kiosk

4. **Add Print Buttons to UI**:
   - Use the `printerService` from React components
   - Add "Reprint Receipt" functionality
   - Add "Print Daily Report" to admin panel

## Support Resources

### Log Files

Check Electron console logs for detailed errors:
```powershell
# In Electron app, press F12 to open DevTools
# Check Console tab for printer-related logs
```

### Testing Tools

All testing scripts are in `client/Kiosk/electron/`:
- `find-label-printer.ps1` - Quick VID/PID detection
- `detect-printer.ps1` - Full USB device scan
- `test-printer.js` - Comprehensive printer testing
- `printer-config.json` - Configuration file

### Documentation

- `PRINTER_SETUP.md` - Full printer integration guide
- `printer.js` - Printer service implementation
- ESC/POS documentation: https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/

## Report Issues

If you encounter issues:

1. **Gather Information**:
   ```powershell
   # Run detection
   .\electron\find-label-printer.ps1 > printer-detection.txt

   # Run status check
   node electron\test-printer.js status > printer-status.txt

   # Include Windows version
   winver
   ```

2. **Check Error Messages**:
   - Run test with verbose output
   - Note exact error messages
   - Check Windows Event Viewer for driver errors

3. **Document Steps**:
   - What you tried
   - Expected vs actual behavior
   - Any error messages

---

## Quick Reference Commands

```powershell
# Navigate to Kiosk directory
cd C:\Users\Shem Joshua\Desktop\Golden\client\Kiosk

# Detect printer VID/PID
.\electron\find-label-printer.ps1

# Test printer connection
node electron\test-printer.js test

# Print sample receipt
node electron\test-printer.js receipt

# Check configuration
node electron\test-printer.js status

# Run Electron app
npm run electron:dev
```

---

**Last Updated**: November 30, 2025
**For Printer**: LABEL-9X00 (USB)
**Platform**: Windows
