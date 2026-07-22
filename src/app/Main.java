package app;

import domain.Account;
import domain.Customer;
import domain.Transaction;
import service.BankService;
import service.impl.bankServiceimpl;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        BankService bankService = new bankServiceimpl();
        System.out.println("========================================");
        System.out.println("       WELCOME TO CONSOLE BANKING       ");
        System.out.println("========================================");
        boolean running = true;
        while (running) {
            System.out.println("""
                    
                    1) Open Account
                    2) Deposit
                    3) Withdraw
                    4) Transfer
                    5) Account Statement
                    6) List Accounts
                    7) Search Account by Customer Name
                    8) Exit
                    """);
            System.out.print("CHOOSE OPTION (1-8): ");
            String choice = sc.nextLine().trim();
            
            switch (choice) {
                case "1" -> openAccount(sc, bankService);
                case "2" -> deposit(sc, bankService);
                case "3" -> withdraw(sc, bankService);
                case "4" -> transfer(sc, bankService);
                case "5" -> statement(sc, bankService);
                case "6" -> listAccounts(sc, bankService);
                case "7" -> searchAccounts(sc, bankService);
                case "8", "0" -> {
                    System.out.println("Thank you for banking with us. Goodbye!");
                    running = false;
                }
                default -> System.out.println("Invalid option. Please try again.");
            }
        }
    }

    private static void openAccount(Scanner sc, BankService bankService) {
        System.out.println("\n--- Open New Account ---");
        System.out.print("Customer Name: ");
        String name = sc.nextLine().trim();
        if (name.isEmpty()) {
            System.out.println("Error: Customer Name cannot be empty.");
            return;
        }

        System.out.print("Customer Email: ");
        String email = sc.nextLine().trim();
        if (email.isEmpty()) {
            System.out.println("Error: Customer Email cannot be empty.");
            return;
        }

        System.out.print("Account Type (SAVINGS/CURRENT): ");
        String type = sc.nextLine().trim().toUpperCase();
        if (!type.equals("SAVINGS") && !type.equals("CURRENT")) {
            System.out.println("Error: Account Type must be SAVINGS or CURRENT.");
            return;
        }

        System.out.print("Initial deposit (optional, press Enter for 0): ");
        String amountStr = sc.nextLine().trim();
        double initial = 0.0;
        if (!amountStr.isEmpty()) {
            try {
                initial = Double.parseDouble(amountStr);
                if (initial < 0) {
                    System.out.println("Error: Initial deposit cannot be negative.");
                    return;
                }
            } catch (NumberFormatException e) {
                System.out.println("Error: Invalid initial deposit amount.");
                return;
            }
        }

        try {
            String accountNumber = bankService.openAccount(name, email, type);
            if (initial > 0) {
                bankService.deposit(accountNumber, initial, "Initial Deposit");
            }
            System.out.println("SUCCESS: Account opened successfully!");
            System.out.println("Account Number: " + accountNumber);
        } catch (Exception e) {
            System.out.println("Error opening account: " + e.getMessage());
        }
    }

    private static void deposit(Scanner sc, BankService bankService) {
        System.out.println("\n--- Deposit Funds ---");
        System.out.print("Enter Account Number: ");
        String accountNumber = sc.nextLine().trim();
        System.out.print("Enter Amount to Deposit: ");
        double amount;
        try {
            amount = Double.parseDouble(sc.nextLine().trim());
        } catch (NumberFormatException e) {
            System.out.println("Error: Invalid amount entered.");
            return;
        }

        System.out.print("Enter Note / Description (optional): ");
        String note = sc.nextLine().trim();
        if (note.isEmpty()) {
            note = "Cash Deposit";
        }

        try {
            bankService.deposit(accountNumber, amount, note);
            System.out.println("SUCCESS: Amount Deposited successfully.");
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }

    private static void withdraw(Scanner sc, BankService bankService) {
        System.out.println("\n--- Withdraw Funds ---");
        System.out.print("Enter Account Number: ");
        String accountNumber = sc.nextLine().trim();
        System.out.print("Enter Amount to Withdraw: ");
        double amount;
        try {
            amount = Double.parseDouble(sc.nextLine().trim());
        } catch (NumberFormatException e) {
            System.out.println("Error: Invalid amount entered.");
            return;
        }

        System.out.print("Enter Note / Description (optional): ");
        String note = sc.nextLine().trim();
        if (note.isEmpty()) {
            note = "Cash Withdrawal";
        }

        try {
            bankService.withdraw(accountNumber, amount, note);
            System.out.println("SUCCESS: Amount Withdrawn successfully.");
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }

    private static void transfer(Scanner sc, BankService bankService) {
        System.out.println("\n--- Transfer Funds ---");
        System.out.print("Enter Source Account Number: ");
        String sourceAccount = sc.nextLine().trim();
        System.out.print("Enter Destination Account Number: ");
        String destAccount = sc.nextLine().trim();
        System.out.print("Enter Amount to Transfer: ");
        double amount;
        try {
            amount = Double.parseDouble(sc.nextLine().trim());
        } catch (NumberFormatException e) {
            System.out.println("Error: Invalid amount entered.");
            return;
        }

        System.out.print("Enter Note / Description (optional): ");
        String note = sc.nextLine().trim();
        if (note.isEmpty()) {
            note = "Fund Transfer";
        }

        try {
            bankService.transfer(sourceAccount, destAccount, amount, note);
            System.out.println("SUCCESS: Transfer completed successfully.");
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }

    private static void statement(Scanner sc, BankService bankService) {
        System.out.println("\n--- Account Statement ---");
        System.out.print("Enter Account Number: ");
        String accountNumber = sc.nextLine().trim();

        try {
            List<Transaction> transactions = bankService.getStatement(accountNumber);
            Customer customer = bankService.getCustomerByAccount(accountNumber);
            Account account = bankService.listAccounts().stream()
                    .filter(a -> a.getAccountNumber().equals(accountNumber))
                    .findFirst()
                    .orElseThrow();

            System.out.println("\n==================================================");
            System.out.println("                 ACCOUNT STATEMENT                ");
            System.out.println("==================================================");
            System.out.println("Account Number: " + account.getAccountNumber());
            System.out.println("Customer Name : " + (customer != null ? customer.getName() : "N/A"));
            System.out.println("Account Type  : " + account.getAccountType());
            System.out.println("Current Balance: $" + String.format("%.2f", account.getBalance()));
            System.out.println("--------------------------------------------------");
            System.out.printf("%-19s | %-12s | %-10s | %s\n", "Date/Time", "Type", "Amount", "Note");
            System.out.println("--------------------------------------------------");
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            if (transactions.isEmpty()) {
                System.out.println("No transactions found for this account.");
            } else {
                for (Transaction tx : transactions) {
                    System.out.printf("%-19s | %-12s | $%-9.2f | %s\n",
                            tx.getTimeStamp().format(formatter),
                            tx.getType(),
                            tx.getAmount(),
                            tx.getNote());
                }
            }
            System.out.println("==================================================");
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }

    private static void listAccounts(Scanner sc, BankService bankService) {
        System.out.println("\n--- All Accounts List ---");
        List<Account> accounts = bankService.listAccounts();
        if (accounts.isEmpty()) {
            System.out.println("No accounts open in the system.");
            return;
        }

        System.out.println("-------------------------------------------------------------------------------------");
        System.out.printf("%-10s | %-20s | %-25s | %-10s | %s\n", "Acc Number", "Customer Name", "Customer Email", "Acc Type", "Balance");
        System.out.println("-------------------------------------------------------------------------------------");
        
        for (Account a : accounts) {
            Customer customer = bankService.getCustomerByAccount(a.getAccountNumber());
            System.out.printf("%-10s | %-20s | %-25s | %-10s | $%.2f\n",
                    a.getAccountNumber(),
                    (customer != null ? customer.getName() : "N/A"),
                    (customer != null ? customer.getEmail() : "N/A"),
                    a.getAccountType(),
                    a.getBalance());
        }
        System.out.println("-------------------------------------------------------------------------------------");
    }

    private static void searchAccounts(Scanner sc, BankService bankService) {
        System.out.println("\n--- Search Account by Customer Name ---");
        System.out.print("Enter Customer Name to Search: ");
        String name = sc.nextLine().trim();
        if (name.isEmpty()) {
            System.out.println("Error: Search query cannot be empty.");
            return;
        }

        List<Account> accounts = bankService.searchAccountsByCustomerName(name);
        if (accounts.isEmpty()) {
            System.out.println("No accounts found matching customer name: " + name);
            return;
        }

        System.out.println("\n--- Search Results ---");
        System.out.println("-------------------------------------------------------------------------------------");
        System.out.printf("%-10s | %-20s | %-25s | %-10s | %s\n", "Acc Number", "Customer Name", "Customer Email", "Acc Type", "Balance");
        System.out.println("-------------------------------------------------------------------------------------");
        
        for (Account a : accounts) {
            Customer customer = bankService.getCustomerByAccount(a.getAccountNumber());
            System.out.printf("%-10s | %-20s | %-25s | %-10s | $%.2f\n",
                    a.getAccountNumber(),
                    (customer != null ? customer.getName() : "N/A"),
                    (customer != null ? customer.getEmail() : "N/A"),
                    a.getAccountType(),
                    a.getBalance());
        }
        System.out.println("-------------------------------------------------------------------------------------");
    }
}
