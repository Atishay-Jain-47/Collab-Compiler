package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

/**
 * MongoDB persistence auditing configuration.
 * <p>
 * Enables automated population of creation and modification timestamps on Mongo documents.
 * </p>
 */
@Configuration
@EnableMongoAuditing
public class MongoConfig {

}
