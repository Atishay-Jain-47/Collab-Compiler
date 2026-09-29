package com.example.demo.dto;

import lombok.*;

/**
 * Authentication response payload containing the generated JWT bearer token and username.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LoginResponseDto {
    private String token;
    private String userName;
}
