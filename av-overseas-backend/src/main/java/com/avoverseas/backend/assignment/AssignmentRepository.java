package com.avoverseas.backend.assignment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {
    List<Assignment> findByStudentId(UUID studentId);
    List<Assignment> findByExpertId(UUID expertId);
    List<Assignment> findByStatus(AssignmentStatus status);
}
