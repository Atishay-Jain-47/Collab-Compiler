package com.example.demo.modules.runner.strategy;

import com.example.demo.entity.types.Language;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

/**
 * Concrete execution strategy for running Java source files.
 * Employs single-file source code execution (introduced in Java 11+) via `java <file.java>`,
 * intelligently discovering JAVA_HOME or system default java executables across environments.
 */
@Component
public class JavaExecutionStrategy implements ExecutionStrategy {
    private static final boolean IS_WINDOWS = System.getProperty("os.name").toLowerCase().contains("win");

    /**
     * Resolves the absolute path of the java executable based on JAVA_HOME or known install paths.
     *
     * @return Path or command name for java
     */
    private String getJavaExecutable() {
        String javaHome = System.getenv("JAVA_HOME");
        if (javaHome != null && !javaHome.trim().isEmpty()) {
            File javaBin = Paths.get(javaHome, "bin", IS_WINDOWS ? "java.exe" : "java").toFile();
            if (javaBin.exists()) {
                return javaBin.getAbsolutePath();
            }
        }
        if (IS_WINDOWS) {
            File jbrJava = new File("C:\\Program Files\\JetBrains\\IntelliJ IDEA 2026.1.1\\jbr\\bin\\java.exe");
            if (jbrJava.exists()) {
                return jbrJava.getAbsolutePath();
            }
        }
        return "java";
    }

    /**
     * Identifies the language supported by this strategy.
     *
     * @return Language.JAVA enum
     */
    @Override
    public Language getLanguage() {
        return Language.JAVA;
    }

    /**
     * Constructs the direct source execution command list for Java.
     *
     * @param codePath path to the Main.java file
     * @return List of command line arguments for ProcessBuilder
     */
    @Override
    public List<String> buildCommand(String codePath) {
        List<String> command = new ArrayList<>();
        command.add(getJavaExecutable());
        command.add(codePath);
        return command;
    }
}
