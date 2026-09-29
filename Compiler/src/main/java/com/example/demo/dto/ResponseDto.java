package com.example.demo.dto;

import lombok.*;

/**
 * Execution result payload returned after executing code inside the process sandbox.
 * Contains stdout output, stderr error message, exit code, and execution time in seconds.
 */
@Getter
@Setter
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ResponseDto {

    private String output;

    private String error;

    private Integer errorCode;

    private Double timeTaken;

}
