package com.example.demo.controller;

import com.example.demo.dto.YjsPayload;
import com.example.demo.manager.SessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * STOMP WebSocket controller for collaborative room synchronization.
 * <p>
 * Routes inbound client messages ({@code /app/editor.sync/{roomId}}), applies permission
 * filters (blocking write updates from read-only users), and broadcasts valid events
 * to all subscribers on {@code /topic/room/{roomId}}.
 * </p>
 * <p>
 * The authenticated {@link Principal} injected by {@link WebSocketSecurityConfig} is used
 * to resolve the true sender identity server-side, so clients can no longer impersonate
 * other users by spoofing the {@code senderId} field in the payload.
 * </p>
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class CollaborationController {

    private final SessionManager sessionManager;

    /**
     * Handles real-time Yjs CRDT binary updates, chat messages, input changes, and run results.
     * <p>
     * The {@code senderId} field inside the payload is <em>overwritten</em> with the verified
     * server-side principal name so that downstream subscribers always see the real identity.
     * </p>
     *
     * @param roomId  unique room identifier
     * @param payload STOMP message payload
     * @param headerAccessor STOMP header accessor carrying the authenticated session principal
     * @return payload to broadcast, or {@code null} if dropped by security filters
     */
    @MessageMapping("/editor.sync/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public YjsPayload handleYjsSync(
            @DestinationVariable String roomId,
            YjsPayload payload,
            SimpMessageHeaderAccessor headerAccessor) {

        // Resolve the verified server-side identity; fall back to payload value only
        // if the principal is somehow absent (should not happen after WebSocketSecurityConfig).
        Principal principal = headerAccessor.getUser();
        String verifiedSenderId = (principal != null) ? principal.getName() : payload.getSenderId();

        if (principal == null) {
            log.warn("No authenticated principal found for STOMP message in room [{}]. "
                    + "Falling back to client-supplied senderId — verify WebSocketSecurityConfig is active.", roomId);
        }

        // Overwrite the client-supplied senderId with the server-verified identity
        payload.setSenderId(verifiedSenderId);

        // Enforce WRITE permissions: block UPDATE events from READ-only users
        if ("UPDATE".equals(payload.getType()) && !sessionManager.canUserWrite(roomId, verifiedSenderId)) {
            log.warn("Blocked UPDATE: User [{}] has READ-ONLY permission in room [{}]", verifiedSenderId, roomId);
            return null; // Suppress broadcast
        }

        if ("CHAT".equals(payload.getType())) {
            log.info("Chat in Room [{}]: [{}] says: {}", roomId, verifiedSenderId, payload.getContent());
        } else {
            log.info("Sync Update in Room [{}]: Type [{}] from user [{}]", roomId, payload.getType(), verifiedSenderId);
        }

        // Return payload to broadcast to all subscribers of /topic/room/{roomId}
        return payload;
    }
}