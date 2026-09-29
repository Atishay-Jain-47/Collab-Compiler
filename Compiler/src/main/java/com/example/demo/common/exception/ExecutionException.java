package com.example.demo.common.exception;

/**
 * Exception thrown when language compilation or sandboxed process execution encounters a fatal error.
 */
public class ExecutionException extends RuntimeException {
    public ExecutionException(String message) {
        super(message);
    }

    public ExecutionException(String message, Throwable cause) {
        super(message, cause);
    }
}
