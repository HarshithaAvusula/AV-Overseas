package com.avoverseas.backend.meeting;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, UUID> {
    List<Meeting> findByAssignmentId(UUID assignmentId);
    List<Meeting> findByStudentId(UUID studentId);
    List<Meeting> findByExpertId(UUID expertId);
}
