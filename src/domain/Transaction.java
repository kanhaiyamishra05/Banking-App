package domain;

import java.time.LocalDateTime;

public class Transaction
{
    private String id;
    private Type type;
    private String accountNumber;
    private double amount;
    private LocalDateTime timeStamp;
    private String note;

    public Transaction(String id, Type type, String accountNumber, double amount, LocalDateTime timeStamp, String note) {
        this.id = id;
        this.type = type;
        this.accountNumber = accountNumber;
        this.amount = amount;
        this.timeStamp = timeStamp;
        this.note = note;
    }
}
