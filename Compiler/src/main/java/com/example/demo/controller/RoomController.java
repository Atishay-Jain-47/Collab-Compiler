package com.example.demo.controller;

import com.example.demo.dto.CollaborationDto;
import com.example.demo.dto.CreateSessionResponseDto;
import com.example.demo.dto.JoinRoomDto;
import com.example.demo.dto.RoomDetailsDto;
import com.example.demo.dto.UpdatePermissionDto;
import com.example.demo.entity.types.Session;
import com.example.demo.manager.SessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller managing room creation, membership queries, and administrative permission changes.
 */
@RestController
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(
        origins = {
                "http://localhost:5173",
                "https://compiler-frontend-six.vercel.app",
                "https://compiler-frontend.satyamvatsal.ovh",
        }
)
public class RoomController {

    private final SessionManager sessionManager;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Retrieves room details including host username, member list, and active user permission level.
     *
     * @param roomId unique room ID
     * @param user optional current requesting username
     * @return {@link ResponseEntity} with {@link RoomDetailsDto} or 404 if room does not exist
     */
    @GetMapping("/collab/room/{roomId}")
    public ResponseEntity<?> getRoomDetails(@PathVariable String roomId, @RequestParam(required = false) String user) {
        RoomDetailsDto details = sessionManager.getRoomDetails(roomId, user);
        if (details == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Room not found");
        }
        return ResponseEntity.ok(details);
    }

    /**
     * Updates permission level (EXECUTE, WRITE, READ) for a room member.
     * Only the designated room admin (creator) is authorized to perform this operation.
     *
     * @param dto payload containing roomId, adminUserName, targetUserName, and new permission
     * @return {@link ResponseEntity} confirming update or 403 Forbidden if requester is not admin
     */
    @PostMapping("/collab/permission")
    public ResponseEntity<?> updatePermission(@RequestBody UpdatePermissionDto dto) {
        boolean updated = sessionManager.updateMemberPermission(
                dto.getRoomId(),
                dto.getAdminUserName(),
                dto.getTargetUserName(),
                dto.getPermission()
        );

        if (!updated) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only the room creator can modify permissions.");
        }

        // Broadcast permission change to all connected clients in the room
        messagingTemplate.convertAndSend("/topic/room/" + dto.getRoomId(),
                (Object) Map.of(
                        "type", "PERMISSION_CHANGE",
                        "senderId", dto.getAdminUserName(),
                        "targetUser", dto.getTargetUserName(),
                        "permission", dto.getPermission().name()
                )
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Permission updated to " + dto.getPermission() + " for " + dto.getTargetUserName()
        ));
    }

    /**
     * Creates a new collaborative room session with the creator as Host.
     *
     * @param collaborationDto room creation data with seed code and language
     * @return {@link ResponseEntity} containing {@link CreateSessionResponseDto}
     */
    @PostMapping("/collab/info")
    public ResponseEntity<CreateSessionResponseDto> createNewRoom(@RequestBody CollaborationDto collaborationDto) {
        Session session = sessionManager.createSession(collaborationDto);
        CreateSessionResponseDto createSessionResponseDto = CreateSessionResponseDto.builder()
                .roomId(session.getSessionId())
                .message("Room Created Successfully")
                .build();
        log.info("Collaboration room created: {}", createSessionResponseDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createSessionResponseDto);
    }

    /**
     * Joins an existing room session and assigns default WRITE permissions.
     *
     * @param joinRoomDto join request containing roomId and userName
     * @return {@link ResponseEntity} confirming room connection or 404 if not found
     */
    @PostMapping("/collab/join")
    public ResponseEntity<CreateSessionResponseDto> joinRoom(@RequestBody JoinRoomDto joinRoomDto) {
        boolean joined = sessionManager.joinUserToRoom(joinRoomDto);

        if (!joined) {
            CreateSessionResponseDto createSessionResponseDto = CreateSessionResponseDto.builder()
                    .roomId("")
                    .message("This Room doesn't exist")
                    .build();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createSessionResponseDto);
        }

        CreateSessionResponseDto createSessionResponseDto = CreateSessionResponseDto.builder()
                .roomId(joinRoomDto.getRoomId())
                .message("Connected to Room " + joinRoomDto.getRoomId())
                .build();
        return ResponseEntity.status(HttpStatus.OK).body(createSessionResponseDto);
    }
}
