// DOM Elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authLoading = document.getElementById('auth-loading');
const toastContainer = document.getElementById('toast-container');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    showLoginForm(); // Start with login form
    
    // Ensure login form is active by default
    setTimeout(() => {
        showLoginForm();
    }, 100);
});

// Event Listeners
function setupEventListeners() {
    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    
    // Remove real-time validation - only validate on form submission
    
    // Enter key handling
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const activeForm = document.querySelector('.auth-form.active');
            if (activeForm) {
                activeForm.querySelector('button[type="submit"]').click();
            }
        }
    });
}

// Form Switching
function showLoginForm() {
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    
    // Update header
    document.querySelector('.auth-subtitle').textContent = 'Welcome back! Please sign in to your account.';
    
    // Clear forms
    loginForm.reset();
    clearValidation();
}

function showSignupForm() {
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
    
    // Update header
    document.querySelector('.auth-subtitle').textContent = 'Create a new account to get started.';
    
    // Clear forms
    signupForm.reset();
    clearValidation();
}

// Authentication Handlers
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(loginForm);
    const credentials = {
        username: formData.get('username').trim(),
        password: formData.get('password')
    };
    
    // Validate input
    if (!credentials.username || !credentials.password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    try {
        showLoading();
        const result = await window.electronAPI.login(credentials);
        
        if (result.success) {
            showToast('Login successful! Opening application...', 'success');
            
            // Wait a moment then open main window
            setTimeout(async () => {
                await window.electronAPI.openMainWindow();
            }, 1000);
        } else {
            showToast(result.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('An unexpected error occurred', 'error');
    } finally {
        hideLoading();
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const formData = new FormData(signupForm);
    const userData = {
        fullName: formData.get('fullName').trim(),
        username: formData.get('username').trim(),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
    };
    
    // Validate input
    if (!validateSignupData(userData)) {
        return;
    }
    
    try {
        showLoading();
        const result = await window.electronAPI.register({
            fullName: userData.fullName,
            username: userData.username,
            password: userData.password
        });
        
        if (result.success) {
            showToast('Account created successfully! You can now sign in.', 'success');
            
            // Switch to login form and pre-fill username
            setTimeout(() => {
                showLoginForm();
                document.getElementById('login-username').value = userData.username;
                document.getElementById('login-password').focus();
            }, 1500);
        } else {
            showToast(result.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('An unexpected error occurred', 'error');
    } finally {
        hideLoading();
    }
}

// Validation Functions
function validateSignupData(userData) {
    // Check required fields
    if (!userData.fullName || !userData.username || !userData.password) {
        showToast('Please fill in all fields', 'error');
        return false;
    }
    
    // Validate username
    if (!validateUsername(userData.username)) {
        return false;
    }
    
    // Validate password length
    if (userData.password.length < 6) {
        showToast('Password must be at least 6 characters long', 'error');
        return false;
    }
    
    // Validate password match
    if (userData.password !== userData.confirmPassword) {
        showToast('Passwords do not match', 'error');
        return false;
    }
    
    return true;
}

function validateUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    
    if (!usernameRegex.test(username)) {
        if (username.length < 3) {
            showToast('Username must be at least 3 characters long', 'error');
        } else if (username.length > 20) {
            showToast('Username must be no more than 20 characters long', 'error');
        } else {
            showToast('Username can only contain letters, numbers, and underscores', 'error');
        }
        return false;
    }
    
    return true;
}

function validatePasswordMatch() {
    // Only validate on form submission, not during typing
    return true;
}

function clearValidation() {
    // Reset all custom validity
    document.querySelectorAll('input').forEach(input => {
        input.setCustomValidity('');
        input.style.borderColor = '#e9ecef';
    });
}

// Password Toggle
function togglePassword(inputId) {
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

// Loading Functions
function showLoading() {
    authLoading.classList.add('show');
}

function hideLoading() {
    authLoading.classList.remove('show');
}

// Toast Notifications
function showToast(message, type = 'success') {
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

// Form Enhancement
document.addEventListener('DOMContentLoaded', () => {
    
    // Add ripple effect to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255,255,255,0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .form-group.focused label {
        color: #667eea;
    }
    
    .form-group.focused input {
        border-color: #667eea;
    }
`;
document.head.appendChild(style);
