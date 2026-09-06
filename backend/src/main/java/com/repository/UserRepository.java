package com.repository;

import com.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Find user by email for Login & Validation
    Optional<User> findByEmail(String email);
    
    // Check if email already exists
    Boolean existsByEmail(String email);
}