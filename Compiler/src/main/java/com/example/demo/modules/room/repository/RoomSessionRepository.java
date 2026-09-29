package com.example.demo.modules.room.repository;

import com.example.demo.entity.types.RoomPermission;
import com.example.demo.entity.types.Session;

import java.util.List;

/**
 * Repository interface for abstracting room session data and member permission persistence.
 * <p>
 * Implements the <b>Repository / Port-and-Adapter Pattern</b> to isolate the core collaboration
 * logic from the underlying storage mechanism. Default implementation uses in-memory concurrency,
 * and can be seamlessly substituted by a Redis repository in horizontally scaled clusters.
 * </p>
 */
public interface RoomSessionRepository {
    void saveSession(Session session);
    Session findSessionById(String sessionId);
    void deleteSession(String sessionId);

    void setRoomAdmin(String roomId, String adminUserName);
    String getRoomAdmin(String roomId);

    void setMemberPermission(String roomId, String userName, RoomPermission permission);
    RoomPermission getMemberPermission(String roomId, String userName);

    void addMemberToRoom(String roomId, String userName);
    void removeMemberFromRoom(String roomId, String userName);
    List<String> getRoomMembers(String roomId);

    void saveUserSessionMapping(String userName, Session session);
    Session findSessionByUserName(String userName);
}

