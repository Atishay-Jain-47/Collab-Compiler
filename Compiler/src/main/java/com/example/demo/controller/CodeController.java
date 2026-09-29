package com.example.demo.controller;

import com.example.demo.dto.RunRequestDto;
import com.example.demo.dto.ResponseDto;
import com.example.demo.entity.types.Session;
import com.example.demo.manager.SessionManager;
import com.example.demo.service.CodeRunnerService;
import com.example.demo.service.SaveFileService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller responsible for code execution and permission enforcement.
 * <p>
 * Validates user execution permissions within the room before orchestrating
 * source file persistence and sandboxed process execution.
 * </p>
 */
@Slf4j
@RestController
@CrossOrigin(
    origins = {
        "http://localhost:5173",
        "https://compiler-frontend-six.vercel.app",
        "https://compiler-frontend.satyamvatsal.ovh",
    }
)
public class CodeController {

    @Autowired
    private SaveFileService saveFileService;

    @Autowired
    private CodeRunnerService codeRunnerService;

    @Autowired
    private SessionManager sessionManager;

    /**
     * Executes user-submitted code in a sandboxed process environment.
     *
     * @param runRequestDto execution payload containing code, language, stdin input, and optional roomId
     * @return {@link ResponseEntity} containing {@link ResponseDto} with execution stdout, stderr, and elapsed time
     */
    @PostMapping("/run")
    public ResponseEntity<ResponseDto> runCode(
        @RequestBody RunRequestDto runRequestDto
    ) {
        log.info("Incoming execution request from user [{}] for language [{}] in room [{}]",
                runRequestDto.getUserName(), runRequestDto.getLanguage(), runRequestDto.getRoomId());

        // Enforce room-level execution permissions if within a collaborative room
        if (runRequestDto.getRoomId() != null && !runRequestDto.getRoomId().trim().isEmpty()) {
            boolean canExecute = sessionManager.canUserExecute(runRequestDto.getRoomId(), runRequestDto.getUserName());
            if (!canExecute) {
                log.warn("Blocked execution: user [{}] lacks EXECUTE permission in room [{}]",
                        runRequestDto.getUserName(), runRequestDto.getRoomId());
                ResponseDto denied = ResponseDto.builder()
                        .output("")
                        .error("Permission Denied: You have Read-Only or View-Only access in this room. Contact the room admin.")
                        .errorCode(403)
                        .timeTaken(0.0)
                        .build();
                return ResponseEntity.status(403).body(denied);
            }
        }

        // Orchestrate session creation, file storage, and execution
        Session session = sessionManager.createSession(runRequestDto);
        try {
            saveFileService.saveFile(session);
            codeRunnerService.execute(session);
            String output = session.getOutput();
            String error = session.getError();

            int errorCode = (error != null && !error.trim().isEmpty() && (output == null || output.trim().isEmpty())) ? 1 : 0;

            ResponseDto responseDto = ResponseDto.builder()
                .output(output)
                .errorCode(errorCode)
                .error(error)
                .timeTaken(session.getTimeTaken())
                .build();
            return ResponseEntity.status(200).body(responseDto);
        } finally {
            // Clean up temporary files, inputs, and compiled binary artifacts
            saveFileService.cleanupSession(session);
        }
    }
}
