package com.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;

@Entity
@Table(name = "votes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"news_id", "user_id"}) // Prevents Duplicate Voting per user!
})
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "news_id", nullable = false)
    private Long newsId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "vote_type", nullable = false)
    private String voteType; // "TRUST" or "NOT_TRUST"

    private LocalDateTime createdAt = LocalDateTime.now();

    // Default Constructor
    public Vote() {
        super();
    }

    // Parametrized Constructor
    public Vote(Long newsId, Long userId, String voteType) {
        this.newsId = newsId;
        this.userId = userId;
        this.voteType = voteType;
    }

    // Getters and Setters
    public Long getId() { 
        return id; 
    }
    public void setId(Long id) { 
        this.id = id; 
    }

    public Long getNewsId() { 
        return newsId; 
    }
    public void setNewsId(Long newsId) { 
        this.newsId = newsId; 
    }

    public Long getUserId() { 
        return userId; 
    }
    public void setUserId(Long userId) { 
        this.userId = userId; 
    }

    public String getVoteType() { 
        return voteType; 
    }
    public void setVoteType(String voteType) { 
        this.voteType = voteType; 
    }

    public LocalDateTime getCreatedAt() { 
        return createdAt; 
    }
    public void setCreatedAt(LocalDateTime createdAt) { 
        this.createdAt = createdAt; 
    }
}