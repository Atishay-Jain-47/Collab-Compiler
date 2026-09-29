package com.example.demo.entity.types;

import lombok.*;

/**
 * Domain model representing an execution or collaboration session.
 * <p>
 * Tracks session identity, submitting user, programming language, code source paths,
 * inputs, and execution outcome metrics.
 * </p>
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class Session {
    private String sessionId;
    private String userName;
    private Language language;
    private String code;
    private String codePath;
    private String input;
    private String inputPath;
    private String output;
    private String error;
    private double timeTaken;
    private double memoryUsed;
}
