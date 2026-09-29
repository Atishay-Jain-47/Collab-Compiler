package com.example.demo.dto;

import com.example.demo.entity.types.RoomPermission;
import lombok.*;

import java.util.List;

/**
 * Comprehensive metadata payload for a room, detailing current admin,
 * active member list, and the requesting caller's effective access permission.
 */
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RoomDetailsDto {
    private String roomId;
    private String adminUserName;
    private List<RoomMemberDto> members;
    private RoomPermission userPermission;
    private boolean isAdmin;
}
