package com.example.demo.modules.room.repository;

import com.example.demo.entity.types.RoomEntity;
import com.example.demo.entity.types.RoomPermission;
import com.example.demo.entity.types.Session;
import com.example.demo.repositories.RoomEntityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * MongoDB-backed persistent implementation of {@link RoomSessionRepository}.
 * <p>
 * Persists room configuration, admin identity, active members list, and role permissions
 * to MongoDB Atlas so collaborative rooms survive server restarts and redeployments,
 * while utilizing ConcurrentHashMaps as a fast L1 read-through cache.
 * </p>
 */
@Slf4j
@Primary
@Repository
@RequiredArgsConstructor
public class MongoRoomSessionRepository implements RoomSessionRepository {

    private final RoomEntityRepository roomEntityRepository;

    // Fast L1 in-memory caches
    private final ConcurrentHashMap<String, Session> sessionIdToSession = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Session> userToSessionMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> roomAdminMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, ConcurrentHashMap<String, RoomPermission>> roomPermissions = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, List<String>> roomMembersMap = new ConcurrentHashMap<>();

    @Override
    public void saveSession(Session session) {
        if (session != null && session.getSessionId() != null) {
            sessionIdToSession.put(session.getSessionId(), session);

            // Persist or update room entity in MongoDB
            String roomId = session.getSessionId();
            try {
                RoomEntity room = roomEntityRepository.findById(roomId).orElseGet(() ->
                        RoomEntity.builder()
                                .roomId(roomId)
                                .adminUserName(session.getUserName())
                                .members(new ArrayList<>(List.of(session.getUserName())))
                                .permissions(new HashMap<>(Map.of(session.getUserName(), RoomPermission.EXECUTE)))
                                .createdAt(Instant.now())
                                .build()
                );

                if (session.getLanguage() != null) {
                    room.setLanguage(session.getLanguage().name());
                }
                if (session.getCode() != null) {
                    room.setCode(session.getCode());
                }
                if (session.getInput() != null) {
                    room.setInput(session.getInput());
                }
                room.setUpdatedAt(Instant.now());

                roomEntityRepository.save(room);
                log.debug("Persisted RoomEntity [{}] to MongoDB", roomId);
            } catch (Exception e) {
                log.warn("Failed to persist RoomEntity [{}] to MongoDB: {}", roomId, e.getMessage());
            }
        }
    }

    @Override
    public Session findSessionById(String sessionId) {
        if (sessionId == null) return null;
        Session session = sessionIdToSession.get(sessionId);
        if (session != null) return session;

        // Fallback: restore from MongoDB if in-memory cache was cleared
        try {
            Optional<RoomEntity> opt = roomEntityRepository.findById(sessionId);
            if (opt.isPresent()) {
                RoomEntity entity = opt.get();
                session = Session.builder()
                        .sessionId(entity.getRoomId())
                        .userName(entity.getAdminUserName())
                        .code(entity.getCode())
                        .input(entity.getInput())
                        .build();

                sessionIdToSession.put(sessionId, session);
                if (entity.getAdminUserName() != null) {
                    roomAdminMap.put(sessionId, entity.getAdminUserName());
                }
                if (entity.getMembers() != null) {
                    roomMembersMap.put(sessionId, new CopyOnWriteArrayList<>(entity.getMembers()));
                }
                if (entity.getPermissions() != null) {
                    roomPermissions.put(sessionId, new ConcurrentHashMap<>(entity.getPermissions()));
                }
                log.info("Restored Room [{}] from MongoDB into memory cache", sessionId);
                return session;
            }
        } catch (Exception e) {
            log.warn("Error reading RoomEntity [{}] from MongoDB: {}", sessionId, e.getMessage());
        }
        return null;
    }

    @Override
    public void deleteSession(String sessionId) {
        if (sessionId == null) return;
        sessionIdToSession.remove(sessionId);
        roomAdminMap.remove(sessionId);
        roomPermissions.remove(sessionId);
        roomMembersMap.remove(sessionId);

        try {
            roomEntityRepository.deleteById(sessionId);
            log.info("Deleted Room [{}] from MongoDB", sessionId);
        } catch (Exception e) {
            log.warn("Failed to delete Room [{}] from MongoDB: {}", sessionId, e.getMessage());
        }
    }

    @Override
    public void setRoomAdmin(String roomId, String adminUserName) {
        if (roomId == null || adminUserName == null) return;
        roomAdminMap.put(roomId, adminUserName);

        try {
            roomEntityRepository.findById(roomId).ifPresent(r -> {
                r.setAdminUserName(adminUserName);
                r.setUpdatedAt(Instant.now());
                roomEntityRepository.save(r);
            });
        } catch (Exception e) {
            log.warn("Failed to update room admin for [{}] in MongoDB: {}", roomId, e.getMessage());
        }
    }

    @Override
    public String getRoomAdmin(String roomId) {
        if (roomId == null) return null;
        String admin = roomAdminMap.get(roomId);
        if (admin != null) return admin;

        return roomEntityRepository.findById(roomId)
                .map(r -> {
                    roomAdminMap.put(roomId, r.getAdminUserName());
                    return r.getAdminUserName();
                })
                .orElse(null);
    }

    @Override
    public void setMemberPermission(String roomId, String userName, RoomPermission permission) {
        if (roomId == null || userName == null || permission == null) return;
        roomPermissions.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>()).put(userName, permission);

        try {
            roomEntityRepository.findById(roomId).ifPresent(r -> {
                if (r.getPermissions() == null) r.setPermissions(new HashMap<>());
                r.getPermissions().put(userName, permission);
                r.setUpdatedAt(Instant.now());
                roomEntityRepository.save(r);
            });
        } catch (Exception e) {
            log.warn("Failed to persist permission for [{}] in room [{}]: {}", userName, roomId, e.getMessage());
        }
    }

    @Override
    public RoomPermission getMemberPermission(String roomId, String userName) {
        if (roomId == null || userName == null) return null;
        ConcurrentHashMap<String, RoomPermission> perms = roomPermissions.get(roomId);
        if (perms != null && perms.containsKey(userName)) {
            return perms.get(userName);
        }

        return roomEntityRepository.findById(roomId)
                .map(r -> {
                    if (r.getPermissions() != null) {
                        roomPermissions.put(roomId, new ConcurrentHashMap<>(r.getPermissions()));
                        return r.getPermissions().get(userName);
                    }
                    return null;
                })
                .orElse(null);
    }

    @Override
    public void addMemberToRoom(String roomId, String userName) {
        if (roomId == null || userName == null) return;
        List<String> members = roomMembersMap.computeIfAbsent(roomId, k -> new CopyOnWriteArrayList<>());
        if (!members.contains(userName)) {
            members.add(userName);
        }

        try {
            roomEntityRepository.findById(roomId).ifPresent(r -> {
                if (r.getMembers() == null) r.setMembers(new ArrayList<>());
                if (!r.getMembers().contains(userName)) {
                    r.getMembers().add(userName);
                    r.setUpdatedAt(Instant.now());
                    roomEntityRepository.save(r);
                }
            });
        } catch (Exception e) {
            log.warn("Failed to add member [{}] to room [{}] in MongoDB: {}", userName, roomId, e.getMessage());
        }
    }

    @Override
    public void removeMemberFromRoom(String roomId, String userName) {
        if (roomId == null || userName == null) return;
        List<String> members = roomMembersMap.get(roomId);
        if (members != null) {
            members.remove(userName);
            if (members.isEmpty()) {
                deleteSession(roomId);
                return;
            }
        }

        try {
            roomEntityRepository.findById(roomId).ifPresent(r -> {
                if (r.getMembers() != null) {
                    r.getMembers().remove(userName);
                    r.setUpdatedAt(Instant.now());
                    roomEntityRepository.save(r);
                }
            });
        } catch (Exception e) {
            log.warn("Failed to remove member [{}] from room [{}] in MongoDB: {}", userName, roomId, e.getMessage());
        }
    }

    @Override
    public List<String> getRoomMembers(String roomId) {
        if (roomId == null) return Collections.emptyList();
        List<String> members = roomMembersMap.get(roomId);
        if (members != null && !members.isEmpty()) {
            return Collections.unmodifiableList(members);
        }

        return roomEntityRepository.findById(roomId)
                .map(r -> {
                    if (r.getMembers() != null) {
                        roomMembersMap.put(roomId, new CopyOnWriteArrayList<>(r.getMembers()));
                        return Collections.unmodifiableList(r.getMembers());
                    }
                    return Collections.<String>emptyList();
                })
                .orElse(Collections.emptyList());
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
