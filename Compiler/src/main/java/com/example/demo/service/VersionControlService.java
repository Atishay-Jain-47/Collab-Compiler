package com.example.demo.service;

import com.example.demo.dto.CodeVersionResponseDto;
import com.example.demo.dto.CreateVersionRequestDto;
import com.example.demo.dto.YjsPayload;
import com.example.demo.entity.types.CodeVersion;
import com.example.demo.manager.SessionManager;
import com.example.demo.repositories.CodeVersionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service managing version control snapshots, commit history, and real-time room version broadcasts.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VersionControlService {

    private final CodeVersionRepository versionRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SessionManager sessionManager;

    /**
     * Saves a new version snapshot. If in a collaborative room, broadcasts the event
     * so all peers update their timeline in real-time.
     */
    public CodeVersionResponseDto saveVersion(CreateVersionRequestDto dto, String authorUserName) {
        String roomId = dto.getRoomId();
        if (roomId != null && !roomId.trim().isEmpty()) {
            roomId = roomId.trim();
        } else {
            roomId = null;
        }

        // Default name if blank
        String name = dto.getVersionName();
        if (name == null || name.trim().isEmpty()) {
            name = dto.isAutoSave() ? "Auto-Save Checkpoint" : "Snapshot " + Instant.now().toString().substring(11, 19);
        }

        CodeVersion version = CodeVersion.builder()
                .roomId(roomId)
                .authorUserName(authorUserName)
                .versionName(name.trim())
                .message(dto.getMessage() != null ? dto.getMessage().trim() : "")
                .code(dto.getCode() != null ? dto.getCode() : "")
                .language(dto.getLanguage() != null ? dto.getLanguage().toUpperCase() : "UNKNOWN")
                .autoSave(dto.isAutoSave())
                .createdAt(Instant.now())
                .build();

        CodeVersion saved = versionRepository.save(version);
        log.info("Saved code version [{}] by [{}] in room [{}] (autoSave={})",
                saved.getId(), authorUserName, roomId, saved.isAutoSave());

        CodeVersionResponseDto responseDto = mapToDto(saved);

        // If in collaborative room, broadcast notification to room subscribers
        if (roomId != null) {
            try {
                messagingTemplate.convertAndSend(
                        "/topic/room/" + roomId,
                        YjsPayload.builder()
                                .senderId(authorUserName)
                                .type("VERSION_CREATED")
                                .content(saved.getId() + ":" + saved.getVersionName())
                                .build()
                );
            } catch (Exception e) {
                log.warn("Failed to broadcast VERSION_CREATED event for room [{}]: {}", roomId, e.getMessage());
            }
        }

        return responseDto;
    }

    /**
     * Retrieves version history for a room or user.
     */
    public List<CodeVersionResponseDto> getVersions(String roomId, String authorUserName, String language) {
        List<CodeVersion> list;
        if (roomId != null && !roomId.trim().isEmpty()) {
            list = versionRepository.findByRoomIdOrderByCreatedAtDesc(roomId.trim());
        } else if (language != null && !language.trim().isEmpty()) {
            list = versionRepository.findByAuthorUserNameAndRoomIdIsNullAndLanguageOrderByCreatedAtDesc(
                    authorUserName, language.toUpperCase());
        } else {
            list = versionRepository.findByAuthorUserNameAndRoomIdIsNullOrderByCreatedAtDesc(authorUserName);
        }

        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    /**
     * Retrieves a single version by ID.
     */
    public CodeVersionResponseDto getVersionById(String versionId) {
        return versionRepository.findById(versionId)
                .map(this::mapToDto)
                .orElse(null);
    }

    /**
     * Reverts editor state to the specified version.
     * In collaborative rooms, broadcasts REVERT_TO_VERSION so all room members update their editor.
     */
    public CodeVersionResponseDto revertToVersion(String versionId, String requestedBy) {
        CodeVersion version = versionRepository.findById(versionId).orElse(null);
        if (version == null) {
            return null;
        }

        String roomId = version.getRoomId();
        if (roomId != null) {
            // Verify permission
            if (!sessionManager.canUserWrite(roomId, requestedBy)) {
                log.warn("User [{}] denied permission to revert in room [{}]", requestedBy, roomId);
                throw new IllegalStateException("You do not have write permission in this room.");
            }

            // Broadcast room-wide revert event
            try {
                messagingTemplate.convertAndSend(
                        "/topic/room/" + roomId,
                        YjsPayload.builder()
                                .senderId(requestedBy)
                                .type("REVERT_TO_VERSION")
                                .content(version.getCode())
                                .build()
                );
                log.info("Broadcasted room-wide REVERT_TO_VERSION for room [{}] by [{}]", roomId, requestedBy);
            } catch (Exception e) {
                log.error("Failed to broadcast REVERT_TO_VERSION event: ", e);
            }
        }

        return mapToDto(version);
    }

    private CodeVersionResponseDto mapToDto(CodeVersion v) {
        return CodeVersionResponseDto.builder()
                .id(v.getId())
                .roomId(v.getRoomId())
                .authorUserName(v.getAuthorUserName())
                .versionName(v.getVersionName())
                .message(v.getMessage())
                .code(v.getCode())
                .language(v.getLanguage())
                .autoSave(v.isAutoSave())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
