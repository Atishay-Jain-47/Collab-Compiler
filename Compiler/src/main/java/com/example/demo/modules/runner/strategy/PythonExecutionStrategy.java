package com.example.demo.modules.runner.strategy;

import com.example.demo.entity.types.Language;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Concrete execution strategy for running Python scripts.
 * Automatically adapts the executable binary path between Windows (python)
 * and Unix/Linux environments (/usr/bin/python3 or python3).
 */
@Component
public class PythonExecutionStrategy implements ExecutionStrategy {
    private static final boolean IS_WINDOWS = System.getProperty("os.name").toLowerCase().contains("win");

    /**
     * Identifies the language supported by this strategy.
     *
     * @return Language.PYTHON enum
     */
    @Override
    public Language getLanguage() {
        return Language.PYTHON;
    }

    /**
     * Constructs the process execution command list for Python code.
     *
     * @param codePath absolute or relative path to the saved python script
     * @return List of command line arguments for ProcessBuilder
     */
    @Override
    public List<String> buildCommand(String codePath) {
        List<String> command = new ArrayList<>();
        if (IS_WINDOWS) {
            command.add("python");
        } else {
            command.add(new File("/usr/bin/python3").exists() ? "/usr/bin/python3" : "python3");
        }
        command.add(codePath);
        return command;
    }
}
