package com.avoverseas.backend.assignment;

import com.avoverseas.backend.audit.AssignmentActivity;
import com.avoverseas.backend.audit.AssignmentActivityRepository;
import com.avoverseas.backend.file.FileStorageService;
import com.avoverseas.backend.notification.Notification;
import com.avoverseas.backend.notification.NotificationRepository;
import com.avoverseas.backend.user.User;
import com.avoverseas.backend.user.UserRepository;
import com.avoverseas.backend.user.UserRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class AssignmentController {

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssignmentFileRepository fileRepository;

    @Autowired
    private AssignmentActivityRepository activityRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private FileStorageService fileStorageService;

    // Helper to get authenticated user
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    public record CreateAssignmentRequest(String title, String subject, String description, String instructions, String deadline, Integer wordCount) {}
    public record StatusUpdateRequest(String status, String description) {}
    public record AssignExpertRequest(String expertId) {}

    // Create Assignment
    @PostMapping("/assignments")
    public ResponseEntity<?> createAssignment(@RequestBody CreateAssignmentRequest req) {
        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.STUDENT) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only students can submit tutoring requests");
        }

        Assignment assignment = Assignment.builder()
                .studentId(user.getId())
                .title(req.title())
                .subject(req.subject())
                .description(req.description())
                .instructions(req.instructions())
                .deadline(Instant.parse(req.deadline()))
                .wordCount(req.wordCount())
                .status(AssignmentStatus.PENDING_PAYMENT)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Assignment saved = assignmentRepository.save(assignment);

        // Audit log
        activityRepository.save(AssignmentActivity.builder()
                .assignmentId(saved.getId())
                .actorId(user.getId())
                .action("SUBMITTED")
                .newStatus(saved.getStatus().name())
                .description("Tutoring request submitted by student.")
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(saved);
    }

    // Get Assignments for logged-in user
    @GetMapping("/assignments")
    public ResponseEntity<List<Assignment>> getAssignments() {
        User user = getAuthenticatedUser();
        if (user.getRole() == UserRole.ADMIN) {
            return ResponseEntity.ok(assignmentRepository.findAll());
        } else if (user.getRole() == UserRole.EXPERT) {
            return ResponseEntity.ok(assignmentRepository.findByExpertId(user.getId()));
        } else {
            return ResponseEntity.ok(assignmentRepository.findByStudentId(user.getId()));
        }
    }

    // Get Single Assignment Details
    @GetMapping("/assignments/{id}")
    public ResponseEntity<?> getAssignment(@PathVariable UUID id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.ADMIN && 
            !user.getId().equals(assignment.getStudentId()) && 
            !user.getId().equals(assignment.getExpertId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        return ResponseEntity.ok(assignment);
    }

    // Assign Expert
    @PostMapping("/assignments/{id}/assign")
    public ResponseEntity<?> assignExpert(@PathVariable UUID id, @RequestBody AssignExpertRequest req) {
        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Admins can assign experts");
        }

        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        UUID expertUuid = UUID.fromString(req.expertId());
        User expert = userRepository.findById(expertUuid)
                .orElseThrow(() -> new RuntimeException("Expert not found"));

        if (expert.getRole() != UserRole.EXPERT) {
            return ResponseEntity.badRequest().body("Selected user is not an Expert");
        }

        AssignmentStatus oldStatus = assignment.getStatus();
        assignment.setExpertId(expert.getId());
        assignment.setStatus(AssignmentStatus.ASSIGNED);
        assignment.setUpdatedAt(Instant.now());

        assignmentRepository.save(assignment);

        // Audit log
        activityRepository.save(AssignmentActivity.builder()
                .assignmentId(assignment.getId())
                .actorId(user.getId())
                .action("ASSIGNED_EXPERT")
                .oldStatus(oldStatus.name())
                .newStatus(assignment.getStatus().name())
                .description("Expert " + expert.getName() + " assigned by admin.")
                .createdAt(Instant.now())
                .build());

        // Notify Expert
        notificationRepository.save(Notification.builder()
                .userId(expert.getId())
                .assignmentId(assignment.getId())
                .type("ASSIGNMENT_ASSIGNED")
                .title("New Tutoring Case Assigned")
                .message("You have been assigned to: " + assignment.getTitle())
                .read(false)
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(assignment);
    }

    // Update Status manually or via workflow
    @PostMapping("/assignments/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable UUID id, @RequestBody StatusUpdateRequest req) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        User user = getAuthenticatedUser();
        AssignmentStatus oldStatus = assignment.getStatus();
        AssignmentStatus newStatus = AssignmentStatus.valueOf(req.status().toUpperCase());

        // Validate transitions based on roles
        if (user.getRole() == UserRole.STUDENT) {
            if (newStatus != AssignmentStatus.DELIVERED && newStatus != AssignmentStatus.CLOSED) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid student status transition request");
            }
        } else if (user.getRole() == UserRole.EXPERT) {
            if (newStatus != AssignmentStatus.IN_PROGRESS && newStatus != AssignmentStatus.ADMIN_REVIEW) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid expert status transition request");
            }
        }

        assignment.setStatus(newStatus);
        assignment.setUpdatedAt(Instant.now());
        assignmentRepository.save(assignment);

        // Audit log
        activityRepository.save(AssignmentActivity.builder()
                .assignmentId(assignment.getId())
                .actorId(user.getId())
                .action("STATUS_CHANGED")
                .oldStatus(oldStatus.name())
                .newStatus(newStatus.name())
                .description(req.description() != null ? req.description() : "Status updated to " + newStatus)
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(assignment);
    }

    // Upload File
    @PostMapping("/assignments/{id}/files")
    public ResponseEntity<?> uploadFile(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("fileType") String fileType) throws IOException {

        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.ADMIN && 
            !user.getId().equals(assignment.getStudentId()) && 
            !user.getId().equals(assignment.getExpertId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        FileType fType = FileType.valueOf(fileType.toUpperCase());

        // Save bytes using FileStorageService abstraction
        String storageKey = fileStorageService.storeFile(
                assignment.getId().toString(),
                fType.name().toLowerCase(),
                file.getOriginalFilename(),
                file.getBytes()
        );

        // Query versions
        List<AssignmentFile> existing = fileRepository.findByAssignmentId(assignment.getId());
        int version = (int) existing.stream().filter(f -> f.getFileType() == fType).count() + 1;

        AssignmentFile assignmentFile = AssignmentFile.builder()
                .assignmentId(assignment.getId())
                .uploadedBy(user.getId())
                .fileType(fType)
                .originalFileName(file.getOriginalFilename())
                .mimeType(file.getContentType())
                .fileSize(file.getSize())
                .storageKey(storageKey)
                .version(version)
                .createdAt(Instant.now())
                .build();

        fileRepository.save(assignmentFile);

        // Audit Log
        activityRepository.save(AssignmentActivity.builder()
                .assignmentId(assignment.getId())
                .actorId(user.getId())
                .action("FILE_UPLOADED")
                .newStatus(assignment.getStatus().name())
                .description("File " + file.getOriginalFilename() + " (" + fType + " v" + version + ") uploaded.")
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(assignmentFile);
    }

    // Get Assignment Files
    @GetMapping("/assignments/{id}/files")
    public ResponseEntity<?> getAssignmentFiles(@PathVariable UUID id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.ADMIN && 
            !user.getId().equals(assignment.getStudentId()) && 
            !user.getId().equals(assignment.getExpertId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        List<AssignmentFile> files = fileRepository.findByAssignmentId(id);
        return ResponseEntity.ok(files);
    }

    // Download File Route
    @GetMapping("/files/download")
    public ResponseEntity<?> downloadFile(@RequestParam("key") String storageKey) {
        byte[] data = fileStorageService.loadFile(storageKey);
        String filename = storageKey.substring(storageKey.lastIndexOf('/') + 1);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }

    // Get Audit Trail
    @GetMapping("/assignments/{id}/audit")
    public ResponseEntity<?> getAuditTrail(@PathVariable UUID id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.ADMIN && 
            !user.getId().equals(assignment.getStudentId()) && 
            !user.getId().equals(assignment.getExpertId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        return ResponseEntity.ok(activityRepository.findByAssignmentIdOrderByCreatedAtDesc(id));
    }
}
