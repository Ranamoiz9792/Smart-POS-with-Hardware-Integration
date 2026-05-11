const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('../database/database');

let mainWindow;
let loginWindow;
let database;
let currentUser = null;

function createLoginWindow() {
  // Create the login window
  loginWindow = new BrowserWindow({
    width: 450,
    height: 700,
    minWidth: 400,
    minHeight: 600,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../preload/preload.js')
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
    titleBarStyle: 'default',
    show: false,
    autoHideMenuBar: true
  });

  // Load the login.html file
  loginWindow.loadFile(path.join(__dirname, '../renderer/login.html'));

  // Show window when ready
  loginWindow.once('ready-to-show', () => {
    loginWindow.show();
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    loginWindow.webContents.openDevTools();
  }

  // Handle window closed
  loginWindow.on('closed', () => {
    loginWindow = null;
    if (!mainWindow) {
      app.quit();
    }
  });
}

function createMainWindow() {
  // Create the main application window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../preload/preload.js')
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Close login window if it exists
    if (loginWindow) {
      loginWindow.close();
      loginWindow = null;
    }
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    currentUser = null;
  });
}

// Initialize database
async function initializeDatabase() {
  try {
    database = new Database();
    await database.initialize();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// App event listeners
app.whenReady().then(async () => {
  await initializeDatabase();
  createLoginWindow(); // Start with login window

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLoginWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (database) {
    database.close();
  }
});

// IPC handlers for database operations
ipcMain.handle('get-customers', async () => {
  try {
    return await database.getAllCustomers();
  } catch (error) {
    console.error('Error getting customers:', error);
    throw error;
  }
});

ipcMain.handle('get-customer', async (event, id) => {
  try {
    return await database.getCustomer(id);
  } catch (error) {
    console.error('Error getting customer:', error);
    throw error;
  }
});

ipcMain.handle('create-customer', async (event, customer) => {
  try {
    return await database.createCustomer(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
});

ipcMain.handle('update-customer', async (event, id, customer) => {
  try {
    return await database.updateCustomer(id, customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
});

ipcMain.handle('delete-customer', async (event, id) => {
  try {
    return await database.deleteCustomer(id);
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
});

ipcMain.handle('get-customer-count', async () => {
  try {
    return await database.getCustomerCount();
  } catch (error) {
    console.error('Error getting customer count:', error);
    throw error;
  }
});

ipcMain.handle('generate-customer-id', async () => {
  try {
    return database.generateCustomerId();
  } catch (error) {
    console.error('Error generating customer ID:', error);
    throw error;
  }
});

// Product IPC handlers
ipcMain.handle('get-products', async () => {
  try {
    return await database.getAllProducts();
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
});

ipcMain.handle('get-product', async (event, id) => {
  try {
    return await database.getProduct(id);
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
});

ipcMain.handle('create-product', async (event, product) => {
  try {
    return await database.createProduct(product);
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
});

ipcMain.handle('update-product', async (event, id, product) => {
  try {
    return await database.updateProduct(id, product);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
});

ipcMain.handle('delete-product', async (event, id) => {
  try {
    return await database.deleteProduct(id);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
});

ipcMain.handle('get-product-count', async () => {
  try {
    return await database.getProductCount();
  } catch (error) {
    console.error('Error getting product count:', error);
    throw error;
  }
});

ipcMain.handle('generate-product-id', async () => {
  try {
    return database.generateProductId();
  } catch (error) {
    console.error('Error generating product ID:', error);
    throw error;
  }
});

// Sales tracking IPC handlers
ipcMain.handle('record-sale', async (event, billId, billItems) => {
  try {
    return await database.recordSale(billId, billItems);
  } catch (error) {
    console.error('Error recording sale:', error);
    throw error;
  }
});

ipcMain.handle('get-todays-sales', async () => {
  try {
    return await database.getTodaysSales();
  } catch (error) {
    console.error('Error getting today\'s sales:', error);
    throw error;
  }
});

ipcMain.handle('get-todays-sales-history', async () => {
  try {
    return await database.getTodaysSalesHistory();
  } catch (error) {
    console.error('Error getting today\'s sales history:', error);
    throw error;
  }
});

// Monthly sales IPC handlers
ipcMain.handle('get-monthly-sales', async (event, year, month) => {
  try {
    return await database.getMonthlySales(year, month);
  } catch (error) {
    console.error('Error getting monthly sales:', error);
    throw error;
  }
});

ipcMain.handle('get-monthly-sales-history', async (event, year, month) => {
  try {
    return await database.getMonthlySalesHistory(year, month);
  } catch (error) {
    console.error('Error getting monthly sales history:', error);
    throw error;
  }
});

ipcMain.handle('get-monthly-sales-detailed', async (event, year, month) => {
  try {
    return await database.getMonthlySalesDetailed(year, month);
  } catch (error) {
    console.error('Error getting monthly sales detailed:', error);
    throw error;
  }
});

// Overdue customers IPC handler
ipcMain.handle('get-overdue-customers', async () => {
  try {
    return await database.getOverdueCustomers();
  } catch (error) {
    console.error('Error getting overdue customers:', error);
    throw error;
  }
});

ipcMain.handle('clear-customer-dues', async (event, customerIds) => {
  try {
    return await database.clearCustomerDues(customerIds);
  } catch (error) {
    console.error('Error clearing customer dues:', error);
    throw error;
  }
});

// Payment History IPC handlers
ipcMain.handle('get-payment-history', async (event, customerId) => {
  try {
    return await database.getPaymentHistoryByCustomer(customerId);
  } catch (error) {
    console.error('Error getting payment history:', error);
    throw error;
  }
});

ipcMain.handle('get-all-payment-history', async () => {
  try {
    return await database.getAllPaymentHistory();
  } catch (error) {
    console.error('Error getting all payment history:', error);
    throw error;
  }
});

ipcMain.handle('update-customer-last-visit', async (event, customerId) => {
  try {
    return await database.updateCustomerLastVisit(customerId);
  } catch (error) {
    console.error('Error updating customer last visit:', error);
    throw error;
  }
});

ipcMain.handle('get-inactive-customers', async (event, days = 30) => {
  try {
    return await database.getInactiveCustomers(days);
  } catch (error) {
    console.error('Error getting inactive customers:', error);
    throw error;
  }
});

ipcMain.handle('record-payment-history', async (event, paymentData) => {
  try {
    return await database.recordPaymentHistory(
      paymentData.customerId,
      paymentData.transactionType,
      paymentData.amount,
      paymentData.previousDues,
      paymentData.newDues,
      paymentData.billId,
      paymentData.notes
    );
  } catch (error) {
    console.error('Error recording payment history:', error);
    throw error;
  }
});

// Bill IPC handlers
ipcMain.handle('save-bill', async (event, billData) => {
  try {
    return await database.saveBill(billData);
  } catch (error) {
    console.error('Error saving bill:', error);
    throw error;
  }
});

ipcMain.handle('get-bills-by-customer', async (event, customerId) => {
  try {
    return await database.getBillsByCustomer(customerId);
  } catch (error) {
    console.error('Error getting bills by customer:', error);
    throw error;
  }
});

ipcMain.handle('search-customers', async (event, query) => {
  try {
    return await database.searchCustomers(query);
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
});

// Authentication IPC handlers
ipcMain.handle('login', async (event, credentials) => {
  try {
    const { username, password } = credentials;
    const user = await database.loginUser(username, password);
    currentUser = user;
    return { success: true, user };
  } catch (error) {
    console.error('Error during login:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('register', async (event, userData) => {
  try {
    const user = await database.registerUser(userData);
    return { success: true, user };
  } catch (error) {
    console.error('Error during registration:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('logout', async () => {
  try {
    currentUser = null;
    if (mainWindow) {
      mainWindow.close();
      mainWindow = null;
    }
    createLoginWindow();
    return { success: true };
  } catch (error) {
    console.error('Error during logout:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-current-user', async () => {
  try {
    if (!currentUser) {
      return null;
    }
    
    // Fetch fresh user data from database to ensure we have latest info
    const freshUserData = await database.getUserById(currentUser.id);
    if (freshUserData) {
      currentUser = freshUserData;
    }
    
    return currentUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
});

ipcMain.handle('update-profile', async (event, userData) => {
  try {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    const updatedUser = await database.updateUser(currentUser.id, userData);
    // Update current user data
    currentUser = { ...currentUser, ...updatedUser };
    return { success: true, user: currentUser };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-main-window', async () => {
  try {
    if (currentUser && !mainWindow) {
      createMainWindow();
      return { success: true };
    }
    return { success: false, error: 'Not authenticated' };
  } catch (error) {
    console.error('Error opening main window:', error);
    return { success: false, error: error.message };
  }
});

// Printer IPC handlers
ipcMain.handle('get-printers', async () => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not available');
    }
    const printers = await mainWindow.webContents.getPrintersAsync();
    console.log('Available printers:', printers);
    return printers;
  } catch (error) {
    console.error('Error getting printers:', error);
    throw error;
  }
});

ipcMain.handle('print-bill', async (event, printContent, options = {}) => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not available');
    }

    // Get all printers to find thermal printer
    const printers = await mainWindow.webContents.getPrintersAsync();

    // Try to find thermal printer (more comprehensive search)
    let selectedPrinter = options.printerName || '';

    if (!selectedPrinter) {
      // Look for thermal printer by various common names
      const thermalKeywords = ['thermal', 'receipt', '58mm', '80mm', 'pos', 'ticket', 'printer', 'label', 'lp', 'usb'];

      // First, try to find a non-PDF printer that's not OneNote
      for (const printer of printers) {
        const nameLower = printer.name.toLowerCase();
        // Skip PDF and OneNote printers
        if (nameLower.includes('pdf') || nameLower.includes('onenote')) {
          continue;
        }
        // Check if it matches thermal keywords
        if (thermalKeywords.some(keyword => nameLower.includes(keyword))) {
          selectedPrinter = printer.name;
          console.log('Found thermal printer:', printer.name);
          break;
        }
      }

      // If no thermal printer found, use the first non-PDF printer
      if (!selectedPrinter) {
        const nonPdfPrinter = printers.find(p =>
          !p.name.toLowerCase().includes('pdf') &&
          !p.name.toLowerCase().includes('onenote')
        );
        if (nonPdfPrinter) {
          selectedPrinter = nonPdfPrinter.name;
          console.log('Using first available printer:', selectedPrinter);
        }
      }
    }

    // Create a hidden print window to render the bill
    const printWindow = new BrowserWindow({
      width: 400,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    // Load the print content
    printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(printContent));

    // Wait for the window to finish loading
    printWindow.webContents.on('did-finish-load', async () => {
      // Print the bill with proper options for thermal printer
      await printWindow.webContents.print({
        silent: false, // Set to false to show printer dialog first time
        printBackground: false,
        deviceName: selectedPrinter,
        pageSize: { width: 80100, height: 100000 }, // 80mm in micrometers
        margins: {
          marginType: 'none',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        },
        scaleFactor: 100,
        copies: 1
      }, (success, errorType) => {
        if (success) {
          console.log('Bill printed successfully to:', selectedPrinter);
        } else {
          console.error('Print failed:', errorType);
        }
        // Close the print window after printing
        setTimeout(() => printWindow.close(), 1000);
      });
    });

    return { success: true, printer: selectedPrinter };
  } catch (error) {
    console.error('Error printing bill:', error);
    return { success: false, error: error.message };
  }
});

// Save slip as TXT file handler
ipcMain.handle('save-slip-txt', async (event, slipData) => {
  try {
    const { fileName, content } = slipData;

    // Get the app's root directory (where the app is running)
    const appRoot = app.getAppPath();

    // Create slips folder path
    const slipsDir = path.join(appRoot, 'slips');

    // Create slips folder if it doesn't exist
    if (!fs.existsSync(slipsDir)) {
      fs.mkdirSync(slipsDir, { recursive: true });
    }

    // Create file path
    const filePath = path.join(slipsDir, `${fileName}.txt`);

    // Write the file
    fs.writeFileSync(filePath, content, 'utf8');

    // Open the file with default text editor (so user can print with Ctrl+P)
    shell.openPath(filePath);

    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving slip:', error);
    return { success: false, error: error.message };
  }
});
