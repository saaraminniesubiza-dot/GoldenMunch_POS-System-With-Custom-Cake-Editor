/**
 * Thermal Printer Test Utility
 * Tests printer connection and functionality
 *
 * Usage: node electron/test-printer.js [test-type]
 *
 * Test types:
 * - detect: Detect available USB printers
 * - test: Print test receipt
 * - receipt: Print sample order receipt
 * - report: Print sample daily report
 * - status: Show printer configuration
 */

const fs = require('fs');
const path = require('path');
const ThermalPrinterService = require('./printer');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('');
  log('='.repeat(60), 'cyan');
  log(message, 'cyan');
  log('='.repeat(60), 'cyan');
  console.log('');
}

/**
 * Detect available USB printers
 */
async function detectPrinters() {
  header('USB PRINTER DETECTION');

  try {
    // Try to import USB detection
    const usb = require('usb');
    const devices = usb.getDeviceList();

    log('Found USB devices:', 'yellow');
    console.log('');

    // Common printer vendor IDs
    const printerVendors = {
      0x04b8: 'Epson',
      0x0519: 'Star Micronics',
      0x0416: 'XPrinter/Label Printer',
      0x1504: 'Bixolon',
      0x154f: 'Citizen',
      0x0dd4: 'Custom Engineering',
      0x0483: 'STMicroelectronics (various printers)',
    };

    let foundPrinters = false;

    devices.forEach((device) => {
      const vid = device.deviceDescriptor.idVendor;
      const pid = device.deviceDescriptor.idProduct;
      const vendorName = printerVendors[vid] || 'Unknown';

      // Check if it's a known printer vendor
      if (printerVendors[vid]) {
        foundPrinters = true;
        log(`✓ Potential Printer Found:`, 'green');
        log(`  Vendor: ${vendorName}`, 'white');
        log(`  VID: 0x${vid.toString(16).padStart(4, '0')}`, 'yellow');
        log(`  PID: 0x${pid.toString(16).padStart(4, '0')}`, 'yellow');
        console.log('');
        log('  Configuration for printer-config.json:', 'cyan');
        console.log('  {');
        console.log('    "printerType": "usb",');
        console.log('    "usb": {');
        console.log(`      "vid": "0x${vid.toString(16).padStart(4, '0')}",`);
        console.log(`      "pid": "0x${pid.toString(16).padStart(4, '0')}",`);
        console.log(`      "comment": "${vendorName}"`);
        console.log('    }');
        console.log('  }');
        console.log('');
        log('-'.repeat(60), 'blue');
        console.log('');
      }
    });

    if (!foundPrinters) {
      log('⚠ No known printer vendors detected in USB devices.', 'yellow');
      log('Your printer may use a different vendor ID.', 'yellow');
      console.log('');
      log('All USB devices:', 'white');
      devices.forEach((device) => {
        const vid = device.deviceDescriptor.idVendor;
        const pid = device.deviceDescriptor.idProduct;
        log(`  VID: 0x${vid.toString(16).padStart(4, '0')}, PID: 0x${pid.toString(16).padStart(4, '0')}`, 'white');
      });
    }
  } catch (error) {
    log('✗ Error detecting USB devices:', 'red');
    log(`  ${error.message}`, 'red');
    console.log('');
    log('Tip: Make sure the "usb" package is installed:', 'yellow');
    log('  npm install usb', 'cyan');
  }
}

/**
 * Load printer configuration
 */
function loadPrinterConfig() {
  const configPath = path.join(__dirname, 'printer-config.json');

  if (!fs.existsSync(configPath)) {
    log('⚠ printer-config.json not found!', 'yellow');
    log('  Using default configuration', 'yellow');
    return {};
  }

  const configData = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(configData);
}

/**
 * Display printer configuration
 */
function showStatus() {
  header('PRINTER CONFIGURATION STATUS');

  const config = loadPrinterConfig();

  if (Object.keys(config).length === 0) {
    log('⚠ No configuration file found', 'yellow');
    log('  Expected location: client/Kiosk/electron/printer-config.json', 'white');
    return;
  }

  log('Configuration loaded successfully:', 'green');
  console.log('');
  log('Printer Type:', 'cyan');
  log(`  ${config.printerType || 'usb'}`, 'white');
  console.log('');

  if (config.printerType === 'usb' || !config.printerType) {
    log('USB Configuration:', 'cyan');
    log(`  VID: ${config.usb?.vid || '0x0416'}`, 'yellow');
    log(`  PID: ${config.usb?.pid || '0x5011'}`, 'yellow');
    log(`  Comment: ${config.usb?.comment || 'Not specified'}`, 'white');
  }

  if (config.printerType === 'network') {
    log('Network Configuration:', 'cyan');
    log(`  Address: ${config.network?.address || '192.168.1.100'}`, 'white');
    log(`  Port: ${config.network?.port || 9100}`, 'white');
  }

  if (config.printerType === 'serial') {
    log('Serial Configuration:', 'cyan');
    log(`  Path: ${config.serial?.path || '/dev/ttyUSB0'}`, 'white');
    log(`  Baud Rate: ${config.serial?.baudRate || 9600}`, 'white');
  }

  console.log('');
  log('Print Settings:', 'cyan');
  log(`  Width: ${config.settings?.width || 48} characters`, 'white');
  log(`  Encoding: ${config.settings?.encoding || 'GB18030'}`, 'white');
  console.log('');
}

/**
 * Test printer connection and print test receipt
 */
async function testPrinter() {
  header('PRINTER CONNECTION TEST');

  const config = loadPrinterConfig();

  log('Initializing printer service...', 'yellow');
  console.log('');

  try {
    const printerConfig = {
      type: config.printerType || 'usb',
      vid: parseInt(config.usb?.vid || '0x0416', 16),
      pid: parseInt(config.usb?.pid || '0x5011', 16),
      address: config.network?.address || '192.168.1.100',
      port: config.network?.port || 9100,
      serialPath: config.serial?.path || '/dev/ttyUSB0',
      baudRate: config.serial?.baudRate || 9600,
      width: config.settings?.width || 48,
      encoding: config.settings?.encoding || 'GB18030',
    };

    log('Configuration:', 'cyan');
    log(`  Type: ${printerConfig.type}`, 'white');
    if (printerConfig.type === 'usb') {
      log(`  VID: 0x${printerConfig.vid.toString(16)}`, 'white');
      log(`  PID: 0x${printerConfig.pid.toString(16)}`, 'white');
    }
    console.log('');

    const printer = new ThermalPrinterService(printerConfig);

    log('Connecting to printer...', 'yellow');
    await printer.connect();
    log('✓ Printer connected successfully!', 'green');
    console.log('');

    log('Printing test receipt...', 'yellow');
    await printer.printTest();
    log('✓ Test receipt sent to printer!', 'green');
    console.log('');

    printer.disconnect();
    log('Test completed successfully!', 'green');
  } catch (error) {
    log('✗ Test failed:', 'red');
    log(`  ${error.message}`, 'red');
    console.log('');
    log('Troubleshooting:', 'yellow');
    log('  1. Check printer is powered on and connected', 'white');
    log('  2. Verify USB VID/PID in printer-config.json', 'white');
    log('  3. Try running: node electron/test-printer.js detect', 'white');
    log('  4. On Windows, you may need printer drivers installed', 'white');
    log('  5. Check printer is not being used by another application', 'white');
  }
}

/**
 * Print sample order receipt
 */
async function printSampleReceipt() {
  header('SAMPLE ORDER RECEIPT TEST');

  const config = loadPrinterConfig();

  try {
    const printerConfig = {
      type: config.printerType || 'usb',
      vid: parseInt(config.usb?.vid || '0x0416', 16),
      pid: parseInt(config.usb?.pid || '0x5011', 16),
      width: config.settings?.width || 48,
      encoding: config.settings?.encoding || 'GB18030',
    };

    const printer = new ThermalPrinterService(printerConfig);

    log('Connecting to printer...', 'yellow');
    await printer.connect();
    log('✓ Printer connected', 'green');
    console.log('');

    const sampleOrder = {
      orderNumber: 'TEST-' + Date.now(),
      orderDate: new Date().toLocaleDateString(),
      items: [
        {
          name: 'Chocolate Cake (Custom)',
          quantity: 1,
          price: 450.0,
          specialInstructions: 'Happy Birthday message, 3 layers',
        },
        {
          name: 'Coffee (Hot)',
          quantity: 2,
          price: 120.0,
        },
        {
          name: 'Croissant',
          quantity: 3,
          price: 85.0,
        },
      ],
      subtotal: 825.0,
      tax: 99.0,
      discount: 50.0,
      total: 874.0,
      paymentMethod: 'GCash',
      verificationCode: 'ABC123',
      customerName: 'Test Customer',
      specialInstructions: 'Please deliver by 2PM. Call when ready for pickup.',
    };

    log('Printing sample order receipt...', 'yellow');
    console.log('');
    log('Order Details:', 'cyan');
    log(`  Order #: ${sampleOrder.orderNumber}`, 'white');
    log(`  Items: ${sampleOrder.items.length}`, 'white');
    log(`  Total: ₱${sampleOrder.total.toFixed(2)}`, 'white');
    console.log('');

    await printer.printReceipt(sampleOrder);
    log('✓ Sample receipt sent to printer!', 'green');
    console.log('');

    printer.disconnect();
    log('Test completed!', 'green');
  } catch (error) {
    log('✗ Print failed:', 'red');
    log(`  ${error.message}`, 'red');
  }
}

/**
 * Print sample daily report
 */
async function printSampleReport() {
  header('SAMPLE DAILY REPORT TEST');

  const config = loadPrinterConfig();

  try {
    const printerConfig = {
      type: config.printerType || 'usb',
      vid: parseInt(config.usb?.vid || '0x0416', 16),
      pid: parseInt(config.usb?.pid || '0x5011', 16),
      width: config.settings?.width || 48,
      encoding: config.settings?.encoding || 'GB18030',
    };

    const printer = new ThermalPrinterService(printerConfig);

    log('Connecting to printer...', 'yellow');
    await printer.connect();
    log('✓ Printer connected', 'green');
    console.log('');

    const sampleReport = {
      date: new Date().toLocaleDateString(),
      totalOrders: 45,
      totalSales: 32500.0,
      paymentBreakdown: {
        Cash: 15000.0,
        GCash: 12000.0,
        Card: 5500.0,
      },
      topItems: [
        { name: 'Chocolate Cake', quantity: 25 },
        { name: 'Coffee', quantity: 38 },
        { name: 'Croissant', quantity: 15 },
        { name: 'Cheesecake', quantity: 12 },
        { name: 'Brownie', quantity: 10 },
      ],
    };

    log('Printing sample daily report...', 'yellow');
    console.log('');

    await printer.printDailyReport(sampleReport);
    log('✓ Sample report sent to printer!', 'green');
    console.log('');

    printer.disconnect();
    log('Test completed!', 'green');
  } catch (error) {
    log('✗ Print failed:', 'red');
    log(`  ${error.message}`, 'red');
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'test';

  console.log('');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     GOLDENMUNCH POS - THERMAL PRINTER TEST UTILITY         ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('');

  switch (command.toLowerCase()) {
    case 'detect':
      await detectPrinters();
      break;

    case 'test':
      await testPrinter();
      break;

    case 'receipt':
      await printSampleReceipt();
      break;

    case 'report':
      await printSampleReport();
      break;

    case 'status':
      showStatus();
      break;

    default:
      log('Usage: node electron/test-printer.js [command]', 'yellow');
      console.log('');
      log('Available commands:', 'cyan');
      log('  detect  - Detect available USB printers', 'white');
      log('  test    - Test printer connection (default)', 'white');
      log('  receipt - Print sample order receipt', 'white');
      log('  report  - Print sample daily report', 'white');
      log('  status  - Show current printer configuration', 'white');
      console.log('');
      log('Examples:', 'cyan');
      log('  node electron/test-printer.js detect', 'white');
      log('  node electron/test-printer.js test', 'white');
      log('  node electron/test-printer.js receipt', 'white');
      console.log('');
  }
}

// Run the script
main().catch((error) => {
  log('Unexpected error:', 'red');
  console.error(error);
  process.exit(1);
});
