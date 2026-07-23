package service.impl;

import domain.Account;
import repository.AccountRepository;
import service.BankService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class InterestScheduler {

    private final AccountRepository accountRepository;
    private final BankService bankService;

    @Autowired
    public InterestScheduler(AccountRepository accountRepository, BankService bankService) {
        this.accountRepository = accountRepository;
        this.bankService = bankService;
    }

    // Run every 60 seconds (60000 ms) for demonstration/testing
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void applySavingsInterest() {
        List<Account> accounts = accountRepository.findAll();
        for (Account account : accounts) {
            if ("SAVINGS".equalsIgnoreCase(account.getAccountType()) && account.getBalance() > 0) {
                // Apply a 0.5% interest payment (simulated monthly interest)
                double interestRate = 0.005;
                double interestAmount = account.getBalance() * interestRate;
                
                // Round to 2 decimal places
                interestAmount = Math.round(interestAmount * 100.0) / 100.0;
                
                if (interestAmount > 0) {
                    try {
                        bankService.deposit(
                            account.getAccountNumber(), 
                            interestAmount, 
                            "Interest Credit (0.5% Rate)"
                        );
                    } catch (Exception e) {
                        System.err.println("Failed to apply interest to account " 
                            + account.getAccountNumber() + ": " + e.getMessage());
                    }
                }
            }
        }
    }
}
