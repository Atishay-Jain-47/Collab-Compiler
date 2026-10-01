package com.example.demo.service;

import com.example.demo.entity.types.Language;
import com.example.demo.entity.types.Session;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Service responsible for writing execution source code and stdin content
 * to isolated temporary files on the local filesystem.
 */
@Service
@Slf4j
public class SaveFileService {
    @Value("${BASE_DIR}")
    private String BASE_DIR;

    /**
     * Persists session code and standard input to sanitized user directories.
     *
     * @param session active execution session
     */
    public void saveFile(Session session) {
        Language language = session.getLanguage();
        String userName = session.getUserName();
        if (userName == null || userName.trim().isEmpty()) {
            userName = "guest_" + session.getSessionId();
        } else {
            userName = userName.replaceAll("[^a-zA-Z0-9_-]", "_");
        }

        String code = session.getCode() != null ? session.getCode() : "";
        String input = session.getInput() != null ? session.getInput() : "";

        String base = BASE_DIR.endsWith(File.separator) || BASE_DIR.endsWith("/") ? BASE_DIR : BASE_DIR + File.separator;
        // Append sessionId to isolate concurrent executions by the same user.
        // Without this, two parallel runs for the same user would share the same
        // directory and overwrite each other's source/input files.
        String dirPath = base + userName + "_" + session.getSessionId() + File.separator;

        String fileName = switch (language) {
            case PYTHON -> "main.py";
            case CPP -> "main.cpp";
            case C -> "main.c";
            case JAVA -> "Main.java";
            case GO -> "main.go";
            case JS -> "main.js";
            case RUST -> "main.rs";
            case TYPESCRIPT -> "main.ts";
            case PHP -> "main.php";
            case RUBY -> "main.rb";
            case BASH -> "main.sh";
            default -> throw new IllegalArgumentException(language + " is not supported");
        };

        String codeFilePath = dirPath + fileName;
        String inputFilePath = dirPath + "input.txt";

        save(code, dirPath, fileName);
        save(input, dirPath, "input.txt");

        session.setCodePath(codeFilePath);
        session.setInputPath(inputFilePath);
    }

    private void save(String content, String dirPath, String fileName) {
        try {
            Path dir = Paths.get(dirPath);
            Files.createDirectories(dir);
            Path filePath = dir.resolve(fileName);
            Files.writeString(filePath, content != null ? content : "", StandardCharsets.UTF_8);
            log.info("File saved at: {}", filePath.toAbsolutePath());
        } catch (IOException e) {
            log.error("Failed to save file: {} in directory: {}", fileName, dirPath, e);
            throw new RuntimeException("Error saving file: " + e.getMessage(), e);
        }
    }

    /**
     * Cleans up the temporary source files, inputs, and compiled artifacts
     * generated for the session to prevent host disk accumulation.
     */
    public void cleanupSession(Session session) {
        if (session == null || session.getCodePath() == null || session.getCodePath().trim().isEmpty()) {
            return;
        }

        try {
            Path codeFile = Paths.get(session.getCodePath());
            Path userDir = codeFile.getParent();
            if (userDir != null && Files.exists(userDir)) {
                try (java.util.stream.Stream<Path> paths = Files.walk(userDir)) {
                    paths.sorted(java.util.Comparator.reverseOrder())
                         .map(Path::toFile)
                         .forEach(File::delete);
                }
                log.info("Successfully cleaned up session workspace at: {}", userDir.toAbsolutePath());
            }
        } catch (Exception e) {
            log.warn("Non-fatal: failed to clean up session workspace: {}", e.getMessage());
        }
    }
}

