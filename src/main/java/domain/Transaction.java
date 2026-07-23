package domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import java.time.LocalDateTime;

@Entity
public class Transaction
{
    @Id
    private String id;
    @Enumerated(EnumType.STRING)
    private Type type;
    private String accountNumber;
    private double amount;
    private LocalDateTime timeStamp;
    private String note;

    public Transaction() {
    }

    public Transaction(String id, Type type, String accountNumber, double amount, LocalDateTime timeStamp, String note) {
        this.id = id;
        this.type = type;
        this.accountNumber = accountNumber;
        this.amount = amount;
        this.timeStamp = timeStamp;
        this.note = note;
    }

    public String getId() {
        return id;
    }

    public Type getType() {
        return type;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public double getAmount() {
        return amount;
    }

    public LocalDateTime getTimeStamp() {
        return timeStamp;
    }

    public String getNote() {
        return note;
    }
}
