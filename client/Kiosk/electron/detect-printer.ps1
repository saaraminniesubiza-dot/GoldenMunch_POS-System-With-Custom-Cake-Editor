# Thermal Printer USB Detection Script
# This script helps detect the USB VID/PID for your thermal printer

Write-Host "=== THERMAL PRINTER USB DETECTION ===" -ForegroundColor Cyan
Write-Host ""

# Get all USB devices
Write-Host "Scanning for USB devices..." -ForegroundColor Yellow
Write-Host ""

$usbDevices = Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -match '^USB' }

# Display all USB devices
Write-Host "Found USB Devices:" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
$usbDevices | Format-Table Status, Class, FriendlyName -AutoSize

Write-Host ""
Write-Host "=== DETAILED PRINTER INFORMATION ===" -ForegroundColor Cyan
Write-Host ""

# Find devices that might be printers
$printerDevices = $usbDevices | Where-Object {
    $_.FriendlyName -match 'LABEL|PRINTER|POS|THERMAL|RECEIPT|EPSON|STAR|XPRINTER|BIXOLON'
}

if ($printerDevices) {
    foreach ($device in $printerDevices) {
        Write-Host "Potential Printer Found: $($device.FriendlyName)" -ForegroundColor Green
        Write-Host "Status: $($device.Status)" -ForegroundColor White
        Write-Host "Class: $($device.Class)" -ForegroundColor White

        # Get hardware IDs to find VID/PID
        $hardwareIds = (Get-PnpDeviceProperty -InstanceId $device.InstanceId -KeyName 'DEVPKEY_Device_HardwareIds').Data

        if ($hardwareIds) {
            Write-Host "Hardware IDs:" -ForegroundColor White
            foreach ($id in $hardwareIds) {
                Write-Host "  $id" -ForegroundColor Gray

                # Extract VID and PID
                if ($id -match 'VID_([0-9A-F]{4})&PID_([0-9A-F]{4})') {
                    $vid = $matches[1]
                    $pid = $matches[2]
                    Write-Host ""
                    Write-Host "  >>> VID: 0x$vid" -ForegroundColor Yellow
                    Write-Host "  >>> PID: 0x$pid" -ForegroundColor Yellow
                    Write-Host ""
                    Write-Host "  Configuration for printer-config.json:" -ForegroundColor Cyan
                    Write-Host '  {' -ForegroundColor White
                    Write-Host '    "printerType": "usb",' -ForegroundColor White
                    Write-Host '    "usb": {' -ForegroundColor White
                    Write-Host "      `"vid`": `"0x$vid`"," -ForegroundColor White
                    Write-Host "      `"pid`": `"0x$pid`"," -ForegroundColor White
                    Write-Host "      `"comment`": `"$($device.FriendlyName)`"" -ForegroundColor White
                    Write-Host '    }' -ForegroundColor White
                    Write-Host '  }' -ForegroundColor White
                    Write-Host ""
                }
            }
        }

        Write-Host "-----------------------------------" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "No thermal printer devices detected automatically." -ForegroundColor Red
    Write-Host "Your printer may be listed in the general USB devices above." -ForegroundColor Yellow
    Write-Host ""
}

# Check for Windows-installed printers
Write-Host "=== WINDOWS INSTALLED PRINTERS ===" -ForegroundColor Cyan
Write-Host ""

$installedPrinters = Get-Printer | Select-Object Name, PortName, DriverName
if ($installedPrinters) {
    $installedPrinters | Format-Table -AutoSize
} else {
    Write-Host "No printers installed in Windows." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== NEXT STEPS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Find your printer in the list above (look for LABEL-9X00)" -ForegroundColor White
Write-Host "2. Note the VID and PID values" -ForegroundColor White
Write-Host "3. Update client/Kiosk/electron/printer-config.json with these values" -ForegroundColor White
Write-Host "4. Run the test script: node electron/test-printer.js" -ForegroundColor White
Write-Host ""
Write-Host "For LABEL-9X00 specifically, checking device details..." -ForegroundColor Yellow
Write-Host ""

# Get detailed info for LABEL devices
$labelDevice = $usbDevices | Where-Object { $_.FriendlyName -match 'LABEL' }
if ($labelDevice) {
    foreach ($device in $labelDevice) {
        Write-Host "=== LABEL DEVICE DETAILS ===" -ForegroundColor Green
        Write-Host "Name: $($device.FriendlyName)" -ForegroundColor White
        Write-Host "Instance ID: $($device.InstanceId)" -ForegroundColor Gray

        # Get all properties
        $properties = Get-PnpDeviceProperty -InstanceId $device.InstanceId

        # Display relevant properties
        $relevantProps = $properties | Where-Object {
            $_.KeyName -match 'HardwareIds|Manufacturer|DeviceDesc|CompatibleIds'
        }

        foreach ($prop in $relevantProps) {
            Write-Host "$($prop.KeyName): $($prop.Data)" -ForegroundColor Gray
        }
        Write-Host ""
    }
}

Write-Host "Detection complete!" -ForegroundColor Green
Write-Host ""
