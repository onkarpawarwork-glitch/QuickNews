package com.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import java.time.LocalDateTime;

@Entity
@Table(name = "articles")
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;
    private String sourceName;
    private String imageUrl;
    private String originalUrl;

    private Integer trustScore = 95;
    private String trustBadge = "green";

    private Integer likesCount = 120;
    private Integer commentsCount = 12;
    private Boolean isCommunity = false;
    private String author = "QuickNews Wire";

    private LocalDateTime createdAt = LocalDateTime.now();

    public Article() {}

    public Article(String title, String description, String category, String sourceName, String imageUrl, String originalUrl) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.sourceName = sourceName;
        this.imageUrl = imageUrl;
        this.originalUrl = originalUrl;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getOriginalUrl() { return originalUrl; }
    public void setOriginalUrl(String originalUrl) { this.originalUrl = originalUrl; }

    public Integer getTrustScore() { return trustScore; }
    public void setTrustScore(Integer trustScore) { this.trustScore = trustScore; }

    public String getTrustBadge() { return trustBadge; }
    public void setTrustBadge(String trustBadge) { this.trustBadge = trustBadge; }

    public Integer getLikesCount() { return likesCount; }
    public void setLikesCount(Integer likesCount) { this.likesCount = likesCount; }

    public Integer getCommentsCount() { return commentsCount; }
    public void setCommentsCount(Integer commentsCount) { this.commentsCount = commentsCount; }

    public Boolean getIsCommunity() { return isCommunity; }
    public void setIsCommunity(Boolean isCommunity) { this.isCommunity = isCommunity; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
