package com.example.demo.controller;

import com.example.demo.dto.YjsPayload;
import com.example.demo.manager.SessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

/**
 * STOMP WebSocket controller for collaborative room synchronization.
 * <p>
 * Routes inbound client messages (`/app/editor.sync/{roomId}`), applies permission
 * filters (blocking write updates from read-only users), and broadcasts valid events
 * to all subscribers on `/topic/room/{roomId}`.
 * </p>
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class CollaborationController {

    private final SessionManager sessionManager;

    /**
     * Handles real-time Yjs CRDT binary updates, chat messages, input changes, and run results.
     *
     * @param roomId unique room identifier
     * @param payload STOMP message payload
     * @return payload to broadcast, or null if dropped by security filters
     */
    @MessageMapping("/editor.sync/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public YjsPayload handleYjsSync(@DestinationVariable String roomId, YjsPayload payload) {

        // Enforce WRITE permissions: block UPDATE events from READ-only users
        if ("UPDATE".equals(payload.getType()) && !sessionManager.canUserWrite(roomId, payload.getSenderId())) {
            log.warn("Blocked UPDATE: User [{}] has READ-ONLY permission in room [{}]", payload.getSenderId(), roomId);
            return null; // Suppress broadcast
        }

        if ("CHAT".equals(payload.getType())) {
            log.info("Chat in Room [{}]: [{}] says: {}", roomId, payload.getSenderId(), payload.getContent());
        } else {
            log.info("Sync Update in Room [{}]: Type [{}] from user [{}]", roomId, payload.getType(), payload.getSenderId());
        }

        // Return payload to broadcast to all subscribers of /topic/room/{roomId}
        return payload;
    }
}