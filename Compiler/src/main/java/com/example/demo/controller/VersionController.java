package com.example.demo.controller;

import com.example.demo.dto.CodeVersionResponseDto;
import com.example.demo.dto.CreateVersionRequestDto;
import com.example.demo.service.VersionControlService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller exposing Version Control endpoints for saving snapshots,
 * browsing commit history, inspecting diff targets, and reverting code states.
 */
@Slf4j
@RestController
@RequestMapping("/api/versions")
@RequiredArgsConstructor
@CrossOrigin(
        origins = {
                "http://localhost:5173",
                "https://compiler-frontend-six.vercel.app",
                "https://compiler-frontend.satyamvatsal.ovh",
        }
)
public class VersionController {

    private final VersionControlService versionService;

    /**
     * Creates a new version snapshot.
     */
    @PostMapping
    public ResponseEntity<CodeVersionResponseDto> createVersion(@RequestBody CreateVersionRequestDto requestDto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName()))
                ? auth.getName() : "anonymous";

        CodeVersionResponseDto response = versionService.saveVersion(requestDto, username);
        return ResponseEntity.ok(response);
    }

    /**
     * Lists versions for a room or user.
     * Query params:
     * - roomId: room ID (for room history)
     * - language: language filter (for solo history)
     */
    @GetMapping
    public ResponseEntity<List<CodeVersionResponseDto>> getVersions(
            @RequestParam(required = false) String roomId,
            @RequestParam(required = false) String language) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName()))
                ? auth.getName() : "anonymous";

        List<CodeVersionResponseDto> list = versionService.getVersions(roomId, username, language);
        return ResponseEntity.ok(list);
    }

    /**
     * Gets a single version by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<CodeVersionResponseDto> getVersionById(@PathVariable String id) {
        CodeVersionResponseDto dto = versionService.getVersionById(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    /**
     * Reverts editor state to the specified version.
     */
    @PostMapping("/{id}/revert")
    public ResponseEntity<CodeVersionResponseDto> revertToVersion(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName()))
                ? auth.getName() : "anonymous";

        try {
            CodeVersionResponseDto dto = versionService.revertToVersion(id, username);
            if (dto == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(dto);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).build();
        }
    }
}
