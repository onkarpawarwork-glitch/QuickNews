package com.service;

import com.entity.Article;
import com.repository.ArticleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@Service
public class NewsService {

    @Autowired
    private ArticleRepository articleRepository;

    private static final String RSS_CONVERTER_URL = "https://api.rss2json.com/v1/api.json?rss_url=";
    private static final String GOOGLE_NEWS_RSS = "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en";

    public List<Article> getAllArticles(String category, String query) {
        // 1. Fetch live articles from Google News via Spring Boot Server
        List<Article> liveArticles = fetchLiveGoogleNews(category);
        
        if (!liveArticles.isEmpty()) {
            return liveArticles;
        }

        // 2. Fallback to MySQL database if offline
        return articleRepository.findAll();
    }

    private List<Article> fetchLiveGoogleNews(String category) {
        List<Article> articlesList = new ArrayList<>();
        try {
            String topicRss = GOOGLE_NEWS_RSS;
            if (category != null && !category.equalsIgnoreCase("all")) {
                topicRss = "https://news.google.com/rss/headlines/section/topic/" + category.toUpperCase() + "?hl=en-IN&gl=IN&ceid=IN:en";
            }

            RestTemplate restTemplate = new RestTemplate();
            Map response = restTemplate.getForObject(RSS_CONVERTER_URL + topicRss, Map.class);

            if (response != null && response.containsKey("items")) {
                List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
                for (Map<String, Object> item : items) {
                    String title = (String) item.get("title");
                    String desc = (String) item.get("description");
                    if (desc != null) {
                        desc = desc.replaceAll("<[^>]*>", "").trim();
                        if (desc.length() > 180) desc = desc.substring(0, 180) + "...";
                    }

                    Article art = new Article();
                    art.setTitle(title != null ? title.split(" - ")[0] : "Breaking News");
                    art.setDescription(desc != null && !desc.isEmpty() ? desc : "Tap to read full story on QuickNews.");
                    art.setCategory(category != null ? category : "general");
                    art.setSourceName(item.get("author") != null ? (String) item.get("author") : "Google News Wire");
                    art.setImageUrl("https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80");
                    art.setOriginalUrl((String) item.get("link"));
                    art.setTrustScore(98);
                    art.setTrustBadge("green");

                    articlesList.add(art);
                }
            }
        } catch (Exception e) {
            System.err.println("Error fetching Google News in Spring Boot: " + e.getMessage());
        }
        return articlesList;
    }
}