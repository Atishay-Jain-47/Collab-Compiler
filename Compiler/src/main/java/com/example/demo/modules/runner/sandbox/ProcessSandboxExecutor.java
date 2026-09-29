package com.example.demo.modules.runner.sandbox;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Process-based implementation of {@link SandboxExecutor}.
 * Executes compilation and execution commands inside OS worker processes with:
 * <ul>
 *   <li>Configurable execution timeouts with forced process tree termination on expiry</li>
 *   <li>Standard input redirection from testcase/user input files</li>
 *   <li>Capturing stdout, stderr, and process return codes</li>
 *   <li>Wall-clock execution timing measurement</li>
 * </ul>
 */
@Slf4j
@Component
public class ProcessSandboxExecutor implements SandboxExecutor {

    /**
     * Executes the supplied system command synchronously within the bounded time limit.
     *
     * @param command list containing executable and arguments
     * @param workingDir directory where execution takes place
     * @param inputFile optional file to redirect into stdin (can be null)
     * @param timeoutSeconds max duration allowed before forcefully terminating the process
     * @return {@link com.example.demo.modules.runner.sandbox.SandboxExecutor.Result} detailing output, error, exit code, and timing
     */
    @Override
    public Result execute(List<String> command, File workingDir, File inputFile, long timeoutSeconds) {
        log.info("ProcessSandboxExecutor starting command: {} in dir: {}", command, workingDir);
        ProcessBuilder pb = new ProcessBuilder(command);

        if (workingDir != null && workingDir.exists()) {
            pb.directory(workingDir);
        }

        if (inputFile != null && inputFile.exists()) {
            pb.redirectInput(inputFile);
        }

        long startTime = System.currentTimeMillis();
        java.util.concurrent.ExecutorService streamPool = java.util.concurrent.Executors.newFixedThreadPool(2);
        try {
            Process process = pb.start();

            java.util.concurrent.Future<String> stdoutFuture = streamPool.submit(new StreamGobbler(process.getInputStream()));
            java.util.concurrent.Future<String> stderrFuture = streamPool.submit(new StreamGobbler(process.getErrorStream()));

            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);

            if (!finished) {
                log.warn("Process exceeded timeout of {}s. Forcibly destroying...", timeoutSeconds);
                process.destroyForcibly();
                stdoutFuture.cancel(true);
                stderrFuture.cancel(true);
                return Result.builder()
                        .output("")
                        .error("Execution timed out (Time Limit Exceeded: " + timeoutSeconds + " seconds)")
                        .exitCode(124)
                        .executionTimeSeconds((double) timeoutSeconds)
                        .timedOut(true)
                        .build();
            }

            String output = "";
            String error = "";
            try {
                output = stdoutFuture.get(2, TimeUnit.SECONDS);
            } catch (Exception e) {
                log.warn("Failed retrieving stdout from StreamGobbler: {}", e.getMessage());
            }

            try {
                error = stderrFuture.get(2, TimeUnit.SECONDS);
            } catch (Exception e) {
                log.warn("Failed retrieving stderr from StreamGobbler: {}", e.getMessage());
            }

            int exitCode = process.exitValue();
            double elapsed = (System.currentTimeMillis() - startTime) / 1000.0;

            return Result.builder()
                    .output(output)
                    .error(error)
                    .exitCode(exitCode)
                    .executionTimeSeconds(elapsed)
                    .timedOut(false)
                    .build();

        } catch (Exception e) {
            log.error("Process execution failed with exception: ", e);
            double elapsed = (System.currentTimeMillis() - startTime) / 1000.0;
            return Result.builder()
                    .output("")
                    .error("Execution exception: " + e.getMessage())
                    .exitCode(1)
                    .executionTimeSeconds(elapsed)
                    .timedOut(false)
                    .build();
        } finally {
            streamPool.shutdownNow();
        }
    }
}
