package repository;

import domain.Transaction;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class TransactionRepository {
    private final Map<String, List<Transaction>> transactionsByAccount = new HashMap<>();

    public void save(Transaction transaction) {
        transactionsByAccount.computeIfAbsent(transaction.getAccountNumber(), k -> new ArrayList<>())
                .add(transaction);
    }

    public List<Transaction> findByAccountNumber(String accountNumber) {
        return transactionsByAccount.getOrDefault(accountNumber, Collections.emptyList());
    }
}
