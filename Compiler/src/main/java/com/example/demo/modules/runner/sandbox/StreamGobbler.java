package com.example.demo.modules.runner.sandbox;

import lombok.extern.slf4j.Slf4j;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Callable;

/**
 * Asynchronously reads and drains an InputStream into an in-memory buffer.
 * Solves OS pipe buffer deadlock and caps output to 2MB to prevent JVM OOM.
 */
@Slf4j
public class StreamGobbler implements Callable<String> {

    public static final int DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2MB max output buffer
    private static final int BUFFER_SIZE = 8192;

    private final InputStream inputStream;
    private final int maxBytes;

    public StreamGobbler(InputStream inputStream) {
        this(inputStream, DEFAULT_MAX_BYTES);
    }

    public StreamGobbler(InputStream inputStream, int maxBytes) {
        this.inputStream = inputStream;
        this.maxBytes = maxBytes;
    }

    @Override
    public String call() {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] data = new byte[BUFFER_SIZE];
        int totalBytesRead = 0;
        boolean truncated = false;

        try {
            int bytesRead;
            while ((bytesRead = inputStream.read(data, 0, data.length)) != -1) {
                if (!truncated) {
                    if (totalBytesRead + bytesRead <= maxBytes) {
                        buffer.write(data, 0, bytesRead);
                        totalBytesRead += bytesRead;
                    } else {
                        int remaining = maxBytes - totalBytesRead;
                        if (remaining > 0) {
                            buffer.write(data, 0, remaining);
                            totalBytesRead += remaining;
                        }
                        truncated = true;
                        log.warn("Sandbox process output exceeded limit of {} bytes; truncating remainder.", maxBytes);
                    }
                }
                // Continue reading to drain the stream so the child process doesn't block!
            }
        } catch (Exception e) {
            log.warn("Exception while reading process stream: {}", e.getMessage());
        }

        String result = buffer.toString(StandardCharsets.UTF_8);
        if (truncated) {
            result += "\n\n[CollabIDE: Output truncated at " + (maxBytes / 1024 / 1024) + "MB limit]";
        }
        return result;
    }
}
