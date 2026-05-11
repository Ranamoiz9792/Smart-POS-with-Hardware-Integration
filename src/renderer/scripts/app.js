// Application State
let customers = [];
let products = [];
let currentCustomer = null;
let currentProduct = null;
let isEditing = false;
let isEditingProduct = false;
let currentUser = null;
let billItems = [];
let billCounter = 0;

// DOM Elements
const dashboardPage = document.getElementById('dashboard-page');
const customersPage = document.getElementById('customers-page');
const productsPage = document.getElementById('products-page');
const billingPage = document.getElementById('billing-page');
const profilePage = document.getElementById('profile-page');
const customerModal = document.getElementById('customer-modal');
const productModal = document.getElementById('product-modal');
const scannerModal = document.getElementById('scanner-modal');
const deleteModal = document.getElementById('delete-modal');
const clearDuesModal = document.getElementById('clear-dues-modal');
const loadingOverlay = document.getElementById('loading-overlay');
const customerForm = document.getElementById('customer-form');
const productForm = document.getElementById('product-form');
const profileForm = document.getElementById('profile-form');
const customersTableBody = document.getElementById('customers-table-body');
const productsTableBody = document.getElementById('products-table-body');
const billItemsBody = document.getElementById('bill-items-body');
const searchInput = document.getElementById('search-input');
const productSearchInputOld = document.getElementById('product-search-input');
const productSearchInput = document.getElementById('product-search');
const productSearchResults = document.getElementById('product-search-results');
const selectedProductIdInput = document.getElementById('selected-product-id');
const quantityInput = document.getElementById('quantity-input');
const totalItemsElement = document.getElementById('total-items');
const grandTotalElement = document.getElementById('grand-total');
const printBillBtn = document.getElementById('print-bill-btn');
const totalCustomersElement = document.getElementById('total-customers');
const totalProductsElement = document.getElementById('total-products');
const todaySalesElement = document.getElementById('today-sales');
const totalDuesElement = document.getElementById('total-dues');
const lowStockAlertsContainer = document.getElementById('low-stock-alerts');
const overdueCustomersContainer = document.getElementById('overdue-customers');
const inactiveCustomersContainer = document.getElementById('inactive-customers');
const dashboardProductSearch = document.getElementById('dashboard-product-search');
const dashboardSearchResults = document.getElementById('dashboard-search-results');
const salesPage = document.getElementById('sales-page');
const dailySalesTableBody = document.getElementById('daily-sales-table-body');
const monthlySalesTableBody = document.getElementById('monthly-sales-table-body');
let currentSalesTab = 'daily';

// Profile form state tracking
let originalProfileData = {};

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await loadCurrentUser();
    await loadDashboard();
});

// Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });

    // Customer form
    customerForm.addEventListener('submit', handleCustomerSubmit);

    // Product form
    productForm.addEventListener('submit', handleProductSubmit);

    // Profile form
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }

    // Search
    searchInput.addEventListener('input', handleSearch);
    if (productSearchInputOld) {
        productSearchInputOld.addEventListener('input', handleProductSearch);
    }
    
    // Product search in billing
    if (productSearchInput) {
        productSearchInput.addEventListener('input', handleBillingProductSearch);
        productSearchInput.addEventListener('focus', handleBillingProductSearch);
        productSearchInput.addEventListener('blur', () => {
            setTimeout(() => hideProductSearchResults(), 200);
        });
    }
    
    // Customer search in billing
    const customerSearchInput = document.getElementById('customer-search');
    if (customerSearchInput) {
        customerSearchInput.addEventListener('input', (e) => {
            clearTimeout(customerSearchTimeout);
            customerSearchTimeout = setTimeout(() => {
                searchCustomers(e.target.value);
            }, 300);
        });
        customerSearchInput.addEventListener('focus', (e) => {
            if (e.target.value.length >= 2) {
                searchCustomers(e.target.value);
            }
        });
        customerSearchInput.addEventListener('blur', () => {
            setTimeout(() => hideCustomerSearchResults(), 200);
        });
    }
    
    // Dashboard quick search
    if (dashboardProductSearch) {
        dashboardProductSearch.addEventListener('input', debounce(handleDashboardProductSearch, 100));
        dashboardProductSearch.addEventListener('focus', handleDashboardProductSearch);
        dashboardProductSearch.addEventListener('blur', () => {
            setTimeout(() => hideDashboardSearchResults(), 200);
        });
    }

    // Delete confirmation
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);

    // Clear dues confirmation
    document.getElementById('confirm-clear-dues-btn').addEventListener('click', confirmClearDues);

    // Allow editing customer ID
    document.getElementById('customer-id').addEventListener('input', () => {
        document.getElementById('customer-id').removeAttribute('readonly');
    });

    // Make customer ID editable on click
    document.getElementById('customer-id').addEventListener('click', () => {
        if (isEditing) {
            document.getElementById('customer-id').removeAttribute('readonly');
            document.getElementById('customer-id').focus();
        }
    });

    // Allow editing product ID
    document.getElementById('product-id').addEventListener('input', () => {
        document.getElementById('product-id').removeAttribute('readonly');
    });

    // Make product ID editable on click
    document.getElementById('product-id').addEventListener('click', () => {
        if (isEditingProduct) {
            document.getElementById('product-id').removeAttribute('readonly');
            document.getElementById('product-id').focus();
        }
    });

    // Payment status radio buttons
    document.querySelectorAll('input[name="payment-status"]').forEach(radio => {
        radio.addEventListener('change', handlePaymentStatusChange);
    });

    // Partial payment amount input
    const partialAmountInput = document.getElementById('partial-amount');
    if (partialAmountInput) {
        partialAmountInput.addEventListener('input', updateRemainingAmount);
        partialAmountInput.addEventListener('blur', validatePartialPayment);
    }
}

function validatePartialPayment() {
    const grandTotal = calculateGrandTotal();
    const partialAmountInput = document.getElementById('partial-amount');
    const cashPaid = parseFloat(partialAmountInput.value) || 0;

    if (grandTotal > 0) {
        if (cashPaid > grandTotal) {
            // Cap the value at grand total minus 0.01 (to keep it as a partial payment)
            partialAmountInput.value = (grandTotal - 0.01).toFixed(2);
            updateRemainingAmount();
            showToast(`Maximum partial payment is Rs ${(grandTotal - 0.01).toFixed(2)} (must be less than total Rs ${grandTotal.toFixed(2)})`, 'warning');
        } else if (cashPaid === grandTotal && grandTotal > 0) {
            // If equals total, clear it and suggest using Cash Paid
            partialAmountInput.value = '';
            updateRemainingAmount();
            showToast('Amount equals total bill. Please select "Cash Paid" instead of "Partial Pay".', 'info');
        } else if (cashPaid <= 0) {
            partialAmountInput.value = '';
            updateRemainingAmount();
        }
    }
}

// Navigation
function handleNavigation(e) {
    e.preventDefault();
    const targetPage = e.currentTarget.dataset.page;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    e.currentTarget.classList.add('active');

    // Show target page
    showPage(targetPage);
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        if (pageId === 'customers') {
            loadCustomers();
        } else if (pageId === 'products') {
            loadProducts();
        } else if (pageId === 'billing') {
            loadBillingPage();
        } else if (pageId === 'sales') {
            loadSalesPage();
        } else if (pageId === 'dashboard') {
            loadDashboard();
        } else if (pageId === 'profile') {
            loadProfile();
        }
    }
}

function showCustomersPage() {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('[data-page="customers"]').classList.add('active');
    
    showPage('customers');
}

function showProductsPage() {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('[data-page="products"]').classList.add('active');
    
    showPage('products');
}

// Dashboard Functions
async function loadDashboard() {
    try {
        showLoading();
        
        // Load basic counts
        const customerCount = await window.electronAPI.getCustomerCount();
        const productCount = await window.electronAPI.getProductCount();
        
        // Load customers to calculate total dues
        const customers = await window.electronAPI.getCustomers();
        const totalDues = customers.reduce((sum, customer) => sum + (customer.remaining_dues || 0), 0);
        
        // Load products to check low stock
        const products = await window.electronAPI.getProducts();
        
        // Load today's sales
        const salesData = await window.electronAPI.getTodaysSales();
        const todaySales = salesData.totalSales;
        
        // Update dashboard elements
        totalCustomersElement.textContent = customerCount;
        totalProductsElement.textContent = productCount;
        todaySalesElement.textContent = `Rs ${todaySales.toFixed(2)}`;
        totalDuesElement.textContent = `Rs ${totalDues.toFixed(2)}`;
        
        // Update low stock alerts
        updateLowStockAlerts(products);
        
        // Update overdue customer alerts
        updateOverdueCustomers();

        // Update inactive customers alerts
        updateInactiveCustomers();

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Error loading dashboard data', 'error');
    } finally {
        hideLoading();
    }
}

function updateLowStockAlerts(products) {
    const lowStockProducts = products.filter(product => product.quantity < 5);
    const outOfStockProducts = products.filter(product => product.quantity === 0);
    
    if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
        lowStockAlertsContainer.innerHTML = '<div class="no-alerts">All products are well stocked!</div>';
        return;
    }
    
    let alertsHTML = '';
    
    // Out of stock alerts (critical)
    outOfStockProducts.forEach(product => {
        alertsHTML += `
            <div class="alert-item critical">
                <div>
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>${product.name}</strong> is out of stock
                </div>
                <span>0 items</span>
            </div>
        `;
    });
    
    // Low stock alerts
    lowStockProducts.filter(p => p.quantity > 0).forEach(product => {
        alertsHTML += `
            <div class="alert-item">
                <div>
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>${product.name}</strong> is running low
                </div>
                <span>${product.quantity} items left</span>
            </div>
        `;
    });
    
    lowStockAlertsContainer.innerHTML = alertsHTML;
}

async function updateOverdueCustomers() {
    try {
        const overdueCustomers = await window.electronAPI.getOverdueCustomers();

        if (overdueCustomers.length === 0) {
            overdueCustomersContainer.innerHTML = '<div class="no-alerts">No overdue payments!</div>';
            return;
        }

        let alertsHTML = `
            <div class="overdue-actions">
                <button class="btn btn-success btn-sm" onclick="clearSelectedDues()" id="clear-selected-btn" style="display: none;">
                    <i class="fas fa-check"></i> Clear Selected Dues
                </button>
            </div>
            <div class="overdue-list">
        `;

        overdueCustomers.forEach(customer => {
            // Store customer data in a global object for safe access
            if (!window.overdueCustomersData) {
                window.overdueCustomersData = {};
            }
            window.overdueCustomersData[customer.id] = {
                id: customer.id,
                name: customer.name,
                dues: customer.remaining_dues
            };

            alertsHTML += `
                <div class="alert-item overdue-payment" data-customer-id="${customer.id}">
                    <div class="overdue-checkbox">
                        <input type="checkbox" class="overdue-customer-checkbox" data-customer-id="${customer.id}" onchange="updateClearSelectedButton()">
                    </div>
                    <div class="overdue-info" onclick="showPage('customers'); setTimeout(() => editCustomer('${customer.id}'), 300);" style="cursor: pointer; flex: 1;">
                        <div>
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>${customer.name}</strong> has overdue payment
                        </div>
                        <span>Rs ${customer.remaining_dues.toFixed(2)}</span>
                    </div>
                    <div class="overdue-action">
                        <button class="btn btn-success btn-sm" onclick="showClearDuesModalById('${customer.id}')" title="Clear Dues">
                            <i class="fas fa-check"></i> Clear Due
                        </button>
                    </div>
                </div>
            `;
        });

        alertsHTML += '</div>';
        overdueCustomersContainer.innerHTML = alertsHTML;

    } catch (error) {
        console.error('Error loading overdue customers:', error);
        overdueCustomersContainer.innerHTML = '<div class="no-alerts">Error loading overdue payments</div>';
    }
}

async function updateInactiveCustomers() {
    try {
        const inactiveCustomers = await window.electronAPI.getInactiveCustomers(30); // 30 days

        if (inactiveCustomers.length === 0) {
            inactiveCustomersContainer.innerHTML = '<div class="no-alerts">All customers visited this month!</div>';
            return;
        }

        let alertsHTML = '';

        inactiveCustomers.forEach(customer => {
            const lastVisit = customer.last_visit ? new Date(customer.last_visit).toLocaleDateString('en-PK') : 'Never';
            const daysSinceVisit = customer.last_visit
                ? Math.floor((new Date() - new Date(customer.last_visit)) / (1000 * 60 * 60 * 24))
                : 'N/A';

            alertsHTML += `
                <div class="alert-item inactive-customer" data-customer-id="${customer.id}">
                    <div class="inactive-info" style="flex: 1;">
                        <div>
                            <i class="fas fa-user-clock"></i>
                            <strong>${customer.name}</strong> hasn't visited
                        </div>
                        <span>Last visit: ${lastVisit} (${daysSinceVisit !== 'N/A' ? daysSinceVisit + ' days ago' : 'Never'})</span>
                    </div>
                    <div class="inactive-action">
                        <span class="customer-phone">${customer.phone}</span>
                    </div>
                </div>
            `;
        });

        inactiveCustomersContainer.innerHTML = alertsHTML;

    } catch (error) {
        console.error('Error loading inactive customers:', error);
        inactiveCustomersContainer.innerHTML = '<div class="no-alerts">Error loading inactive customers</div>';
    }
}

// Variables for clearing dues
let customerIdsToClear = [];
let singleCustomerToClear = null;

// Show clear dues modal using customer ID (fetches data from global object)
function showClearDuesModalById(customerId) {
    const customerData = window.overdueCustomersData ? window.overdueCustomersData[customerId] : null;
    if (!customerData) {
        console.error('Customer data not found for ID:', customerId);
        return;
    }
    showClearDuesModal(customerData.id, customerData.name, customerData.dues);
}

function showClearDuesModal(customerId, customerName, duesAmount) {
    singleCustomerToClear = { id: customerId, name: customerName };
    document.getElementById('clear-dues-message').innerHTML = `
        Are you sure you want to clear <strong>${customerName}</strong>'s dues of Rs ${duesAmount.toFixed(2)}?
    `;
    showModal(clearDuesModal);
}

function closeClearDuesModal() {
    hideModal(clearDuesModal);
    singleCustomerToClear = null;
    customerIdsToClear = [];
}

async function confirmClearDues() {
    try {
        let customerIds = [];
        let customersToClear = [];

        if (singleCustomerToClear) {
            customerIds = [singleCustomerToClear.id];
            customersToClear = [singleCustomerToClear];
        } else if (customerIdsToClear.length > 0) {
            customerIds = customerIdsToClear;
            // Get customer data for each ID
            for (const id of customerIdsToClear) {
                try {
                    const customer = await window.electronAPI.getCustomer(id);
                    customersToClear.push(customer);
                } catch (err) {
                    console.error('Error fetching customer:', err);
                }
            }
        } else {
            closeClearDuesModal();
            return;
        }

        showLoading();

        // Record payment history for each customer before clearing
        for (const customer of customersToClear) {
            const currentDues = customer.remaining_dues || 0;
            if (currentDues > 0) {
                try {
                    // Record payment history manually since clearCustomerDues doesn't do it
                    await window.electronAPI.invoke('record-payment-history', {
                        customerId: customer.id,
                        transactionType: 'PAYMENT_RECEIVED',
                        amount: currentDues,
                        previousDues: currentDues,
                        newDues: 0,
                        billId: null,
                        notes: 'Dues cleared manually'
                    });
                } catch (err) {
                    console.error('Error recording payment history:', err);
                }
            }
        }

        await window.electronAPI.clearCustomerDues(customerIds);
        hideLoading();
        closeClearDuesModal();

        // Refresh the dashboard and customers
        await loadDashboard();
        await loadCustomers();

        showToast(`Dues cleared for ${customerIds.length} customer(s)`, 'success');
    } catch (error) {
        hideLoading();
        console.error('Error clearing dues:', error);
        showToast('Error clearing dues. Please try again.', 'error');
    }
}

function clearSelectedDues() {
    const checkboxes = document.querySelectorAll('.overdue-customer-checkbox:checked');
    customerIdsToClear = Array.from(checkboxes).map(cb => cb.dataset.customerId);
    singleCustomerToClear = null;

    const customerCount = customerIdsToClear.length;
    document.getElementById('clear-dues-message').innerHTML = `
        Are you sure you want to clear dues for <strong>${customerCount}</strong> customer(s)?
    `;
    showModal(clearDuesModal);
}

function updateClearSelectedButton() {
    const checkboxes = document.querySelectorAll('.overdue-customer-checkbox:checked');
    const clearSelectedBtn = document.getElementById('clear-selected-btn');

    if (checkboxes.length > 0) {
        clearSelectedBtn.style.display = 'inline-flex';
    } else {
        clearSelectedBtn.style.display = 'none';
    }
}

// Customer Functions
async function loadCustomers() {
    try {
        showLoading();
        customers = await window.electronAPI.getCustomers();
        renderCustomersTable(customers);
    } catch (error) {
        console.error('Error loading customers:', error);
        showToast('Error loading customers', 'error');
    } finally {
        hideLoading();
    }
}

function renderCustomersTable(customersToRender) {
    customersTableBody.innerHTML = '';
    
    if (customersToRender.length === 0) {
        customersTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #6c757d;">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    No customers found
                </td>
            </tr>
        `;
        return;
    }

    customersToRender.forEach(customer => {
        const row = document.createElement('tr');
        const shortId = customer.id.length > 15 ? customer.id.substring(0, 15) + '...' : customer.id;
        const remainingDues = customer.remaining_dues || 0;
        
        // Check if customer is overdue (7+ days)
        const isOverdue = remainingDues > 0 && 
                         customer.due_date && 
                         isCustomerOverdue(customer.due_date);
        
        if (isOverdue) {
            row.classList.add('overdue-customer');
        }
        
        row.innerHTML = `
            <td title="${customer.id}">${shortId}</td>
            <td>${customer.name}${isOverdue ? ' <i class="fas fa-exclamation-triangle text-danger" title="Overdue payment (7+ days)"></i>' : ''}</td>
            <td>${customer.phone}</td>
            <td>${formatDate(customer.created_at)}</td>
            <td style="color: ${remainingDues > 0 ? '#dc3545' : '#28a745'}; font-weight: bold;">
                Rs ${remainingDues.toFixed(2)}
            </td>
            <td>
                <div class="action-buttons-table">
                    <button class="btn btn-warning btn-sm" onclick="viewCustomerDuesDetails('${customer.id}', '${customer.name}')" title="View Dues Details">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="btn btn-info btn-sm" onclick="showPaymentHistoryModal('${customer.id}', '${customer.name}')" title="View Payment History">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="editCustomer('${customer.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${customer.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        customersTableBody.appendChild(row);
    });
}

function isCustomerOverdue(dueDate) {
    if (!dueDate) return false;
    
    const dueDateObj = new Date(dueDate);
    const now = new Date();
    const daysDiff = Math.floor((now - dueDateObj) / (1000 * 60 * 60 * 24));
    
    return daysDiff >= 7;
}

// Customer Modal Functions
async function showAddCustomerModal() {
    isEditing = false;
    currentCustomer = null;
    document.getElementById('modal-title').textContent = 'Add Customer';
    document.getElementById('save-customer-btn').textContent = 'Save Customer';
    
    // Reset form
    customerForm.reset();
    
    // Generate and show new customer ID but make it editable
    try {
        const newId = await window.electronAPI.generateCustomerId();
        document.getElementById('customer-id').value = newId;
        document.getElementById('customer-id').removeAttribute('readonly');
        document.getElementById('customer-id').placeholder = 'Enter custom ID or use generated';
    } catch (error) {
        console.error('Error generating customer ID:', error);
        document.getElementById('customer-id').value = '';
        document.getElementById('customer-id').removeAttribute('readonly');
        document.getElementById('customer-id').placeholder = 'Enter customer ID (e.g., CID-xxx)';
    }
    
    showModal(customerModal);
}

async function editCustomer(id) {
    try {
        showLoading();
        currentCustomer = await window.electronAPI.getCustomer(id);
        isEditing = true;
        
        document.getElementById('modal-title').textContent = 'Edit Customer';
        document.getElementById('save-customer-btn').textContent = 'Update Customer';
        
        // Populate form
        document.getElementById('customer-id').value = currentCustomer.id;
        document.getElementById('customer-name').value = currentCustomer.name;
        document.getElementById('customer-phone').value = currentCustomer.phone;
        document.getElementById('customer-dues').value = currentCustomer.remaining_dues || 0;
        
        // Make ID field editable but indicate it can be changed
        document.getElementById('customer-id').removeAttribute('readonly');
        document.getElementById('customer-id').placeholder = 'Editable customer ID';
        
        showModal(customerModal);
    } catch (error) {
        console.error('Error loading customer:', error);
        showToast('Error loading customer details', 'error');
    } finally {
        hideLoading();
    }
}

function closeCustomerModal() {
    hideModal(customerModal);
    customerForm.reset();
    currentCustomer = null;
    isEditing = false;
}

async function handleCustomerSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(customerForm);
    const customerId = formData.get('id').trim();
    const customerData = {
        name: formData.get('name').trim(),
        phone: formData.get('phone').trim(),
        remaining_dues: parseFloat(formData.get('remaining_dues')) || 0
    };

    // Validate required fields
    if (!customerData.name || !customerData.phone || !customerId) {
        showToast('Please fill in all required fields including Customer ID', 'error');
        return;
    }

    try {
        showLoading();
        
        if (isEditing) {
            // Check if user wants to update the ID
            if (customerId !== currentCustomer.id) {
                // User wants to change the ID - we need to delete old and create new
                await window.electronAPI.deleteCustomer(currentCustomer.id);
                customerData.id = customerId;
                await window.electronAPI.createCustomer(customerData);
                showToast('Customer updated successfully', 'success');
            } else {
                // Regular update
                await window.electronAPI.updateCustomer(currentCustomer.id, customerData);
                showToast('Customer updated successfully', 'success');
            }
        } else {
            // Use the provided customer ID
            customerData.id = customerId;
            await window.electronAPI.createCustomer(customerData);
            showToast('Customer created successfully', 'success');
        }
        
        closeCustomerModal();
        await loadCustomers();
        await loadDashboard(); // Update dashboard counts
        
    } catch (error) {
        console.error('Error saving customer:', error);
        showToast('Error saving customer', 'error');
    } finally {
        hideLoading();
    }
}

// Delete Functions
function deleteCustomer(id) {
    currentCustomer = customers.find(c => c.id === id);
    showModal(deleteModal);
}

function closeDeleteModal() {
    hideModal(deleteModal);
    currentCustomer = null;
    currentProduct = null;
}

async function confirmDelete() {
    if (!currentCustomer && !currentProduct) return;
    
    try {
        showLoading();
        
        if (currentCustomer) {
            await window.electronAPI.deleteCustomer(currentCustomer.id);
            showToast(`Customer "${currentCustomer.name}" and all associated bills deleted successfully`, 'success');
            closeDeleteModal();
            await loadCustomers();
        } else if (currentProduct) {
            await window.electronAPI.deleteProduct(currentProduct.id);
            showToast('Product deleted successfully', 'success');
            closeDeleteModal();
            await loadProducts();
        }
        
        await loadDashboard(); // Update dashboard counts
    } catch (error) {
        console.error('Error deleting:', error);
        let errorMessage = 'Error deleting item';
        if (error.message.includes('foreign key constraint')) {
            errorMessage = 'Cannot delete customer due to database constraints. Please try again.';
        } else if (error.message.includes('Customer not found')) {
            errorMessage = 'Customer not found or already deleted.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        showToast(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

// Search Function
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderCustomersTable(customers);
        return;
    }
    
    const filteredCustomers = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.phone.includes(searchTerm) ||
        customer.id.toString().includes(searchTerm)
    );
    
    renderCustomersTable(filteredCustomers);
}

// Product Functions
async function loadProducts() {
    try {
        showLoading();
        products = await window.electronAPI.getProducts();
        renderProductsTable(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Error loading products', 'error');
    } finally {
        hideLoading();
    }
}

function renderProductsTable(productsToRender) {
    productsTableBody.innerHTML = '';
    
    if (productsToRender.length === 0) {
        productsTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #6c757d;">
                    <i class="fas fa-box" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    No products found
                </td>
            </tr>
        `;
        return;
    }

    productsToRender.forEach(product => {
        const row = document.createElement('tr');
        const shortId = product.id.length > 15 ? product.id.substring(0, 15) + '...' : product.id;
        
        row.innerHTML = `
            <td title="${product.id}">${shortId}</td>
            <td>${product.name}</td>
            <td>Rs ${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.quantity}</td>
            <td>${formatDate(product.created_at)}</td>
            <td>
                <div class="action-buttons-table">
                    <button class="btn btn-secondary btn-sm" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        productsTableBody.appendChild(row);
    });
}

// Product Modal Functions
async function showAddProductModal() {
    isEditingProduct = false;
    currentProduct = null;
    document.getElementById('product-modal-title').textContent = 'Add Product';
    document.getElementById('save-product-btn').textContent = 'Save Product';
    
    // Reset form
    productForm.reset();
    
    // Generate and show new product ID but make it editable
    try {
        const newId = await window.electronAPI.generateProductId();
        document.getElementById('product-id').value = newId;
        document.getElementById('product-id').removeAttribute('readonly');
        document.getElementById('product-id').placeholder = 'Enter custom ID or use generated';
    } catch (error) {
        console.error('Error generating product ID:', error);
        document.getElementById('product-id').value = '';
        document.getElementById('product-id').removeAttribute('readonly');
        document.getElementById('product-id').placeholder = 'Enter product ID (e.g., PID-xxx)';
    }
    
    showModal(productModal);
}

async function editProduct(id) {
    try {
        showLoading();
        currentProduct = await window.electronAPI.getProduct(id);
        isEditingProduct = true;
        
        document.getElementById('product-modal-title').textContent = 'Edit Product';
        document.getElementById('save-product-btn').textContent = 'Update Product';
        
        // Populate form
        document.getElementById('product-id').value = currentProduct.id;
        document.getElementById('product-name').value = currentProduct.name;
        document.getElementById('product-price').value = currentProduct.price;
        document.getElementById('product-quantity').value = currentProduct.quantity;
        
        // Make ID field editable but indicate it can be changed
        document.getElementById('product-id').removeAttribute('readonly');
        document.getElementById('product-id').placeholder = 'Editable product ID';
        
        showModal(productModal);
    } catch (error) {
        console.error('Error loading product:', error);
        showToast('Error loading product details', 'error');
    } finally {
        hideLoading();
    }
}

function closeProductModal() {
    hideModal(productModal);
    productForm.reset();
    currentProduct = null;
    isEditingProduct = false;
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(productForm);
    const productId = formData.get('id').trim();
    const productData = {
        name: formData.get('name').trim(),
        price: parseFloat(formData.get('price')),
        quantity: parseInt(formData.get('quantity'))
    };

    // Validate required fields
    if (!productData.name || !productId || isNaN(productData.price) || isNaN(productData.quantity)) {
        showToast('Please fill in all required fields with valid values', 'error');
        return;
    }

    if (productData.price < 0 || productData.quantity < 0) {
        showToast('Price and quantity cannot be negative', 'error');
        return;
    }

    try {
        showLoading();
        
        if (isEditingProduct) {
            // Check if user wants to update the ID
            if (productId !== currentProduct.id) {
                // User wants to change the ID - we need to delete old and create new
                await window.electronAPI.deleteProduct(currentProduct.id);
                productData.id = productId;
                await window.electronAPI.createProduct(productData);
                showToast('Product updated successfully', 'success');
            } else {
                // Regular update
                await window.electronAPI.updateProduct(currentProduct.id, productData);
                showToast('Product updated successfully', 'success');
            }
        } else {
            // Use the provided product ID
            productData.id = productId;
            await window.electronAPI.createProduct(productData);
            showToast('Product created successfully', 'success');
        }
        
        closeProductModal();
        await loadProducts();
        await loadDashboard(); // Update dashboard counts
        
    } catch (error) {
        console.error('Error saving product:', error);
        showToast('Error saving product', 'error');
    } finally {
        hideLoading();
    }
}

function deleteProduct(id) {
    currentProduct = products.find(p => p.id === id);
    showModal(deleteModal);
}

// Product Search Function
function handleProductSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderProductsTable(products);
        return;
    }
    
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.id.toString().includes(searchTerm) ||
        product.price.toString().includes(searchTerm)
    );
    
    renderProductsTable(filteredProducts);
}

// Export Products Function
async function exportProducts() {
    try {
        showLoading();
        const products = await window.electronAPI.getProducts();
        
        // Create CSV content
        const headers = ['ID', 'Name', 'Price', 'Quantity', 'Created Date'];
        const csvContent = [
            headers.join(','),
            ...products.map(product => [
                product.id,
                `"${product.name}"`,
                product.price,
                product.quantity,
                `"${formatDate(product.created_at)}"`
            ].join(','))
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Products exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting products:', error);
        showToast('Error exporting products', 'error');
    } finally {
        hideLoading();
    }
}

// Billing Functions
async function loadBillingPage() {
    try {
        showLoading();
        // Load products for the dropdown
        products = await window.electronAPI.getProducts();
        populateProductSelect();

        // Reset billing state
        billItems = [];
        billCounter = 0;
        updateBillDisplay();

    } catch (error) {
        console.error('Error loading billing page:', error);
        showToast('Error loading billing page', 'error');
    } finally {
        hideLoading();
    }
}

function populateProductSelect() {
    // This function is no longer needed as we use search dropdown
    // Keep for compatibility with old product search if needed
}

function addProductToBill() {
    const productId = selectedProductIdInput.value;
    const quantity = parseInt(quantityInput.value);
    
    if (!productId) {
        showToast('Please select a product', 'error');
        return;
    }
    
    if (!quantity || quantity <= 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }
    
    // Find the selected product
    const selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) {
        showToast('Selected product not found', 'error');
        return;
    }
    
    const availableStock = selectedProduct.quantity;
    if (quantity > availableStock) {
        showToast(`Only ${availableStock} items available in stock`, 'error');
        return;
    }
    
    const productName = selectedProduct.name;
    const price = parseFloat(selectedProduct.price);
    const total = price * quantity;
    
    // Check if product already exists in bill
    const existingItemIndex = billItems.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = billItems[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        
        if (newQuantity > availableStock) {
            showToast(`Cannot add more. Only ${availableStock} items available in stock`, 'error');
            return;
        }
        
        billItems[existingItemIndex].quantity = newQuantity;
        billItems[existingItemIndex].total = price * newQuantity;
    } else {
        // Add new item
        billItems.push({
            id: ++billCounter,
            productId,
            productName,
            price,
            quantity,
            total
        });
    }
    
    // Reset form
    productSearchInput.value = '';
    selectedProductIdInput.value = '';
    quantityInput.value = 1;
    hideProductSearchResults();
    
    updateBillDisplay();
    showToast(`${productName} added to bill`, 'success');
}

function removeFromBill(itemId) {
    billItems = billItems.filter(item => item.id !== itemId);
    updateBillDisplay();
    showToast('Item removed from bill', 'success');
}

function updateBillDisplay() {
    // Update bill items table
    billItemsBody.innerHTML = '';
    
    if (billItems.length === 0) {
        billItemsBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: #6c757d;">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    No items in bill
                </td>
            </tr>
        `;
        totalItemsElement.textContent = '0';
        grandTotalElement.textContent = 'Rs 0.00';
        printBillBtn.disabled = true;
        return;
    }
    
    let grandTotal = 0;
    let totalItems = 0;
    
    billItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.productName}</td>
            <td>Rs ${item.price.toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>Rs ${item.total.toFixed(2)}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removeFromBill(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        billItemsBody.appendChild(row);
        
        grandTotal += item.total;
        totalItems += item.quantity;
    });

    totalItemsElement.textContent = totalItems;
    grandTotalElement.textContent = `Rs ${grandTotal.toFixed(2)}`;
    printBillBtn.disabled = false;
    updateSaveToCustomerButton();

    // Update partial payment validation if partial payment is selected
    const paymentStatus = getPaymentStatus();
    if (paymentStatus === 'partial') {
        updateRemainingAmount();
    }
}

function clearBill() {
    if (billItems.length === 0) {
        showToast('Bill is already empty', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to clear the entire bill?')) {
        billItems = [];
        billCounter = 0;
        updateBillDisplay();
        showToast('Bill cleared successfully', 'success');
    }
}

// Customer Search Functions
let selectedCustomer = null;
let customerSearchTimeout = null;

async function searchCustomers(query) {
    if (query.length < 2) {
        hideCustomerSearchResults();
        return;
    }
    
    try {
        const customers = await window.electronAPI.searchCustomers(query);
        showCustomerSearchResults(customers);
    } catch (error) {
        console.error('Error searching customers:', error);
        showToast('Error searching customers', 'error');
    }
}

function showCustomerSearchResults(customers) {
    const resultsContainer = document.getElementById('customer-search-results');
    const customerSearch = document.getElementById('customer-search');
    
    if (customers.length === 0) {
        resultsContainer.innerHTML = '<div class="search-result-item">No customers found</div>';
    } else {
        resultsContainer.innerHTML = customers.map(customer => `
            <div class="search-result-item" onclick="selectCustomer('${customer.id}', '${customer.name}', '${customer.phone}', ${customer.remaining_dues || 0})">
                <div class="customer-info">
                    <strong>${customer.name}</strong>
                    <span>${customer.phone}</span>
                </div>
                <div class="customer-dues">Rs ${(customer.remaining_dues || 0).toFixed(2)}</div>
            </div>
        `).join('');
    }
    
    resultsContainer.style.display = 'block';
}

function hideCustomerSearchResults() {
    const resultsContainer = document.getElementById('customer-search-results');
    resultsContainer.style.display = 'none';
}

function selectCustomer(customerId, customerName, customerPhone, remainingDues) {
    selectedCustomer = {
        id: customerId,
        name: customerName,
        phone: customerPhone,
        remaining_dues: remainingDues
    };
    
    // Update UI
    document.getElementById('selected-customer-id').value = customerId;
    document.getElementById('customer-search').value = '';
    document.getElementById('selected-customer-name').textContent = customerName;
    document.getElementById('selected-customer-phone').textContent = customerPhone;
    document.getElementById('selected-customer-dues').textContent = `Dues: Rs ${remainingDues.toFixed(2)}`;
    document.getElementById('selected-customer-info').style.display = 'block';
    
    hideCustomerSearchResults();
    updateSaveToCustomerButton();
}

function clearCustomerSelection() {
    selectedCustomer = null;
    document.getElementById('selected-customer-id').value = '';
    document.getElementById('selected-customer-info').style.display = 'none';
    updateSaveToCustomerButton();
}

function calculateGrandTotal() {
    let grandTotal = 0;
    billItems.forEach(item => {
        grandTotal += item.total;
    });
    return grandTotal;
}

function updateCustomerDisplay() {
    if (selectedCustomer) {
        const customerInfo = document.getElementById('selected-customer-info');
        const duesElement = customerInfo.querySelector('.customer-dues');
        if (duesElement) {
            duesElement.textContent = `Dues: Rs ${selectedCustomer.remaining_dues.toFixed(2)}`;
        }
    }
}

async function viewCustomerDuesDetails(customerId, customerName) {
    try {
        showLoading();

        console.log(`Loading dues details for customer: ${customerName} (${customerId})`);

        // Get customer data to fetch current remaining_dues
        const customer = await window.electronAPI.getCustomer(customerId);
        const bills = await window.electronAPI.getBillsByCustomer(customerId);
        const paymentHistory = await window.electronAPI.getPaymentHistory(customerId);

        console.log(`Found ${bills.length} bills for ${customerName}`);
        console.log(`Customer remaining_dues: ${customer.remaining_dues}`);

        if (bills.length === 0 && paymentHistory.length === 0) {
            showToast(`${customerName} has no purchase history`, 'info');
            hideLoading();
            return;
        }

        // Use the actual remaining_dues from customer record
        const totalDues = customer.remaining_dues || 0;
        const hasDues = totalDues > 0;

        // Create a modal to display dues details
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Dues Details - ${customerName}</h3>
                    <button class="btn btn-sm btn-secondary" onclick="this.closest('.modal').remove(); document.body.style.overflow = 'auto';">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="dues-summary">
                        <div class="dues-total ${hasDues ? '' : 'paid'}">
                            <h4>${hasDues ? 'Total Dues: Rs ' + totalDues.toFixed(2) : 'All dues cleared!'}</h4>
                            <p>${hasDues ? `Based on ${bills.length} purchase${bills.length > 1 ? 's' : ''}` : `No outstanding payments - showing ${bills.length} purchase${bills.length > 1 ? 's' : ''} history`}</p>
                        </div>
                    </div>

                    ${paymentHistory.length > 0 ? `
                        <div class="payment-history-section">
                            <h5>Payment History:</h5>
                            <div class="payment-history-list">
                                ${paymentHistory.map(payment => {
                                    const isPayment = payment.transaction_type === 'PAYMENT_RECEIVED';
                                    const isDueAdded = payment.transaction_type === 'DUE_ADDED';
                                    return `
                                        <div class="payment-history-item ${isPayment ? 'payment' : isDueAdded ? 'due' : ''}">
                                            <div class="payment-header">
                                                <span class="payment-type">
                                                    ${isPayment ? '<i class="fas fa-arrow-down"></i> Payment Received' :
                                                      isDueAdded ? '<i class="fas fa-arrow-up"></i> Due Added' :
                                                      '<i class="fas fa-exchange-alt"></i> ' + payment.transaction_type}
                                                </span>
                                                <span class="payment-date">${new Date(payment.created_at).toLocaleDateString('en-PK')}</span>
                                            </div>
                                            <div class="payment-details">
                                                <div class="payment-amount">
                                                    <strong>${isPayment ? '-' : '+'}Rs ${payment.amount.toFixed(2)}</strong>
                                                </div>
                                                <div class="payment-balance">
                                                    <span>Previous: Rs ${payment.previous_dues.toFixed(2)}</span>
                                                    <i class="fas fa-arrow-right"></i>
                                                    <span>New: Rs ${payment.new_dues.toFixed(2)}</span>
                                                </div>
                                                ${payment.notes ? `<div class="payment-notes">${payment.notes}</div>` : ''}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="bills-list">
                        <h5>${hasDues ? 'Pending Bills:' : 'Purchase History:'}</h5>
                        ${bills.map(bill => {
                            try {
                                const billData = Array.isArray(bill.bill_data) ? bill.bill_data : [];
                                return `
                                    <div class="bill-item ${hasDues ? '' : 'paid-bill'}">
                                        <div class="bill-header">
                                            <span class="bill-id">Bill #${bill.id.split('-')[1]}</span>
                                            <span class="bill-date">${new Date(bill.created_at).toLocaleDateString('en-PK')} ${new Date(bill.created_at).toLocaleTimeString('en-PK', {hour: '2-digit', minute: '2-digit'})}</span>
                                            ${!hasDues ? '<span class="paid-badge">PAID</span>' : ''}
                                        </div>
                                        <div class="bill-details">
                                            <div class="bill-items">
                                                ${billData.map(item => `
                                                    <div class="bill-item-detail">
                                                        <span>${item.productName || 'Unknown Product'}</span>
                                                        <span>Qty: ${item.quantity || 0}</span>
                                                        <span>Rs ${(item.total || 0).toFixed(2)}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                            <div class="bill-total">
                                                <strong>Bill Total: Rs ${bill.total_amount.toFixed(2)}</strong>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            } catch (error) {
                                console.error('Error rendering bill:', bill.id, error);
                                return `
                                    <div class="bill-item">
                                        <div class="bill-header">
                                            <span class="bill-id">Bill #${bill.id.split('-')[1]}</span>
                                            <span class="bill-date">${new Date(bill.created_at).toLocaleDateString('en-PK')}</span>
                                        </div>
                                        <div class="bill-details">
                                            <div class="bill-total">
                                                <strong>Bill Total: Rs ${bill.total_amount.toFixed(2)}</strong>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }
                        }).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => showModal(modal), 10);
        hideLoading();

    } catch (error) {
        hideLoading();
        console.error('Error loading dues details:', error);
        showToast(`Error loading dues details: ${error.message}`, 'error');
    }
}

// Payment History Modal Functions
let currentPaymentHistory = [];

async function showPaymentHistoryModal(customerId, customerName) {
    try {
        showLoading();

        document.getElementById('payment-history-title').textContent = `Payment History - ${customerName}`;
        const paymentHistory = await window.electronAPI.getPaymentHistory(customerId);
        currentPaymentHistory = paymentHistory;

        const content = document.getElementById('payment-history-content');

        if (paymentHistory.length === 0) {
            content.innerHTML = `
                <div class="no-alerts">
                    <i class="fas fa-history" style="font-size: 3rem; opacity: 0.5;"></i>
                    <p>No payment history found for this customer</p>
                </div>
            `;
        } else {
            let html = '<div class="payment-history-table-container"><table class="payment-history-table"><thead><tr>';
            html += '<th>Date</th><th>Type</th><th>Amount</th><th>Previous Dues</th><th>New Dues</th><th>Notes</th>';
            html += '</tr></thead><tbody>';

            paymentHistory.forEach(payment => {
                const isPayment = payment.transaction_type === 'PAYMENT_RECEIVED';
                const amountClass = isPayment ? 'payment-amount' : 'due-amount';
                const icon = isPayment ? '<i class="fas fa-arrow-down"></i> ' :
                           payment.transaction_type === 'DUE_ADDED' ? '<i class="fas fa-arrow-up"></i> ' :
                           '<i class="fas fa-exchange-alt"></i> ';

                html += `
                    <tr>
                        <td>${new Date(payment.created_at).toLocaleDateString('en-PK')}</td>
                        <td>${icon}${payment.transaction_type}</td>
                        <td class="${amountClass}">${isPayment ? '-' : '+'}Rs ${payment.amount.toFixed(2)}</td>
                        <td>Rs ${payment.previous_dues.toFixed(2)}</td>
                        <td>Rs ${payment.new_dues.toFixed(2)}</td>
                        <td>${payment.notes || '-'}</td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
            content.innerHTML = html;
        }

        showModal(document.getElementById('payment-history-modal'));
        hideLoading();

    } catch (error) {
        hideLoading();
        console.error('Error loading payment history:', error);
        showToast('Error loading payment history', 'error');
    }
}

function closePaymentHistoryModal() {
    hideModal(document.getElementById('payment-history-modal'));
    currentPaymentHistory = [];
}

function exportPaymentHistory() {
    if (currentPaymentHistory.length === 0) {
        showToast('No payment history to export', 'warning');
        return;
    }

    const csvContent = [
        ['Date', 'Type', 'Amount', 'Previous Dues', 'New Dues', 'Notes'],
        ...currentPaymentHistory.map(p => [
            new Date(p.created_at).toLocaleString('en-PK'),
            p.transaction_type,
            (p.transaction_type === 'PAYMENT_RECEIVED' ? '-' : '+') + p.amount.toFixed(2),
            p.previous_dues.toFixed(2),
            p.new_dues.toFixed(2),
            p.notes || ''
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Payment history exported successfully', 'success');
}

async function viewDuesDetails() {
    if (!selectedCustomer) {
        showToast('No customer selected', 'warning');
        return;
    }
    
    await viewCustomerDuesDetails(selectedCustomer.id, selectedCustomer.name);
}

function updateSaveToCustomerButton() {
    const saveToCustomerBtn = document.getElementById('save-to-customer-btn');
    saveToCustomerBtn.disabled = billItems.length === 0 || !selectedCustomer;
}

// Payment Status Functions
function handlePaymentStatusChange(e) {
    const partialPaymentInput = document.getElementById('partial-payment-input');
    const paymentStatus = e.target.value;

    if (paymentStatus === 'partial') {
        partialPaymentInput.style.display = 'block';
        // Focus on the partial amount input for better UX
        setTimeout(() => {
            document.getElementById('partial-amount').focus();
        }, 100);
        updateRemainingAmount();
    } else {
        partialPaymentInput.style.display = 'none';
        // Clear partial payment values when switching away
        document.getElementById('partial-amount').value = '';
        document.getElementById('remaining-amount').textContent = 'Rs 0.00';
        document.getElementById('partial-amount').style.borderColor = '';
    }
}

function updateRemainingAmount() {
    const grandTotal = calculateGrandTotal();
    const partialAmount = parseFloat(document.getElementById('partial-amount').value) || 0;
    const remaining = Math.max(0, grandTotal - partialAmount);

    const remainingElement = document.getElementById('remaining-amount');
    const hintElement = document.getElementById('partial-payment-hint');
    const partialAmountInput = document.getElementById('partial-amount');

    remainingElement.textContent = `Rs ${remaining.toFixed(2)}`;

    // Reset styles
    remainingElement.style.color = '';
    remainingElement.style.fontWeight = '';
    partialAmountInput.style.borderColor = '';
    if (hintElement) {
        hintElement.style.color = '';
        hintElement.style.display = 'block';
    }

    // No items in bill yet
    if (grandTotal === 0) {
        remainingElement.textContent = 'Rs 0.00';
        if (hintElement) {
            hintElement.innerHTML = '<i class="fas fa-shopping-cart"></i> Add items to bill first';
        }
        return;
    }

    // Validate and show warnings
    if (partialAmount >= grandTotal) {
        remainingElement.style.color = '#dc3545';
        remainingElement.style.fontWeight = 'bold';
        partialAmountInput.style.borderColor = '#dc3545';

        if (partialAmount === grandTotal) {
            remainingElement.textContent = 'Rs 0.00 ⚠️ Full payment - use "Cash Paid" option';
            if (hintElement) {
                hintElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <strong>Use "Cash Paid" for full payment instead</strong>';
                hintElement.style.color = '#dc3545';
            }
        } else {
            remainingElement.textContent = `Rs ${remaining.toFixed(2)} ⚠️ Amount exceeds total!`;
            if (hintElement) {
                hintElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <strong>Payment cannot exceed total (Rs ${grandTotal.toFixed(2)})</strong>`;
                hintElement.style.color = '#dc3545';
            }
        }
    } else if (partialAmount <= 0) {
        remainingElement.style.color = '#dc3545';
        remainingElement.style.fontWeight = 'bold';
        partialAmountInput.style.borderColor = '#dc3545';
        remainingElement.textContent = `Rs ${remaining.toFixed(2)} ⚠️ No payment entered`;
        if (hintElement) {
            hintElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <strong>Enter amount or use "Full Due" for no payment</strong>';
            hintElement.style.color = '#dc3545';
        }
    } else {
        // Valid partial payment
        partialAmountInput.style.borderColor = '#28a745';
        if (hintElement) {
            hintElement.innerHTML = `<i class="fas fa-check-circle"></i> Valid: Rs ${partialAmount.toFixed(2)} paid, Rs ${remaining.toFixed(2)} remaining`;
            hintElement.style.color = '#28a745';
        }
    }
}

function getPaymentStatus() {
    const selectedStatus = document.querySelector('input[name="payment-status"]:checked');
    if (!selectedStatus) return 'cash'; // Default to cash

    return selectedStatus.value;
}

function calculatePaymentAmounts() {
    const grandTotal = calculateGrandTotal();
    const paymentStatus = getPaymentStatus();

    let cashPaid = 0;
    let dueAmount = 0;

    switch (paymentStatus) {
        case 'cash':
            cashPaid = grandTotal;
            dueAmount = 0;
            break;
        case 'due':
            cashPaid = 0;
            dueAmount = grandTotal;
            break;
        case 'partial':
            cashPaid = parseFloat(document.getElementById('partial-amount').value) || 0;
            dueAmount = Math.max(0, grandTotal - cashPaid);
            break;
    }

    return { paymentStatus, cashPaid, dueAmount };
}

async function saveBillToCustomer() {
    if (billItems.length === 0) {
        showToast('Please add items to the bill first', 'warning');
        return;
    }

    if (!selectedCustomer) {
        showToast('Please select a customer first', 'warning');
        return;
    }

    try {
        showLoading();

        // Get payment details
        const { paymentStatus, cashPaid, dueAmount } = calculatePaymentAmounts();
        const grandTotal = calculateGrandTotal();

        // Validate partial payment
        if (paymentStatus === 'partial') {
            if (cashPaid <= 0) {
                showToast('Partial payment amount must be greater than 0. Select "Full Due" for no payment.', 'warning');
                hideLoading();
                return;
            }
            if (cashPaid >= grandTotal) {
                if (cashPaid === grandTotal) {
                    showToast('Amount equals total bill. Please select "Cash Paid" for full payment.', 'warning');
                } else {
                    showToast(`Partial payment (Rs ${cashPaid.toFixed(2)}) cannot exceed total bill (Rs ${grandTotal.toFixed(2)}).`, 'warning');
                }
                hideLoading();
                return;
            }
        }

        // Debug: Log the selected customer data
        console.log('Selected customer for bill save:', selectedCustomer);
        console.log('Bill items:', billItems);
        console.log('Payment status:', paymentStatus, 'Cash paid:', cashPaid, 'Due amount:', dueAmount);

        const billData = {
            items: billItems,
            totalAmount: grandTotal,
            totalItems: billItems.length,
            customerId: selectedCustomer.id
        };

        console.log('Bill data being saved:', billData);

        const savedBill = await window.electronAPI.saveBill(billData);

        // Deduct quantities from product stock
        for (const item of billItems) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const newQuantity = product.quantity - item.quantity;
                await window.electronAPI.updateProduct(item.productId, {
                    name: product.name,
                    price: product.price,
                    quantity: Math.max(0, newQuantity) // Ensure quantity doesn't go negative
                });

                // Update local products array
                product.quantity = Math.max(0, newQuantity);
            }
        }

        // Update customer dues based on payment status
        const currentDues = selectedCustomer.remaining_dues || 0;
        let newDues = currentDues;

        // Only add dues if payment status is not 'cash' (fully paid)
        if (paymentStatus !== 'cash') {
            newDues = currentDues + dueAmount;
        }

        await window.electronAPI.updateCustomer(selectedCustomer.id, {
            name: selectedCustomer.name,
            phone: selectedCustomer.phone,
            remaining_dues: newDues
        });

        // Update local customer data
        selectedCustomer.remaining_dues = newDues;

        // Record payment history
        try {
            let transactionType = 'SALE';
            let notes = '';

            if (paymentStatus === 'cash') {
                transactionType = 'CASH_SALE';
                notes = `Full payment received: Rs ${cashPaid.toFixed(2)}`;
            } else if (paymentStatus === 'due') {
                transactionType = 'DUE_ADDED';
                notes = `Full amount added to dues: Rs ${dueAmount.toFixed(2)}`;
            } else if (paymentStatus === 'partial') {
                transactionType = 'PARTIAL_PAYMENT';
                notes = `Partial payment: Rs ${cashPaid.toFixed(2)} paid, Rs ${dueAmount.toFixed(2)} added to dues`;
            }

            await window.electronAPI.recordPaymentHistory({
                customerId: selectedCustomer.id,
                transactionType: transactionType,
                amount: grandTotal,
                previousDues: currentDues,
                newDues: newDues,
                billId: savedBill.id,
                notes: notes
            });
        } catch (err) {
            console.error('Error recording payment history:', err);
        }

        // Update customer's last visit
        try {
            await window.electronAPI.updateCustomerLastVisit(selectedCustomer.id);
        } catch (err) {
            console.error('Error updating last visit:', err);
        }

        // Record the sale for tracking (only once)
        await window.electronAPI.recordSale(savedBill.id, billItems);

        // Show appropriate success message
        let successMessage = '';
        if (paymentStatus === 'cash') {
            successMessage = `Payment received: Rs ${cashPaid.toFixed(2)}. Bill completed!`;
        } else if (paymentStatus === 'due') {
            successMessage = `Bill saved to ${selectedCustomer.name}'s account. Total dues: Rs ${newDues.toFixed(2)}`;
        } else {
            successMessage = `Partial payment received: Rs ${cashPaid.toFixed(2)}. Rs ${dueAmount.toFixed(2)} added to dues. Total dues: Rs ${newDues.toFixed(2)}`;
        }

        showToast(successMessage, 'success');

        // Check if auto-print is enabled
        const autoPrintCheckbox = document.getElementById('auto-print-checkbox');
        if (autoPrintCheckbox && autoPrintCheckbox.checked) {
            await printBill(true); // Sale already recorded, don't duplicate
        }

        // Clear the bill after saving
        billItems = [];
        billCounter = 0;
        updateBillDisplay();

        // Reset payment status to default (cash)
        document.querySelector('input[name="payment-status"][value="cash"]').checked = true;
        document.getElementById('partial-payment-input').style.display = 'none';
        document.getElementById('partial-amount').value = '';
        document.getElementById('remaining-amount').textContent = 'Rs 0.00';

        // Clear customer selection to start fresh
        clearCustomerSelection();

        // Refresh only the billing page content, don't navigate to dashboard
        setTimeout(() => {
            // Clear the bill items and reset the form
            billItems = [];
            billCounter = 0;
            updateBillDisplay();

            // Clear customer search
            document.getElementById('customer-search').value = '';
            hideCustomerSearchResults();

            // Clear product search
            document.getElementById('product-search').value = '';
            document.getElementById('quantity-input').value = '1';
            hideProductSearchResults();

            showToast('Ready for new bill', 'success');
        }, 1500);

    } catch (error) {
        console.error('Error saving bill to customer:', error);

        // Provide more specific error messages
        let errorMessage = 'Error saving bill to customer';
        if (error.message.includes('Customer with ID') && error.message.includes('not found')) {
            errorMessage = 'Selected customer is no longer valid. Please select a different customer.';
        } else if (error.message.includes('Invalid customer ID')) {
            errorMessage = 'Invalid customer selected. Please select a valid customer.';
        } else if (error.message.includes('foreign key constraint')) {
            errorMessage = 'Database constraint error. Please try again or contact support.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        showToast(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

// Scanner Functions for External USB Barcode Scanner
// Scanner mode: 'billing' or 'addProduct'
let scannerMode = 'billing';

function openScanner() {
    scannerMode = 'billing';
    document.getElementById('scanner-modal-title').textContent = 'Scan Product Barcode';
    document.getElementById('scanner-action-btn').innerHTML = '<i class="fas fa-search"></i><span>Search</span>';
    showModal(scannerModal);

    // Auto-focus on the input field for external scanner
    setTimeout(() => {
        const barcodeInput = document.getElementById('manual-barcode');
        barcodeInput.value = '';
        barcodeInput.focus();
    }, 300);
}

function openScannerForProduct() {
    scannerMode = 'addProduct';
    document.getElementById('scanner-modal-title').textContent = 'Scan Barcode for New Product';
    document.getElementById('scanner-action-btn').innerHTML = '<i class="fas fa-check"></i><span>Use This ID</span>';
    showModal(scannerModal);

    // Auto-focus on the input field for external scanner
    setTimeout(() => {
        const barcodeInput = document.getElementById('manual-barcode');
        barcodeInput.value = '';
        barcodeInput.focus();
    }, 300);
}

async function openScannerAndAddProduct() {
    // First show the add product modal to set up the context
    isEditingProduct = false;
    currentProduct = null;
    document.getElementById('product-modal-title').textContent = 'Add Product';
    document.getElementById('save-product-btn').textContent = 'Save Product';

    // Reset form and clear product ID
    productForm.reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-id').placeholder = 'Scan barcode to auto-fill...';

    // Open scanner directly
    openScannerForProduct();
}

function closeScannerModal() {
    hideModal(scannerModal);
    document.getElementById('manual-barcode').value = '';
    scannerMode = 'billing';
}

// Handle Enter key on barcode input (external scanner sends Enter after scan)
document.addEventListener('DOMContentLoaded', () => {
    const barcodeInput = document.getElementById('manual-barcode');

    barcodeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleScannerAction();
        }
    });
});

function handleScannerAction() {
    const barcode = document.getElementById('manual-barcode').value.trim();

    if (!barcode) {
        showToast('Please enter a barcode or product ID', 'error');
        return;
    }

    if (scannerMode === 'addProduct') {
        // For adding new product - paste the barcode into product ID field and open modal
        closeScannerModal();
        document.getElementById('product-id').value = barcode;
        // Open the product modal
        showModal(productModal);
        document.getElementById('product-name').focus();
        showToast(`Barcode scanned: ${barcode}. Please fill in product details.`, 'success');
    } else {
        // For billing - search for existing product
        searchProductByCode(barcode);
    }
}

function searchProductByCode(barcode) {
    if (!barcode) {
        barcode = document.getElementById('manual-barcode').value.trim();
    }

    if (!barcode) {
        showToast('Please enter a barcode or product ID', 'error');
        return;
    }

    // Search for product by ID or name
    const product = products.find(p =>
        p.id.toLowerCase().includes(barcode.toLowerCase()) ||
        p.name.toLowerCase().includes(barcode.toLowerCase())
    );

    if (product) {
        if (product.quantity <= 0) {
            showToast('Product is out of stock', 'error');
            // Keep modal open and clear input for next scan
            document.getElementById('manual-barcode').value = '';
            document.getElementById('manual-barcode').focus();
            return;
        }

        // Close scanner modal
        closeScannerModal();

        // Auto-fill the product search and select it
        productSearchInput.value = product.name;
        selectedProductIdInput.value = product.id;
        quantityInput.value = 1;
        quantityInput.focus();

        showToast(`Product found: ${product.name}`, 'success');
    } else {
        showToast(`Product not found for barcode: ${barcode}`, 'error');
        // Clear input for next scan
        document.getElementById('manual-barcode').value = '';
        document.getElementById('manual-barcode').focus();
    }
}

// Product Search Functions
function handleBillingProductSearch() {
    const query = productSearchInput.value.toLowerCase().trim();
    
    if (query.length === 0) {
        hideProductSearchResults();
        selectedProductIdInput.value = '';
        return;
    }
    
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.id.toLowerCase().includes(query)
    ).slice(0, 10); // Limit to 10 results
    
    displayProductSearchResults(filteredProducts, productSearchResults);
}

async function handleDashboardProductSearch() {
    const query = dashboardProductSearch.value.toLowerCase().trim();
    
    if (query.length === 0) {
        hideDashboardSearchResults();
        return;
    }
    
    // Load products if not already loaded
    if (!products || products.length === 0) {
        try {
            products = await window.electronAPI.getProducts();
        } catch (error) {
            console.error('Error loading products for search:', error);
            return;
        }
    }
    
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.id.toLowerCase().includes(query)
    ).slice(0, 5); // Limit to 5 results for dashboard
    
    displayProductSearchResults(filteredProducts, dashboardSearchResults);
}

function displayProductSearchResults(filteredProducts, container) {
    if (filteredProducts.length === 0) {
        container.innerHTML = '<div class="search-result-item">No products found</div>';
        container.style.display = 'block';
        return;
    }
    
    let resultsHTML = '';
    filteredProducts.forEach(product => {
        const stockClass = product.quantity === 0 ? 'out' : (product.quantity < 5 ? 'low' : '');
        const stockText = product.quantity === 0 ? 'Out of stock' : `${product.quantity} in stock`;
        
        resultsHTML += `
            <div class="search-result-item" onclick="selectProduct('${product.id}', '${product.name}', '${container.id}')">
                <div class="search-result-info">
                    <div class="search-result-name">${product.name}</div>
                    <div class="search-result-price">Rs ${product.price}</div>
                </div>
                <div class="search-result-stock ${stockClass}">${stockText}</div>
            </div>
        `;
    });
    
    container.innerHTML = resultsHTML;
    container.style.display = 'block';
}

function selectProduct(productId, productName, containerId) {
    if (containerId === 'product-search-results') {
        // Billing page selection
        productSearchInput.value = productName;
        selectedProductIdInput.value = productId;
        hideProductSearchResults();
        quantityInput.focus();
    } else if (containerId === 'dashboard-search-results') {
        // Dashboard quick search - navigate to product
        hideDashboardSearchResults();
        dashboardProductSearch.value = productName;
        showToast(`Found: ${productName}`, 'info');
        
        // Navigate to products page and highlight the product
        showPage('products');
        setTimeout(() => {
            const productRows = document.querySelectorAll('#products-table-body tr');
            productRows.forEach(row => {
                if (row.textContent.includes(productName)) {
                    row.style.backgroundColor = '#fff3cd';
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        row.style.backgroundColor = '';
                    }, 3000);
                }
            });
        }, 500);
    }
}

function hideProductSearchResults() {
    productSearchResults.style.display = 'none';
}

function hideDashboardSearchResults() {
    dashboardSearchResults.style.display = 'none';
}

function openQuickScanner() {
    showPage('billing');
    setTimeout(() => {
        openScanner();
    }, 300);
}

// Sales Page Functions
async function loadSalesPage() {
    // Initialize month/year selectors
    initializeMonthYearSelectors();
    
    // Load daily sales (default tab)
    await loadDailySales();
}

function initializeMonthYearSelectors() {
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    
    // Populate months
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    monthSelect.innerHTML = '';
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
    
    // Populate years (current year and previous 2 years)
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    for (let year = currentYear; year >= currentYear - 2; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    
    // Set current month and year
    const now = new Date();
    monthSelect.value = now.getMonth() + 1;
    yearSelect.value = now.getFullYear();
}

async function loadDailySales() {
    try {
        showLoading();
        
        // Load today's sales data
        const salesData = await window.electronAPI.getTodaysSales();
        const salesHistory = await window.electronAPI.getTodaysSalesHistory();
        
        // Update summary cards
        document.getElementById('daily-total-sales').textContent = `Rs ${salesData.totalSales.toFixed(2)}`;
        document.getElementById('daily-total-items').textContent = salesData.totalItems;
        
        // Render sales history table
        renderDailySalesTable(salesHistory);
        
    } catch (error) {
        console.error('Error loading daily sales:', error);
        showToast('Error loading daily sales data', 'error');
    } finally {
        hideLoading();
    }
}

function renderDailySalesTable(salesHistory) {
    if (salesHistory.length === 0) {
        dailySalesTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem; color: #6c757d;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                        <i class="fas fa-chart-line" style="font-size: 4rem; opacity: 0.5;"></i>
                        <h3 style="margin: 0; font-weight: 500;">No sales recorded today</h3>
                        <p style="margin: 0; font-size: 0.9rem;">Sales will appear here once you print bills</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    dailySalesTableBody.innerHTML = '';
    
    salesHistory.forEach(sale => {
        const row = document.createElement('tr');
        const saleTime = new Date(sale.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        row.innerHTML = `
            <td>${saleTime}</td>
            <td>${sale.product_name}</td>
            <td>${sale.quantity}</td>
            <td>Rs ${parseFloat(sale.price).toFixed(2)}</td>
            <td>Rs ${parseFloat(sale.total_amount).toFixed(2)}</td>
        `;
        dailySalesTableBody.appendChild(row);
    });
}

function renderMonthlySalesTable(salesHistory) {
    if (salesHistory.length === 0) {
        monthlySalesTableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 3rem; color: #6c757d;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                        <i class="fas fa-calendar-alt" style="font-size: 4rem; opacity: 0.5;"></i>
                        <h3 style="margin: 0; font-weight: 500;">No sales recorded for this month</h3>
                        <p style="margin: 0; font-size: 0.9rem;">Monthly sales data will appear here</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    monthlySalesTableBody.innerHTML = '';
    
    salesHistory.forEach(dailySale => {
        const row = document.createElement('tr');
        const saleDate = new Date(dailySale.sale_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        row.innerHTML = `
            <td>${saleDate}</td>
            <td>Rs ${parseFloat(dailySale.daily_total).toFixed(2)}</td>
            <td>${dailySale.daily_items}</td>
            <td>${dailySale.daily_bills}</td>
        `;
        monthlySalesTableBody.appendChild(row);
    });
}

function showSalesTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    currentSalesTab = tabName;
    
    // Load appropriate data
    if (tabName === 'daily') {
        loadDailySales();
    } else if (tabName === 'monthly') {
        loadMonthlyReport();
    }
}

async function loadMonthlyReport() {
    try {
        showLoading();
        
        const monthSelect = document.getElementById('month-select');
        const yearSelect = document.getElementById('year-select');
        const selectedMonth = parseInt(monthSelect.value);
        const selectedYear = parseInt(yearSelect.value);
        
        // Load monthly sales data
        const monthlySales = await window.electronAPI.getMonthlySales(selectedYear, selectedMonth);
        const monthlySalesHistory = await window.electronAPI.getMonthlySalesHistory(selectedYear, selectedMonth);
        
        // Update summary cards
        document.getElementById('monthly-total-sales').textContent = `Rs ${monthlySales.totalSales.toFixed(2)}`;
        document.getElementById('monthly-total-items').textContent = monthlySales.totalItems;
        document.getElementById('monthly-total-bills').textContent = monthlySales.totalBills;
        
        // Render monthly sales table
        renderMonthlySalesTable(monthlySalesHistory);
        
    } catch (error) {
        console.error('Error loading monthly report:', error);
        showToast('Error loading monthly report', 'error');
    } finally {
        hideLoading();
    }
}

async function refreshCurrentTab() {
    if (currentSalesTab === 'daily') {
        await loadDailySales();
    } else if (currentSalesTab === 'monthly') {
        await loadMonthlyReport();
    }
    showToast('Sales data refreshed', 'success');
}

async function exportDailySales() {
    try {
        showLoading();
        const salesHistory = await window.electronAPI.getTodaysSalesHistory();
        
        if (salesHistory.length === 0) {
            showToast('No sales data to export', 'warning');
            return;
        }
        
        // Create CSV content
        const headers = ['Time', 'Product', 'Quantity', 'Price (Rs)', 'Total (Rs)'];
        const csvContent = [
            headers.join(','),
            ...salesHistory.map(sale => [
                new Date(sale.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                `"${sale.product_name}"`,
                sale.quantity,
                parseFloat(sale.price).toFixed(2),
                parseFloat(sale.total_amount).toFixed(2)
            ].join(','))
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const today = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `daily-sales-${today}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Daily sales exported successfully', 'success');
        
    } catch (error) {
        console.error('Error exporting daily sales:', error);
        showToast('Error exporting daily sales', 'error');
    } finally {
        hideLoading();
    }
}

async function exportMonthlySales() {
    try {
        showLoading();
        const monthSelect = document.getElementById('month-select');
        const yearSelect = document.getElementById('year-select');
        const selectedMonth = parseInt(monthSelect.value);
        const selectedYear = parseInt(yearSelect.value);
        
        const monthlySalesHistory = await window.electronAPI.getMonthlySalesHistory(selectedYear, selectedMonth);
        
        if (monthlySalesHistory.length === 0) {
            showToast('No monthly sales data to export', 'warning');
            return;
        }
        
        // Create CSV content
        const headers = ['Date', 'Daily Sales (Rs)', 'Items Sold', 'Bills Count'];
        const csvContent = [
            headers.join(','),
            ...monthlySalesHistory.map(dailySale => [
                dailySale.sale_date,
                parseFloat(dailySale.daily_total).toFixed(2),
                dailySale.daily_items,
                dailySale.daily_bills
            ].join(','))
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const monthName = monthSelect.options[monthSelect.selectedIndex].text;
        a.href = url;
        a.download = `monthly-sales-${monthName}-${selectedYear}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Monthly sales exported successfully', 'success');
        
    } catch (error) {
        console.error('Error exporting monthly sales:', error);
        showToast('Error exporting monthly sales', 'error');
    } finally {
        hideLoading();
    }
}

// Print Bill Function
async function printBill(saleAlreadyRecorded = false) {
    if (billItems.length === 0) {
        showToast('No items in bill to print', 'error');
        return;
    }

    try {
        showLoading();

        // Only deduct inventory if sale hasn't been recorded yet
        if (!saleAlreadyRecorded) {
            // Deduct quantities from product stock
            for (const item of billItems) {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    const newQuantity = product.quantity - item.quantity;
                    await window.electronAPI.updateProduct(item.productId, {
                        name: product.name,
                        price: product.price,
                        quantity: Math.max(0, newQuantity) // Ensure quantity doesn't go negative
                    });

                    // Update local products array
                    product.quantity = Math.max(0, newQuantity);
                }
            }
        }

        hideLoading();

    } catch (error) {
        console.error('Error updating inventory:', error);
        showToast('Error updating inventory, but continuing with print', 'warning');
        hideLoading();
    }

    // Only record sale if it hasn't been recorded yet
    if (!saleAlreadyRecorded) {
        // Generate bill ID and record the sale
        const billId = 'BILL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        try {
            await window.electronAPI.recordSale(billId, billItems);
            console.log('Sale recorded successfully');
        } catch (error) {
            console.error('Error recording sale:', error);
            // Don't show error to user as print should continue
        }
    }

//     const currentDate = new Date();
//     const dateStr = currentDate.toLocaleDateString('en-PK');
//     const timeStr = currentDate.toLocaleTimeString('en-PK');

//     let grandTotal = 0;
//     let totalItems = 0;

//     // Calculate totals
//     billItems.forEach(item => {
//         grandTotal += item.total;
//         totalItems += item.quantity;
//     });

//     // Create file name from product names and amount
//     const productNames = billItems.map(item => item.productName).join('_');
//     const fileName = `${productNames} - ${grandTotal.toFixed(2)}`;

//     // Create text-based slip content
//     let slipContent = `================================
//       BABU KARYANA STORE
//      Your General Store
// ================================

// Date: ${dateStr}
// Time: ${timeStr}
// Bill #: ${Date.now()}

// --------------------------------
// Item      Qty   Price      Total
// --------------------------------`;

//     // Add items to slip content
//     billItems.forEach(item => {
//         const name = item.productName.padEnd(14, ' ');
//         const qty = item.quantity.toString().padStart(3, ' ');
//         const price = `Rs ${item.price.toFixed(2)}`.padStart(8, ' ');
//         const total = `Rs ${item.total.toFixed(2)}`.padStart(9, ' ');
//         slipContent += `\n${name}  ${qty}  ${price}  ${total}`;
//     });

//     slipContent += `
// --------------------------------
// Total Items: ${totalItems}
// Grand Total: Rs ${grandTotal.toFixed(2)}

// ================================
//     Thank you for shopping!
//        Visit Again
// ================================`;

//     // Save slip as TXT file and open it for printing
//     try {
//         const result = await window.electronAPI.saveSlipTxt({
//             fileName: fileName,
//             content: slipContent
//         });

//         if (result.success) {
//             showToast(`Slip saved! Press Ctrl+P to print.`, 'success');
//         } else {
//             showToast('Error saving slip.', 'error');
//         }
//     } catch (error) {
//         console.error('Error saving slip:', error);
//         showToast('Error saving slip.', 'error');
//     }

//     // Clear the bill after successful print
//     billItems = [];
//     billCounter = 0;
//     updateBillDisplay();

//     // Refresh dashboard to show updated stock alerts and sales
//     if (dashboardPage.classList.contains('active')) {
//         loadDashboard();
//     }
// }
const currentDate = new Date();
const dateStr = currentDate.toLocaleDateString('en-PK');
const timeStr = currentDate.toLocaleTimeString('en-PK');

let grandTotal = 0;
let totalItems = 0;

// Calculate totals
billItems.forEach(item => {
    grandTotal += item.total;
    totalItems += item.quantity;
});

// Create file name from product names and amount
const productNames = billItems.map(item => item.productName).join('_');
const fileName = `${productNames} - ${grandTotal.toFixed(2)}`;

/* ================= OLD SLIP DESIGN (COMMENTED) =================
let slipContent = `================================
      BABU KARYANA STORE
     Your General Store
================================

Date: ${dateStr}
Time: ${timeStr}
Bill #: ${Date.now()}

--------------------------------
Item      Qty   Price      Total
--------------------------------`;

billItems.forEach(item => {
    const name = item.productName.padEnd(14, ' ');
    const qty = item.quantity.toString().padStart(3, ' ');
    const price = `Rs ${item.price.toFixed(2)}`.padStart(8, ' ');
    const total = `Rs ${item.total.toFixed(2)}`.padStart(9, ' ');
    slipContent += `\n${name}  ${qty}  ${price}  ${total}`;
});

slipContent += `
--------------------------------
Total Items: ${totalItems}
Grand Total: Rs ${grandTotal.toFixed(2)}

================================
    Thank you for shopping!
       Visit Again
================================`;
============================================================== */


// ================= NEW 80mm CENTERED SLIP DESIGN =================

// 80mm paper ≈ 42 characters width
const LINE_WIDTH = 42;

function centerText(text) {
    const spaces = Math.max(0, Math.floor((LINE_WIDTH - text.length) / 2));
    return ' '.repeat(spaces) + text;
}

let slipContent = "";
slipContent += "                                     \n";
slipContent += "                                     \n";
slipContent += "=====================================\n";
slipContent += "                                     \n";
slipContent += centerText("BABU KARYANA STORE") + "\n";
slipContent += "=====================================\n";
slipContent += "=====================================\n";
slipContent += centerText(`Date: ${dateStr}`) + "\n";
slipContent += centerText(`Time: ${timeStr}`) + "\n";
slipContent += centerText(`Bill #: ${Date.now()}`) + "\n";
slipContent += "-------------------------------------\n";
slipContent += "Item      Qty   Price      Total\n";
slipContent += "-------------------------------------\n";

// Add items
// ===== ITEMS (COMPACT SPACING LIKE 2ND IMAGE) =====
billItems.forEach(item => {
    const name  = item.productName.padEnd(8, ' ');   // was 14 → now 8 (less gap)
    // const qty   = item.quantity.toString().padStart(3, ' ');
    const qty   = item.quantity.toString().padStart(2, ' ');
    // const price = `${item.price.toFixed(2)}`.padStart(8, ' ');
    const price = `${item.price.toFixed(2)}`.padStart(7, ' ');
    // const total = `${item.total.toFixed(2)}`.padStart(9, ' ');
    const total = `${item.total.toFixed(2)}`.padStart(9, ' ');

    slipContent += `${name}  ${qty}  ${price}  ${total}\n`;
});
slipContent += "-------------------------------------\n";
slipContent += `Total Items: ${totalItems}\n`;
slipContent += "=====================================\n";
slipContent += `GRAND TOTAL: Rs ${grandTotal.toFixed(2)}\n`;
slipContent += "=====================================\n";
slipContent += "=====================================\n";
slipContent += centerText("Thank you for shopping!") + "\n";
slipContent += centerText("Visit Again") + "\n";
slipContent += "                                     \n";
slipContent += "=====================================\n";
slipContent += "                                     \n";
slipContent += "                                     \n";
slipContent += "                                     \n";


// Save slip as TXT file and open it for printing
try {
    const result = await window.electronAPI.saveSlipTxt({
        fileName: fileName,
        content: slipContent
    });

    if (result.success) {
        showToast(`Slip saved! Press Ctrl+P to print.`, 'success');
    } else {
        showToast('Error saving slip.', 'error');
    }
} catch (error) {
    console.error('Error saving slip:', error);
    showToast('Error saving slip.', 'error');
}

// Clear the bill after successful print
billItems = [];
billCounter = 0;
updateBillDisplay();

// Refresh dashboard to show updated stock alerts and sales
if (dashboardPage.classList.contains('active')) {
    loadDashboard();
} }

// Export Function
async function exportCustomers() {
    try {
        showLoading();
        const customers = await window.electronAPI.getCustomers();
        
        // Create CSV content
        const headers = ['ID', 'Name', 'Phone', 'Created Date'];
        const csvContent = [
            headers.join(','),
            ...customers.map(customer => [
                customer.id,
                `"${customer.name}"`,
                `"${customer.phone}"`,
                `"${formatDate(customer.created_at)}"`
            ].join(','))
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Customers exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting customers:', error);
        showToast('Error exporting customers', 'error');
    } finally {
        hideLoading();
    }
}

// Utility Functions
function showModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

function showLoading() {
    loadingOverlay.classList.add('show');
}

function hideLoading() {
    loadingOverlay.classList.remove('show');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="${icons[type]} toast-icon"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        if (e.target === customerModal) {
            closeCustomerModal();
        } else if (e.target === productModal) {
            closeProductModal();
        } else if (e.target === scannerModal) {
            closeScannerModal();

        } else if (e.target === deleteModal) {
            closeDeleteModal();
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key closes modals
    if (e.key === 'Escape') {
        if (customerModal.classList.contains('show')) {
            closeCustomerModal();
        } else if (productModal.classList.contains('show')) {
            closeProductModal();
        } else if (scannerModal.classList.contains('show')) {
            closeScannerModal();

        } else if (deleteModal.classList.contains('show')) {
            closeDeleteModal();
        }
    }

    // Ctrl+N for new customer/product
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        // Check which page is currently active
        if (productsPage.classList.contains('active')) {
            showAddProductModal();
        } else if (billingPage.classList.contains('active')) {
            openScanner();
        } else {
            showAddCustomerModal();
        }
    }
});

// Authentication Functions
async function loadCurrentUser() {
    try {
        currentUser = await window.electronAPI.getCurrentUser();
        if (currentUser) {
            // Update UI with user info
            const userName = document.getElementById('user-name');
            const sidebarUsername = document.getElementById('sidebar-username');
            
            if (userName) {
                userName.textContent = currentUser.full_name || currentUser.username;
            }
            if (sidebarUsername) {
                sidebarUsername.textContent = `@${currentUser.username}`;
            }
        }
    } catch (error) {
        console.error('Error loading current user:', error);
    }
}

async function handleLogout() {
    try {
        showLoading();
        const result = await window.electronAPI.logout();
        if (result.success) {
            showToast('Logged out successfully', 'success');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        showToast('Error during logout', 'error');
    } finally {
        hideLoading();
    }
}

// Profile Functions
async function loadProfile() {
    if (!currentUser) {
        await loadCurrentUser();
    }
    
    if (currentUser) {
        // Update profile header
        const profileFullName = document.getElementById('profile-full-name');
        const profileUsername = document.getElementById('profile-username');
        
        if (profileFullName) profileFullName.textContent = currentUser.full_name || 'No name set';
        if (profileUsername) profileUsername.textContent = `@${currentUser.username}`;
        
        // Populate form
        const fullNameInput = document.getElementById('profile-fullname');
        
        if (fullNameInput) fullNameInput.value = currentUser.full_name || '';
        
        // Store original data for change tracking
        originalProfileData = {
            fullName: currentUser.full_name || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        };
        
        // Set up change tracking
        setupProfileChangeTracking();
        
        // Initially disable the update button
        updateProfileButtonState();
    }
}

function setupProfileChangeTracking() {
    const fullNameInput = document.getElementById('profile-fullname');
    const currentPasswordInput = document.getElementById('profile-current-password');
    const newPasswordInput = document.getElementById('profile-new-password');
    const confirmPasswordInput = document.getElementById('profile-confirm-password');
    
    const inputs = [fullNameInput, currentPasswordInput, newPasswordInput, confirmPasswordInput];
    
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', updateProfileButtonState);
        }
    });
}

function updateProfileButtonState() {
    const fullNameInput = document.getElementById('profile-fullname');
    const currentPasswordInput = document.getElementById('profile-current-password');
    const newPasswordInput = document.getElementById('profile-new-password');
    const confirmPasswordInput = document.getElementById('profile-confirm-password');
    const updateButton = profileForm.querySelector('button[type="submit"]');
    
    if (!updateButton) return;
    
    // Get current values
    const currentData = {
        fullName: fullNameInput ? fullNameInput.value.trim() : '',
        currentPassword: currentPasswordInput ? currentPasswordInput.value : '',
        newPassword: newPasswordInput ? newPasswordInput.value : '',
        confirmPassword: confirmPasswordInput ? confirmPasswordInput.value : ''
    };
    
    // Check if anything has changed
    const hasChanges = currentData.fullName !== originalProfileData.fullName ||
                      currentData.newPassword !== originalProfileData.newPassword ||
                      currentData.confirmPassword !== originalProfileData.confirmPassword ||
                      (currentData.newPassword && currentData.currentPassword !== originalProfileData.currentPassword);
    
    // Enable/disable button based on changes
    updateButton.disabled = !hasChanges;
    updateButton.style.opacity = hasChanges ? '1' : '0.6';
    updateButton.style.cursor = hasChanges ? 'pointer' : 'not-allowed';
}

async function handleProfileSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(profileForm);
    const profileData = {
        fullName: formData.get('fullName').trim(),
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
        confirmPassword: formData.get('confirmPassword')
    };
    
    // Validate input
    if (!profileData.fullName) {
        showToast('Please fill in your full name', 'error');
        return;
    }
    
    // If changing password, validate
    if (profileData.newPassword || profileData.currentPassword) {
        if (!profileData.currentPassword) {
            showToast('Please enter your current password to change it', 'error');
            return;
        }
        
        if (!profileData.newPassword) {
            showToast('Please enter a new password', 'error');
            return;
        }
        
        if (profileData.newPassword.length < 6) {
            showToast('New password must be at least 6 characters long', 'error');
            return;
        }
        
        if (profileData.newPassword !== profileData.confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }
    }
    
    try {
        showLoading();
        
        const updateData = {
            fullName: profileData.fullName
        };
        
        // Only include password if changing
        if (profileData.newPassword) {
            updateData.password = profileData.newPassword;
            updateData.currentPassword = profileData.currentPassword;
        }
        
        const result = await window.electronAPI.updateProfile(updateData);
        
        if (result.success) {
            showToast('Profile updated successfully', 'success');
            
            // Refresh current user data from database
            await loadCurrentUser();
            
            // Reload the profile page with fresh data
            await loadProfile();
            
            // Clear password fields
            document.getElementById('profile-current-password').value = '';
            document.getElementById('profile-new-password').value = '';
            document.getElementById('profile-confirm-password').value = '';
        } else {
            showToast(result.error || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('An unexpected error occurred', 'error');
    } finally {
        hideLoading();
    }
}



function toggleProfilePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}
