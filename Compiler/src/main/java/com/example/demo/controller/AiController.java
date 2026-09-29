package com.example.demo.controller;

import com.example.demo.dto.AiRequestDto;
import com.example.demo.dto.AiResponseDto;
import com.example.demo.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller exposing AI code assistance endpoints powered by Google Gemini.
 * <p>
 * Supports actions: EXPLAIN, FIX, OPTIMIZE, and custom CHAT.
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

    private final AiService aiService;

    /**
     * Processes an AI code assistance request.
     *
     * @param requestDto AI request containing code, language, errors, and target action
     * @return {@link ResponseEntity} containing {@link AiResponseDto} with explanation and suggested code
     */
    @PostMapping("/ask")
    public ResponseEntity<AiResponseDto> askAi(@RequestBody AiRequestDto requestDto) {
        log.info("AI request action: {} for language: {}", requestDto.getAction(), requestDto.getLanguage());
        AiResponseDto response = aiService.processAiRequest(requestDto);
        return ResponseEntity.ok(response);
    }
}
