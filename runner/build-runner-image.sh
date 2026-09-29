#!/usr/bin/env bash
# ==============================================================================
# CollabIDE - Build Docker Runner Image (POSIX / Linux / macOS)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}" || exit 1

echo "[CollabIDE] Building Docker runner image: collab-compiler-runner:latest..."

docker build -t collab-compiler-runner:latest .

if [ $? -eq 0 ]; then
    echo "[CollabIDE] Successfully built collab-compiler-runner:latest!"
else
    echo "[CollabIDE] Failed to build Docker image. Please check if Docker daemon is running."
    exit 1
fi
