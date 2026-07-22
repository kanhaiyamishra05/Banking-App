package repository;

import domain.Account;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class AccountRepository
{
    private final Map<String, Account> accountsByNumber = new HashMap<>();

    public Optional<Account> findByNumber(String accountNumber) {
        return Optional.ofNullable(accountsByNumber.get(accountNumber));
    }

    public void save(Account account) {
        accountsByNumber.put(account.getAccountNumber(), account);
    }


    public List<Account> findAll() {
        return new ArrayList<>(accountsByNumber.values());
    }
}

