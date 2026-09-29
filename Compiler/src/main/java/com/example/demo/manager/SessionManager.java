package com.example.demo.manager;

import com.example.demo.dto.CollaborationDto;
import com.example.demo.dto.JoinRoomDto;
import com.example.demo.dto.RoomDetailsDto;
import com.example.demo.dto.RoomMemberDto;
import com.example.demo.dto.RunRequestDto;
import com.example.demo.entity.types.RoomPermission;
import com.example.demo.entity.types.Session;
import com.example.demo.modules.room.repository.RoomSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Service managing collaborative coding sessions, room lifecycles, and member permissions.
 * <p>
 * Delegates low-level persistence to {@link RoomSessionRepository} and enforces room access
 * controls (Host, Runner, Editor, Viewer).
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SessionManager {

    private final RoomSessionRepository roomRepository;


    public Session getSessionByUserId(String userId) {
        if (userId == null) return null;
        return roomRepository.findSessionByUserName(userId);
    }

    public Session createSession(CollaborationDto collaborationDto) {
        String newId = getNewSessionId();
        Session session = Session.builder()
                .sessionId(newId)
                .userName(collaborationDto.getUserName())
                .code(collaborationDto.getCode())
                .language(collaborationDto.getLanguage())
                .codePath("")
                .input(collaborationDto.getInput())
                .inputPath("")
                .output("")
                .error("")
                .timeTaken(0.0)
                .memoryUsed(0.0)
                .build();

        String creator = collaborationDto.getUserName();
        if (creator != null) {
            roomRepository.saveUserSessionMapping(creator, session);
            roomRepository.setRoomAdmin(newId, creator);
            roomRepository.setMemberPermission(newId, creator, RoomPermission.EXECUTE);
            roomRepository.addMemberToRoom(newId, creator);
        }

        roomRepository.saveSession(session);
        log.info("Collaboration room created: {} by admin: {}", session.getSessionId(), creator);
        return session;
    }

    public boolean joinUserToRoom(JoinRoomDto joinRoomDto) {
        String roomId = joinRoomDto.getRoomId();
        Session session = roomRepository.findSessionById(roomId);
        if (session == null) return false;

        String userName = joinRoomDto.getUserName();
        if (userName != null) {
            roomRepository.addMemberToRoom(roomId, userName);
            String admin = roomRepository.getRoomAdmin(roomId);
            if (userName.equals(admin)) {
                roomRepository.setMemberPermission(roomId, userName, RoomPermission.EXECUTE);
            } else if (roomRepository.getMemberPermission(roomId, userName) == null) {
                roomRepository.setMemberPermission(roomId, userName, RoomPermission.WRITE);
            }
        }
        return true;
    }

    public boolean updateMemberPermission(String roomId, String adminUser, String targetUser, RoomPermission permission) {
        String admin = roomRepository.getRoomAdmin(roomId);
        if (admin == null || !admin.equals(adminUser)) {
            log.warn("Permission update denied: {} is not admin of room {}", adminUser, roomId);
            return false;
        }

        roomRepository.setMemberPermission(roomId, targetUser, permission);
        log.info("Permission updated in room {}: {} -> {}", roomId, targetUser, permission);
        return true;
    }

    public RoomDetailsDto getRoomDetails(String roomId, String currentUsername) {
        Session session = roomRepository.findSessionById(roomId);
        if (session == null) return null;

        String admin = roomRepository.getRoomAdmin(roomId);
        List<String> users = roomRepository.getRoomMembers(roomId);

        List<RoomMemberDto> memberDtos = users.stream().map(user -> {
            RoomPermission p = roomRepository.getMemberPermission(roomId, user);
            return RoomMemberDto.builder()
                    .userName(user)
                    .isAdmin(user.equals(admin))
                    .permission(p != null ? p : RoomPermission.WRITE)
                    .build();
        }).toList();

        RoomPermission myPerm = (currentUsername != null && currentUsername.equals(admin))
                ? RoomPermission.EXECUTE
                : roomRepository.getMemberPermission(roomId, currentUsername);

        if (myPerm == null) {
            myPerm = RoomPermission.WRITE;
        }

        return RoomDetailsDto.builder()
                .roomId(roomId)
                .adminUserName(admin)
                .members(memberDtos)
                .userPermission(myPerm)
                .isAdmin(currentUsername != null && currentUsername.equals(admin))
                .build();
    }

    public boolean canUserWrite(String roomId, String username) {
        if (roomId == null || username == null) return true;
        String admin = roomRepository.getRoomAdmin(roomId);
        if (username.equals(admin)) return true;

        RoomPermission p = roomRepository.getMemberPermission(roomId, username);
        return p == null || p == RoomPermission.WRITE || p == RoomPermission.EXECUTE;
    }

    public boolean canUserExecute(String roomId, String username) {
        if (roomId == null || username == null) return true;
        String admin = roomRepository.getRoomAdmin(roomId);
        if (username.equals(admin)) return true;

        RoomPermission p = roomRepository.getMemberPermission(roomId, username);
        return p == null || p == RoomPermission.EXECUTE;
    }

    public Session createSession(RunRequestDto runRequestDto) {
        String newId = getNewSessionId();
        return Session.builder()
                .sessionId(newId)
                .userName(runRequestDto.getUserName())
                .code(runRequestDto.getCode())
                .language(runRequestDto.getLanguage())
                .codePath("")
                .input(runRequestDto.getInput())
                .inputPath("")
                .output("")
                .error("")
                .timeTaken(0.0)
                .memoryUsed(0.0)
                .build();
    }

    private String getNewSessionId() {
        int min = 100000;
        int max = 999999;
        String idStr;
        while (true) {
            int sessionId = ThreadLocalRandom.current().nextInt((max - min) + 1) + min;
            idStr = String.valueOf(sessionId);
            if (roomRepository.findSessionById(idStr) == null) {
                break;
            }
        }
        return idStr;
    }
}
