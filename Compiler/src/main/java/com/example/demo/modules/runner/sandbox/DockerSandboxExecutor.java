package com.example.demo.modules.runner.sandbox;

import com.example.demo.entity.types.Language;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Docker-based implementation of {@link SandboxExecutor}.
 * Executes untrusted code inside isolated, hardened, ephemeral containers with:
 * <ul>
 *   <li>Disabled network access (--network=none) to prevent SSRF and external calls</li>
 *   <li>Capped memory and swap limits (--memory=256m) to prevent host memory exhaustion</li>
 *   <li>CPU usage throttling (--cpus=1.0) to prevent CPU starvation</li>
 *   <li>PID process limits (--pids-limit=64) to neutralize fork bombs</li>
 *   <li>Ephemeral lifecycle (--rm) to ensure zero persistent side effects</li>
 *   <li>Wall-clock timeout enforcement with forced container destruction on TLE</li>
 * </ul>
 */
@Slf4j
@Component
public class DockerSandboxExecutor implements SandboxExecutor {

    @Value("${compiler.sandbox.docker.image:collab-compiler-runner:latest}")
    private String dockerImage;

    @Value("${compiler.sandbox.docker.memory:256m}")
    private String memoryLimit;

    @Value("${compiler.sandbox.docker.cpus:1.0}")
    private String cpusLimit;

    @Value("${compiler.sandbox.docker.pids-limit:64}")
    private String pidsLimit;

    @Value("${compiler.sandbox.docker.network:none}")
    private String networkMode;

    @Override
    public Result execute(List<String> command, File workingDir, File inputFile, long timeoutSeconds) {
        return execute(command, workingDir, inputFile, timeoutSeconds, null);
    }

    @Override
    public Result execute(List<String> command, File workingDir, File inputFile, long timeoutSeconds, Language language) {
        if (workingDir == null || !workingDir.exists()) {
            return Result.builder()
                    .output("")
                    .error("Execution failed: Working directory does not exist.")
                    .exitCode(1)
                    .executionTimeSeconds(0.0)
                    .timedOut(false)
                    .build();
        }

        // Normalize host path for Docker volume mounting across Windows and POSIX
        String hostPath = workingDir.getAbsolutePath().replace('\\', '/');

        // Resolve container execution command
        List<String> containerCmd = resolveContainerCommand(language, workingDir, command);

        List<String> dockerCmd = new ArrayList<>();
        dockerCmd.add("docker");
        dockerCmd.add("run");
        dockerCmd.add("--rm");
        dockerCmd.add("-i");
        dockerCmd.add("--network=" + networkMode);
        dockerCmd.add("--memory=" + memoryLimit);
        dockerCmd.add("--memory-swap=" + memoryLimit);
        dockerCmd.add("--cpus=" + cpusLimit);
        dockerCmd.add("--pids-limit=" + pidsLimit);
        dockerCmd.add("-v");
        dockerCmd.add(hostPath + ":/workspace:rw");
        dockerCmd.add("-w");
        dockerCmd.add("/workspace");
        dockerCmd.add(dockerImage);
        dockerCmd.addAll(containerCmd);

        log.info("DockerSandboxExecutor launching container: {}", dockerCmd);
        ProcessBuilder pb = new ProcessBuilder(dockerCmd);

        if (inputFile != null && inputFile.exists()) {
            pb.redirectInput(inputFile);
        }

        long startTime = System.currentTimeMillis();
        java.util.concurrent.ExecutorService streamPool = java.util.concurrent.Executors.newFixedThreadPool(2);
        try {
            Process process = pb.start();

            // Asynchronously drain stdout and stderr to prevent pipe buffer deadlock
            // and cap output to 2MB to prevent JVM OOM denial-of-service
            java.util.concurrent.Future<String> stdoutFuture = streamPool.submit(new StreamGobbler(process.getInputStream()));
            java.util.concurrent.Future<String> stderrFuture = streamPool.submit(new StreamGobbler(process.getErrorStream()));

            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);

            if (!finished) {
                log.warn("Docker container exceeded timeout of {}s. Forcibly terminating...", timeoutSeconds);
                process.destroyForcibly();
                stdoutFuture.cancel(true);
                stderrFuture.cancel(true);
                return Result.builder()
                        .output("")
                        .error("Execution timed out (Time Limit Exceeded: " + timeoutSeconds + " seconds in Docker sandbox)")
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

            log.info("Docker container exited with code: {} in {}s", exitCode, elapsed);
            return Result.builder()
                    .output(output)
                    .error(error)
                    .exitCode(exitCode)
                    .executionTimeSeconds(elapsed)
                    .timedOut(false)
                    .build();

        } catch (Exception e) {
            log.error("Docker execution failed with error: ", e);
            double elapsed = (System.currentTimeMillis() - startTime) / 1000.0;
            return Result.builder()
                    .output("")
                    .error("Docker execution exception: " + e.getMessage())
                    .exitCode(1)
                    .executionTimeSeconds(elapsed)
                    .timedOut(false)
                    .build();
        } finally {
            streamPool.shutdownNow();
        }
    }

    /**
     * Resolves the Linux command to execute inside the container based on language or files.
     */
    private List<String> resolveContainerCommand(Language language, File workingDir, List<String> fallbackCommand) {
        if (language != null) {
            return switch (language) {
                case PYTHON -> List.of("python3", "main.py");
                case CPP -> List.of("/bin/sh", "-c", "g++ main.cpp -O2 -o main.out && ./main.out");
                case C -> List.of("/bin/sh", "-c", "gcc main.c -O2 -o main.out && ./main.out");
                case JAVA -> List.of("/bin/sh", "-c", "javac Main.java && java Main");
                case GO -> List.of("go", "run", "main.go");
                case JS -> List.of("node", "main.js");
                case RUST -> List.of("/bin/sh", "-c", "rustc main.rs -O -o main.out && ./main.out");
                case TYPESCRIPT -> List.of("/bin/sh", "-c", "npx -y tsx main.ts");
                case PHP -> List.of("php", "main.php");
                case RUBY -> List.of("ruby", "main.rb");
                case BASH -> List.of("/bin/bash", "main.sh");
            };
        }

        // Fallback: inspect directory file names
        if (new File(workingDir, "main.py").exists()) return List.of("python3", "main.py");
        if (new File(workingDir, "main.cpp").exists()) return List.of("/bin/sh", "-c", "g++ main.cpp -O2 -o main.out && ./main.out");
        if (new File(workingDir, "main.c").exists()) return List.of("/bin/sh", "-c", "gcc main.c -O2 -o main.out && ./main.out");
        if (new File(workingDir, "Main.java").exists()) return List.of("/bin/sh", "-c", "javac Main.java && java Main");
        if (new File(workingDir, "main.go").exists()) return List.of("go", "run", "main.go");
        if (new File(workingDir, "main.js").exists()) return List.of("node", "main.js");
        if (new File(workingDir, "main.rs").exists()) return List.of("/bin/sh", "-c", "rustc main.rs -O -o main.out && ./main.out");
        if (new File(workingDir, "main.ts").exists()) return List.of("/bin/sh", "-c", "npx -y tsx main.ts");
        if (new File(workingDir, "main.php").exists()) return List.of("php", "main.php");
        if (new File(workingDir, "main.rb").exists()) return List.of("ruby", "main.rb");
        if (new File(workingDir, "main.sh").exists()) return List.of("/bin/bash", "main.sh");

        return fallbackCommand;
    }
}
