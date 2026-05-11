const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

class Database {
  constructor() {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.dbPath = path.join(dataDir, 'customers.db');
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          // Enable foreign key constraints
          this.db.run('PRAGMA foreign_keys = ON', (err) => {
            if (err) {
              console.error('Error enabling foreign keys:', err);
              reject(err);
            } else {
              console.log('Foreign key constraints enabled');
              this.createTables().then(resolve).catch(reject);
            }
          });
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createCustomersTable = `
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          remaining_dues REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createProductsTable = `
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          quantity REAL NOT NULL DEFAULT 0,
          unit TEXT DEFAULT 'pcs',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createBillsTable = `
        CREATE TABLE IF NOT EXISTS bills (
          id TEXT PRIMARY KEY,
          customer_id TEXT,
          total_amount REAL NOT NULL,
          total_items INTEGER NOT NULL,
          bill_data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
      `;

      const createSalesTable = `
        CREATE TABLE IF NOT EXISTS daily_sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bill_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          product_name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          total_amount REAL NOT NULL,
          sale_date DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createPaymentHistoryTable = `
        CREATE TABLE IF NOT EXISTS payment_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id TEXT NOT NULL,
          transaction_type TEXT NOT NULL,
          amount REAL NOT NULL,
          previous_dues REAL NOT NULL,
          new_dues REAL NOT NULL,
          bill_id TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
      `;

      // Create users table first
      this.db.run(createUsersTable, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
        } else {
          console.log('Users table created or already exists');
          
          // Then create customers table
          this.db.run(createCustomersTable, (err) => {
            if (err) {
              console.error('Error creating customers table:', err);
              reject(err);
            } else {
              console.log('Customers table created or already exists');
              
              // Finally create products table
              this.db.run(createProductsTable, (err) => {
                if (err) {
                  console.error('Error creating products table:', err);
                  reject(err);
                } else {
                  console.log('Products table created or already exists');
                  
                  // Create bills table
                  this.db.run(createBillsTable, (err) => {
                    if (err) {
                      console.error('Error creating bills table:', err);
                      reject(err);
                    } else {
                      console.log('Bills table created or already exists');
                      
                      // Create sales table
                      this.db.run(createSalesTable, (err) => {
                        if (err) {
                          console.error('Error creating sales table:', err);
                          reject(err);
                        } else {
                          console.log('Sales table created or already exists');

                          // Create payment history table
                          this.db.run(createPaymentHistoryTable, (err) => {
                            if (err) {
                              console.error('Error creating payment history table:', err);
                              reject(err);
                            } else {
                              console.log('Payment history table created or already exists');
                              this.migrateDatabase().then(() => {
                                this.createDefaultAdmin().then(resolve).catch(reject);
                              }).catch(reject);
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    });
  }

  // Database Migration Function
  async migrateDatabase() {
    return new Promise((resolve, reject) => {
      let migrationsCompleted = 0;
      let totalMigrations = 0;
      
      const checkComplete = () => {
        migrationsCompleted++;
        if (migrationsCompleted === totalMigrations) {
          console.log('Database migrations completed');
          resolve();
        }
      };
      
      // Check customers table
      this.db.all("PRAGMA table_info(customers)", [], (err, columns) => {
        if (err) {
          console.error('Error checking customers table:', err);
          reject(err);
          return;
        }
        
        const hasRemainingDues = columns.some(col => col.name === 'remaining_dues');
        const hasDueDate = columns.some(col => col.name === 'due_date');
        const hasLastVisit = columns.some(col => col.name === 'last_visit');

        if (!hasRemainingDues) {
          totalMigrations++;
          console.log('Adding remaining_dues column to customers table...');
          this.db.run("ALTER TABLE customers ADD COLUMN remaining_dues REAL DEFAULT 0", (err) => {
            if (err) {
              console.error('Error adding remaining_dues column:', err);
              reject(err);
            } else {
              console.log('Successfully added remaining_dues column');
              checkComplete();
            }
          });
        }
        
        if (!hasDueDate) {
          totalMigrations++;
          console.log('Adding due_date column to customers table...');
          this.db.run("ALTER TABLE customers ADD COLUMN due_date DATETIME", (err) => {
            if (err) {
              console.error('Error adding due_date column:', err);
              reject(err);
            } else {
              console.log('Successfully added due_date column');
              checkComplete();
            }
          });
        }

        if (!hasLastVisit) {
          totalMigrations++;
          console.log('Adding last_visit column to customers table...');
          this.db.run("ALTER TABLE customers ADD COLUMN last_visit DATETIME", (err) => {
            if (err) {
              console.error('Error adding last_visit column:', err);
              reject(err);
            } else {
              console.log('Successfully added last_visit column');
              checkComplete();
            }
          });
        }

        // Check bills table
        this.db.all("PRAGMA table_info(bills)", [], (err, billColumns) => {
          if (err) {
            console.error('Error checking bills table:', err);
            reject(err);
            return;
          }

          const hasCustomerId = billColumns.some(col => col.name === 'customer_id');
          if (!hasCustomerId) {
            totalMigrations++;
            console.log('Adding customer_id column to bills table...');
            this.db.run("ALTER TABLE bills ADD COLUMN customer_id TEXT", (err) => {
              if (err) {
                console.error('Error adding customer_id column:', err);
                reject(err);
              } else {
                console.log('Successfully added customer_id column');
                checkComplete();
              }
            });
          }

          // If no migrations needed, resolve immediately
          if (totalMigrations === 0) {
            console.log('Database is up to date');
            resolve();
          }
        });

        // Check products table for unit column and decimal quantity support
        this.db.all("PRAGMA table_info(products)", [], (err, productColumns) => {
          if (err) {
            console.error('Error checking products table:', err);
            reject(err);
            return;
          }

          const hasUnit = productColumns.some(col => col.name === 'unit');
          if (!hasUnit) {
            totalMigrations++;
            console.log('Adding unit column to products table...');
            this.db.run("ALTER TABLE products ADD COLUMN unit TEXT DEFAULT 'pcs'", (err) => {
              if (err) {
                console.error('Error adding unit column:', err);
                reject(err);
              } else {
                console.log('Successfully added unit column');
                checkComplete();
              }
            });
          }
        });
      });
    });
  }

  // Generate UUID for customer ID
  generateCustomerId() {
    return 'CID-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Generate UUID for product ID
  generateProductId() {
    return 'PID-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async getAllCustomers() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM customers ORDER BY created_at DESC';
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async searchCustomers(query) {
    return new Promise((resolve, reject) => {
      const searchQuery = `
        SELECT * FROM customers 
        WHERE name LIKE ? OR phone LIKE ? 
        ORDER BY name ASC 
        LIMIT 10
      `;
      const searchTerm = `%${query}%`;
      this.db.all(searchQuery, [searchTerm, searchTerm], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getCustomer(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM customers WHERE id = ?';
      this.db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async createCustomer(customer) {
    return new Promise((resolve, reject) => {
      const { name, phone, remaining_dues = 0 } = customer;
      const customerId = customer.id || this.generateCustomerId();
      const query = `
        INSERT INTO customers (id, name, phone, remaining_dues)
        VALUES (?, ?, ?, ?)
      `;
      
      this.db.run(query, [customerId, name, phone, remaining_dues], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: customerId,
            name,
            phone,
            remaining_dues,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
    });
  }

  async updateCustomer(id, customer) {
    return new Promise((resolve, reject) => {
      const { name, phone, remaining_dues } = customer;
      let query, params;
      
      if (remaining_dues !== undefined) {
        // Get current customer data to check if dues are being added/changed
        this.db.get('SELECT remaining_dues FROM customers WHERE id = ?', [id], (err, currentCustomer) => {
          if (err) {
            reject(err);
            return;
          }
          
          const currentDues = currentCustomer ? currentCustomer.remaining_dues || 0 : 0;
          const newDues = remaining_dues || 0;
          
          let query, params;
          if (newDues > currentDues && newDues > 0) {
            // Dues are being added or increased, update due_date with local time
            const now = new Date();
            const localTimestamp = now.getFullYear() + '-' + 
                                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                                  String(now.getDate()).padStart(2, '0') + ' ' + 
                                  String(now.getHours()).padStart(2, '0') + ':' + 
                                  String(now.getMinutes()).padStart(2, '0') + ':' + 
                                  String(now.getSeconds()).padStart(2, '0');
            query = `
              UPDATE customers 
              SET name = ?, phone = ?, remaining_dues = ?, due_date = ?, updated_at = ?
              WHERE id = ?
            `;
            params = [name, phone, newDues, localTimestamp, localTimestamp, id];
          } else if (newDues === 0) {
            // Dues are paid off, clear due_date
            const now = new Date();
            const localTimestamp = now.getFullYear() + '-' + 
                                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                                  String(now.getDate()).padStart(2, '0') + ' ' + 
                                  String(now.getHours()).padStart(2, '0') + ':' + 
                                  String(now.getMinutes()).padStart(2, '0') + ':' + 
                                  String(now.getSeconds()).padStart(2, '0');
            query = `
              UPDATE customers 
              SET name = ?, phone = ?, remaining_dues = ?, due_date = NULL, updated_at = ?
              WHERE id = ?
            `;
            params = [name, phone, newDues, localTimestamp, id];
          } else {
            // Just update other fields, keep existing due_date
            const now = new Date();
            const localTimestamp = now.getFullYear() + '-' + 
                                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                                  String(now.getDate()).padStart(2, '0') + ' ' + 
                                  String(now.getHours()).padStart(2, '0') + ':' + 
                                  String(now.getMinutes()).padStart(2, '0') + ':' + 
                                  String(now.getSeconds()).padStart(2, '0');
            query = `
              UPDATE customers 
              SET name = ?, phone = ?, remaining_dues = ?, updated_at = ?
              WHERE id = ?
            `;
            params = [name, phone, newDues, localTimestamp, id];
          }
          
          this.db.run(query, params, (err) => {
            if (err) {
              reject(err);
            } else if (this.changes === 0) {
              reject(new Error('Customer not found'));
            } else {
              // Record payment history if dues changed
              if (newDues !== currentDues) {
                const transactionType = newDues > currentDues ? 'DUE_ADDED' : 'PAYMENT_RECEIVED';
                const amount = Math.abs(newDues - currentDues);

                this.recordPaymentHistory(id, transactionType, amount, currentDues, newDues, null, 'Dues updated via customer edit')
                  .then(() => {
                    resolve({ id, name, phone, remaining_dues: newDues, updated_at: new Date().toISOString() });
                  })
                  .catch((historyErr) => {
                    console.error('Error recording payment history:', historyErr);
                    // Still resolve even if history recording fails
                    resolve({ id, name, phone, remaining_dues: newDues, updated_at: new Date().toISOString() });
                  });
              } else {
                resolve({ id, name, phone, remaining_dues: newDues, updated_at: new Date().toISOString() });
              }
            }
          });
        });
      } else {
        // No dues update, just update other fields
        const now = new Date();
        const localTimestamp = now.getFullYear() + '-' + 
                              String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(now.getDate()).padStart(2, '0') + ' ' + 
                              String(now.getHours()).padStart(2, '0') + ':' + 
                              String(now.getMinutes()).padStart(2, '0') + ':' + 
                              String(now.getSeconds()).padStart(2, '0');
        const query = `
          UPDATE customers 
          SET name = ?, phone = ?, updated_at = ?
          WHERE id = ?
        `;
        const params = [name, phone, localTimestamp, id];
        
        this.db.run(query, params, function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('Customer not found'));
          } else {
            resolve({ id, name, phone, remaining_dues, updated_at: new Date().toISOString() });
          }
        });
      }
    });
  }

  async deleteCustomer(id) {
    return new Promise((resolve, reject) => {
      // First, delete all bills associated with this customer
      const deleteBillsQuery = 'DELETE FROM bills WHERE customer_id = ?';
      this.db.run(deleteBillsQuery, [id], (err) => {
        if (err) {
          console.error('Error deleting customer bills:', err);
          reject(err);
          return;
        }
        
        // Then delete all sales records associated with this customer's bills
        const deleteSalesQuery = 'DELETE FROM daily_sales WHERE bill_id IN (SELECT id FROM bills WHERE customer_id = ?)';
        this.db.run(deleteSalesQuery, [id], (err) => {
          if (err) {
            console.error('Error deleting customer sales:', err);
            reject(err);
            return;
          }
          
          // Finally, delete the customer
          const deleteCustomerQuery = 'DELETE FROM customers WHERE id = ?';
          this.db.run(deleteCustomerQuery, [id], function(err) {
            if (err) {
              reject(err);
            } else if (this.changes === 0) {
              reject(new Error('Customer not found'));
            } else {
              resolve({ deleted: true, id });
            }
          });
        });
      });
    });
  }

  async getCustomerCount() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT COUNT(*) as count FROM customers';
      this.db.get(query, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  async getOverdueCustomers() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM customers
        WHERE remaining_dues > 0
        ORDER BY name ASC
      `;
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async clearCustomerDues(customerIds) {
    return new Promise((resolve, reject) => {
      const placeholders = customerIds.map(() => '?').join(',');
      const query = `
        UPDATE customers
        SET remaining_dues = 0, due_date = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
      `;
      this.db.run(query, customerIds, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ cleared: this.changes, customerIds });
        }
      });
    });
  }

  // Payment History Methods
  async recordPaymentHistory(customerId, transactionType, amount, previousDues, newDues, billId = null, notes = null) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO payment_history (customer_id, transaction_type, amount, previous_dues, new_dues, bill_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(query, [customerId, transactionType, amount, previousDues, newDues, billId, notes], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            customerId,
            transactionType,
            amount,
            previousDues,
            newDues,
            billId,
            notes,
            created_at: new Date().toISOString()
          });
        }
      });
    });
  }

  async getPaymentHistoryByCustomer(customerId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM payment_history
        WHERE customer_id = ?
        ORDER BY created_at DESC
      `;
      this.db.all(query, [customerId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async updateCustomerLastVisit(customerId) {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const localTimestamp = now.getFullYear() + '-' +
                            String(now.getMonth() + 1).padStart(2, '0') + '-' +
                            String(now.getDate()).padStart(2, '0') + ' ' +
                            String(now.getHours()).padStart(2, '0') + ':' +
                            String(now.getMinutes()).padStart(2, '0') + ':' +
                            String(now.getSeconds()).padStart(2, '0');

      const query = `
        UPDATE customers
        SET last_visit = ?, updated_at = ?
        WHERE id = ?
      `;

      this.db.run(query, [localTimestamp, localTimestamp, customerId], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Customer not found'));
        } else {
          resolve({ id: customerId, last_visit: localTimestamp, updated_at: new Date().toISOString() });
        }
      });
    });
  }

  async getInactiveCustomers(days = 30) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM customers
        WHERE last_visit IS NULL
           OR date(last_visit) < date('now', '-' || ${days} || ' days')
        ORDER BY name ASC
      `;
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getAllPaymentHistory() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT ph.*, c.name as customer_name, c.phone as customer_phone
        FROM payment_history ph
        LEFT JOIN customers c ON ph.customer_id = c.id
        ORDER BY ph.created_at DESC
        LIMIT 100
      `;
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Product CRUD Operations
  async getAllProducts() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM products ORDER BY created_at DESC';
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getProduct(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM products WHERE id = ?';
      this.db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async createProduct(product) {
    return new Promise((resolve, reject) => {
      const { name, price, quantity = 0, unit = 'pcs' } = product;
      const productId = product.id || this.generateProductId();
      const query = `
        INSERT INTO products (id, name, price, quantity, unit)
        VALUES (?, ?, ?, ?, ?)
      `;

      this.db.run(query, [productId, name, price, quantity, unit], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: productId,
            name,
            price,
            quantity,
            unit,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
    });
  }

  async updateProduct(id, product) {
    return new Promise((resolve, reject) => {
      const { name, price, quantity, unit } = product;
      const query = `
        UPDATE products
        SET name = ?, price = ?, quantity = ?, unit = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.run(query, [name, price, quantity, unit, id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Product not found'));
        } else {
          resolve({ id, name, price, quantity, unit, updated_at: new Date().toISOString() });
        }
      });
    });
  }

  async deleteProduct(id) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM products WHERE id = ?';
      this.db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Product not found'));
        } else {
          resolve({ deleted: true, id });
        }
      });
    });
  }

  async getProductCount() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT COUNT(*) as count FROM products';
      this.db.get(query, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  // Bill Operations
  generateBillId() {
    return 'BILL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  async saveBill(billData) {
    return new Promise((resolve, reject) => {
      const billId = this.generateBillId();
      const { items, totalAmount, totalItems, customerId } = billData;
      
      // If customerId is provided, verify the customer exists
      if (customerId) {
        this.db.get('SELECT id FROM customers WHERE id = ?', [customerId], (err, customer) => {
          if (err) {
            console.error('Error checking customer:', err);
            reject(err);
            return;
          }
          
          if (!customer) {
            reject(new Error(`Customer with ID ${customerId} not found`));
            return;
          }
          
          // Customer exists, proceed with bill insertion
          this.insertBill(billId, customerId, totalAmount, totalItems, items, resolve, reject);
        });
      } else {
        // No customer ID, insert bill without customer
        this.insertBill(billId, null, totalAmount, totalItems, items, resolve, reject);
      }
    });
  }
  
  insertBill(billId, customerId, totalAmount, totalItems, items, resolve, reject) {
    const query = `
      INSERT INTO bills (id, customer_id, total_amount, total_items, bill_data)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    this.db.run(query, [billId, customerId, totalAmount, totalItems, JSON.stringify(items)], function(err) {
      if (err) {
        console.error('Error saving bill:', err);
        if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
          reject(new Error('Invalid customer ID. Please select a valid customer.'));
        } else {
          reject(err);
        }
      } else {
        resolve({
          id: billId,
          customerId,
          totalAmount,
          totalItems,
          items,
          created_at: new Date().toISOString()
        });
      }
    });
  }

  async getAllBills() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM bills ORDER BY created_at DESC';
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse bill_data JSON for each bill
          const bills = rows.map(bill => ({
            ...bill,
            bill_data: JSON.parse(bill.bill_data)
          }));
          resolve(bills);
        }
      });
    });
  }

  async getBill(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM bills WHERE id = ?';
      this.db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            bill_data: JSON.parse(row.bill_data)
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async getBillsByCustomer(customerId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT b.*, c.name as customer_name, c.phone as customer_phone 
        FROM bills b 
        LEFT JOIN customers c ON b.customer_id = c.id 
        WHERE b.customer_id = ? 
        ORDER BY b.created_at DESC
      `;
      this.db.all(query, [customerId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const bills = rows.map(bill => {
            try {
              return {
                ...bill,
                bill_data: JSON.parse(bill.bill_data)
              };
            } catch (parseError) {
              console.error('Error parsing bill_data for bill:', bill.id, parseError);
              return {
                ...bill,
                bill_data: []
              };
            }
          });
          resolve(bills);
        }
      });
    });
  }

  // Sales Tracking Methods
  async recordSale(billId, billItems) {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      // Store local timestamp in SQLite datetime format
      const localTimestamp = now.getFullYear() + '-' + 
                            String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                            String(now.getDate()).padStart(2, '0') + ' ' + 
                            String(now.getHours()).padStart(2, '0') + ':' + 
                            String(now.getMinutes()).padStart(2, '0') + ':' + 
                            String(now.getSeconds()).padStart(2, '0');
      
      // Prepare all sales records
      const salesData = billItems.map(item => [
        billId,
        item.productId,
        item.productName,
        item.quantity,
        item.price,
        item.total,
        today,
        localTimestamp
      ]);
      
      // Insert all sales records with explicit created_at timestamp
      const query = `
        INSERT INTO daily_sales (bill_id, product_id, product_name, quantity, price, total_amount, sale_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      let completed = 0;
      let hasError = false;
      
      salesData.forEach(sale => {
        this.db.run(query, sale, (err) => {
          if (err && !hasError) {
            hasError = true;
            reject(err);
            return;
          }
          
          completed++;
          if (completed === salesData.length && !hasError) {
            resolve({ recorded: salesData.length, billId });
          }
        });
      });
    });
  }

  async getTodaysSales() {
    return new Promise((resolve, reject) => {
      const today = new Date().toISOString().split('T')[0];
      const query = `
        SELECT SUM(total_amount) as total_sales, COUNT(*) as total_items
        FROM daily_sales 
        WHERE sale_date = ?
      `;
      
      this.db.get(query, [today], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            totalSales: row.total_sales || 0,
            totalItems: row.total_items || 0
          });
        }
      });
    });
  }

  async getTodaysSalesHistory() {
    return new Promise((resolve, reject) => {
      const today = new Date().toISOString().split('T')[0];
      const query = `
        SELECT bill_id, product_name, quantity, price, total_amount, created_at
        FROM daily_sales 
        WHERE sale_date = ?
        ORDER BY created_at DESC
      `;
      
      this.db.all(query, [today], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getMonthlySales(year, month) {
    return new Promise((resolve, reject) => {
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      const query = `
        SELECT SUM(total_amount) as total_sales, COUNT(*) as total_items,
               COUNT(DISTINCT bill_id) as total_bills
        FROM daily_sales 
        WHERE sale_date LIKE ?
      `;
      
      this.db.get(query, [`${monthStr}%`], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            totalSales: row.total_sales || 0,
            totalItems: row.total_items || 0,
            totalBills: row.total_bills || 0
          });
        }
      });
    });
  }

  async getMonthlySalesHistory(year, month) {
    return new Promise((resolve, reject) => {
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      const query = `
        SELECT sale_date, SUM(total_amount) as daily_total, COUNT(*) as daily_items,
               COUNT(DISTINCT bill_id) as daily_bills
        FROM daily_sales 
        WHERE sale_date LIKE ?
        GROUP BY sale_date
        ORDER BY sale_date DESC
      `;
      
      this.db.all(query, [`${monthStr}%`], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getMonthlySalesDetailed(year, month) {
    return new Promise((resolve, reject) => {
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      const query = `
        SELECT bill_id, product_name, quantity, price, total_amount, sale_date, created_at
        FROM daily_sales 
        WHERE sale_date LIKE ?
        ORDER BY created_at DESC
      `;
      
      this.db.all(query, [`${monthStr}%`], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Authentication Methods
  async createDefaultAdmin() {
    return new Promise((resolve, reject) => {
      // Check if any users exist
      const checkQuery = 'SELECT COUNT(*) as count FROM users';
      this.db.get(checkQuery, [], async (err, row) => {
        if (err) {
          reject(err);
        } else if (row.count === 0) {
          // Create default admin user
          try {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const insertQuery = `
              INSERT INTO users (username, password_hash, full_name)
              VALUES (?, ?, ?)
            `;
            this.db.run(insertQuery, ['admin', hashedPassword, 'Administrator'], (err) => {
              if (err) {
                console.error('Error creating default admin:', err);
                reject(err);
              } else {
                console.log('Default admin user created (username: admin, password: admin123)');
                resolve();
              }
            });
          } catch (error) {
            reject(error);
          }
        } else {
          resolve();
        }
      });
    });
  }

  async registerUser(userData) {
    return new Promise(async (resolve, reject) => {
      try {
        const { username, password, fullName } = userData;
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const query = `
          INSERT INTO users (username, password_hash, full_name)
          VALUES (?, ?, ?)
        `;
        
        this.db.run(query, [username, hashedPassword, fullName], function(err) {
          if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              reject(new Error('Username already exists'));
            } else {
              reject(err);
            }
          } else {
            resolve({
              id: this.lastID,
              username,
              fullName,
              created_at: new Date().toISOString()
            });
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async loginUser(username, password) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE username = ? AND is_active = 1';
      this.db.get(query, [username], async (err, user) => {
        if (err) {
          reject(err);
        } else if (!user) {
          reject(new Error('Invalid username or password'));
        } else {
          try {
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (isValidPassword) {
              // Remove password hash from response
              const { password_hash, ...userWithoutPassword } = user;
              resolve(userWithoutPassword);
            } else {
              reject(new Error('Invalid username or password'));
            }
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }

  async getUserById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, username, full_name, is_active, created_at FROM users WHERE id = ?';
      this.db.get(query, [id], (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
  }

  async updateUser(id, userData) {
    return new Promise(async (resolve, reject) => {
      try {
        const { fullName, password, currentPassword } = userData;
        
        // If password is being changed, verify current password first
        if (password) {
          if (!currentPassword) {
            reject(new Error('Current password is required to change password'));
            return;
          }
          
          // Get current user to verify password
          const userQuery = 'SELECT password_hash FROM users WHERE id = ?';
          this.db.get(userQuery, [id], async (err, user) => {
            if (err) {
              reject(err);
              return;
            }
            
            if (!user) {
              reject(new Error('User not found'));
              return;
            }
            
            try {
              // Verify current password
              const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
              if (!isValidPassword) {
                reject(new Error('Current password is incorrect'));
                return;
              }
              
              // Hash new password and update
              const hashedPassword = await bcrypt.hash(password, 10);
              const updateQuery = `UPDATE users SET full_name = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
              const updateParams = [fullName, hashedPassword, id];
              
              this.db.run(updateQuery, updateParams, function(err) {
                if (err) {
                  reject(err);
                } else if (this.changes === 0) {
                  reject(new Error('User not found'));
                } else {
                  resolve({ id, fullName, updated_at: new Date().toISOString() });
                }
              });
            } catch (error) {
              reject(error);
            }
          });
        } else {
          // Just update full name without password change
          const query = `UPDATE users SET full_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
          const params = [fullName, id];
          
          this.db.run(query, params, function(err) {
            if (err) {
              reject(err);
            } else if (this.changes === 0) {
              reject(new Error('User not found'));
            } else {
              resolve({ id, fullName, updated_at: new Date().toISOString() });
            }
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

module.exports = Database;
