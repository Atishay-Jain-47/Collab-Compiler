package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Core application security beans configuration.
 * <p>
 * Configures the Spring Security {@link AuthenticationManager} and the BCrypt
 * {@link PasswordEncoder} for secure password hashing.
 * </p>
 */
@Configuration
public class AppConfig {

    /**
     * Exposes the AuthenticationManager bean from Spring Security's AuthenticationConfiguration.
     *
     * @param configuration Spring authentication configuration
     * @return configured AuthenticationManager
     * @throws Exception if manager cannot be created
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    /**
     * Password encoder bean utilizing BCrypt strong hashing algorithm.
     *
     * @return BCryptPasswordEncoder instance
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
