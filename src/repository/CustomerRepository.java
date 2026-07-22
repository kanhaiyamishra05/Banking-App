package repository;

import domain.Customer;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class CustomerRepository {
    private final Map<String, Customer> customersById = new HashMap<>();

    public Optional<Customer> findById(String id) {
        return Optional.ofNullable(customersById.get(id));
    }

    public void save(Customer customer) {
        customersById.put(customer.getId(), customer);
    }

    public List<Customer> findAll() {
        return new ArrayList<>(customersById.values());
    }
}
