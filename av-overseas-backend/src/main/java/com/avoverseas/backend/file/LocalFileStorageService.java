package com.avoverseas.backend.file;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class LocalFileStorageService implements FileStorageService {

    @Value("${app.upload.dir:./data/uploads}")
    private String uploadDir;

    @Override
    public String storeFile(String assignmentId, String category, String filename, byte[] content) {
        try {
            // Build storageKey structure similar to S3
            String fileId = UUID.randomUUID().toString();
            String extension = "";
            int dotIdx = filename.lastIndexOf('.');
            if (dotIdx > 0) {
                extension = filename.substring(dotIdx);
            }
            
            String storageKey = String.format("assignments/%s/%s/%s%s", assignmentId, category, fileId, extension);
            
            // Resolve local directory paths
            Path targetPath = Paths.get(uploadDir, storageKey);
            Files.createDirectories(targetPath.getParent());
            Files.write(targetPath, content);
            
            return storageKey;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file locally", e);
        }
    }

    @Override
    public byte[] loadFile(String storageKey) {
        try {
            Path filePath = Paths.get(uploadDir, storageKey);
            if (!Files.exists(filePath)) {
                throw new RuntimeException("File not found at storage path: " + storageKey);
            }
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file from local storage", e);
        }
    }

    @Override
    public String getDownloadUrl(String storageKey) {
        // Return a mock download endpoint route
        return "/api/v1/files/download?key=" + storageKey;
    }
}
