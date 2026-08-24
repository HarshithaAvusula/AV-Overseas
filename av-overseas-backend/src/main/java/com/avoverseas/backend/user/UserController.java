package com.avoverseas.backend.user;

import com.avoverseas.backend.assignment.Assignment;
import com.avoverseas.backend.assignment.AssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    public record StudentDTO(
            String id,
            String name,
            String email,
            Instant createdAt,
            int totalOrders,
            int activeOrders
    ) {}

    public record ExpertDTO(
            String id,
            String name,
            String email,
            Instant createdAt,
            int assignedOrders
    ) {}

    @GetMapping("/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StudentDTO>> getStudents() {
        List<User> students = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.STUDENT)
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .collect(Collectors.toList());

        List<Assignment> allAssignments = assignmentRepository.findAll();

        List<StudentDTO> dtos = students.stream().map(s -> {
            List<Assignment> userAssignments = allAssignments.stream()
                    .filter(a -> a.getStudentId() != null && a.getStudentId().equals(s.getId()))
                    .collect(Collectors.toList());
            int total = userAssignments.size();
            int active = (int) userAssignments.stream()
                    .filter(a -> a.getStatus() != null && !List.of("CLOSED", "COMPLETED").contains(a.getStatus().name()))
                    .count();
            return new StudentDTO(
                    s.getId().toString(),
                    s.getName(),
                    s.getEmail(),
                    s.getCreatedAt() != null ? s.getCreatedAt() : Instant.now(),
                    total,
                    active
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/experts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ExpertDTO>> getExperts() {
        List<User> experts = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.EXPERT)
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .collect(Collectors.toList());

        List<Assignment> allAssignments = assignmentRepository.findAll();

        List<ExpertDTO> dtos = experts.stream().map(u -> {
            int assigned = (int) allAssignments.stream()
                    .filter(a -> a.getExpertId() != null && a.getExpertId().equals(u.getId()))
                    .count();
            return new ExpertDTO(
                    u.getId().toString(),
                    u.getName(),
                    u.getEmail(),
                    u.getCreatedAt() != null ? u.getCreatedAt() : Instant.now(),
                    assigned
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}
