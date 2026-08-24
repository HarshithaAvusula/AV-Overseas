package com.avoverseas.backend.audit;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assignment_activities")
public class AssignmentActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "assignment_id", nullable = false)
    private UUID assignmentId;

    @Column(name = "actor_id", nullable = false)
    private UUID actorId;

    @Column(nullable = false)
    private String action;

    @Column(name = "old_status")
    private String oldStatus;

    @Column(name = "new_status")
    private String newStatus;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Instant createdAt;

    public AssignmentActivity() {
    }

    public AssignmentActivity(UUID id, UUID assignmentId, UUID actorId, String action, String oldStatus, String newStatus, String description, Instant createdAt) {
        this.id = id;
        this.assignmentId = assignmentId;
        this.actorId = actorId;
        this.action = action;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.description = description;
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

    public UUID getActorId() {
        return actorId;
    }

    public void setActorId(UUID actorId) {
        this.actorId = actorId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getOldStatus() {
        return oldStatus;
    }

    public void setOldStatus(String oldStatus) {
        this.oldStatus = oldStatus;
    }

    public String getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(String newStatus) {
        this.newStatus = newStatus;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public static AssignmentActivityBuilder builder() {
        return new AssignmentActivityBuilder();
    }

    public static class AssignmentActivityBuilder {
        private UUID id;
        private UUID assignmentId;
        private UUID actorId;
        private String action;
        private String oldStatus;
        private String newStatus;
        private String description;
        private Instant createdAt;

        AssignmentActivityBuilder() {
        }

        public AssignmentActivityBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public AssignmentActivityBuilder assignmentId(UUID assignmentId) {
            this.assignmentId = assignmentId;
            return this;
        }

        public AssignmentActivityBuilder actorId(UUID actorId) {
            this.actorId = actorId;
            return this;
        }

        public AssignmentActivityBuilder action(String action) {
            this.action = action;
            return this;
        }

        public AssignmentActivityBuilder oldStatus(String oldStatus) {
            this.oldStatus = oldStatus;
            return this;
        }

        public AssignmentActivityBuilder newStatus(String newStatus) {
            this.newStatus = newStatus;
            return this;
        }

        public AssignmentActivityBuilder description(String description) {
            this.description = description;
            return this;
        }

        public AssignmentActivityBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public AssignmentActivity build() {
            return new AssignmentActivity(id, assignmentId, actorId, action, oldStatus, newStatus, description, createdAt);
        }
    }
}
