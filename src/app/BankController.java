package app;

import domain.Account;
import domain.Customer;
import domain.Transaction;
import service.BankService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class BankController {

    private final BankService bankService;

    @Autowired
    public BankController(BankService bankService) {
        this.bankService = bankService;
    }

    @GetMapping("/accounts")
    public ResponseEntity<List<Account>> listAccounts() {
        return ResponseEntity.ok(bankService.listAccounts());
    }

    @PostMapping("/accounts")
    public ResponseEntity<?> openAccount(@RequestBody AccountRequest request) {
        try {
            if (request.name() == null || request.name().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Name cannot be empty"));
            }
            if (request.email() == null || request.email().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email cannot be empty"));
            }
            if (request.type() == null || (!request.type().equalsIgnoreCase("SAVINGS") && !request.type().equalsIgnoreCase("CURRENT"))) {
                return ResponseEntity.badRequest().body(Map.of("error", "Type must be SAVINGS or CURRENT"));
            }
            
            String accountNumber = bankService.openAccount(request.name().trim(), request.email().trim(), request.type().trim().toUpperCase());
            
            if (request.initialDeposit() != null && request.initialDeposit() > 0) {
                bankService.deposit(accountNumber, request.initialDeposit(), "Initial Deposit");
            }
            
            return ResponseEntity.ok(Map.of(
                "accountNumber", accountNumber,
                "message", "Account opened successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/accounts/{number}/deposit")
    public ResponseEntity<?> deposit(@PathVariable String number, @RequestBody DepositRequest request) {
        try {
            if (request.amount() == null || request.amount() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount must be greater than zero"));
            }
            String note = request.note() == null || request.note().trim().isEmpty() ? "Cash Deposit" : request.note().trim();
            bankService.deposit(number, request.amount(), note);
            return ResponseEntity.ok(Map.of("message", "Amount deposited successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/accounts/{number}/withdraw")
    public ResponseEntity<?> withdraw(@PathVariable String number, @RequestBody WithdrawRequest request) {
        try {
            if (request.amount() == null || request.amount() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount must be greater than zero"));
            }
            String note = request.note() == null || request.note().trim().isEmpty() ? "Cash Withdrawal" : request.note().trim();
            bankService.withdraw(number, request.amount(), note);
            return ResponseEntity.ok(Map.of("message", "Amount withdrawn successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/accounts/transfer")
    public ResponseEntity<?> transfer(@RequestBody TransferRequest request) {
        try {
            if (request.sourceAccount() == null || request.sourceAccount().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Source account cannot be empty"));
            }
            if (request.destAccount() == null || request.destAccount().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Destination account cannot be empty"));
            }
            if (request.amount() == null || request.amount() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount must be greater than zero"));
            }
            String note = request.note() == null || request.note().trim().isEmpty() ? "Fund Transfer" : request.note().trim();
            
            bankService.transfer(request.sourceAccount().trim(), request.destAccount().trim(), request.amount(), note);
            return ResponseEntity.ok(Map.of("message", "Transfer completed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/accounts/{number}/statement")
    public ResponseEntity<?> getStatement(@PathVariable String number) {
        try {
            List<Transaction> statement = bankService.getStatement(number);
            return ResponseEntity.ok(statement);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/accounts/search")
    public ResponseEntity<List<Account>> searchAccounts(@RequestParam String name) {
        return ResponseEntity.ok(bankService.searchAccountsByCustomerName(name));
    }

    @GetMapping("/accounts/{number}/customer")
    public ResponseEntity<?> getCustomer(@PathVariable String number) {
        Customer customer = bankService.getCustomerByAccount(number);
        if (customer == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(customer);
    }

    // Record DTOs for request mapping
    public record AccountRequest(String name, String email, String type, Double initialDeposit) {}
    public record DepositRequest(Double amount, String note) {}
    public record WithdrawRequest(Double amount, String note) {}
    public record TransferRequest(String sourceAccount, String destAccount, Double amount, String note) {}
}
