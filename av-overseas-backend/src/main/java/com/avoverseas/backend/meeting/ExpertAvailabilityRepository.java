package com.avoverseas.backend.meeting;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExpertAvailabilityRepository extends JpaRepository<ExpertAvailability, UUID> {
    List<ExpertAvailability> findByExpertId(UUID expertId);
    List<ExpertAvailability> findByExpertIdAndActive(UUID expertId, Boolean active);
}
