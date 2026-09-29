package com.example.demo.dto;

import lombok.*;

/**
 * Real-time WebSocket payload conveying CRDT binary updates (base64 encoded),
 * chat messages, or sync handshakes across collaborators in a room.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class YjsPayload {
    private String senderId;
    private String updateBase64; // Used for Yjs binary data
    private String type;         // "UPDATE", "SYNC_REQUEST", "CHAT", etc.
    private String content;      // <--- Add this for Chat messages
}