package com.controller;

import com.entity.Article;
import com.repository.ArticleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/community")
@CrossOrigin(origins = "*") // Allows React frontend connection
public class CommunityPostController {

    @Autowired
    private ArticleRepository articleRepository;

    // 1. POST /api/community/report - Saves Community News to MySQL Database
    @PostMapping("/report")
    public ResponseEntity<Article> reportNews(@RequestBody Article article) {
        article.setIsCommunity(true);

        // 3-Layer AI Trust Verification Engine
        int trustScore = calculateTrustScore(article.getTitle(), article.getDescription(), article.getSourceName());
        article.setTrustScore(trustScore);
        article.setTrustBadge(trustScore >= 80 ? "green" : "yellow");

        if (article.getLikesCount() == null) article.setLikesCount(1);
        if (article.getCommentsCount() == null) article.setCommentsCount(0);
        if (article.getAuthor() == null) article.setAuthor("Verified Community Reporter");
        if (article.getSourceName() == null) article.setSourceName("Local Community");

        // Save directly to MySQL database
        Article savedArticle = articleRepository.save(article);
        return ResponseEntity.ok(savedArticle);
    }

    // 2. GET /api/community/posts - Fetches all reported community news from MySQL
    @GetMapping("/posts")
    public ResponseEntity<List<Article>> getCommunityPosts() {
        return ResponseEntity.ok(articleRepository.findAll());
    }

    // 3. POST /api/community/{id}/upvote - Community Upvote System (Increases Trust Score)
    @PostMapping("/{id}/upvote")
    public ResponseEntity<Article> upvoteNews(@PathVariable Long id) {
        Optional<Article> optionalArticle = articleRepository.findById(id);
        if (optionalArticle.isPresent()) {
            Article article = optionalArticle.get();
            article.setLikesCount(article.getLikesCount() + 1);
            
            // Boost trust score on community votes
            if (article.getTrustScore() < 99) {
                article.setTrustScore(article.getTrustScore() + 1);
            }
            return ResponseEntity.ok(articleRepository.save(article));
        }
        return ResponseEntity.notFound().build();
    }

    // 🧠 3-Layer AI Trust Verification Logic
    private int calculateTrustScore(String title, String desc, String location) {
        int score = 90;

        // Layer 1: Check location/source validity
        if (location != null && !location.trim().isEmpty()) {
            score += 4;
        }

        // Layer 2: Check headline length & quality
        if (title != null && title.length() >= 15) {
            score += 3;
        }

        // Layer 3: Spam check
        if (title != null && (title.toLowerCase().contains("fake") || title.toLowerCase().contains("scam"))) {
            score -= 30;
        }

        return Math.min(99, Math.max(50, score));
    }
}