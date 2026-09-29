package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * User credentials payload for sign-in and account registration endpoints.
 */
@AllArgsConstructor
@Getter
@Setter
@NoArgsConstructor
public class UserAuthRequestDto {
    private String userName;
    private String password;
}
