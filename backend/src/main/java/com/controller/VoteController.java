package com.controller;

import com.entity.Vote;
import com.repository.VoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/votes")
@CrossOrigin(origins = "*")
public class VoteController {

    @Autowired
    private VoteRepository voteRepository;

    @PostMapping("/{newsId}")
    public ResponseEntity<?> castVote(@PathVariable Long newsId, @RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        String voteType = payload.get("voteType").toString(); // "TRUST" or "NOT_TRUST"

        // Prevent Duplicate Votes per User per Article
        Optional<Vote> existingVote = voteRepository.findByNewsIdAndUserId(newsId, userId);
        if (existingVote.isPresent()) {
            Vote vote = existingVote.get();
            vote.setVoteType(voteType);
            voteRepository.save(vote);
        } else {
            Vote newVote = new Vote(newsId, userId, voteType);
            voteRepository.save(newVote);
        }

        // Calculate Real-time Trust Statistics
        long trustVotes = voteRepository.countByNewsIdAndVoteType(newsId, "TRUST");
        long notTrustVotes = voteRepository.countByNewsIdAndVoteType(newsId, "NOT_TRUST");
        long totalVotes = trustVotes + notTrustVotes;

        double trustPercentage = totalVotes > 0 ? ((double) trustVotes / totalVotes) * 100 : 100.0;

        Map<String, Object> response = new HashMap<>();
        response.put("newsId", newsId);
        response.put("trustVotes", trustVotes);
        response.put("notTrustVotes", notTrustVotes);
        response.put("totalVotes", totalVotes);
        response.put("trustPercentage", Math.round(trustPercentage));

        return ResponseEntity.ok(response);
    }
}