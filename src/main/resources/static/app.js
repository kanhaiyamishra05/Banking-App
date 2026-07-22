// State variables
let accounts = [];
let activeAccountNumber = null;
let activeCustomer = null;

// DOM Elements
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

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadAccounts();
    setupEventListeners();
});

// Event Listeners Configuration
function setupEventListeners() {
    // Show open account form
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

    // Form Submissions
    openAccountForm.addEventListener('submit', handleOpenAccount);
    depositForm.addEventListener('submit', handleDeposit);
    withdrawForm.addEventListener('submit', handleWithdraw);
    transferForm.addEventListener('submit', handleTransfer);

    // Search
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

// Fetch and Render Accounts List
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
        
        // Fetch customer name (cached or from server)
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

// Select account and show dashboard
async function selectAccount(accountNumber) {
    activeAccountNumber = accountNumber;
    
    // Highlight in sidebar
    document.querySelectorAll('.account-item-card').forEach(el => {
        el.classList.toggle('active', el.dataset.number === accountNumber);
    });

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

        // Load statement
        loadStatement(accountNumber);

        // Switch panels
        defaultPanelViewEl.style.display = 'none';
        openAccountPanelEl.style.display = 'none';
        activeAccountDashboardEl.style.display = 'block';

    } catch (error) {
        alert('Error loading account dashboard: ' + error.message);
    }
}

// Fetch and render transaction statement
async function loadStatement(accountNumber) {
    const rowsEl = document.getElementById('statement-rows');
    rowsEl.innerHTML = '<tr><td colspan="4" class="empty-table">Loading transaction history...</td></tr>';

    try {
        const response = await fetch(`/api/accounts/${accountNumber}/statement`);
        if (!response.ok) throw new Error('Failed to fetch statement');
        const transactions = await response.json();

        if (transactions.length === 0) {
            rowsEl.innerHTML = '<tr><td colspan="4" class="empty-table">No transactions recorded.</td></tr>';
            return;
        }

        rowsEl.innerHTML = '';
        // Sort transactions descending by timestamp (newest first)
        transactions.sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp));

        transactions.forEach(tx => {
            const tr = document.createElement('tr');
            
            // Format Timestamp
            const dateStr = new Date(tx.timeStamp).toLocaleString();
            
            // Format Type Badge and Amount Color
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

// Action: Open Account
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

        // Reload accounts list state
        await loadAccounts();
        // Refresh active dashboard
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

        await loadAccounts();
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

        await loadAccounts();
        selectAccount(activeAccountNumber);
        alert('Transfer completed successfully!');
    } catch (error) {
        alert('Transfer failed: ' + error.message);
    }
}

// Action: Search Customer Accounts
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
