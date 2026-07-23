package domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Customer
{
    private String name;
    @Id
    private String id;
    private String email;

    public Customer() {
    }

    public Customer(String name, String id, String email) {
        this.name = name;
        this.id = id;
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public String getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }
}
