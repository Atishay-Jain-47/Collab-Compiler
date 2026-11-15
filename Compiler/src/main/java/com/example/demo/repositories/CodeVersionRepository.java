package com.example.demo.repositories;

import com.example.demo.entity.types.CodeVersion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * MongoDB repository for managing {@link CodeVersion} snapshots.
 */
@Repository
public interface CodeVersionRepository extends MongoRepository<CodeVersion, String> {

    /**
     * Finds all versions saved in a collaborative room, sorted newest first.
     */
    List<CodeVersion> findByRoomIdOrderByCreatedAtDesc(String roomId);

    /**
     * Finds all solo versions saved by a specific user, sorted newest first.
     */
    List<CodeVersion> findByAuthorUserNameAndRoomIdIsNullOrderByCreatedAtDesc(String authorUserName);

    /**
     * Finds versions for a user and specific language (solo).
     */
    List<CodeVersion> findByAuthorUserNameAndRoomIdIsNullAndLanguageOrderByCreatedAtDesc(String authorUserName, String language);

    /**
     * Deletes all versions associated with a room.
     */
    void deleteByRoomId(String roomId);
}
