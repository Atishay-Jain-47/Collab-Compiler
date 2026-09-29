package com.example.demo.dto;

import lombok.*;

/**
 * Response payload returned when a user successfully initializes a new collaboration room.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateSessionResponseDto {
    private String roomId;
    private String message;
}
