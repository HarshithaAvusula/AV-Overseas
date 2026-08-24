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

    @Column(name = "title")
    private String title;

    @Column(name = "assignment_id")
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

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "platform")
    private String platform;

    @Column(name = "meeting_link", nullable = false)
    private String meetingLink;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MeetingStatus status;

    @Column(name = "purpose", columnDefinition = "TEXT")
    private String purpose;

    @Column(name = "expert_notes", columnDefinition = "TEXT")
    private String expertNotes;

    @Column(name = "discussion_summary", columnDefinition = "TEXT")
    private String discussionSummary;

    @Column(name = "student_requirements", columnDefinition = "TEXT")
    private String studentRequirements;

    @Column(name = "recommendations", columnDefinition = "TEXT")
    private String recommendations;

    @Column(name = "follow_up_actions", columnDefinition = "TEXT")
    private String followUpActions;

    @Column(name = "next_meeting_date")
    private String nextMeetingDate;

    @Column(name = "student_confirmed", nullable = false)
    private Boolean studentConfirmed;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    public Meeting() {
    }

    public Meeting(UUID id, String title, UUID assignmentId, UUID studentId, UUID expertId, MeetingType type, Instant scheduledAt, Integer durationMinutes, String platform, String meetingLink, MeetingStatus status, String purpose, String expertNotes, String discussionSummary, String studentRequirements, String recommendations, String followUpActions, String nextMeetingDate, Boolean studentConfirmed, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.title = title;
        this.assignmentId = assignmentId;
        this.studentId = studentId;
        this.expertId = expertId;
        this.type = type;
        this.scheduledAt = scheduledAt;
        this.durationMinutes = durationMinutes != null ? durationMinutes : 45;
        this.platform = platform != null ? platform : "Jitsi";
        this.meetingLink = meetingLink;
        this.status = status;
        this.purpose = purpose;
        this.expertNotes = expertNotes;
        this.discussionSummary = discussionSummary;
        this.studentRequirements = studentRequirements;
        this.recommendations = recommendations;
        this.followUpActions = followUpActions;
        this.nextMeetingDate = nextMeetingDate;
        this.studentConfirmed = studentConfirmed != null ? studentConfirmed : false;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public Integer getDurationMinutes() {
        return durationMinutes != null ? durationMinutes : 45;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public String getPlatform() {
        return platform != null ? platform : "Jitsi";
    }

    public void setPlatform(String platform) {
        this.platform = platform;
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

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getExpertNotes() {
        return expertNotes;
    }

    public void setExpertNotes(String expertNotes) {
        this.expertNotes = expertNotes;
    }

    public String getDiscussionSummary() {
        return discussionSummary;
    }

    public void setDiscussionSummary(String discussionSummary) {
        this.discussionSummary = discussionSummary;
    }

    public String getStudentRequirements() {
        return studentRequirements;
    }

    public void setStudentRequirements(String studentRequirements) {
        this.studentRequirements = studentRequirements;
    }

    public String getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(String recommendations) {
        this.recommendations = recommendations;
    }

    public String getFollowUpActions() {
        return followUpActions;
    }

    public void setFollowUpActions(String followUpActions) {
        this.followUpActions = followUpActions;
    }

    public String getNextMeetingDate() {
        return nextMeetingDate;
    }

    public void setNextMeetingDate(String nextMeetingDate) {
        this.nextMeetingDate = nextMeetingDate;
    }

    public Boolean getStudentConfirmed() {
        return studentConfirmed != null ? studentConfirmed : false;
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
        private String title;
        private UUID assignmentId;
        private UUID studentId;
        private UUID expertId;
        private MeetingType type;
        private Instant scheduledAt;
        private Integer durationMinutes = 45;
        private String platform = "Jitsi";
        private String meetingLink;
        private MeetingStatus status = MeetingStatus.UPCOMING;
        private String purpose;
        private String expertNotes;
        private String discussionSummary;
        private String studentRequirements;
        private String recommendations;
        private String followUpActions;
        private String nextMeetingDate;
        private Boolean studentConfirmed = false;
        private Instant createdAt = Instant.now();
        private Instant updatedAt = Instant.now();

        MeetingBuilder() {
        }

        public MeetingBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public MeetingBuilder title(String title) {
            this.title = title;
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

        public MeetingBuilder durationMinutes(Integer durationMinutes) {
            this.durationMinutes = durationMinutes;
            return this;
        }

        public MeetingBuilder platform(String platform) {
            this.platform = platform;
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

        public MeetingBuilder purpose(String purpose) {
            this.purpose = purpose;
            return this;
        }

        public MeetingBuilder expertNotes(String expertNotes) {
            this.expertNotes = expertNotes;
            return this;
        }

        public MeetingBuilder discussionSummary(String discussionSummary) {
            this.discussionSummary = discussionSummary;
            return this;
        }

        public MeetingBuilder studentRequirements(String studentRequirements) {
            this.studentRequirements = studentRequirements;
            return this;
        }

        public MeetingBuilder recommendations(String recommendations) {
            this.recommendations = recommendations;
            return this;
        }

        public MeetingBuilder followUpActions(String followUpActions) {
            this.followUpActions = followUpActions;
            return this;
        }

        public MeetingBuilder nextMeetingDate(String nextMeetingDate) {
            this.nextMeetingDate = nextMeetingDate;
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
            return new Meeting(id, title, assignmentId, studentId, expertId, type, scheduledAt, durationMinutes, platform, meetingLink, status, purpose, expertNotes, discussionSummary, studentRequirements, recommendations, followUpActions, nextMeetingDate, studentConfirmed, createdAt, updatedAt);
        }
    }
}
