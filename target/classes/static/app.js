// State variables
let accounts = [];
let activeAccountNumber = null;
let activeCustomer = null;
let currentUserRole = null; // 'ADMIN' or 'CUSTOMER'
let loggedInUser = null;
let analyticsChart = null;

// DOM Elements
const loginContainer = document.getElementById('login-container');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const navActions = document.getElementById('nav-actions');
const navGuest = document.getElementById('nav-guest');
const loggedUserName = document.getElementById('logged-user-name');
const btnLogout = document.getElementById('btn-logout');

const adminSidebar = document.getElementById('admin-sidebar');
const adminSearchBox = document.getElementById('admin-search-box');
const accountsListEl = document.getElementById('accounts-list');
const defaultPanelViewEl = document.getElementById('default-panel-view');
const openAccountPanelEl = document.getElementById('open-account-panel');
const activeAccountDashboardEl = document.getElementById('active-account-dashboard');

const btnShowOpenForm = document.getElementById('btn-show-open-form');
const btnWelcomeOpenAccount = document.getElementById('btn-welcome-open-account');
const btnCloseOpenForm = document.getElementById('btn-close-open-form');

const openAccountForm = document.getElementById('open-account-form');
const depositForm = document.getElementById('deposit-form');
const withdrawForm = document.getElementById('withdraw-form');
const transferForm = document.getElementById('transfer-form');

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search-btn');
const statementRefreshBtn = document.getElementById('statement-refresh-btn');
const btnDownloadCsv = document.getElementById('btn-download-csv');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// Event Listeners Configuration
function setupEventListeners() {
    // Handle Login
    loginForm.addEventListener('submit', handleLogin);

    // Handle Logout
    btnLogout.addEventListener('click', handleLogout);

    // Show open account form (Admin only)
    const showForm = () => {
        defaultPanelViewEl.style.display = 'none';
        activeAccountDashboardEl.style.display = 'none';
        openAccountPanelEl.style.display = 'block';
    };
    btnShowOpenForm.addEventListener('click', showForm);
    btnWelcomeOpenAccount.addEventListener('click', showForm);

    // Hide open account form
    btnCloseOpenForm.addEventListener('click', () => {
        openAccountPanelEl.style.display = 'none';
        if (activeAccountNumber) {
            activeAccountDashboardEl.style.display = 'block';
        } else {
            defaultPanelViewEl.style.display = 'block';
        }
    });

    // Form Submissions for Transactions
    openAccountForm.addEventListener('submit', handleOpenAccount);
    depositForm.addEventListener('submit', handleDeposit);
    withdrawForm.addEventListener('submit', handleWithdraw);
    transferForm.addEventListener('submit', handleTransfer);

    // Search (Admin only)
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        loadAccounts();
    });

    // Statement Refresh
    statementRefreshBtn.addEventListener('click', () => {
        if (activeAccountNumber) loadStatement(activeAccountNumber);
    });
}

// Handle Login Form Submission
async function handleLogin(e) {
    e.preventDefault();
    const accountNumber = document.getElementById('login-account').value.trim();
    const email = document.getElementById('login-email').value.trim();

    // Check for hardcoded Admin credentials
    if (accountNumber === 'ADMIN' && email === 'admin@bank.com') {
        currentUserRole = 'ADMIN';
        loggedInUser = { name: 'Administrator' };
        enterApp();
        return;
    }

    // Call REST Login API for customer
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountNumber, email })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');

        currentUserRole = 'CUSTOMER';
        loggedInUser = data.customer;
        activeAccountNumber = data.accountNumber;
        
        enterApp();
    } catch (error) {
        alert('Authentication Error: ' + error.message);
    }
}

// Transitions to Dashboard after Login
function enterApp() {
    loginContainer.style.display = 'none';
    mainApp.style.display = 'grid';
    navGuest.style.display = 'none';
    navActions.style.display = 'flex';
    loggedUserName.innerText = loggedInUser.name;

    if (currentUserRole === 'ADMIN') {
        mainApp.classList.remove('customer-mode');
        adminSidebar.style.display = 'flex';
        adminSearchBox.style.display = 'flex';
        defaultPanelViewEl.style.display = 'block';
        activeAccountDashboardEl.style.display = 'none';
        loadAccounts();
    } else { // CUSTOMER Mode
        mainApp.classList.add('customer-mode');
        adminSidebar.style.display = 'none';
        adminSearchBox.style.display = 'none';
        defaultPanelViewEl.style.display = 'none';
        activeAccountDashboardEl.style.display = 'block';
        
        // Single Account view for customer
        loadCustomerAccountInfo(activeAccountNumber);
    }
}

// Handle Logout
function handleLogout() {
    currentUserRole = null;
    loggedInUser = null;
    activeAccountNumber = null;
    activeCustomer = null;
    if (analyticsChart) {
        analyticsChart.destroy();
        analyticsChart = null;
    }

    loginForm.reset();
    loginContainer.style.display = 'flex';
    mainApp.style.display = 'none';
    navActions.style.display = 'none';
    navGuest.style.display = 'flex';
}

// Fetch single account details for customer
async function loadCustomerAccountInfo(accountNumber) {
    try {
        const response = await fetch('/api/accounts');
        if (!response.ok) throw new Error('Failed to load accounts');
        accounts = await response.json();

        // Load active customer details and dashboard values
        selectAccount(accountNumber);
    } catch (error) {
        alert('Error loading account: ' + error.message);
    }
}

// Fetch and Render Accounts List (Admin only)
async function loadAccounts(filterName = '') {
    try {
        let url = '/api/accounts';
        if (filterName.trim().length > 0) {
            url = `/api/accounts/search?name=${encodeURIComponent(filterName)}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load accounts');
        accounts = await response.json();
        
        renderAccountsList();
    } catch (error) {
        console.error(error);
        accountsListEl.innerHTML = `<div class="empty-state">Error loading accounts: ${error.message}</div>`;
    }
}

// Render the accounts sidebar
async function renderAccountsList() {
    if (accounts.length === 0) {
        accountsListEl.innerHTML = '<div class="empty-state">No accounts found.</div>';
        return;
    }

    accountsListEl.innerHTML = '';
    
    // For each account, fetch customer details to display name
    for (const account of accounts) {
        const itemEl = document.createElement('div');
        itemEl.className = `account-item-card ${activeAccountNumber === account.accountNumber ? 'active' : ''}`;
        itemEl.dataset.number = account.accountNumber;
        
        // Fetch customer name
        let name = 'Loading...';
        try {
            const custResponse = await fetch(`/api/accounts/${account.accountNumber}/customer`);
            if (custResponse.ok) {
                const customerObj = await custResponse.json();
                name = customerObj.name;
            } else {
                name = 'N/A';
            }
        } catch (e) {
            name = 'Error';
        }

        itemEl.innerHTML = `
            <div class="acc-header">
                <span class="acc-number">${account.accountNumber}</span>
                <span class="acc-badge ${account.accountType.toLowerCase()}">${account.accountType}</span>
            </div>
            <div class="cust-name">${name}</div>
            <div class="acc-balance">$${account.balance.toFixed(2)}</div>
        `;

        itemEl.addEventListener('click', () => selectAccount(account.accountNumber));
        accountsListEl.appendChild(itemEl);
    }
}

// Select account and show dashboard values
async function selectAccount(accountNumber) {
    activeAccountNumber = accountNumber;
    
    // Highlight in sidebar (if admin)
    if (currentUserRole === 'ADMIN') {
        document.querySelectorAll('.account-item-card').forEach(el => {
            el.classList.toggle('active', el.dataset.number === accountNumber);
        });
    }

    try {
        // Fetch customer details
        const custResponse = await fetch(`/api/accounts/${accountNumber}/customer`);
        if (!custResponse.ok) throw new Error('Customer details not found');
        activeCustomer = await custResponse.json();

        // Find account object in local state
        const account = accounts.find(a => a.accountNumber === accountNumber);
        if (!account) return;

        // Render dashboard values
        document.getElementById('active-cust-name').innerText = activeCustomer.name;
        document.getElementById('active-cust-email').innerText = activeCustomer.email;
        document.getElementById('active-acc-number').innerText = account.accountNumber;
        document.getElementById('active-balance').innerText = `$${account.balance.toFixed(2)}`;
        
        const badge = document.getElementById('active-acc-badge');
        badge.innerText = account.accountType;
        badge.className = `account-badge ${account.accountType.toLowerCase()}`;

        // Reset quick forms
        depositForm.reset();
        withdrawForm.reset();
        transferForm.reset();

        // Configure CSV Download Link
        btnDownloadCsv.setAttribute('href', `/api/accounts/${accountNumber}/statement/download`);

        // Load statement
        loadStatement(accountNumber);

        // Switch panels (if admin)
        if (currentUserRole === 'ADMIN') {
            defaultPanelViewEl.style.display = 'none';
            openAccountPanelEl.style.display = 'none';
            activeAccountDashboardEl.style.display = 'block';
        }

    } catch (error) {
        alert('Error loading account dashboard: ' + error.message);
    }
}

// Fetch and render transaction statement + update expense chart
async function loadStatement(accountNumber) {
    const rowsEl = document.getElementById('statement-rows');
    rowsEl.innerHTML = '<tr><td colspan="4" class="empty-table">Loading transaction history...</td></tr>';

    try {
        const response = await fetch(`/api/accounts/${accountNumber}/statement`);
        if (!response.ok) throw new Error('Failed to fetch statement');
        const transactions = await response.json();

        // Render the Analytics Chart
        renderAnalyticsChart(transactions);

        if (transactions.length === 0) {
            rowsEl.innerHTML = '<tr><td colspan="4" class="empty-table">No transactions recorded.</td></tr>';
            return;
        }

        rowsEl.innerHTML = '';
        // Sort transactions descending by timestamp (newest first)
        transactions.sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp));

        transactions.forEach(tx => {
            const tr = document.createElement('tr');
            const dateStr = new Date(tx.timeStamp).toLocaleString();
            
            let typeBadge = '';
            let amountClass = '';
            let amountSign = '';
            
            switch (tx.type) {
                case 'DEPOSIT':
                    typeBadge = '<span class="tx-type-badge deposit">Deposit</span>';
                    amountClass = 'credit';
                    amountSign = '+';
                    break;
                case 'WITHDRAW':
                    typeBadge = '<span class="tx-type-badge withdraw">Withdraw</span>';
                    amountClass = 'debit';
                    amountSign = '-';
                    break;
                case 'TRANSFER_OUT':
                    typeBadge = '<span class="tx-type-badge transfer_out">Tx Out</span>';
                    amountClass = 'debit';
                    amountSign = '-';
                    break;
                case 'TRANSFER_IN':
                    typeBadge = '<span class="tx-type-badge transfer_in">Tx In</span>';
                    amountClass = 'credit';
                    amountSign = '+';
                    break;
            }

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${typeBadge}</td>
                <td class="tx-amount ${amountClass}">${amountSign}$${tx.amount.toFixed(2)}</td>
                <td>${tx.note}</td>
            `;
            rowsEl.appendChild(tr);
        });

    } catch (error) {
        rowsEl.innerHTML = `<tr><td colspan="4" class="empty-table text-red">Error: ${error.message}</td></tr>`;
    }
}

// Generate analytics chart using Chart.js
function renderAnalyticsChart(transactions) {
    let income = 0;
    let expense = 0;

    transactions.forEach(tx => {
        if (tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN') {
            income += tx.amount;
        } else if (tx.type === 'WITHDRAW' || tx.type === 'TRANSFER_OUT') {
            expense += tx.amount;
        }
    });

    const ctx = document.getElementById('analytics-chart').getContext('2d');
    
    // Destroy previous instance to re-render fresh data
    if (analyticsChart) {
        analyticsChart.destroy();
    }

    // Default view if no transactions exist
    if (income === 0 && expense === 0) {
        income = 1; // Default dummy visual values
        expense = 0;
    }

    analyticsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Income (Credits)', 'Expenses (Debits)'],
            datasets: [{
                data: [income, expense],
                backgroundColor: ['#10B981', '#EF4444'],
                borderColor: '#FFFFFF',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: { family: 'Inter', size: 11 }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// Action: Open Account (Admin only)
async function handleOpenAccount(e) {
    e.preventDefault();
    
    const name = document.getElementById('new-cust-name').value.trim();
    const email = document.getElementById('new-cust-email').value.trim();
    const type = document.getElementById('new-acc-type').value;
    const initialDepositVal = document.getElementById('new-initial-deposit').value;
    const initialDeposit = initialDepositVal ? parseFloat(initialDepositVal) : 0;

    try {
        const response = await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, type, initialDeposit })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Server error');

        alert(`Success! Account Opened.\nAccount Number: ${data.accountNumber}`);
        openAccountForm.reset();
        
        // Reload list and select the newly created account
        await loadAccounts();
        selectAccount(data.accountNumber);

    } catch (error) {
        alert('Failed to open account: ' + error.message);
    }
}

// Action: Deposit
async function handleDeposit(e) {
    e.preventDefault();
    if (!activeAccountNumber) return;

    const amount = parseFloat(document.getElementById('deposit-amount').value);
    const note = document.getElementById('deposit-note').value.trim();

    try {
        const response = await fetch(`/api/accounts/${activeAccountNumber}/deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, note })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Server error');

        // Reload data
        if (currentUserRole === 'ADMIN') {
            await loadAccounts();
        } else {
            await loadCustomerAccountInfo(activeAccountNumber);
        }
        selectAccount(activeAccountNumber);
        alert('Deposit successful!');
    } catch (error) {
        alert('Deposit failed: ' + error.message);
    }
}

// Action: Withdraw
async function handleWithdraw(e) {
    e.preventDefault();
    if (!activeAccountNumber) return;

    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const note = document.getElementById('withdraw-note').value.trim();

    try {
        const response = await fetch(`/api/accounts/${activeAccountNumber}/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, note })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Server error');

        if (currentUserRole === 'ADMIN') {
            await loadAccounts();
        } else {
            await loadCustomerAccountInfo(activeAccountNumber);
        }
        selectAccount(activeAccountNumber);
        alert('Withdrawal successful!');
    } catch (error) {
        alert('Withdrawal failed: ' + error.message);
    }
}

// Action: Transfer
async function handleTransfer(e) {
    e.preventDefault();
    if (!activeAccountNumber) return;

    const destAccount = document.getElementById('transfer-dest').value.trim();
    const amount = parseFloat(document.getElementById('transfer-amount').value);
    const note = document.getElementById('transfer-note').value.trim();

    try {
        const response = await fetch('/api/accounts/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceAccount: activeAccountNumber,
                destAccount,
                amount,
                note
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Server error');

        if (currentUserRole === 'ADMIN') {
            await loadAccounts();
        } else {
            await loadCustomerAccountInfo(activeAccountNumber);
        }
        selectAccount(activeAccountNumber);
        alert('Transfer completed successfully!');
    } catch (error) {
        alert('Transfer failed: ' + error.message);
    }
}

// Action: Search Customer Accounts (Admin only)
function handleSearch() {
    const query = searchInput.value.trim();
    if (query.length > 0) {
        clearSearchBtn.style.display = 'inline-block';
        loadAccounts(query);
    } else {
        clearSearchBtn.style.display = 'none';
        loadAccounts();
    }
}
