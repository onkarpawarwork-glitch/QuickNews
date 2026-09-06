package com.repository;

import com.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {
    Optional<Vote> findByNewsIdAndUserId(Long newsId, Long userId);
    long countByNewsIdAndVoteType(Long newsId, String voteType);
    long countByNewsId(Long newsId);
}