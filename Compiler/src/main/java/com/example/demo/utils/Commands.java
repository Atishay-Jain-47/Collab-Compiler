package com.example.demo.utils;

import com.example.demo.entity.types.Language;

import java.io.File;
import java.nio.file.Paths;
import java.util.ArrayList;

/**
 * Legacy command builder utility class.
 * <p>
 * Provides fallback CLI generation for supported languages. Note that runtime execution
 * has been refactored to use the Strategy Pattern via {@link com.example.demo.modules.runner.strategy.ExecutionStrategy}
 * and {@link com.example.demo.modules.runner.strategy.ExecutionStrategyFactory}.
 * This class is maintained for backwards compatibility and static invocation needs.
 */
public class Commands {
    private static final boolean IS_WINDOWS = System.getProperty("os.name").toLowerCase().contains("win");

    /**
     * Resolves the java binary location, checking JAVA_HOME and known IDE paths.
     */
    private static String getJavaExecutable() {
        String javaHome = System.getenv("JAVA_HOME");
        if (javaHome != null && !javaHome.trim().isEmpty()) {
            File javaBin = Paths.get(javaHome, "bin", IS_WINDOWS ? "java.exe" : "java").toFile();
            if (javaBin.exists()) {
                return javaBin.getAbsolutePath();
            }
        }
        // Fallback to common IntelliJ JBR path on Windows if java is not in PATH
        if (IS_WINDOWS) {
            File jbrJava = new File("C:\\Program Files\\JetBrains\\IntelliJ IDEA 2026.1.1\\jbr\\bin\\java.exe");
            if (jbrJava.exists()) {
                return jbrJava.getAbsolutePath();
            }
        }
        return "java";
    }

    public static ArrayList<String> getCommand(Language language, String codePath) {
        String executablePath = codePath + (IS_WINDOWS ? ".exe" : "Executable");
        ArrayList<String> command = new ArrayList<>();

        switch (language) {
            case PYTHON:
                if (IS_WINDOWS) {
                    command.add("python");
                } else {
                    command.add(new File("/usr/bin/python3").exists() ? "/usr/bin/python3" : "python3");
                }
                command.add(codePath);
                break;

            case CPP:
                if (IS_WINDOWS) {
                    command.add("cmd.exe");
                    command.add("/c");
                    command.add("g++ \"" + codePath + "\" -o \"" + executablePath + "\" && \"" + executablePath + "\"");
                } else {
                    command.add("/bin/sh");
                    command.add("-c");
                    command.add("g++ \"" + codePath + "\" -o \"" + executablePath + "\" && \"" + executablePath + "\"");
                }
                break;

            case C:
                if (IS_WINDOWS) {
                    command.add("cmd.exe");
                    command.add("/c");
                    command.add("gcc \"" + codePath + "\" -o \"" + executablePath + "\" && \"" + executablePath + "\"");
                } else {
                    command.add("/bin/sh");
                    command.add("-c");
                    command.add("gcc \"" + codePath + "\" -o \"" + executablePath + "\" && \"" + executablePath + "\"");
                }
                break;

            case JAVA:
                command.add(getJavaExecutable());
                command.add(codePath);
                break;

            case GO:
                command.add("go");
                command.add("run");
                command.add(codePath);
                break;

            case JS:
                command.add("node");
                command.add(codePath);
                break;

            default:
                throw new IllegalArgumentException("Unsupported language: " + language);
        }

        return command;
    }
}
