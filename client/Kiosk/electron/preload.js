const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Add any electron APIs you need to expose to the renderer
  // For security, only expose specific functions you need

  // Example: Get app version
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Example: Print receipt
  printReceipt: (data) => ipcRenderer.invoke('print-receipt', data),

  // Example: Open external payment window
  openPayment: (paymentData) => ipcRenderer.invoke('open-payment', paymentData),
});

// Optional: Disable specific features
window.addEventListener('DOMContentLoaded', () => {
  // Disable text selection for kiosk mode
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';

  // Disable drag and drop
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => e.preventDefault());
});
