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
import java.util.List;
import java.util.UUID;

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
    public record AddNotesRequest(String notes) {}
    public record AddAvailabilityRequest(Integer dayOfWeek, String startTime, String endTime, String timezone) {}

    // Get meetings for assignment
    @GetMapping("/meetings/assignment/{assignmentId}")
    public ResponseEntity<?> getMeetingsForAssignment(@PathVariable UUID assignmentId) {
        return ResponseEntity.ok(meetingRepository.findByAssignmentId(assignmentId));
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

        MeetingType mType = MeetingType.valueOf(req.type().toUpperCase());
        Instant scheduledInstant = Instant.parse(req.scheduledAt());

        // Platform generates dedicated link using Jitsi / mock meeting room ID
        String roomName = "av-overseas-" + UUID.randomUUID().toString().substring(0, 8);
        String meetingLink = "https://meet.jit.si/" + roomName;

        Meeting meeting = Meeting.builder()
                .assignmentId(assignment.getId())
                .studentId(assignment.getStudentId())
                .expertId(assignment.getExpertId())
                .type(mType)
                .scheduledAt(scheduledInstant)
                .meetingLink(meetingLink)
                .status(MeetingStatus.SCHEDULED)
                .expertNotes("")
                .studentConfirmed(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Meeting saved = meetingRepository.save(meeting);

        // Update Assignment status
        AssignmentStatus oldStatus = assignment.getStatus();
        AssignmentStatus nextStatus = (mType == MeetingType.REQUIREMENT) 
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

        return ResponseEntity.ok(saved);
    }

    // Expert submits notes post-meeting
    @PostMapping("/meetings/{meetingId}/notes")
    public ResponseEntity<?> submitNotes(@PathVariable UUID meetingId, @RequestBody AddNotesRequest req) {
        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.EXPERT) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only experts can submit meeting notes");
        }

        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        if (!meeting.getExpertId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        meeting.setExpertNotes(req.notes());
        meeting.setStatus(MeetingStatus.COMPLETED);
        meeting.setUpdatedAt(Instant.now());
        Meeting saved = meetingRepository.save(meeting);

        // Audit log
        activityRepository.save(AssignmentActivity.builder()
                .assignmentId(meeting.getAssignmentId())
                .actorId(user.getId())
                .action("MEETING_COMPLETED")
                .description("Expert completed meeting and uploaded requirements notes.")
                .createdAt(Instant.now())
                .build());

        // Notify Student
        notificationRepository.save(Notification.builder()
                .userId(meeting.getStudentId())
                .assignmentId(meeting.getAssignmentId())
                .type("MEETING_NOTES_SUBMITTED")
                .title("Meeting Notes Submitted")
                .message("Expert has submitted requirements notes. Please verify and confirm them.")
                .read(false)
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(saved);
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
        meetingRepository.save(meeting);

        // Update Assignment status
        Assignment assignment = assignmentRepository.findById(meeting.getAssignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        AssignmentStatus oldStatus = assignment.getStatus();
        
        if (meeting.getType() == MeetingType.REQUIREMENT) {
            assignment.setStatus(AssignmentStatus.REQUIREMENT_CONFIRMED);
            // Progress immediately to In Progress to let Expert start work
            assignment.setStatus(AssignmentStatus.IN_PROGRESS);
        } else {
            // Explanation Meeting complete, delivery accepted
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

        // Notify Expert
        notificationRepository.save(Notification.builder()
                .userId(meeting.getExpertId())
                .assignmentId(assignment.getId())
                .type("REQUIREMENTS_CONFIRMED")
                .title("Requirements Confirmed!")
                .message("Student has confirmed the requirements. You can now start drafting the tutorial.")
                .read(false)
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(meeting);
    }
}
