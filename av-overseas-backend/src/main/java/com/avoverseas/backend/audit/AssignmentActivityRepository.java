package com.avoverseas.backend.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface AssignmentActivityRepository extends JpaRepository<AssignmentActivity, UUID> {
    List<AssignmentActivity> findByAssignmentIdOrderByCreatedAtDesc(UUID assignmentId);
}
