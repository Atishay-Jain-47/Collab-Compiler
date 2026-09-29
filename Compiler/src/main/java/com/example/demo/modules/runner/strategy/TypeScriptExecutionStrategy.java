package com.example.demo.modules.runner.strategy;

import com.example.demo.entity.types.Language;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Concrete execution strategy for running TypeScript files using tsx or ts-node.
 */
@Component
public class TypeScriptExecutionStrategy implements ExecutionStrategy {
    private static final boolean IS_WINDOWS = System.getProperty("os.name").toLowerCase().contains("win");

    @Override
    public Language getLanguage() {
        return Language.TYPESCRIPT;
    }

    @Override
    public List<String> buildCommand(String codePath) {
        List<String> command = new ArrayList<>();
        if (IS_WINDOWS) {
            command.add("cmd.exe");
            command.add("/c");
            command.add("npx -y tsx \"" + codePath + "\"");
        } else {
            command.add("/bin/sh");
            command.add("-c");
            command.add("npx -y tsx \"" + codePath + "\"");
        }
        return command;
    }
}
