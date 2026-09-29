package com.example.demo.dto;

import lombok.*;

/**
 * Data Transfer Object for joining an existing collaborative room session.
 */
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class JoinRoomDto {
    private String userName;
    private String roomId;
}
