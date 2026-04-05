package app;

import service.BankService;
import service.impl.bankServiceimpl;

import java.util.Scanner;

public class Main
{
    static void main(String[] args) {
        Scanner sc=new Scanner(System.in);
        BankService bankService= new bankServiceimpl();
        System.out.println("welcome to console bank");
        boolean running = true;
        while(running) {
            System.out.println("""
                    1) Open Account
                    2) Deposit
                    3) Withdraw
                    4) Transfer
                    5) Account Statement
                    6) List Account
                    7) Search Account by Customer Name
                    8) Exit
                    """);
            System.out.print("CHOOSE: ");
            String choice = sc.nextLine().trim();
//            System.out.println("CHOICE: " + choice);
            
            switch (choice) {
                case "1" -> openAccount(sc,bankService);
                case "2" -> deposit(sc);
                case "3" -> withdraw(sc);
                case "4" -> transfer(sc);
                case "5" -> statement(sc);
                case "6" -> listAccounts(sc);
                case "7" -> searchAccounts(sc);
                case "0" -> running = false;
            }
        }
    }

    private static void openAccount(Scanner sc,BankService bankService) {
        System.out.println("Customer name: ");
        String name = sc.nextLine().trim();
        System.out.println("Customer email: ");
        String email = sc.nextLine().trim();
        System.out.println("Account Type (SAVINGS/CURRENT): ");
        String type = sc.nextLine().trim();
        System.out.println("Initial deposit (optional, blank for 0): ");
        String amountStr = sc.nextLine().trim();
//        if (amountStr.isBlank()) amountStr = "0";
        Double initial = Double.valueOf(amountStr);
        bankService.openAccount(name,email,type);
    }

    private static void deposit(Scanner sc) {
    }

    private static void withdraw(Scanner sc) {
    }

    private static void transfer(Scanner sc) {
    }

    private static void statement(Scanner sc) {
    }

    private static void listAccounts(Scanner sc) {
    }

    private static void searchAccounts(Scanner sc) {
    }
}
