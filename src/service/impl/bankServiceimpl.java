package service.impl;
import domain.Account;
import repository.AccountRepository;
import service.BankService;

import java.util.UUID;

public class bankServiceimpl implements BankService {

    private AccountRepository accountRepository=new AccountRepository();
    @Override
    public String openAccount(String name, String email, String accountType) {

        String customerId = UUID.randomUUID().toString();
        String accountNumber= UUID.randomUUID().toString();

        Account a = new Account(accountNumber,accountType, (double) 0,customerId);

//        SAVE
        accountRepository



        return "";
    }
}
