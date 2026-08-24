package com.avoverseas.backend.meeting;

import jakarta.persistence.*;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "expert_availabilities")
public class ExpertAvailability {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "expert_id", nullable = false)
    private UUID expertId;

    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek; // 1 = Monday, 7 = Sunday

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private String timezone; // e.g. "Asia/Kolkata", "UTC"

    @Column(nullable = false)
    private Boolean active;

    public ExpertAvailability() {
    }

    public ExpertAvailability(UUID id, UUID expertId, Integer dayOfWeek, LocalTime startTime, LocalTime endTime, String timezone, Boolean active) {
        this.id = id;
        this.expertId = expertId;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.timezone = timezone;
        this.active = active;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getExpertId() {
        return expertId;
    }

    public void setExpertId(UUID expertId) {
        this.expertId = expertId;
    }

    public Integer getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(Integer dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public static ExpertAvailabilityBuilder builder() {
        return new ExpertAvailabilityBuilder();
    }

    public static class ExpertAvailabilityBuilder {
        private UUID id;
        private UUID expertId;
        private Integer dayOfWeek;
        private LocalTime startTime;
        private LocalTime endTime;
        private String timezone;
        private Boolean active;

        ExpertAvailabilityBuilder() {
        }

        public ExpertAvailabilityBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public ExpertAvailabilityBuilder expertId(UUID expertId) {
            this.expertId = expertId;
            return this;
        }

        public ExpertAvailabilityBuilder dayOfWeek(Integer dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
            return this;
        }

        public ExpertAvailabilityBuilder startTime(LocalTime startTime) {
            this.startTime = startTime;
            return this;
        }

        public ExpertAvailabilityBuilder endTime(LocalTime endTime) {
            this.endTime = endTime;
            return this;
        }

        public ExpertAvailabilityBuilder timezone(String timezone) {
            this.timezone = timezone;
            return this;
        }

        public ExpertAvailabilityBuilder active(Boolean active) {
            this.active = active;
            return this;
        }

        public ExpertAvailability build() {
            return new ExpertAvailability(id, expertId, dayOfWeek, startTime, endTime, timezone, active);
        }
    }
}
