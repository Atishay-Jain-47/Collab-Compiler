package com.example.demo.dto;

import lombok.*;

/**
 * Request payload for creating a new code version snapshot.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVersionRequestDto {
    private String roomId;          // null for solo
    private String versionName;     // commit title
    private String message;         // commit description
    private String code;            // source code
    private String language;        // programming language
    private boolean autoSave;       // manual vs auto-checkpoint
}
