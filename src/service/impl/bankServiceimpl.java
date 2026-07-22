package service.impl;

import domain.Account;
import domain.Customer;
import domain.Transaction;
import domain.Type;
import repository.AccountRepository;
import repository.CustomerRepository;
import repository.TransactionRepository;
import service.BankService;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Set;

@Service
public class bankServiceimpl implements BankService {

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final TransactionRepository transactionRepository;

    @Autowired
    public bankServiceimpl(AccountRepository accountRepository,
                           CustomerRepository customerRepository,
                           TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public String openAccount(String name, String email, String accountType) {
        String customerId = UUID.randomUUID().toString();
        Customer customer = new Customer(name, customerId, email);
        customerRepository.save(customer);

        String accountNumber = getAccountNumber();
        Account account = new Account(accountNumber, accountType, 0.0, customerId);
        accountRepository.save(account);

        return accountNumber;
    }

    @Override
    public List<Account> listAccounts() {
        return accountRepository.findAll().stream()
                .sorted(Comparator.comparing(Account::getAccountNumber))
                .collect(Collectors.toList());
    }

    @Override
    public void deposit(String accountNumber, double amount, String note) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Deposit amount must be greater than zero.");
        }
        Account account = accountRepository.findByNumber(accountNumber)
                .orElseThrow(() -> new IllegalArgumentException("Account not found: " + accountNumber));
        
        account.setBalance(account.getBalance() + amount);
        accountRepository.save(account);

        Transaction transaction = new Transaction(
                UUID.randomUUID().toString(),
                Type.DEPOSIT,
                accountNumber,
                amount,
                LocalDateTime.now(),
                note
        );
        transactionRepository.save(transaction);
    }

    @Override
    public void withdraw(String accountNumber, double amount, String note) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be greater than zero.");
        }
        Account account = accountRepository.findByNumber(accountNumber)
                .orElseThrow(() -> new IllegalArgumentException("Account not found: " + accountNumber));

        if (account.getBalance() < amount) {
            throw new IllegalArgumentException("Insufficient balance. Available: " + account.getBalance());
        }

        account.setBalance(account.getBalance() - amount);
        accountRepository.save(account);

        Transaction transaction = new Transaction(
                UUID.randomUUID().toString(),
                Type.WITHDRAW,
                accountNumber,
                amount,
                LocalDateTime.now(),
                note
        );
        transactionRepository.save(transaction);
    }

    @Override
    public void transfer(String sourceAccountNumber, String destAccountNumber, double amount, String note) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Transfer amount must be greater than zero.");
        }
        if (sourceAccountNumber.equals(destAccountNumber)) {
            throw new IllegalArgumentException("Source and destination accounts cannot be the same.");
        }

        Account sourceAccount = accountRepository.findByNumber(sourceAccountNumber)
                .orElseThrow(() -> new IllegalArgumentException("Source account not found: " + sourceAccountNumber));
        Account destAccount = accountRepository.findByNumber(destAccountNumber)
                .orElseThrow(() -> new IllegalArgumentException("Destination account not found: " + destAccountNumber));

        if (sourceAccount.getBalance() < amount) {
            throw new IllegalArgumentException("Insufficient balance in source account. Available: " + sourceAccount.getBalance());
        }

        sourceAccount.setBalance(sourceAccount.getBalance() - amount);
        destAccount.setBalance(destAccount.getBalance() + amount);

        accountRepository.save(sourceAccount);
        accountRepository.save(destAccount);

        LocalDateTime now = LocalDateTime.now();

        Transaction outTx = new Transaction(
                UUID.randomUUID().toString(),
                Type.TRANSFER_OUT,
                sourceAccountNumber,
                amount,
                now,
                "Transfer to " + destAccountNumber + (note.trim().isEmpty() ? "" : ": " + note)
        );
        transactionRepository.save(outTx);

        Transaction inTx = new Transaction(
                UUID.randomUUID().toString(),
                Type.TRANSFER_IN,
                destAccountNumber,
                amount,
                now,
                "Transfer from " + sourceAccountNumber + (note.trim().isEmpty() ? "" : ": " + note)
        );
        transactionRepository.save(inTx);
    }

    @Override
    public List<Transaction> getStatement(String accountNumber) {
        // Validate account exists
        accountRepository.findByNumber(accountNumber)
                .orElseThrow(() -> new IllegalArgumentException("Account not found: " + accountNumber));
        return transactionRepository.findByAccountNumber(accountNumber);
    }

    @Override
    public List<Account> searchAccountsByCustomerName(String name) {
        Set<String> matchingCustomerIds = customerRepository.findAll().stream()
                .filter(c -> c.getName().toLowerCase().contains(name.toLowerCase()))
                .map(Customer::getId)
                .collect(Collectors.toSet());

        return accountRepository.findAll().stream()
                .filter(a -> matchingCustomerIds.contains(a.getCustomerId()))
                .sorted(Comparator.comparing(Account::getAccountNumber))
                .collect(Collectors.toList());
    }

    @Override
    public Customer getCustomerByAccount(String accountNumber) {
        Account account = accountRepository.findByNumber(accountNumber).orElse(null);
        if (account == null) {
            return null;
        }
        return customerRepository.findById(account.getCustomerId()).orElse(null);
    }

    private String getAccountNumber() {
        int size = accountRepository.findAll().size() + 1;
        return String.format("AC%06d", size);
    }
}
