package com.avoverseas.backend.meeting;

import com.avoverseas.backend.assignment.Assignment;
import com.avoverseas.backend.assignment.AssignmentRepository;
import com.avoverseas.backend.assignment.AssignmentStatus;
import com.avoverseas.backend.audit.AssignmentActivity;
import com.avoverseas.backend.audit.AssignmentActivityRepository;
import com.avoverseas.backend.notification.Notification;
import com.avoverseas.backend.notification.NotificationRepository;
import com.avoverseas.backend.user.User;
import com.avoverseas.backend.user.UserRepository;
import com.avoverseas.backend.user.UserRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class MeetingController {

    @Autowired
    private MeetingRepository meetingRepository;

    @Autowired
    private ExpertAvailabilityRepository availabilityRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssignmentActivityRepository activityRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    public record BookMeetingRequest(UUID assignmentId, String type, String scheduledAt) {}
    public record ScheduleMeetingRequest(
            String title,
            UUID studentId,
            UUID expertId,
            UUID assignmentId,
            String type,
            String scheduledAt,
            Integer durationMinutes,
            String platform,
            String meetingLink,
            String purpose
    ) {}
    public record AddNotesRequest(
            String notes,
            String discussionSummary,
            String studentRequirements,
            String recommendations,
            String followUpActions,
            String nextMeetingDate,
            String status
    ) {}
    public record UpdateStatusRequest(String status) {}
    public record AddAvailabilityRequest(Integer dayOfWeek, String startTime, String endTime, String timezone) {}

    public record MeetingDTO(
            String id,
            String title,
            String assignmentId,
            String assignmentTitle,
            String subject,
            String studentId,
            String studentName,
            String studentEmail,
            String expertId,
            String expertName,
            String expertEmail,
            String type,
            String typeLabel,
            Instant scheduledAt,
            int durationMinutes,
            String platform,
            String meetingLink,
            String status,
            String purpose,
            String expertNotes,
            String discussionSummary,
            String studentRequirements,
            String recommendations,
            String followUpActions,
            String nextMeetingDate,
            Boolean studentConfirmed,
            Instant createdAt,
            Instant updatedAt
    ) {}

    // Get all meetings (enriched with Student, Expert, and Assignment data)
    @GetMapping("/meetings")
    public ResponseEntity<List<MeetingDTO>> getAllMeetings() {
        User user = getAuthenticatedUser();
        List<Meeting> list;

        if (user.getRole() == UserRole.ADMIN) {
            list = meetingRepository.findAll();
        } else if (user.getRole() == UserRole.EXPERT) {
            list = meetingRepository.findByExpertId(user.getId());
        } else {
            list = meetingRepository.findByStudentId(user.getId());
        }

        List<MeetingDTO> dtos = list.stream()
                .sorted((a, b) -> {
                    if (a.getScheduledAt() == null) return 1;
                    if (b.getScheduledAt() == null) return -1;
                    return a.getScheduledAt().compareTo(b.getScheduledAt());
                })
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    // Get single meeting by ID
    @GetMapping("/meetings/{id}")
    public ResponseEntity<?> getMeetingById(@PathVariable UUID id) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));
        return ResponseEntity.ok(mapToDTO(meeting));
    }

    // Get meetings for assignment
    @GetMapping("/meetings/assignment/{assignmentId}")
    public ResponseEntity<?> getMeetingsForAssignment(@PathVariable UUID assignmentId) {
        List<Meeting> list = meetingRepository.findByAssignmentId(assignmentId);
        List<MeetingDTO> dtos = list.stream().map(this::mapToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // Schedule / Create New Meeting
    @PostMapping("/meetings/schedule")
    public ResponseEntity<?> scheduleMeeting(@RequestBody ScheduleMeetingRequest req) {
        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.EXPERT) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Admins and Experts can schedule new meetings");
        }

        UUID studentId = req.studentId();
        UUID expertId = req.expertId() != null ? req.expertId() : user.getId();

        if (studentId == null) {
            return ResponseEntity.badRequest().body("Student ID is required");
        }

        MeetingType mType;
        try {
            mType = MeetingType.valueOf(req.type().toUpperCase().replace(" ", "_"));
        } catch (Exception e) {
            mType = MeetingType.REQUIREMENT_DISCUSSION;
        }

        Instant scheduledInstant;
        try {
            scheduledInstant = Instant.parse(req.scheduledAt());
        } catch (Exception e) {
            scheduledInstant = Instant.now().plusSeconds(86400); // Tomorrow default
        }

        String platform = req.platform() != null && !req.platform().isEmpty() ? req.platform() : "Jitsi";
        String roomName = "av-overseas-" + UUID.randomUUID().toString().substring(0, 8);
        String link = (req.meetingLink() != null && !req.meetingLink().isEmpty()) 
                ? req.meetingLink() 
                : "https://meet.jit.si/" + roomName;

        String title = (req.title() != null && !req.title().isEmpty()) 
                ? req.title() 
                : formatMeetingTypeLabel(mType.name());

        Meeting meeting = Meeting.builder()
                .title(title)
                .assignmentId(req.assignmentId())
                .studentId(studentId)
                .expertId(expertId)
                .type(mType)
                .scheduledAt(scheduledInstant)
                .durationMinutes(req.durationMinutes() != null ? req.durationMinutes() : 45)
                .platform(platform)
                .meetingLink(link)
                .status(MeetingStatus.UPCOMING)
                .purpose(req.purpose() != null ? req.purpose() : "Mentorship & Academic Counseling Session")
                .expertNotes("")
                .discussionSummary("")
                .studentRequirements("")
                .recommendations("")
                .followUpActions("")
                .studentConfirmed(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Meeting saved = meetingRepository.save(meeting);

        // Notify Student
        notificationRepository.save(Notification.builder()
                .userId(studentId)
                .assignmentId(req.assignmentId())
                .type("MEETING_SCHEDULED")
                .title("New Mentorship Session Scheduled")
                .message("A new " + title + " session has been scheduled for " + scheduledInstant.toString())
                .read(false)
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(mapToDTO(saved));
    }

    // Get expert availability slots
    @GetMapping("/meetings/expert/{expertId}/availability")
    public ResponseEntity<?> getExpertAvailability(@PathVariable UUID expertId) {
        return ResponseEntity.ok(availabilityRepository.findByExpertIdAndActive(expertId, true));
    }

    // Expert submits availability
    @PostMapping("/meetings/availability")
    public ResponseEntity<?> addAvailability(@RequestBody AddAvailabilityRequest req) {
        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.EXPERT) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only experts can set availability");
        }

        ExpertAvailability availability = ExpertAvailability.builder()
                .expertId(user.getId())
                .dayOfWeek(req.dayOfWeek())
                .startTime(java.time.LocalTime.parse(req.startTime()))
                .endTime(java.time.LocalTime.parse(req.endTime()))
                .timezone(req.timezone())
                .active(true)
                .build();

        return ResponseEntity.ok(availabilityRepository.save(availability));
    }

    // Student books meeting
    @PostMapping("/meetings/book")
    public ResponseEntity<?> bookMeeting(@RequestBody BookMeetingRequest req) {
        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.STUDENT) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only students can book meetings");
        }

        Assignment assignment = assignmentRepository.findById(req.assignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!assignment.getStudentId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        if (assignment.getExpertId() == null) {
            return ResponseEntity.badRequest().body("No Expert has been assigned to this tutoring task yet");
        }

        MeetingType mType;
        try {
            mType = MeetingType.valueOf(req.type().toUpperCase().replace(" ", "_"));
        } catch (Exception e) {
            mType = MeetingType.REQUIREMENT_DISCUSSION;
        }

        Instant scheduledInstant = Instant.parse(req.scheduledAt());
        String roomName = "av-overseas-" + UUID.randomUUID().toString().substring(0, 8);
        String meetingLink = "https://meet.jit.si/" + roomName;

        Meeting meeting = Meeting.builder()
                .title(assignment.getTitle() + " - " + formatMeetingTypeLabel(mType.name()))
                .assignmentId(assignment.getId())
                .studentId(assignment.getStudentId())
                .expertId(assignment.getExpertId())
                .type(mType)
                .scheduledAt(scheduledInstant)
                .durationMinutes(45)
                .platform("Jitsi")
                .meetingLink(meetingLink)
                .status(MeetingStatus.UPCOMING)
                .purpose("Requirement discussion and scope clarification for " + assignment.getTitle())
                .expertNotes("")
                .discussionSummary("")
                .studentRequirements("")
                .recommendations("")
                .followUpActions("")
                .studentConfirmed(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Meeting saved = meetingRepository.save(meeting);

        // Update Assignment status
        AssignmentStatus oldStatus = assignment.getStatus();
        AssignmentStatus nextStatus = (mType == MeetingType.REQUIREMENT || mType == MeetingType.REQUIREMENT_DISCUSSION) 
                ? AssignmentStatus.REQUIREMENT_MEETING 
                : AssignmentStatus.EXPLANATION_MEETING;
        
        assignment.setStatus(nextStatus);
        assignment.setUpdatedAt(Instant.now());
        assignmentRepository.save(assignment);

        // Audit Log
        activityRepository.save(AssignmentActivity.builder()
                .assignmentId(assignment.getId())
                .actorId(user.getId())
                .action("MEETING_SCHEDULED")
                .oldStatus(oldStatus.name())
                .newStatus(nextStatus.name())
                .description(mType + " meeting scheduled for " + req.scheduledAt() + ". Room link generated.")
                .createdAt(Instant.now())
                .build());

        // Notify Expert
        notificationRepository.save(Notification.builder()
                .userId(assignment.getExpertId())
                .assignmentId(assignment.getId())
                .type("MEETING_SCHEDULED")
                .title("New Tutorial Meeting Scheduled")
                .message("A student has booked a " + mType + " meeting for assignment: " + assignment.getTitle())
                .read(false)
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(mapToDTO(saved));
    }

    // Submit / Update Meeting Notes
    @PostMapping("/meetings/{meetingId}/notes")
    public ResponseEntity<?> submitNotes(@PathVariable UUID meetingId, @RequestBody AddNotesRequest req) {
        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.EXPERT && user.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        if (req.notes() != null) meeting.setExpertNotes(req.notes());
        if (req.discussionSummary() != null) meeting.setDiscussionSummary(req.discussionSummary());
        if (req.studentRequirements() != null) meeting.setStudentRequirements(req.studentRequirements());
        if (req.recommendations() != null) meeting.setRecommendations(req.recommendations());
        if (req.followUpActions() != null) meeting.setFollowUpActions(req.followUpActions());
        if (req.nextMeetingDate() != null) meeting.setNextMeetingDate(req.nextMeetingDate());

        if (req.status() != null && !req.status().isEmpty()) {
            try {
                meeting.setStatus(MeetingStatus.valueOf(req.status().toUpperCase()));
            } catch (Exception ignored) {}
        } else if (meeting.getStatus() == MeetingStatus.UPCOMING || meeting.getStatus() == MeetingStatus.SCHEDULED || meeting.getStatus() == MeetingStatus.LIVE) {
            meeting.setStatus(MeetingStatus.COMPLETED);
        }

        meeting.setUpdatedAt(Instant.now());
        Meeting saved = meetingRepository.save(meeting);

        // Audit log
        if (meeting.getAssignmentId() != null) {
            activityRepository.save(AssignmentActivity.builder()
                    .assignmentId(meeting.getAssignmentId())
                    .actorId(user.getId())
                    .action("MEETING_NOTES_UPDATED")
                    .description(user.getName() + " updated meeting discussion notes and recommendations.")
                    .createdAt(Instant.now())
                    .build());
        }

        // Notify Student
        notificationRepository.save(Notification.builder()
                .userId(meeting.getStudentId())
                .assignmentId(meeting.getAssignmentId())
                .type("MEETING_NOTES_SUBMITTED")
                .title("Meeting Notes Updated")
                .message("Mentorship notes and recommendations have been updated for your session.")
                .read(false)
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(mapToDTO(saved));
    }

    // Update Meeting Status (e.g. UPCOMING, LIVE, COMPLETED, CANCELLED, NO_SHOW)
    @PostMapping("/meetings/{meetingId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable UUID meetingId, @RequestBody UpdateStatusRequest req) {
        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.EXPERT) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        try {
            MeetingStatus newStatus = MeetingStatus.valueOf(req.status().toUpperCase());
            meeting.setStatus(newStatus);
            meeting.setUpdatedAt(Instant.now());
            Meeting saved = meetingRepository.save(meeting);
            return ResponseEntity.ok(mapToDTO(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid meeting status: " + req.status());
        }
    }

    // Student confirms requirements
    @PostMapping("/meetings/{meetingId}/confirm")
    public ResponseEntity<?> confirmMeetingNotes(@PathVariable UUID meetingId) {
        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.STUDENT) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only students can confirm requirements");
        }

        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        if (!meeting.getStudentId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        meeting.setStudentConfirmed(true);
        meeting.setUpdatedAt(Instant.now());
        Meeting saved = meetingRepository.save(meeting);

        if (meeting.getAssignmentId() != null) {
            Assignment assignment = assignmentRepository.findById(meeting.getAssignmentId())
                    .orElseThrow(() -> new RuntimeException("Assignment not found"));
            
            AssignmentStatus oldStatus = assignment.getStatus();
            
            if (meeting.getType() == MeetingType.REQUIREMENT || meeting.getType() == MeetingType.REQUIREMENT_DISCUSSION) {
                assignment.setStatus(AssignmentStatus.IN_PROGRESS);
            } else {
                assignment.setStatus(AssignmentStatus.DELIVERED);
            }
            
            assignment.setUpdatedAt(Instant.now());
            assignmentRepository.save(assignment);

            // Audit log
            activityRepository.save(AssignmentActivity.builder()
                    .assignmentId(assignment.getId())
                    .actorId(user.getId())
                    .action("REQUIREMENTS_CONFIRMED")
                    .oldStatus(oldStatus.name())
                    .newStatus(assignment.getStatus().name())
                    .description("Student confirmed requirements. Status set to: " + assignment.getStatus())
                    .createdAt(Instant.now())
                    .build());
        }

        return ResponseEntity.ok(mapToDTO(saved));
    }

    private MeetingDTO mapToDTO(Meeting m) {
        String studentName = "Student";
        String studentEmail = "";
        if (m.getStudentId() != null) {
            Optional<User> u = userRepository.findById(m.getStudentId());
            if (u.isPresent()) {
                studentName = u.get().getName();
                studentEmail = u.get().getEmail();
            }
        }

        String expertName = "Expert Mentor";
        String expertEmail = "";
        if (m.getExpertId() != null) {
            Optional<User> u = userRepository.findById(m.getExpertId());
            if (u.isPresent()) {
                expertName = u.get().getName();
                expertEmail = u.get().getEmail();
            }
        }

        String assignmentTitle = "General Mentorship Program";
        String subject = "Study Abroad & Academic Guidance";
        if (m.getAssignmentId() != null) {
            Optional<Assignment> a = assignmentRepository.findById(m.getAssignmentId());
            if (a.isPresent()) {
                assignmentTitle = a.get().getTitle();
                subject = a.get().getSubject();
            }
        }

        String typeLabel = formatMeetingTypeLabel(m.getType() != null ? m.getType().name() : "REQUIREMENT_DISCUSSION");
        String title = (m.getTitle() != null && !m.getTitle().isEmpty()) ? m.getTitle() : typeLabel;

        return new MeetingDTO(
                m.getId().toString(),
                title,
                m.getAssignmentId() != null ? m.getAssignmentId().toString() : "",
                assignmentTitle,
                subject,
                m.getStudentId() != null ? m.getStudentId().toString() : "",
                studentName,
                studentEmail,
                m.getExpertId() != null ? m.getExpertId().toString() : "",
                expertName,
                expertEmail,
                m.getType() != null ? m.getType().name() : "REQUIREMENT_DISCUSSION",
                typeLabel,
                m.getScheduledAt() != null ? m.getScheduledAt() : Instant.now(),
                m.getDurationMinutes() != null ? m.getDurationMinutes() : 45,
                m.getPlatform() != null ? m.getPlatform() : "Jitsi",
                m.getMeetingLink() != null ? m.getMeetingLink() : "https://meet.jit.si/av-overseas-" + m.getId().toString().substring(0, 8),
                m.getStatus() != null ? m.getStatus().name() : "UPCOMING",
                m.getPurpose() != null ? m.getPurpose() : "Discuss academic requirements, university preferences and application roadmap.",
                m.getExpertNotes() != null ? m.getExpertNotes() : "",
                m.getDiscussionSummary() != null ? m.getDiscussionSummary() : "",
                m.getStudentRequirements() != null ? m.getStudentRequirements() : "",
                m.getRecommendations() != null ? m.getRecommendations() : "",
                m.getFollowUpActions() != null ? m.getFollowUpActions() : "",
                m.getNextMeetingDate() != null ? m.getNextMeetingDate() : "",
                m.getStudentConfirmed() != null ? m.getStudentConfirmed() : false,
                m.getCreatedAt() != null ? m.getCreatedAt() : Instant.now(),
                m.getUpdatedAt() != null ? m.getUpdatedAt() : Instant.now()
        );
    }

    private String formatMeetingTypeLabel(String raw) {
        if (raw == null) return "Mentorship Session";
        return switch (raw) {
            case "REQUIREMENT", "REQUIREMENT_DISCUSSION" -> "Requirement Discussion";
            case "ACADEMIC_COUNSELING" -> "Academic Counseling";
            case "TUTORING_SESSION" -> "Tutoring Session";
            case "MOCK_INTERVIEW" -> "Mock Interview";
            case "UNIVERSITY_SELECTION" -> "University Selection";
            case "APPLICATION_GUIDANCE" -> "Application Guidance";
            case "FOLLOW_UP_MEETING" -> "Follow-up Meeting";
            case "EXPLANATION" -> "Solution Walkthrough";
            default -> Arrays.stream(raw.split("_"))
                    .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
                    .collect(Collectors.joining(" "));
        };
    }
}
