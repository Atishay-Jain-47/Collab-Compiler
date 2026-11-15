package com.example.demo.entity.types;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * MongoDB document persisting collaboration room state across server restarts.
 */
@Document(collection = "collab_rooms")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomEntity {

    @Id
    private String roomId;

    @Indexed
    private String adminUserName;

    private String language;

    private String code;

    private String input;

    @Builder.Default
    private List<String> members = new ArrayList<>();

    @Builder.Default
    private Map<String, RoomPermission> permissions = new HashMap<>();

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();
}
