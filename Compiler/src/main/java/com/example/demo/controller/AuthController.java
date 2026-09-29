package com.example.demo.controller;

import com.example.demo.dto.LoginResponseDto;
import com.example.demo.dto.UserAuthRequestDto;
import com.example.demo.dto.CreateUserResponseDto;
import com.example.demo.service.AuthService;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller managing user authentication lifecycles.
 * <p>
 * Handles user account creation (signup) and credential verification (login) returning JWT tokens.
 * </p>
 */
@RestController
@RequestMapping("/auth")
@CrossOrigin(
        origins = {
                "http://localhost:5173",
                "https://compiler-frontend-six.vercel.app",
                "https://compiler-frontend.satyamvatsal.ovh",
        }
)
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final AuthService authService;

    /**
     * Registers a new user account with hashed credentials.
     *
     * @param userAuthRequestDto user registration payload
     * @return {@link ResponseEntity} containing {@link CreateUserResponseDto}
     */
    @PostMapping("/signup")
    public ResponseEntity<CreateUserResponseDto> createNewUser(@RequestBody UserAuthRequestDto userAuthRequestDto) {
        CreateUserResponseDto createUserResponseDto = userService.createNewUser(userAuthRequestDto);
        return ResponseEntity.ok(createUserResponseDto);
    }

    /**
     * Authenticates existing user credentials and generates a signed JWT.
     *
     * @param userAuthRequestDto login credentials
     * @return {@link ResponseEntity} containing {@link LoginResponseDto} with JWT token
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> loginUser(@RequestBody UserAuthRequestDto userAuthRequestDto) {
        LoginResponseDto loginResponseDto = authService.login(userAuthRequestDto);
        return ResponseEntity.ok(loginResponseDto);
    }
}
