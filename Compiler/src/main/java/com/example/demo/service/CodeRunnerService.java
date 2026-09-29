package com.example.demo.service;

import com.example.demo.entity.types.Session;
import com.example.demo.modules.runner.sandbox.SandboxExecutor;
import com.example.demo.modules.runner.strategy.ExecutionStrategy;
import com.example.demo.modules.runner.strategy.ExecutionStrategyFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class CodeRunnerService {

    private static final long DEFAULT_TIMEOUT_SECONDS = 15;

    private final ExecutionStrategyFactory strategyFactory;
    private final SandboxExecutor sandboxExecutor;

    public void execute(Session session) {
        String codePath = session.getCodePath();
        String inputPath = session.getInputPath();

        ExecutionStrategy strategy = strategyFactory.getStrategy(session.getLanguage());
        List<String> command = strategy.buildCommand(codePath);

        File codeFile = new File(codePath);
        File workingDir = codeFile.getParentFile();
        File inputFile = (inputPath != null && !inputPath.trim().isEmpty()) ? new File(inputPath) : null;

        log.info("CodeRunnerService executing [{}] with strategy: {}", session.getLanguage(), strategy.getClass().getSimpleName());

        SandboxExecutor.Result result = sandboxExecutor.execute(
                command,
                workingDir,
                inputFile,
                DEFAULT_TIMEOUT_SECONDS,
                session.getLanguage()
        );

        session.setOutput(result.getOutput());
        session.setError(result.getError());
        session.setTimeTaken(result.getExecutionTimeSeconds());
    }
}
