package repository;

import domain.Account;

import java.util.HashMap;
import java.util.Map;

public class AccountRepository
{
    private final Map<String, Account> accountsByNumber = new HashMap<>();

    public void save(Account account) {
        accountsByNumber.put(account.getAccountNumber(), account);
    }

}
