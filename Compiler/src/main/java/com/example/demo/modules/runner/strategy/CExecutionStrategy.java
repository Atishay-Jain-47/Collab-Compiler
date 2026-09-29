package com.example.demo.modules.runner.strategy;

import com.example.demo.entity.types.Language;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Concrete execution strategy for compiling and running C source code.
 * Uses gcc with platform-specific execution wrappers to compile and run the resulting binary.
 */
@Component
public class CExecutionStrategy implements ExecutionStrategy {
    private static final boolean IS_WINDOWS = System.getProperty("os.name").toLowerCase().contains("win");

    /**
     * Identifies the language supported by this strategy.
     *
     * @return Language.C enum
     */
    @Override
    public Language getLanguage() {
        return Language.C;
    }

    /**
     * Constructs the compile & execute command list for C using gcc.
     *
     * @param codePath path to the .c source file
     * @return List of command line arguments for ProcessBuilder
     */
    @Override
    public List<String> buildCommand(String codePath) {
        String executablePath = codePath + (IS_WINDOWS ? ".exe" : "Executable");
        List<String> command = new ArrayList<>();

        if (IS_WINDOWS) {
            command.add("cmd.exe");
            command.add("/c");
            command.add("gcc \"" + codePath + "\" -o \"" + executablePath + "\" && \"" + executablePath + "\"");
        } else {
            command.add("/bin/sh");
            command.add("-c");
            command.add("gcc \"" + codePath + "\" -o \"" + executablePath + "\" && \"" + executablePath + "\"");
        }
        return command;
    }
}
