package com.example.demo.modules.runner.sandbox;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.File;
import java.util.List;

/**
 * Abstraction layer for executing untrusted user code in a constrained environment.
 * <p>
 * Decouples process creation and monitoring from the web server thread pool. Implementations
 * handle process boundaries, resource quotas, and timeout enforcement.
 * </p>
 */
public interface SandboxExecutor {

    /**
     * Immutable value object holding the output and performance metrics of a process run.
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    class Result {
        private String output;
        private String error;
        private int exitCode;
        private double executionTimeSeconds;
        private boolean timedOut;
    }

    /**
     * Executes the given process command inside the designated working directory.
     *
     * @param command ordered command tokens
     * @param workingDir isolated temporary directory for the execution
     * @param inputFile file containing standard input (stdin) to stream to the process, or null if none
     * @param timeoutSeconds maximum duration in seconds allowed before the process is forcibly killed
     * @return a {@link Result} containing stdout, stderr, exit code, and execution time
     */
    Result execute(List<String> command, File workingDir, File inputFile, long timeoutSeconds);

    /**
     * Executes the given process command with language context for containerized sandboxes.
     *
     * @param command ordered command tokens
     * @param workingDir isolated temporary directory for the execution
     * @param inputFile file containing standard input (stdin)
     * @param timeoutSeconds maximum duration in seconds allowed before process is killed
     * @param language programming language of the snippet
     * @return a {@link Result} containing stdout, stderr, exit code, and execution time
     */
    default Result execute(List<String> command, File workingDir, File inputFile, long timeoutSeconds, com.example.demo.entity.types.Language language) {
        return execute(command, workingDir, inputFile, timeoutSeconds);
    }
}

