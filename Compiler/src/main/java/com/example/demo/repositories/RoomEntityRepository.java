package com.example.demo.repositories;

import com.example.demo.entity.types.RoomEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data MongoDB repository for persisting {@link RoomEntity}.
 */
@Repository
public interface RoomEntityRepository extends MongoRepository<RoomEntity, String> {
}
