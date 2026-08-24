package com.avoverseas.backend.assignment;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assignment_files")
public class AssignmentFile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "assignment_id", nullable = false)
    private UUID assignmentId;

    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", nullable = false)
    private FileType fileType;

    @Column(name = "original_file_name", nullable = false)
    private String originalFileName;

    @Column(name = "mime_type")
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(nullable = false)
    private Integer version;

    @Column(nullable = false)
    private Instant createdAt;

    public AssignmentFile() {
    }

    public AssignmentFile(UUID id, UUID assignmentId, UUID uploadedBy, FileType fileType, String originalFileName, String mimeType, Long fileSize, String storageKey, Integer version, Instant createdAt) {
        this.id = id;
        this.assignmentId = assignmentId;
        this.uploadedBy = uploadedBy;
        this.fileType = fileType;
        this.originalFileName = originalFileName;
        this.mimeType = mimeType;
        this.fileSize = fileSize;
        this.storageKey = storageKey;
        this.version = version;
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

    public UUID getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(UUID uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public FileType getFileType() {
        return fileType;
    }

    public void setFileType(FileType fileType) {
        this.fileType = fileType;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public static AssignmentFileBuilder builder() {
        return new AssignmentFileBuilder();
    }

    public static class AssignmentFileBuilder {
        private UUID id;
        private UUID assignmentId;
        private UUID uploadedBy;
        private FileType fileType;
        private String originalFileName;
        private String mimeType;
        private Long fileSize;
        private String storageKey;
        private Integer version;
        private Instant createdAt;

        AssignmentFileBuilder() {
        }

        public AssignmentFileBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public AssignmentFileBuilder assignmentId(UUID assignmentId) {
            this.assignmentId = assignmentId;
            return this;
        }

        public AssignmentFileBuilder uploadedBy(UUID uploadedBy) {
            this.uploadedBy = uploadedBy;
            return this;
        }

        public AssignmentFileBuilder fileType(FileType fileType) {
            this.fileType = fileType;
            return this;
        }

        public AssignmentFileBuilder originalFileName(String originalFileName) {
            this.originalFileName = originalFileName;
            return this;
        }

        public AssignmentFileBuilder mimeType(String mimeType) {
            this.mimeType = mimeType;
            return this;
        }

        public AssignmentFileBuilder fileSize(Long fileSize) {
            this.fileSize = fileSize;
            return this;
        }

        public AssignmentFileBuilder storageKey(String storageKey) {
            this.storageKey = storageKey;
            return this;
        }

        public AssignmentFileBuilder version(Integer version) {
            this.version = version;
            return this;
        }

        public AssignmentFileBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public AssignmentFile build() {
            return new AssignmentFile(id, assignmentId, uploadedBy, fileType, originalFileName, mimeType, fileSize, storageKey, version, createdAt);
        }
    }
}
