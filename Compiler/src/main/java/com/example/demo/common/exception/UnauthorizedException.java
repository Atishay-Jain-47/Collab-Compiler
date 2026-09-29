package com.example.demo.common.exception;

/**
 * Exception thrown when an operation is attempted without valid authentication credentials
 * or insufficient room permissions (e.g. read-only member trying to edit or execute).
 */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
