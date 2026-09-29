package com.example.demo.modules.runner.strategy;

import com.example.demo.entity.types.Language;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Concrete execution strategy for running Go source code via `go run <file.go>`.
 */
@Component
public class GoExecutionStrategy implements ExecutionStrategy {
    /**
     * Identifies the language supported by this strategy.
     *
     * @return Language.GO enum
     */
    @Override
    public Language getLanguage() {
        return Language.GO;
    }

    /**
     * Constructs the `go run` execution command list.
     *
     * @param codePath path to the .go source file
     * @return List of command line arguments for ProcessBuilder
     */
    @Override
    public List<String> buildCommand(String codePath) {
        List<String> command = new ArrayList<>();
        command.add("go");
        command.add("run");
        command.add(codePath);
        return command;
    }
}
