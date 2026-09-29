package com.example.demo.modules.runner.strategy;

import com.example.demo.entity.types.Language;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Concrete execution strategy for running JavaScript source code via Node.js runtime.
 */
@Component
public class JsExecutionStrategy implements ExecutionStrategy {
    /**
     * Identifies the language supported by this strategy.
     *
     * @return Language.JS enum
     */
    @Override
    public Language getLanguage() {
        return Language.JS;
    }

    /**
     * Constructs the `node <file.js>` execution command list.
     *
     * @param codePath path to the JavaScript file
     * @return List of command line arguments for ProcessBuilder
     */
    @Override
    public List<String> buildCommand(String codePath) {
        List<String> command = new ArrayList<>();
        command.add("node");
        command.add(codePath);
        return command;
    }
}
