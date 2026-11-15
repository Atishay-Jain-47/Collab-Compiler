package com.example.demo.dto;

import lombok.*;

import java.time.Instant;

/**
 * Response payload representing a code version snapshot summary or detail.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeVersionResponseDto {
    private String id;
    private String roomId;
    private String authorUserName;
    private String versionName;
    private String message;
    private String code;
    private String language;
    private boolean autoSave;
    private Instant createdAt;
}
