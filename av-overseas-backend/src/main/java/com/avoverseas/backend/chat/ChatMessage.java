package com.avoverseas.backend.chat;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "assignment_id", nullable = false)
    private UUID assignmentId;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Column(name = "receiver_id", nullable = false)
    private UUID receiverId;

    @Column(name = "message_text", nullable = false, columnDefinition = "TEXT")
    private String messageText;

    @Column(name = "contains_contact_info", nullable = false)
    private Boolean containsContactInfo;

    @Column(name = "moderation_action", nullable = false)
    private String moderationAction; // e.g. "NONE", "REDACTED"

    @Column(nullable = false)
    private Instant createdAt;

    public ChatMessage() {
    }

    public ChatMessage(UUID id, UUID assignmentId, UUID senderId, UUID receiverId, String messageText, Boolean containsContactInfo, String moderationAction, Instant createdAt) {
        this.id = id;
        this.assignmentId = assignmentId;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.messageText = messageText;
        this.containsContactInfo = containsContactInfo;
        this.moderationAction = moderationAction;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(UUID assignmentId) {
        this.assignmentId = assignmentId;
    }

    public UUID getSenderId() {
        return senderId;
    }

    public void setSenderId(UUID senderId) {
        this.senderId = senderId;
    }

    public UUID getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(UUID receiverId) {
        this.receiverId = receiverId;
    }

    public String getMessageText() {
        return messageText;
    }

    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }

    public Boolean getContainsContactInfo() {
        return containsContactInfo;
    }

    public void setContainsContactInfo(Boolean containsContactInfo) {
        this.containsContactInfo = containsContactInfo;
    }

    public String getModerationAction() {
        return moderationAction;
    }

    public void setModerationAction(String moderationAction) {
        this.moderationAction = moderationAction;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public static ChatMessageBuilder builder() {
        return new ChatMessageBuilder();
    }

    public static class ChatMessageBuilder {
        private UUID id;
        private UUID assignmentId;
        private UUID senderId;
        private UUID receiverId;
        private String messageText;
        private Boolean containsContactInfo;
        private String moderationAction;
        private Instant createdAt;

        ChatMessageBuilder() {
        }

        public ChatMessageBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public ChatMessageBuilder assignmentId(UUID assignmentId) {
            this.assignmentId = assignmentId;
            return this;
        }

        public ChatMessageBuilder senderId(UUID senderId) {
            this.senderId = senderId;
            return this;
        }

        public ChatMessageBuilder receiverId(UUID receiverId) {
            this.receiverId = receiverId;
            return this;
        }

        public ChatMessageBuilder messageText(String messageText) {
            this.messageText = messageText;
            return this;
        }

        public ChatMessageBuilder containsContactInfo(Boolean containsContactInfo) {
            this.containsContactInfo = containsContactInfo;
            return this;
        }

        public ChatMessageBuilder moderationAction(String moderationAction) {
            this.moderationAction = moderationAction;
            return this;
        }

        public ChatMessageBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ChatMessage build() {
            return new ChatMessage(id, assignmentId, senderId, receiverId, messageText, containsContactInfo, moderationAction, createdAt);
        }
    }
}
