package com.avoverseas.backend.payout;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "expert_payouts")
public class ExpertPayout {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "assignment_id", nullable = false)
    private UUID assignmentId;

    @Column(name = "expert_id", nullable = false)
    private UUID expertId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExpertPayoutStatus status;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "released_at")
    private Instant releasedAt;

    @Column(nullable = false)
    private Instant createdAt;

    public ExpertPayout() {
    }

    public ExpertPayout(UUID id, UUID assignmentId, UUID expertId, BigDecimal amount, ExpertPayoutStatus status, Instant approvedAt, Instant releasedAt, Instant createdAt) {
        this.id = id;
        this.assignmentId = assignmentId;
        this.expertId = expertId;
        this.amount = amount;
        this.status = status;
        this.approvedAt = approvedAt;
        this.releasedAt = releasedAt;
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

    public UUID getExpertId() {
        return expertId;
    }

    public void setExpertId(UUID expertId) {
        this.expertId = expertId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public ExpertPayoutStatus getStatus() {
        return status;
    }

    public void setStatus(ExpertPayoutStatus status) {
        this.status = status;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(Instant approvedAt) {
        this.approvedAt = approvedAt;
    }

    public Instant getReleasedAt() {
        return releasedAt;
    }

    public void setReleasedAt(Instant releasedAt) {
        this.releasedAt = releasedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public static ExpertPayoutBuilder builder() {
        return new ExpertPayoutBuilder();
    }

    public static class ExpertPayoutBuilder {
        private UUID id;
        private UUID assignmentId;
        private UUID expertId;
        private BigDecimal amount;
        private ExpertPayoutStatus status;
        private Instant approvedAt;
        private Instant releasedAt;
        private Instant createdAt;

        ExpertPayoutBuilder() {
        }

        public ExpertPayoutBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public ExpertPayoutBuilder assignmentId(UUID assignmentId) {
            this.assignmentId = assignmentId;
            return this;
        }

        public ExpertPayoutBuilder expertId(UUID expertId) {
            this.expertId = expertId;
            return this;
        }

        public ExpertPayoutBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public ExpertPayoutBuilder status(ExpertPayoutStatus status) {
            this.status = status;
            return this;
        }

        public ExpertPayoutBuilder approvedAt(Instant approvedAt) {
            this.approvedAt = approvedAt;
            return this;
        }

        public ExpertPayoutBuilder releasedAt(Instant releasedAt) {
            this.releasedAt = releasedAt;
            return this;
        }

        public ExpertPayoutBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ExpertPayout build() {
            return new ExpertPayout(id, assignmentId, expertId, amount, status, approvedAt, releasedAt, createdAt);
        }
    }
}
