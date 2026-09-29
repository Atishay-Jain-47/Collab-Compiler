package com.example.demo.repositories;

import com.example.demo.entity.types.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data MongoDB repository for {@link User} entity management.
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /**
     * Finds a user record matching the given username.
     *
     * @param userName unique username
     * @return {@link User} entity or null if not found
     */
    User findByUserName(String userName);
}