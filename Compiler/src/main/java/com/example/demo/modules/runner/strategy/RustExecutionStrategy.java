package com.example.demo.modules.runner.strategy;

import com.example.demo.entity.types.Language;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Concrete execution strategy for compiling and running Rust source code.
 */
@Component
public class RustExecutionStrategy implements ExecutionStrategy {
    private static final boolean IS_WINDOWS = System.getProperty("os.name").toLowerCase().contains("win");

    @Override
    public Language getLanguage() {
        return Language.RUST;
    }

    @Override
    public List<String> buildCommand(String codePath) {
        String executablePath = codePath + (IS_WINDOWS ? ".exe" : ".out");
        List<String> command = new ArrayList<>();

        if (IS_WINDOWS) {
            command.add("cmd.exe");
            command.add("/c");
            command.add("rustc \"" + codePath + "\" -o \"" + executablePath + "\" && \"" + executablePath + "\"");
        } else {
            command.add("/bin/sh");
            command.add("-c");
            command.add("rustc \"" + codePath + "\" -O -o \"" + executablePath + "\" && \"" + executablePath + "\"");
        }
        return command;
    }
}
