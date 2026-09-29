package com.example.demo.common.exception;

/**
 * Exception thrown when a requested domain entity (user, room session, file) cannot be located.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
