package com.example.demo.dto;

import com.example.demo.entity.types.RoomPermission;
import lombok.*;

/**
 * Representation of an individual participant inside a collaboration room,
 * including assigned permission level and admin status.
 */
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RoomMemberDto {
    private String userName;
    private RoomPermission permission;
    private boolean isAdmin;
}
