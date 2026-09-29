package com.example.demo.service;

import com.example.demo.dto.UserAuthRequestDto;
import com.example.demo.dto.CreateUserResponseDto;
import com.example.demo.entity.types.User;
import com.example.demo.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service managing user registration and user database records in MongoDB.
 */
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Registers a new unique user into MongoDB with BCrypt-hashed password.
     *
     * @param userAuthRequestDto user registration payload
     * @return {@link CreateUserResponseDto} with outcome message
     */
    public CreateUserResponseDto createNewUser(UserAuthRequestDto userAuthRequestDto) {
        String userName = userAuthRequestDto.getUserName();
        String password = userAuthRequestDto.getPassword();
        User user = userRepository.findByUserName(userName);
        if (user != null) {
            return CreateUserResponseDto.builder()
                    .userName("")
                    .message("A user with this username already exists. Please pick another one.")
                    .build();
        }
        String hashedPassword = passwordEncoder.encode(password);
        User newUser = new User(userName, hashedPassword);
        userRepository.save(newUser);
        return CreateUserResponseDto.builder()
                .message("User created Successfully")
                .userName(userName)
                .build();
    }
}
