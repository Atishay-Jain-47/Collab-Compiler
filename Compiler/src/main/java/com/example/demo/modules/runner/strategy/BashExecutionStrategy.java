package com.example.demo.modules.runner.strategy;

import com.example.demo.entity.types.Language;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Concrete execution strategy for running Shell / Bash scripts.
 */
@Component
public class BashExecutionStrategy implements ExecutionStrategy {
    private static final boolean IS_WINDOWS = System.getProperty("os.name").toLowerCase().contains("win");

    @Override
    public Language getLanguage() {
        return Language.BASH;
    }

    @Override
    public List<String> buildCommand(String codePath) {
        List<String> command = new ArrayList<>();
        if (IS_WINDOWS) {
            command.add("bash");
            command.add(codePath);
        } else {
            command.add("/bin/bash");
            command.add(codePath);
        }
        return command;
    }
}
