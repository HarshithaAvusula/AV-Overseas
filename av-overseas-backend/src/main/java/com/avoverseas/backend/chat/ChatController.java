package com.avoverseas.backend.chat;

import com.avoverseas.backend.assignment.Assignment;
import com.avoverseas.backend.assignment.AssignmentRepository;
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
@RequestMapping("/api/v1/chat")
public class ChatController {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatModerationService moderationService;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    public record SendMessageRequest(UUID assignmentId, String text) {}

    // Get Chat History
    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<?> getChatHistory(@PathVariable UUID assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.ADMIN && 
            !user.getId().equals(assignment.getStudentId()) && 
            !user.getId().equals(assignment.getExpertId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        List<ChatMessage> history = chatMessageRepository.findByAssignmentIdOrderByCreatedAtAsc(assignmentId);
        return ResponseEntity.ok(history);
    }

    // Send Message
    @PostMapping("/message")
    public ResponseEntity<?> sendMessage(@RequestBody SendMessageRequest req) {
        Assignment assignment = assignmentRepository.findById(req.assignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        User sender = getAuthenticatedUser();
        if (sender.getRole() != UserRole.ADMIN && 
            !sender.getId().equals(assignment.getStudentId()) && 
            !sender.getId().equals(assignment.getExpertId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        // Determine Receiver
        UUID receiverId;
        if (sender.getId().equals(assignment.getStudentId())) {
            receiverId = assignment.getExpertId();
        } else {
            receiverId = assignment.getStudentId();
        }

        if (receiverId == null) {
            return ResponseEntity.badRequest().body("No tutor is assigned to chat with yet");
        }

        // Moderate Chat Message Text
        ChatModerationService.ModerationResult modResult = moderationService.moderate(req.text());

        ChatMessage message = ChatMessage.builder()
                .assignmentId(assignment.getId())
                .senderId(sender.getId())
                .receiverId(receiverId)
                .messageText(modResult.moderatedText)
                .containsContactInfo(modResult.containsContactInfo)
                .moderationAction(modResult.moderationAction)
                .createdAt(Instant.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        return ResponseEntity.ok(saved);
    }
}
