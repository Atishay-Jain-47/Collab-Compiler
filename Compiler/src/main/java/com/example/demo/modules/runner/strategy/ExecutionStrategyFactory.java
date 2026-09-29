package com.example.demo.modules.runner.strategy;

import com.example.demo.entity.types.Language;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Factory class responsible for discovering, caching, and resolving {@link ExecutionStrategy} instances.
 * <p>
 * Implements the <b>Factory Pattern</b>. Spring automatically injects all beans implementing
 * {@link ExecutionStrategy} on startup, allowing runtime strategy resolution with $O(1)$ complexity.
 * </p>
 */
@Slf4j
@Component
public class ExecutionStrategyFactory {

    private final Map<Language, ExecutionStrategy> strategyMap = new EnumMap<>(Language.class);

    /**
     * Initializes the factory with all discovered {@link ExecutionStrategy} Spring beans.
     *
     * @param strategies list of injected strategy beans
     */
    public ExecutionStrategyFactory(List<ExecutionStrategy> strategies) {
        for (ExecutionStrategy strategy : strategies) {
            strategyMap.put(strategy.getLanguage(), strategy);
            log.info("Registered execution strategy for language: {}", strategy.getLanguage());
        }
    }

    /**
     * Retrieves the appropriate execution strategy for the specified language.
     *
     * @param language the target programming language
     * @return the resolved {@link ExecutionStrategy}
     * @throws IllegalArgumentException if no strategy is registered for the specified language
     */
    public ExecutionStrategy getStrategy(Language language) {
        ExecutionStrategy strategy = strategyMap.get(language);
        if (strategy == null) {
            throw new IllegalArgumentException("No execution strategy registered for language: " + language);
        }
        return strategy;
    }
}

