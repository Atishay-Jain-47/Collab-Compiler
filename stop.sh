#!/usr/bin/env bash

# ==============================================================================
# Online Collaborative Compiler - Service Shutdown Script
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================="
echo " Stopping Online Collaborative Compiler Services"
echo "=================================================="

# 1. Stop Backend PID if saved
if [ -f "$SCRIPT_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/.backend.pid")
    echo "Stopping Backend PID: $BACKEND_PID..."
    kill -9 "$BACKEND_PID" 2>/dev/null || taskkill //F //PID "$BACKEND_PID" 2>/dev/null
    rm -f "$SCRIPT_DIR/.backend.pid"
fi

# 2. Stop Frontend PID if saved
if [ -f "$SCRIPT_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/.frontend.pid")
    echo "Stopping Frontend PID: $FRONTEND_PID..."
    kill -9 "$FRONTEND_PID" 2>/dev/null || taskkill //F //PID "$FRONTEND_PID" 2>/dev/null
    rm -f "$SCRIPT_DIR/.frontend.pid"
fi

# 3. Clean up by checking active port listeners (8082 and 5173)
if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "
        \$ports = @(8082, 5173)
        foreach (\$p in \$ports) {
            \$conn = Get-NetTCPConnection -LocalPort \$p -ErrorAction SilentlyContinue
            if (\$conn) {
                Write-Host \"Cleaning up remaining process on port \$p (PID: \$(\$conn.OwningProcess))...\"
                Stop-Process -Id \$conn.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    "
else
    # Linux / macOS lsof/fuser
    fuser -k 8082/tcp 2>/dev/null
    fuser -k 5173/tcp 2>/dev/null
fi

echo "=================================================="
echo " All services have been stopped."
echo "=================================================="
