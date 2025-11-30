# Quick script to find LABEL-9X00 printer VID/PID
# Run this in PowerShell: .\electron\find-label-printer.ps1

Write-Host ""
Write-Host "=== FINDING LABEL-9X00 PRINTER ===" -ForegroundColor Cyan
Write-Host ""

# Find LABEL device
$labelDevice = Get-PnpDevice -PresentOnly | Where-Object { $_.FriendlyName -match 'LABEL' }

if ($labelDevice) {
    foreach ($device in $labelDevice) {
        Write-Host "✓ Found: $($device.FriendlyName)" -ForegroundColor Green
        Write-Host ""

        # Get hardware IDs
        $hardwareIds = (Get-PnpDeviceProperty -InstanceId $device.InstanceId -KeyName 'DEVPKEY_Device_HardwareIds').Data

        foreach ($id in $hardwareIds) {
            if ($id -match 'VID_([0-9A-F]{4})&PID_([0-9A-F]{4})') {
                $vid = $matches[1]
                $pid = $matches[2]

                Write-Host "USB Vendor ID:  0x$vid" -ForegroundColor Yellow
                Write-Host "USB Product ID: 0x$pid" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "Copy this configuration to printer-config.json:" -ForegroundColor Cyan
                Write-Host ""
                Write-Host '{' -ForegroundColor White
                Write-Host '  "printerType": "usb",' -ForegroundColor White
                Write-Host '  "usb": {' -ForegroundColor White
                Write-Host "    `"vid`": `"0x$vid`"," -ForegroundColor White
                Write-Host "    `"pid`": `"0x$pid`"," -ForegroundColor White
                Write-Host "    `"comment`": `"$($device.FriendlyName)`"" -ForegroundColor White
                Write-Host '  },' -ForegroundColor White
                Write-Host '  "settings": {' -ForegroundColor White
                Write-Host '    "width": 48,' -ForegroundColor White
                Write-Host '    "encoding": "GB18030",' -ForegroundColor White
                Write-Host '    "comment": "48 chars = 80mm paper"' -ForegroundColor White
                Write-Host '  }' -ForegroundColor White
                Write-Host '}' -ForegroundColor White
                Write-Host ""

                # Save to file
                $configContent = @"
{
  "printerType": "usb",
  "usb": {
    "vid": "0x$vid",
    "pid": "0x$pid",
    "comment": "$($device.FriendlyName)"
  },
  "settings": {
    "width": 48,
    "encoding": "GB18030",
    "comment": "48 chars = 80mm paper (adjust to 32 for 58mm paper)"
  },
  "network": {
    "address": "192.168.1.100",
    "port": 9100,
    "comment": "Use printer's IP address if using network connection"
  },
  "serial": {
    "path": "COM3",
    "baudRate": 9600,
    "comment": "Serial port path - COM3, COM4, etc. (Windows)"
  },
  "commonPrinters": {
    "epson": {
      "usb": { "vid": "0x04b8", "pid": "0x0e03" },
      "description": "Epson TM-T20, TM-T88 series"
    },
    "star": {
      "usb": { "vid": "0x0519", "pid": "0x0001" },
      "description": "Star TSP100, TSP650 series"
    },
    "xprinter": {
      "usb": { "vid": "0x0416", "pid": "0x5011" },
      "description": "XPrinter XP-58, XP-80 series"
    },
    "bixolon": {
      "usb": { "vid": "0x1504", "pid": "0x0006" },
      "description": "Bixolon SRP-350, SRP-275 series"
    }
  }
}
"@
                $outputPath = Join-Path $PSScriptRoot "printer-config-detected.json"
                $configContent | Out-File -FilePath $outputPath -Encoding utf8
                Write-Host "✓ Configuration saved to: $outputPath" -ForegroundColor Green
                Write-Host ""
                Write-Host "Next steps:" -ForegroundColor Cyan
                Write-Host "1. Review the configuration in: $outputPath" -ForegroundColor White
                Write-Host "2. Copy it to: printer-config.json" -ForegroundColor White
                Write-Host "3. Test the printer: cd client/Kiosk && node electron/test-printer.js test" -ForegroundColor White
                Write-Host ""
            }
        }
    }
} else {
    Write-Host "✗ LABEL printer not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "1. Printer is powered on" -ForegroundColor White
    Write-Host "2. USB cable is connected" -ForegroundColor White
    Write-Host "3. Windows has detected the device" -ForegroundColor White
    Write-Host ""
    Write-Host "Try running the full detection script:" -ForegroundColor Yellow
    Write-Host "  .\electron\detect-printer.ps1" -ForegroundColor White
    Write-Host ""
}
