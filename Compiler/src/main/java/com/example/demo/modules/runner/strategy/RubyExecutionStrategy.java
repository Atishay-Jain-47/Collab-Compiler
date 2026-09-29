package com.example.demo.modules.runner.strategy;

import com.example.demo.entity.types.Language;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Concrete execution strategy for running Ruby scripts via ruby interpreter.
 */
@Component
public class RubyExecutionStrategy implements ExecutionStrategy {

    @Override
    public Language getLanguage() {
        return Language.RUBY;
    }

    @Override
    public List<String> buildCommand(String codePath) {
        List<String> command = new ArrayList<>();
        command.add("ruby");
        command.add(codePath);
        return command;
    }
}
