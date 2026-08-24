package com.avoverseas.backend.assignment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface AssignmentFileRepository extends JpaRepository<AssignmentFile, UUID> {
    List<AssignmentFile> findByAssignmentId(UUID assignmentId);
}
