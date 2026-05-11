const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Customer operations
  getCustomers: () => ipcRenderer.invoke('get-customers'),
  getCustomer: (id) => ipcRenderer.invoke('get-customer', id),
  createCustomer: (customer) => ipcRenderer.invoke('create-customer', customer),
  updateCustomer: (id, customer) => ipcRenderer.invoke('update-customer', id, customer),
  deleteCustomer: (id) => ipcRenderer.invoke('delete-customer', id),
  getCustomerCount: () => ipcRenderer.invoke('get-customer-count'),
  generateCustomerId: () => ipcRenderer.invoke('generate-customer-id'),
  searchCustomers: (query) => ipcRenderer.invoke('search-customers', query),
  
  // Product operations
  getProducts: () => ipcRenderer.invoke('get-products'),
  getProduct: (id) => ipcRenderer.invoke('get-product', id),
  createProduct: (product) => ipcRenderer.invoke('create-product', product),
  updateProduct: (id, product) => ipcRenderer.invoke('update-product', id, product),
  deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),
  getProductCount: () => ipcRenderer.invoke('get-product-count'),
  generateProductId: () => ipcRenderer.invoke('generate-product-id'),
  
  // Sales tracking operations
  recordSale: (billId, billItems) => ipcRenderer.invoke('record-sale', billId, billItems),
  getTodaysSales: () => ipcRenderer.invoke('get-todays-sales'),
  getTodaysSalesHistory: () => ipcRenderer.invoke('get-todays-sales-history'),
  getMonthlySales: (year, month) => ipcRenderer.invoke('get-monthly-sales', year, month),
  getMonthlySalesHistory: (year, month) => ipcRenderer.invoke('get-monthly-sales-history', year, month),
  getMonthlySalesDetailed: (year, month) => ipcRenderer.invoke('get-monthly-sales-detailed', year, month),
  getOverdueCustomers: () => ipcRenderer.invoke('get-overdue-customers'),
  clearCustomerDues: (customerIds) => ipcRenderer.invoke('clear-customer-dues', customerIds),

  // Payment history operations
  getPaymentHistory: (customerId) => ipcRenderer.invoke('get-payment-history', customerId),
  getAllPaymentHistory: () => ipcRenderer.invoke('get-all-payment-history'),
  updateCustomerLastVisit: (customerId) => ipcRenderer.invoke('update-customer-last-visit', customerId),
  getInactiveCustomers: (days) => ipcRenderer.invoke('get-inactive-customers', days),

  // Bill operations
  saveBill: (billData) => ipcRenderer.invoke('save-bill', billData),
  getBillsByCustomer: (customerId) => ipcRenderer.invoke('get-bills-by-customer', customerId),
  
  // Authentication operations
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  register: (userData) => ipcRenderer.invoke('register', userData),
  logout: () => ipcRenderer.invoke('logout'),
  getCurrentUser: () => ipcRenderer.invoke('get-current-user'),
  updateProfile: (userData) => ipcRenderer.invoke('update-profile', userData),
  openMainWindow: () => ipcRenderer.invoke('open-main-window'),

  // Printer operations
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printBill: (printContent, options) => ipcRenderer.invoke('print-bill', printContent, options),

  // Slip operations
  saveSlipTxt: (slipData) => ipcRenderer.invoke('save-slip-txt', slipData)
});
