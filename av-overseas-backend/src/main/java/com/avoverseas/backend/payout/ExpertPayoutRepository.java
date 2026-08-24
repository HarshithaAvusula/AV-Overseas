package com.avoverseas.backend.payout;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpertPayoutRepository extends JpaRepository<ExpertPayout, UUID> {
    List<ExpertPayout> findByExpertId(UUID expertId);
    Optional<ExpertPayout> findByAssignmentId(UUID assignmentId);
}
