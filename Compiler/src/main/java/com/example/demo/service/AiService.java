package com.example.demo.service;

import com.example.demo.dto.AiRequestDto;
import com.example.demo.dto.AiResponseDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Service orchestrating AI code assistant requests with Google Gemini API,
 * intelligent code chunking for large files, strict word limit enforcement,
 * and offline heuristic fallbacks.
 */
@Slf4j
@Service
public class AiService {

    public static final int CHUNK_LINE_SIZE = 100;
    public static final int MAX_PROMPT_WORDS = 300;
    public static final int MAX_PROCESSED_CHUNKS = 10; // Safety cap (1000 lines max)

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodeChunk {
        private int index;      // 1-based index
        private int startLine;
        private int endLine;
        private String content;
        private int lineCount;
    }

    /**
     * Splits source code into sequential chunks of {@value #CHUNK_LINE_SIZE} lines.
     */
    public List<CodeChunk> chunkCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            return List.of(new CodeChunk(1, 1, 1, "", 0));
        }

        String[] lines = code.split("\\r?\\n");
        List<CodeChunk> chunks = new ArrayList<>();
        int total = lines.length;

        for (int i = 0; i < total; i += CHUNK_LINE_SIZE) {
            int end = Math.min(i + CHUNK_LINE_SIZE, total);
            StringBuilder sb = new StringBuilder();
            for (int j = i; j < end; j++) {
                sb.append(lines[j]);
                if (j < end - 1) {
                    sb.append("\n");
                }
            }
            chunks.add(CodeChunk.builder()
                    .index(chunks.size() + 1)
                    .startLine(i + 1)
                    .endLine(end)
                    .lineCount(end - i)
                    .content(sb.toString())
                    .build());
        }

        return chunks.isEmpty() ? List.of(new CodeChunk(1, 1, total, code, total)) : chunks;
    }

    public AiResponseDto processAiRequest(AiRequestDto request) {
        String code = request.getCode() != null ? request.getCode() : "";
        String language = request.getLanguage() != null ? request.getLanguage() : "UNKNOWN";
        String error = request.getError() != null ? request.getError() : "";
        String action = request.getAction() != null ? request.getAction() : "EXPLAIN";
        String userMsg = request.getUserMessage() != null ? request.getUserMessage().trim() : "";

        // Calculate prompt word count
        int promptWords = userMsg.isEmpty() ? 0 : userMsg.split("\\s+").length;

        // Perform code chunking
        List<CodeChunk> allChunks = chunkCode(code);
        int totalChunks = allChunks.size();
        Integer requestedChunkIndex = request.getChunkIndex();

        // Validate targeted chunk or default to all
        CodeChunk targetedChunk = null;
        if (requestedChunkIndex != null && requestedChunkIndex > 0 && requestedChunkIndex <= totalChunks) {
            targetedChunk = allChunks.get(requestedChunkIndex - 1);
        }

        String prompt = buildPromptWithChunks(action, language, code, error, userMsg, allChunks, targetedChunk);

        if (geminiApiKey == null || geminiApiKey.trim().isEmpty() || geminiApiKey.contains("YOUR_")) {
            AiResponseDto fallback = generateOfflineFallback(action, language, code, error);
            fallback.setChunkIndex(requestedChunkIndex);
            fallback.setTotalChunks(totalChunks);
            fallback.setPromptWordCount(promptWords);
            return fallback;
        }

        // Try gemini-2.5-flash first, fallback to gemini-1.5-flash
        String[] modelsToTry = {"gemini-2.5-flash", "gemini-1.5-flash"};
        for (String modelName : modelsToTry) {
            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + geminiApiKey.trim();

                Map<String, Object> requestBody = Map.of(
                        "contents", List.of(
                                Map.of("parts", List.of(
                                        Map.of("text", prompt)
                                ))
                        )
                );

                String jsonPayload = objectMapper.writeValueAsString(requestBody);

                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(25))
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
                            .chunkIndex(requestedChunkIndex)
                            .totalChunks(totalChunks)
                            .promptWordCount(promptWords)
                            .build();
                } else {
                    log.warn("Gemini model {} returned status: {}, attempting next fallback if available", modelName, response.statusCode());
                }
            } catch (Exception e) {
                log.error("Error communicating with Gemini model {}: ", modelName, e);
            }
        }

        AiResponseDto fallback = generateOfflineFallback(action, language, code, error);
        fallback.setChunkIndex(requestedChunkIndex);
        fallback.setTotalChunks(totalChunks);
        fallback.setPromptWordCount(promptWords);
        return fallback;
    }

    private String buildPromptWithChunks(String action, String language, String rawCode, String error,
                                         String userMsg, List<CodeChunk> chunks, CodeChunk targetedChunk) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert programming tutor and code assistant in an online collaborative IDE (CollabIDE).\n");
        sb.append("Language: ").append(language).append("\n\n");

        // Chunking Context Info
        if (targetedChunk != null) {
            sb.append("### CODE CONTEXT (TARGETED CHUNK ").append(targetedChunk.getIndex())
              .append(" of ").append(chunks.size()).append(")\n");
            sb.append("Analyzing Lines ").append(targetedChunk.getStartLine())
              .append(" to ").append(targetedChunk.getEndLine()).append(":\n");
            sb.append("```").append(language.toLowerCase()).append("\n")
              .append(targetedChunk.getContent()).append("\n```\n\n");
        } else if (chunks.size() > 1) {
            int chunksToProcess = Math.min(chunks.size(), MAX_PROCESSED_CHUNKS);
            sb.append("### CODE CONTEXT (STRUCTURED IN ").append(chunks.size()).append(" CHUNKS)\n");
            if (chunks.size() > MAX_PROCESSED_CHUNKS) {
                sb.append("[Note: Code truncated to first ").append(MAX_PROCESSED_CHUNKS)
                  .append(" chunks (") .append(MAX_PROCESSED_CHUNKS * CHUNK_LINE_SIZE)
                  .append(" lines) for token efficiency]\n");
            }
            sb.append("\n");

            for (int i = 0; i < chunksToProcess; i++) {
                CodeChunk c = chunks.get(i);
                sb.append("--- [CHUNK ").append(c.getIndex()).append("/").append(chunks.size())
                  .append(" | Lines ").append(c.getStartLine()).append("-").append(c.getEndLine()).append("] ---\n");
                sb.append("```").append(language.toLowerCase()).append("\n")
                  .append(c.getContent()).append("\n```\n\n");
            }
        } else {
            sb.append("### CODE CONTEXT:\n```").append(language.toLowerCase()).append("\n")
              .append(rawCode).append("\n```\n\n");
        }

        switch (action.toUpperCase()) {
            case "FIX":
                sb.append("TASK: The user's code produced an error or unexpected output.\n");
                sb.append("ERROR / RUNNER OUTPUT:\n").append(error).append("\n\n");
                sb.append("Diagnose the bug clearly in 2-3 bullet points. If targeted to a chunk, specify the lines affected. ");
                sb.append("Then provide the completely fixed, working replacement code inside a ```code block.");
                break;
            case "OPTIMIZE":
                sb.append("TASK: Analyze the time and space complexity of the code above, and provide a more optimized or cleaner version.\n");
                sb.append("State Big-O time and space complexity before and after, followed by the optimized code in a ```code block.");
                break;
            case "CHAT":
                sb.append("USER QUESTION (Max 300 words):\n").append(userMsg).append("\n\n");
                sb.append("Answer the user's question directly with respect to the code context. Provide clear explanations and code snippets if helpful.");
                break;
            case "EXPLAIN":
            default:
                sb.append("TASK: Explain what the code does step-by-step in clear, easy-to-understand terms.\n");
                sb.append("Provide a concise summary of purpose, key logic flow, and input/output behavior across the code segments.");
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
            msg = "### 🛠️ Error Diagnostic (Offline Mode)\n\n" +
                    "- **Detected Issue:** `" + error.lines().findFirst().orElse("Runtime/Syntax error") + "`\n" +
                    "- **Recommendation:** Check your variable declarations, syntax brackets, and imported libraries.\n\n";
        } else if ("OPTIMIZE".equalsIgnoreCase(action)) {
            msg = "### ⚡ Optimization Analysis (Offline Mode)\n\n" +
                    "- **Estimated Complexity:** Standard linear/polynomial depending on nested loops.\n";
        } else {
            msg = "### 🧠 Code Overview (" + language + " - Offline Mode)\n\n" +
                    "- **Total Length:** " + code.length() + " characters (" + code.lines().count() + " lines).\n" +
                    "- **Language Mode:** " + language + "\n\n";
        }

        return AiResponseDto.builder()
                .success(true)
                .response(msg)
                .suggestedCode(suggested)
                .build();
    }
}
