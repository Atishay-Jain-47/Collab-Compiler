package com.example.demo.entity.types;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * MongoDB document representing a code snapshot / version commit.
 * <p>
 * Supports both solo workspace versions (tied to {@code authorUserName}) and
 * collaborative room versions (tied to {@code roomId}).
 * </p>
 */
@Document(collection = "code_versions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeVersion {

    @Id
    private String id;

    @Indexed
    private String roomId;          // null for solo personal versions

    @Indexed
    private String authorUserName;  // creator of this version

    private String versionName;     // e.g. "Initial setup", "Fixed recursion base case"

    private String message;         // optional commit description

    private String code;            // source code content snapshot

    private String language;        // PYTHON, CPP, JAVA, etc.

    private boolean autoSave;       // true if triggered automatically (e.g. on Run or auto-checkpoint)

    @Builder.Default
    private Instant createdAt = Instant.now();
}
