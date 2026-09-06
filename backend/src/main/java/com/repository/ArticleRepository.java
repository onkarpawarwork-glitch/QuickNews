package com.repository;


import com.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findByCategoryOrderByCreatedAtDesc(String category);
    List<Article> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String title, String desc);
    
    
}