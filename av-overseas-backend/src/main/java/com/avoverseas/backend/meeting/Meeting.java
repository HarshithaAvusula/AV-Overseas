package com.avoverseas.backend.meeting;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "meetings")
public class Meeting {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "assignment_id", nullable = false)
    private UUID assignmentId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "expert_id", nullable = false)
    private UUID expertId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MeetingType type;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Column(name = "meeting_link", nullable = false)
    private String meetingLink;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MeetingStatus status;

    @Column(name = "expert_notes", columnDefinition = "TEXT")
    private String expertNotes;

    @Column(name = "student_confirmed", nullable = false)
    private Boolean studentConfirmed;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    public Meeting() {
    }

    public Meeting(UUID id, UUID assignmentId, UUID studentId, UUID expertId, MeetingType type, Instant scheduledAt, String meetingLink, MeetingStatus status, String expertNotes, Boolean studentConfirmed, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.assignmentId = assignmentId;
        this.studentId = studentId;
        this.expertId = expertId;
        this.type = type;
        this.scheduledAt = scheduledAt;
        this.meetingLink = meetingLink;
        this.status = status;
        this.expertNotes = expertNotes;
        this.studentConfirmed = studentConfirmed;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public UUID getStudentId() {
        return studentId;
    }

    public void setStudentId(UUID studentId) {
        this.studentId = studentId;
    }

    public UUID getExpertId() {
        return expertId;
    }

    public void setExpertId(UUID expertId) {
        this.expertId = expertId;
    }

    public MeetingType getType() {
        return type;
    }

    public void setType(MeetingType type) {
        this.type = type;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(Instant scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public String getMeetingLink() {
        return meetingLink;
    }

    public void setMeetingLink(String meetingLink) {
        this.meetingLink = meetingLink;
    }

    public MeetingStatus getStatus() {
        return status;
    }

    public void setStatus(MeetingStatus status) {
        this.status = status;
    }

    public String getExpertNotes() {
        return expertNotes;
    }

    public void setExpertNotes(String expertNotes) {
        this.expertNotes = expertNotes;
    }

    public Boolean getStudentConfirmed() {
        return studentConfirmed;
    }

    public void setStudentConfirmed(Boolean studentConfirmed) {
        this.studentConfirmed = studentConfirmed;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static MeetingBuilder builder() {
        return new MeetingBuilder();
    }

    public static class MeetingBuilder {
        private UUID id;
        private UUID assignmentId;
        private UUID studentId;
        private UUID expertId;
        private MeetingType type;
        private Instant scheduledAt;
        private String meetingLink;
        private MeetingStatus status;
        private String expertNotes;
        private Boolean studentConfirmed;
        private Instant createdAt;
        private Instant updatedAt;

        MeetingBuilder() {
        }

        public MeetingBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public MeetingBuilder assignmentId(UUID assignmentId) {
            this.assignmentId = assignmentId;
            return this;
        }

        public MeetingBuilder studentId(UUID studentId) {
            this.studentId = studentId;
            return this;
        }

        public MeetingBuilder expertId(UUID expertId) {
            this.expertId = expertId;
            return this;
        }

        public MeetingBuilder type(MeetingType type) {
            this.type = type;
            return this;
        }

        public MeetingBuilder scheduledAt(Instant scheduledAt) {
            this.scheduledAt = scheduledAt;
            return this;
        }

        public MeetingBuilder meetingLink(String meetingLink) {
            this.meetingLink = meetingLink;
            return this;
        }

        public MeetingBuilder status(MeetingStatus status) {
            this.status = status;
            return this;
        }

        public MeetingBuilder expertNotes(String expertNotes) {
            this.expertNotes = expertNotes;
            return this;
        }

        public MeetingBuilder studentConfirmed(Boolean studentConfirmed) {
            this.studentConfirmed = studentConfirmed;
            return this;
        }

        public MeetingBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public MeetingBuilder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Meeting build() {
            return new Meeting(id, assignmentId, studentId, expertId, type, scheduledAt, meetingLink, status, expertNotes, studentConfirmed, createdAt, updatedAt);
        }
    }
}
