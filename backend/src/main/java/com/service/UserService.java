package com.service;

import com.entity.User;
import com.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // 1. Register / Save new User into MySQL Database
    public User registerUser(User user) throws Exception {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new Exception("Email already registered in database!");
        }

        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("USER");
        }

        return userRepository.save(user);
    }

    // 2. Login User / Admin
    public User loginUser(String email, String password) throws Exception {
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword().equals(password)) {
                return user;
            } else {
                throw new Exception("Incorrect Password!");
            }
        } else {
            throw new Exception("User not found with email: " + email);
        }
    }

    // 3. Find User by Email
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // 4. Get all Users (For Admin Dashboard)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}