package com.example.demo.dto;

import com.example.demo.entity.types.RoomPermission;
import lombok.*;

/**
 * Request payload sent by a room admin to modify the access permission
 * (READ_ONLY, WRITE, or EXECUTE) of a target room participant.
 */
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdatePermissionDto {
    private String roomId;
    private String adminUserName;
    private String targetUserName;
    private RoomPermission permission;
}
