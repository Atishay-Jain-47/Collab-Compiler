package com.example.demo.modules.runner.strategy;

import com.example.demo.entity.types.Language;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Concrete execution strategy for running PHP scripts via php CLI.
 */
@Component
public class PhpExecutionStrategy implements ExecutionStrategy {

    @Override
    public Language getLanguage() {
        return Language.PHP;
    }

    @Override
    public List<String> buildCommand(String codePath) {
        List<String> command = new ArrayList<>();
        command.add("php");
        command.add(codePath);
        return command;
    }
}
