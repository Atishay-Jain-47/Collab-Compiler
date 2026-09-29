package com.example.demo.dto;

import lombok.*;

/**
 * Data Transfer Object for requesting AI-assisted code intelligence
 * (explanation, bug fixing, optimization, or interactive coding chat).
 */
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AiRequestDto {
    private String code;
    private String language;
    private String error;
    private String action;      // "EXPLAIN", "FIX", "OPTIMIZE", "CHAT"
    private String userMessage; // for custom prompt / questions
}
