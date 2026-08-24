package com.avoverseas.backend.assignment;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assignments")
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "expert_id")
    private UUID expertId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(nullable = false)
    private Instant deadline;

    @Column(name = "word_count")
    private Integer wordCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    public Assignment() {
    }

    public Assignment(UUID id, UUID studentId, UUID expertId, String title, String subject, String description, String instructions, Instant deadline, Integer wordCount, AssignmentStatus status, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.studentId = studentId;
        this.expertId = expertId;
        this.title = title;
        this.subject = subject;
        this.description = description;
        this.instructions = instructions;
        this.deadline = deadline;
        this.wordCount = wordCount;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public Instant getDeadline() {
        return deadline;
    }

    public void setDeadline(Instant deadline) {
        this.deadline = deadline;
    }

    public Integer getWordCount() {
        return wordCount;
    }

    public void setWordCount(Integer wordCount) {
        this.wordCount = wordCount;
    }

    public AssignmentStatus getStatus() {
        return status;
    }

    public void setStatus(AssignmentStatus status) {
        this.status = status;
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

    public static AssignmentBuilder builder() {
        return new AssignmentBuilder();
    }

    public static class AssignmentBuilder {
        private UUID id;
        private UUID studentId;
        private UUID expertId;
        private String title;
        private String subject;
        private String description;
        private String instructions;
        private Instant deadline;
        private Integer wordCount;
        private AssignmentStatus status;
        private Instant createdAt;
        private Instant updatedAt;

        AssignmentBuilder() {
        }

        public AssignmentBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public AssignmentBuilder studentId(UUID studentId) {
            this.studentId = studentId;
            return this;
        }

        public AssignmentBuilder expertId(UUID expertId) {
            this.expertId = expertId;
            return this;
        }

        public AssignmentBuilder title(String title) {
            this.title = title;
            return this;
        }

        public AssignmentBuilder subject(String subject) {
            this.subject = subject;
            return this;
        }

        public AssignmentBuilder description(String description) {
            this.description = description;
            return this;
        }

        public AssignmentBuilder instructions(String instructions) {
            this.instructions = instructions;
            return this;
        }

        public AssignmentBuilder deadline(Instant deadline) {
            this.deadline = deadline;
            return this;
        }

        public AssignmentBuilder wordCount(Integer wordCount) {
            this.wordCount = wordCount;
            return this;
        }

        public AssignmentBuilder status(AssignmentStatus status) {
            this.status = status;
            return this;
        }

        public AssignmentBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public AssignmentBuilder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Assignment build() {
            return new Assignment(id, studentId, expertId, title, subject, description, instructions, deadline, wordCount, status, createdAt, updatedAt);
        }
    }
}
