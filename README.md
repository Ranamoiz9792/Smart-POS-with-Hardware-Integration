# Babu Karyana Store - Customer Management System

A professional desktop application for managing customers, products, billing, and sales tracking. Built with Electron.js and SQLite.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Electron](https://img.shields.io/badge/Electron-27.0.0-9FE349)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [User Guide](#user-guide)
  - [Authentication](#authentication)
  - [Dashboard](#dashboard)
  - [Customers](#customers)
  - [Products](#products)
  - [Billing & POS](#billing--pos)
  - [Barcode Scanner](#barcode-scanner)
  - [Sales Reports](#sales-reports)
  - [Profile Settings](#profile-settings)
- [Default Credentials](#default-credentials)
- [Hardware Requirements](#hardware-requirements)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

### Core Features
| Feature | Description |
|---------|-------------|
| **Customer Management** | Add, edit, delete customers with contact info and dues tracking |
| **Product Management** | Manage inventory with stock levels and low stock alerts |
| **Billing & POS** | Create bills, add products, print thermal receipts |
| **Thermal Printer Support** | Auto-detects and prints silently to thermal receipt printers (58mm/80mm) |
| **Barcode Scanner Support** | Compatible with USB barcode scanners (Sonic SNC-9300, etc.) |
| **Sales Tracking** | Daily and monthly sales reports with CSV export |
| **Dues Management** | Track customer payments with overdue alerts (7+ days) |
| **User Authentication** | Secure login/signup with encrypted passwords |
| **Data Export** | Export customers, products, and sales data to CSV |

---

## Installation

### Prerequisites
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Windows** (tested on Windows 10/11)

### Steps

1. **Extract/Clone** the project folder:
   ```bash
   cd "C:\Users\Moiz\Downloads\Electron Js"
   ```

2. **Install dependencies** (first time only):
   ```bash
   npm install
   ```

3. **Run the application**:
   ```bash
   npm start
   ```

   Or double-click `run.bat`

---

## Getting Started

### First Time Setup

1. **Launch the app** - Login screen appears
2. **Create your account** or use default admin credentials
3. **Add your products** to the inventory
4. **Add customers** to your database
5. **Start billing!**

---

## User Guide

### Authentication

#### Login
- Enter your **username** and **password**
- Click **"Sign In"**

#### Create New Account
- Click **"Sign up here"** on login screen
- Fill in:
  - Full Name
  - Username (3-20 characters, letters/numbers/underscores only)
  - Password (minimum 6 characters)
  - Confirm Password

---

### Dashboard

The dashboard gives you a quick overview of your business:

| Section | Description |
|---------|-------------|
| **Total Customers** | Click to view all customers |
| **Total Products** | Click to manage inventory |
| **Today's Sales** | Revenue generated today |
| **Total Dues** | Outstanding payments from customers |
| **Stock Alerts** | Products with low/out of stock |
| **Overdue Payments** | Customers with payments 7+ days late |
| **Quick Search** | Fast product lookup |
| **Quick QR Scan** | Open barcode scanner |
| **New Bill** | Jump to billing page |

---

### Customers

#### Add Customer
1. Go to **Customers** page
2. Click **"Add Customer"**
3. Fill in details:
   - **Customer ID** (auto-generated, editable)
   - **Name** (required)
   - **Phone Number** (required)
   - **Remaining Dues** (optional, default: 0)
4. Click **"Save Customer"**

#### Edit Customer
- Click the **edit icon** on any customer row
- Modify details and save

#### Delete Customer
- Click the **trash icon**
- Confirm deletion
- ⚠️ This also deletes all associated bills and sales records

#### View Dues Details
- Click the **info icon** to see customer's purchase history and total dues

#### Search Customers
- Use the **search box** to filter by name, phone, or ID

---

### Products

#### Add Product
1. Go to **Products** page
2. Click **"Add Product"**
3. Fill in details:
   - **Product ID** (auto-generated, editable)
   - **Product Name** (required)
   - **Price (Rs)** (required)
   - **Quantity** (required)
4. Click **"Save Product"**

#### Edit Product
- Click the **edit icon** on any product row
- Modify details and save

#### Delete Product
- Click the **trash icon**
- Confirm deletion

#### Low Stock Alerts
Products appear in dashboard alerts when:
- **Out of Stock**: Quantity = 0 (critical - red)
- **Low Stock**: Quantity < 5 (warning - yellow)

---

### Billing & POS

The billing page is your point-of-sale system.

#### Create a Bill

1. **(Optional) Select a Customer**
   - Type customer name/phone in search box
   - Click on customer from dropdown
   - View their current dues

2. **Add Products**
   - **Option 1**: Use barcode scanner
   - **Option 2**: Type product name/ID and select from dropdown
   - Enter quantity
   - Click **"Add to Bill"**

3. **Review Bill**
   - See all items, quantities, prices, and totals
   - Remove items with trash icon

4. **Complete Sale**
   - **Print Bill**: Prints receipt silently to thermal printer and records sale
   - **Save to Customer**: Assigns bill to customer, adds to their dues
   - **Clear Bill**: Reset for next customer

#### Thermal Printer Auto-Detection
- The app **automatically detects** thermal printers when connected
- Supports common thermal printers (58mm/80mm receipt printers)
- **Silent printing** - No print dialogs, receipts print directly
- Printer keywords detected: `thermal`, `receipt`, `58mm`, `80mm`, `pos`, `ticket`

#### Auto-Print Feature
- Check **"Auto-print bill after saving"** to automatically print receipt when saving to customer

---

### Barcode Scanner

This app supports **USB Barcode Scanners** (tested with Sonic SNC-9300).

#### How to Use
1. Plug in your barcode scanner (USB)
2. Click **"Scan Product"** button
3. Scanner input field is **auto-focused**
4. Point scanner at a barcode
5. Scanner automatically "types" the barcode and presses Enter
6. Product is found and added to bill

#### Manual Entry
If you don't have a scanner or it fails:
- Type the barcode/product ID manually
- Press Enter or click **"Search"**

---

### Sales Reports

Track your business performance with detailed sales reports.

#### Today's Sales
- **Total Sales**: Revenue generated today
- **Items Sold**: Total quantity sold
- **Sales Details**: Time, product, quantity, price for each sale
- **Export CSV**: Download today's sales data

#### Monthly Report
- Select month and year from dropdowns
- View:
  - Monthly total sales
  - Items sold
  - Total bills generated
  - Daily breakdown
- **Export CSV**: Download monthly sales data

---

### Profile Settings

Update your account information:

1. Go to **Profile** page
2. Update **Full Name**
3. **Change Password** (optional):
   - Enter current password
   - Enter new password (min 6 characters)
   - Confirm new password
4. Click **"Update Profile"**

---

## Default Credentials

If you haven't created an account yet, use these defaults:

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `admin123` |

⚠️ **Important**: Change the default password after first login!

---

## Hardware Requirements

### Recommended
- **Barcode Scanner**: USB 2D Desktop Barcode Scanner (e.g., Sonic SNC-9300)
- **Thermal Printer**: 58mm or 80mm thermal receipt printer (USB)
- **Computer**: Windows 10/11, 4GB RAM minimum

### Scanner Setup
1. Plug scanner into USB port
2. Wait for driver installation (automatic)
3. No additional configuration needed - works as keyboard input

### Thermal Printer Setup
1. **Connect the printer** to your computer via USB
2. **Install the printer driver** (comes with the printer or download from manufacturer)
3. **Power on the printer** and ensure it has paper
4. **The app auto-detects** the thermal printer when you click "Print Bill"
5. **No configuration needed** - the app will find and use your thermal printer automatically

#### Supported Thermal Printer Types
- 58mm thermal receipt printers
- 80mm thermal receipt printers
- POS thermal printers
- Any USB thermal printer with standard drivers

#### How Printing Works
- When you click **"Print Bill"**, the app:
  1. Scans for connected thermal printers
  2. Auto-detects printers with names containing: `thermal`, `receipt`, `58mm`, `80mm`, `pos`, `ticket`
  3. Prints **silently** (no dialogs) directly to the detected printer
  4. Falls back to the first available printer if no thermal printer is found

⚠️ **Note**: If no thermal printer is connected, the print job may fail or show a dialog. Connect a thermal printer for the best experience.

---

## Project Structure

```
electron-js-customer-management/
├── src/
│   ├── main/
│   │   └── main.js              # Electron main process
│   ├── preload/
│   │   └── preload.js           # Context bridge for IPC
│   ├── database/
│   │   └── database.js          # SQLite database operations
│   └── renderer/
│       ├── index.html           # Main application UI
│       ├── login.html           # Login/signup page
│       ├── scripts/
│       │   ├── app.js           # Frontend logic
│       │   └── auth.js          # Authentication logic
│       └── styles/
│           ├── main.css         # Main styles
│           └── auth.css         # Auth styles
├── assets/
│   ├── css/                     # Font Awesome icons
│   ├── fonts/                   # Icon fonts
│   └── icon files
├── data/
│   └── customers.db             # SQLite database (auto-created)
├── package.json                 # Dependencies and scripts
├── run.bat                      # Quick start script (Windows)
└── README.md                    # This file
```

---

## Technologies Used

| Technology | Purpose |
|------------|---------|
| **Electron.js** | Desktop application framework |
| **Node.js** | JavaScript runtime |
| **SQLite3** | Local database |
| **bcrypt** | Password encryption |
| **Font Awesome** | Icons |
| **HTML/CSS/JavaScript** | Frontend |

---

## Troubleshooting

### Application won't start
- Ensure Node.js is installed: `node --version`
- Reinstall dependencies: `npm install`
- Check Windows Defender/firewall settings

### Database errors
- Delete `data/customers.db` and restart (will create fresh database)
- Ensure write permissions in the application folder

### Scanner not working
- Check scanner is properly connected
- Try typing manually in the scanner input field
- Test scanner in Notepad to verify it's working

### Receipt not printing
- Ensure thermal printer is **connected via USB** and **powered on**
- Verify printer driver is installed (check in Windows Settings > Devices > Printers & scanners)
- Check printer has paper and is online
- Test printer in other applications (Notepad, etc.)
- Restart the application after connecting the printer
- Check the console (F12) for printer detection messages

### Print dialog appearing instead of silent printing
- This happens when **no thermal printer is detected**
- Connect a thermal printer and ensure the driver is installed
- The app requires a thermal printer for silent printing
- If using a regular printer, you may see print dialogs

### Thermal printer not detected
- Check the printer is properly connected via USB
- Verify the printer driver is installed
- Try unplugging and reconnecting the printer
- Check Windows "Printers & scanners" settings to confirm the printer appears there
- The app looks for printers with names containing: `thermal`, `receipt`, `58mm`, `80mm`, `pos`, `ticket`

### Forgot password
- Delete `data/customers.db` and restart
- Use default admin credentials (admin/admin123)

### Port already in use
- Close all Electron app instances
- Use Task Manager to end any `electron.exe` processes

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Escape` | Close any open modal |
| `Ctrl+N` | Add new customer/product (on respective pages) |
| `Enter` | Submit forms / Scan barcode |

---

## Data Backup

Your data is stored in: `data/customers.db`

### Manual Backup
1. Close the application
2. Copy `data/customers.db` to a safe location

### Restore
1. Close the application
2. Replace `data/customers.db` with your backup
3. Restart the application

---

## License

This project is licensed under the MIT License.

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review this README thoroughly
3. Ensure all prerequisites are met

---

**Made with ❤️ for Babu Karyana Store**

*Version 1.1.0 | 2024 - Added Thermal Printer Auto-Detection & Silent Printing*
