package com.example.demo.service;

import com.example.demo.dto.AiRequestDto;
import com.example.demo.dto.AiResponseDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Service orchestrating AI code assistant requests with Google Gemini API and offline heuristic fallbacks.
 * <p>
 * Handles prompt engineering, model invocation, JSON stream parsing, code block extraction,
 * and graceful fallback when offline or when no API key is provisioned.
 * </p>
 */
@Slf4j
@Service
public class AiService {

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();


    public AiResponseDto processAiRequest(AiRequestDto request) {
        String code = request.getCode() != null ? request.getCode() : "";
        String language = request.getLanguage() != null ? request.getLanguage() : "UNKNOWN";
        String error = request.getError() != null ? request.getError() : "";
        String action = request.getAction() != null ? request.getAction() : "EXPLAIN";
        String userMsg = request.getUserMessage() != null ? request.getUserMessage() : "";

        String prompt = buildPrompt(action, language, code, error, userMsg);

        if (geminiApiKey == null || geminiApiKey.trim().isEmpty() || geminiApiKey.contains("YOUR_")) {
            return generateOfflineFallback(action, language, code, error);
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" + geminiApiKey.trim();

            Map<String, Object> requestBody = Map.of(
                    "contents", java.util.List.of(
                            Map.of("parts", java.util.List.of(
                                    Map.of("text", prompt)
                            ))
                    )
            );

            String jsonPayload = objectMapper.writeValueAsString(requestBody);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(20))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode partsNode = root.path("candidates").path(0).path("content").path("parts");
                StringBuilder fullResponseBuilder = new StringBuilder();
                if (partsNode.isArray()) {
                    for (JsonNode part : partsNode) {
                        if (part.has("text")) {
                            fullResponseBuilder.append(part.get("text").asText());
                        }
                    }
                }
                String fullResponse = fullResponseBuilder.toString();
                if (fullResponse.isBlank()) {
                    fullResponse = partsNode.path(0).path("text").asText();
                }
                String extractedCode = extractCodeSnippet(fullResponse);

                return AiResponseDto.builder()
                        .success(true)
                        .response(fullResponse)
                        .suggestedCode(extractedCode)
                        .build();
            } else {
                log.warn("Gemini API call failed with status: {}, body: {}", response.statusCode(), response.body());
                return generateOfflineFallback(action, language, code, error);
            }
        } catch (Exception e) {
            log.error("Error communicating with Gemini API: ", e);
            return generateOfflineFallback(action, language, code, error);
        }
    }

    private String buildPrompt(String action, String language, String code, String error, String userMsg) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert programming tutor and code assistant in an online collaborative IDE.\n");
        sb.append("Language: ").append(language).append("\n\n");

        switch (action.toUpperCase()) {
            case "FIX":
                sb.append("TASK: The user's code produced an error or unexpected output.\n");
                sb.append("ERROR/OUTPUT:\n").append(error).append("\n\n");
                sb.append("CODE:\n```").append(language.toLowerCase()).append("\n").append(code).append("\n```\n\n");
                sb.append("Diagnose the bug clearly in 2-3 bullet points, then provide the completely fixed, working code inside a ```code block.");
                break;
            case "OPTIMIZE":
                sb.append("TASK: Analyze the time and space complexity of the code below, and provide a more optimized or cleaner version.\n");
                sb.append("CODE:\n```").append(language.toLowerCase()).append("\n").append(code).append("\n```\n\n");
                sb.append("State Big-O time and space complexity before and after, followed by the optimized code in a ```code block.");
                break;
            case "CHAT":
                sb.append("USER QUESTION: ").append(userMsg).append("\n\n");
                sb.append("CODE CONTEXT:\n```").append(language.toLowerCase()).append("\n").append(code).append("\n```\n\n");
                sb.append("Answer the user's question directly and provide helpful code examples if relevant.");
                break;
            case "EXPLAIN":
            default:
                sb.append("TASK: Explain what the following code does step-by-step in clear, easy-to-understand terms.\n");
                sb.append("CODE:\n```").append(language.toLowerCase()).append("\n").append(code).append("\n```\n\n");
                sb.append("Provide a concise summary of purpose, key logic flow, and input/output behavior.");
                break;
        }
        return sb.toString();
    }

    private String extractCodeSnippet(String markdown) {
        if (markdown == null) return "";
        int start = markdown.indexOf("```");
        if (start == -1) return "";
        int endOfLang = markdown.indexOf("\n", start);
        if (endOfLang == -1) return "";
        int close = markdown.indexOf("```", endOfLang);
        if (close == -1) return "";
        return markdown.substring(endOfLang + 1, close).trim();
    }

    private AiResponseDto generateOfflineFallback(String action, String language, String code, String error) {
        String msg;
        String suggested = "";

        if ("FIX".equalsIgnoreCase(action) && error != null && !error.isEmpty()) {
            msg = "### 🛠️ Error Diagnostic\n\n" +
                    "- **Detected Issue:** `" + error.lines().findFirst().orElse("Runtime/Syntax error") + "`\n" +
                    "- **Recommendation:** Check your variable declarations, syntax brackets, and imported libraries.\n\n" +
                    "> 💡 *Tip: Add `GEMINI_API_KEY` to `application.properties` to enable full Google Gemini live code fixing!*";
        } else if ("OPTIMIZE".equalsIgnoreCase(action)) {
            msg = "### ⚡ Optimization Analysis\n\n" +
                    "- **Estimated Complexity:** Standard linear/polynomial depending on nested loops.\n" +
                    "- **Tip:** Consider using hash maps for $O(1)$ lookups instead of nested linear scans.\n\n" +
                    "> 💡 *Tip: Configure `GEMINI_API_KEY` for detailed algorithmic complexity breakdowns.*";
        } else {
            msg = "### 🧠 Code Overview (" + language + ")\n\n" +
                    "- **Total Length:** " + code.length() + " characters (" + code.lines().count() + " lines).\n" +
                    "- **Language Mode:** " + language + "\n\n" +
                    "> 💡 *To unlock live AI insights, add your free Google Gemini API key to `application.properties` as `GEMINI_API_KEY=AIzaSy...`.*";
        }

        return AiResponseDto.builder()
                .success(true)
                .response(msg)
                .suggestedCode(suggested)
                .build();
    }
}
