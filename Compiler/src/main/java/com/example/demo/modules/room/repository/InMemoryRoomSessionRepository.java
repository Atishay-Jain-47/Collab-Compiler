package com.example.demo.modules.room.repository;

import com.example.demo.entity.types.RoomPermission;
import com.example.demo.entity.types.Session;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Thread-safe in-memory implementation of {@link RoomSessionRepository}.
 * Uses ConcurrentHashMap and CopyOnWriteArrayList data structures to support
 * concurrent multi-user access without lock contention.
 * <p>
 * This class serves as the default storage engine and can be swapped with a
 * Redis-backed implementation in multi-instance clustering environments.
 */
@Repository
public class InMemoryRoomSessionRepository implements RoomSessionRepository {

    /** Map of sessionId to active Session instance */
    private final ConcurrentHashMap<String, Session> sessionIdToSession = new ConcurrentHashMap<>();
    /** Map of username to user's current active Session */
    private final ConcurrentHashMap<String, Session> userToSessionMap = new ConcurrentHashMap<>();
    /** Map of roomId to the username of the room creator/admin */
    private final ConcurrentHashMap<String, String> roomAdminMap = new ConcurrentHashMap<>();
    /** Nested map of roomId -> (username -> RoomPermission) */
    private final ConcurrentHashMap<String, ConcurrentHashMap<String, RoomPermission>> roomPermissions = new ConcurrentHashMap<>();
    /** Map of roomId to thread-safe list of active user names */
    private final ConcurrentHashMap<String, List<String>> roomMembersMap = new ConcurrentHashMap<>();

    @Override
    public void saveSession(Session session) {
        if (session != null && session.getSessionId() != null) {
            sessionIdToSession.put(session.getSessionId(), session);
        }
    }

    @Override
    public Session findSessionById(String sessionId) {
        if (sessionId == null) return null;
        return sessionIdToSession.get(sessionId);
    }

    @Override
    public void deleteSession(String sessionId) {
        if (sessionId == null) return;
        sessionIdToSession.remove(sessionId);
        roomAdminMap.remove(sessionId);
        roomPermissions.remove(sessionId);
        roomMembersMap.remove(sessionId);
    }

    @Override
    public void setRoomAdmin(String roomId, String adminUserName) {
        if (roomId != null && adminUserName != null) {
            roomAdminMap.put(roomId, adminUserName);
        }
    }

    @Override
    public String getRoomAdmin(String roomId) {
        if (roomId == null) return null;
        return roomAdminMap.get(roomId);
    }

    @Override
    public void setMemberPermission(String roomId, String userName, RoomPermission permission) {
        if (roomId != null && userName != null && permission != null) {
            roomPermissions.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>()).put(userName, permission);
        }
    }

    @Override
    public RoomPermission getMemberPermission(String roomId, String userName) {
        if (roomId == null || userName == null) return null;
        ConcurrentHashMap<String, RoomPermission> perms = roomPermissions.get(roomId);
        return perms != null ? perms.get(userName) : null;
    }

    @Override
    public void addMemberToRoom(String roomId, String userName) {
        if (roomId == null || userName == null) return;
        List<String> members = roomMembersMap.computeIfAbsent(roomId, k -> new CopyOnWriteArrayList<>());
        if (!members.contains(userName)) {
            members.add(userName);
        }
    }

    @Override
    public void removeMemberFromRoom(String roomId, String userName) {
        if (roomId == null || userName == null) return;
        List<String> members = roomMembersMap.get(roomId);
        if (members != null) {
            members.remove(userName);
            // If room has no more active members, clean up room resources to prevent memory leak
            if (members.isEmpty()) {
                deleteSession(roomId);
            }
        }
    }

    @Override
    public List<String> getRoomMembers(String roomId) {
        if (roomId == null) return Collections.emptyList();
        List<String> members = roomMembersMap.get(roomId);
        return members != null ? Collections.unmodifiableList(members) : Collections.emptyList();
    }

    @Override
    public void saveUserSessionMapping(String userName, Session session) {
        if (userName != null && session != null) {
            userToSessionMap.put(userName, session);
        }
    }

    @Override
    public Session findSessionByUserName(String userName) {
        if (userName == null) return null;
        return userToSessionMap.get(userName);
    }
}
