package com.example.demo.modules.runner.sandbox;

import com.example.demo.entity.types.Language;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Adaptive Sandbox Dispatcher.
 * Acts as the primary {@link SandboxExecutor} bean.
 * <p>
 * Automatically probes Docker daemon availability:
 * <ul>
 *   <li>When Docker daemon is active: dispatches execution to {@link DockerSandboxExecutor}
 *       for full containerized isolation (zero network, cgroups memory & CPU caps, PID limits).</li>
 *   <li>When Docker is offline or disabled (e.g. Docker Desktop closed): gracefully falls back
 *       to {@link ProcessSandboxExecutor} so code compilation and execution never breaks.</li>
 * </ul>
 * </p>
 */
@Slf4j
@Component
@Primary
@RequiredArgsConstructor
public class AdaptiveSandboxExecutor implements SandboxExecutor {

    private final ProcessSandboxExecutor processSandboxExecutor;
    private final DockerSandboxExecutor dockerSandboxExecutor;

    @Value("${compiler.sandbox.type:auto}")
    private String sandboxType;

    @Value("${compiler.sandbox.docker.image:collab-compiler-runner:latest}")
    private String dockerImage;

    // Cache Docker availability check for 30 seconds to avoid running `docker info` on every single request
    private final AtomicBoolean dockerAvailableCache = new AtomicBoolean(false);
    private final AtomicLong lastDockerCheckTime = new AtomicLong(0);
    private static final long DOCKER_CHECK_TTL_MS = 30_000;

    @Override
    public Result execute(List<String> command, File workingDir, File inputFile, long timeoutSeconds) {
        return execute(command, workingDir, inputFile, timeoutSeconds, null);
    }

    @Override
    public Result execute(List<String> command, File workingDir, File inputFile, long timeoutSeconds, Language language) {
        if (isDockerActive()) {
            log.info("AdaptiveSandbox: Routing execution to [DockerSandboxExecutor] for language [{}]", language);
            return dockerSandboxExecutor.execute(command, workingDir, inputFile, timeoutSeconds, language);
        } else {
            log.info("AdaptiveSandbox: Docker offline, image missing, or disabled. Falling back to [ProcessSandboxExecutor] for language [{}]", language);
            return processSandboxExecutor.execute(command, workingDir, inputFile, timeoutSeconds);
        }
    }

    /**
     * Checks whether Docker execution is enabled, the Docker daemon is responding,
     * and the required runner image is available locally.
     *
     * @return true if Docker daemon and runner image are ready, false otherwise
     */
    public boolean isDockerActive() {
        if ("process".equalsIgnoreCase(sandboxType)) {
            return false;
        }

        long now = System.currentTimeMillis();
        if (now - lastDockerCheckTime.get() < DOCKER_CHECK_TTL_MS) {
            return dockerAvailableCache.get();
        }

        boolean available = probeDockerDaemonAndImage();
        dockerAvailableCache.set(available);
        lastDockerCheckTime.set(now);
        return available;
    }

    /**
     * Executes a fast probe against `docker info` and verifies image existence.
     */
    private boolean probeDockerDaemonAndImage() {
        try {
            // Step 1: Probe Docker daemon status
            ProcessBuilder pb = new ProcessBuilder("docker", "info");
            pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            pb.redirectError(ProcessBuilder.Redirect.DISCARD);
            Process process = pb.start();

            boolean finished = process.waitFor(2, TimeUnit.SECONDS);
            if (!finished || process.exitValue() != 0) {
                if (!finished) process.destroyForcibly();
                log.debug("AdaptiveSandbox: Docker daemon probe did not succeed.");
                return false;
            }

            // Step 2: Check if runner image is available locally
            ProcessBuilder imgPb = new ProcessBuilder("docker", "image", "inspect", dockerImage);
            imgPb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            imgPb.redirectError(ProcessBuilder.Redirect.DISCARD);
            Process imgProcess = imgPb.start();

            boolean imgFinished = imgProcess.waitFor(2, TimeUnit.SECONDS);
            if (imgFinished && imgProcess.exitValue() == 0) {
                log.info("AdaptiveSandbox: Docker daemon and runner image [{}] are active and ready.", dockerImage);
                return true;
            } else {
                if (!imgFinished) imgProcess.destroyForcibly();
                log.info("AdaptiveSandbox: Docker is active, but runner image [{}] is not yet built. Run 'runner/build-runner-image.bat' to enable containerized execution. Falling back to host process sandbox.", dockerImage);
                return false;
            }
        } catch (Exception e) {
            log.debug("AdaptiveSandbox: Docker CLI probe error: {}", e.getMessage());
            return false;
        }
    }
}
