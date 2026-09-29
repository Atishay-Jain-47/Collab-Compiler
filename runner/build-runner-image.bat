@echo off
REM ==============================================================================
REM CollabIDE - Build Docker Runner Image (Windows)
REM ==============================================================================

setlocal
cd /d "%~dp0"

echo [CollabIDE] Building Docker runner image: collab-compiler-runner:latest...
docker build -t collab-compiler-runner:latest .

if %ERRORLEVEL% equ 0 (
    echo [CollabIDE] Successfully built collab-compiler-runner:latest!
) else (
    echo [CollabIDE] Failed to build Docker image. Please check if Docker Desktop is running.
)
endlocal
