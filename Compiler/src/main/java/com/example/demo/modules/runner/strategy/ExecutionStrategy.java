package com.example.demo.modules.runner.strategy;

import com.example.demo.entity.types.Language;

import java.util.List;

/**
 * Strategy interface representing the compilation and execution semantics for a specific programming language.
 * <p>
 * Implements the <b>Strategy Pattern</b> to eliminate hardcoded switch statements across runners,
 * adhering to the <b>Open/Closed Principle (OCP)</b>. Adding support for a new language requires
 * implementing this interface and registering it as a Spring Component.
 * </p>
 */
public interface ExecutionStrategy {

    /**
     * Identifies the programming language handled by this execution strategy.
     *
     * @return the {@link Language} enum value
     */
    Language getLanguage();

    /**
     * Builds the cross-platform command line arguments necessary to compile (if needed)
     * and execute source code located at the specified file path.
     *
     * @param codePath absolute filesystem path to the code source file
     * @return ordered list of command tokens suitable for {@link ProcessBuilder}
     */
    List<String> buildCommand(String codePath);
}

