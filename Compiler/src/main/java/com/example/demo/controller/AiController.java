package com.example.demo.controller;

import com.example.demo.dto.AiRequestDto;
import com.example.demo.dto.AiResponseDto;
import com.example.demo.service.AiService;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * REST Controller exposing AI code assistance endpoints powered by Google Gemini.
 * <p>
 * Supports actions: EXPLAIN, FIX, OPTIMIZE, and custom CHAT.
 * </p>
 * <p>
 * Rate-limited to {@value #MAX_REQUESTS_PER_MINUTE} requests per minute per authenticated user
 * to prevent runaway Gemini API costs. The endpoint requires a valid JWT (enforced by
 * {@link com.example.demo.config.SecurityConfig}).
 * </p>
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(
        origins = {
                "http://localhost:5173",
                "https://compiler-frontend-six.vercel.app",
                "https://compiler-frontend.satyamvatsal.ovh",
        }
)
public class AiController {

    private static final int MAX_REQUESTS_PER_MINUTE = 1;

    private final AiService aiService;

    /**
     * Per-user token-bucket registry. Made static to preserve limits if DevTools reloads.
     */
    private static final ConcurrentHashMap<String, Bucket> rateLimitBuckets = new ConcurrentHashMap<>();

    /**
     * Returns (or creates) the rate-limit bucket for the given user.
     *
     * @param username authenticated username
     * @return Bucket4j token bucket for that user
     */
    private Bucket getBucketForUser(String username) {
        return rateLimitBuckets.computeIfAbsent(username, key -> Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(MAX_REQUESTS_PER_MINUTE)
                        .refillGreedy(MAX_REQUESTS_PER_MINUTE, Duration.ofMinutes(1))
                        .build())
                .build());
    }

    /**
     * Processes an AI code assistance request.
     * <p>
     * Requires a valid JWT (HTTP 401 otherwise). Rate-limited to
     * {@value #MAX_REQUESTS_PER_MINUTE} req/min per user (HTTP 429 when exceeded).
     * </p>
     *
     * @param requestDto AI request containing code, language, errors, and target action
     * @return {@link ResponseEntity} containing {@link AiResponseDto} with explanation and suggested code,
     *         or HTTP 429 if the rate limit is exceeded
     */
    @PostMapping("/ask")
    public ResponseEntity<AiResponseDto> askAi(@RequestBody AiRequestDto requestDto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        // Enforce word limit on user custom prompt (max 300 words)
        String userMsg = requestDto.getUserMessage();
        if (userMsg != null && !userMsg.trim().isEmpty()) {
            int wordCount = userMsg.trim().split("\\s+").length;
            if (wordCount > AiService.MAX_PROMPT_WORDS) {
                log.warn("AI prompt rejected: User [{}] provided {} words, exceeding limit of {}", 
                        username, wordCount, AiService.MAX_PROMPT_WORDS);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(AiResponseDto.builder()
                                .success(false)
                                .error("Prompt exceeds maximum limit of " + AiService.MAX_PROMPT_WORDS 
                                        + " words (received " + wordCount + " words). Please shorten your question.")
                                .promptWordCount(wordCount)
                                .build());
            }
        }

        Bucket bucket = getBucketForUser(username);
        long before = bucket.getAvailableTokens();
        boolean consumed = bucket.tryConsume(1);
        long after = bucket.getAvailableTokens();
        log.info("RateLimit DEBUG - User: [{}], Tokens Before: {}, Consumed: {}, Tokens After: {}, Map Size: {}", 
                username, before, consumed, after, rateLimitBuckets.size());

        if (!consumed) {
            log.warn("Rate limit exceeded for user [{}] on AI endpoint", username);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("X-RateLimit-Limit", String.valueOf(MAX_REQUESTS_PER_MINUTE))
                    .header("X-RateLimit-Remaining", "0")
                    .header("Retry-After", "60")
                    .body(AiResponseDto.builder()
                            .success(false)
                            .error("AI rate limit reached (" + MAX_REQUESTS_PER_MINUTE + " req/min). Please wait a moment.")
                            .build());
        }

        log.info("AI request action: {} for language: {} by user: {} (chunk: {})", 
                requestDto.getAction(), requestDto.getLanguage(), username, requestDto.getChunkIndex());
        AiResponseDto response = aiService.processAiRequest(requestDto);
        long remaining = bucket.getAvailableTokens();
        return ResponseEntity.ok()
                .header("X-RateLimit-Limit", String.valueOf(MAX_REQUESTS_PER_MINUTE))
                .header("X-RateLimit-Remaining", String.valueOf(remaining))
                .body(response);
    }
}
