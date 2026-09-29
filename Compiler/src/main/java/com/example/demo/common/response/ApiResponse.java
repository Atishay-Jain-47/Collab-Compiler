package com.example.demo.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;

/**
 * Standard REST API response envelope wrapping all controller endpoint responses.
 * Provides uniform JSON structure containing status flags, messages, typed data payload,
 * application error codes, and UTC epoch timestamps.
 *
 * @param <T> Type of the encapsulated payload data
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private Integer errorCode;
    private Long timestamp;

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .errorCode(0)
                .timestamp(Instant.now().toEpochMilli())
                .build();
    }

    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Operation completed successfully");
    }

    public static <T> ApiResponse<T> error(String message, Integer errorCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errorCode(errorCode != null ? errorCode : 1)
                .timestamp(Instant.now().toEpochMilli())
                .build();
    }
}
