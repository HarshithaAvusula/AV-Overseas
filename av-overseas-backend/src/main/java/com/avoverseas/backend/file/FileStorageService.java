package com.avoverseas.backend.file;

public interface FileStorageService {
    String storeFile(String assignmentId, String category, String filename, byte[] content);
    byte[] loadFile(String storageKey);
    String getDownloadUrl(String storageKey);
}
