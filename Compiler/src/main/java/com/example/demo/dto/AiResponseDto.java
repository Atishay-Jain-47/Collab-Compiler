package com.example.demo.dto;

import lombok.*;

/**
 * Data Transfer Object containing AI suggestions, explanation text, or generated code diffs.
 */
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AiResponseDto {
    private String response;
    private String suggestedCode;
    private boolean success;
    private String error;
}
