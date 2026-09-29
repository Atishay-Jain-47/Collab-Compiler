package com.example.demo.dto;

import lombok.*;

/**
 * Response payload returned upon user account registration.
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class CreateUserResponseDto {
    private String userName;
    private String message;
}
