#!/usr/bin/env bash

# ==============================================================================
# Online Collaborative Compiler - Service Startup Script
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$SCRIPT_DIR/logs"

echo "=================================================="
echo " Starting Online Collaborative Compiler Services"
echo "=================================================="

# Set JDK and Node paths if available on Windows/WSL
if [ -z "$JAVA_HOME" ] && [ -d "C:/Users/atish/.jdks/corretto-21.0.11" ]; then
    export JAVA_HOME="C:/Users/atish/.jdks/corretto-21.0.11"
    export PATH="$JAVA_HOME/bin:$PATH"
elif [ -z "$JAVA_HOME" ] && [ -d "/c/Users/atish/.jdks/corretto-21.0.11" ]; then
    export JAVA_HOME="/c/Users/atish/.jdks/corretto-21.0.11"
    export PATH="$JAVA_HOME/bin:$PATH"
fi

if [ -d "C:/Program Files/nodejs" ]; then
    export PATH="C:/Program Files/nodejs:$PATH"
elif [ -d "/c/Program Files/nodejs" ]; then
    export PATH="/c/Program Files/nodejs:$PATH"
fi

# 1. Start Spring Boot Backend on Port 8082
echo "[1/2] Starting Spring Boot Backend on port 8082..."
cd "$SCRIPT_DIR/Compiler" || exit 1

if command -v cmd.exe >/dev/null 2>&1 && [ -f "run-backend.bat" ]; then
    nohup cmd.exe /c "run-backend.bat" > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
elif [ -f "./mvnw" ]; then
    nohup ./mvnw spring-boot:run > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
else
    nohup mvn spring-boot:run > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
fi
BACKEND_PID=$!
echo $BACKEND_PID > "$SCRIPT_DIR/.backend.pid"
echo "      Backend started with PID: $BACKEND_PID"

# 2. Start Vite Frontend on Port 5173
echo "[2/2] Starting Vite Frontend on port 5173..."
cd "$SCRIPT_DIR/Compiler-frontend" || exit 1

if command -v npm.cmd >/dev/null 2>&1; then
    nohup npm.cmd run dev > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
else
    nohup npm run dev > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
fi
FRONTEND_PID=$!
echo $FRONTEND_PID > "$SCRIPT_DIR/.frontend.pid"
echo "      Frontend started with PID: $FRONTEND_PID"

echo "=================================================="
echo " Services launched successfully!"
echo " - Frontend: http://localhost:5173"
echo " - Backend:  http://localhost:8082"
echo " - Logs:     logs/backend.log, logs/frontend.log"
echo " To stop services, run: ./stop.sh (or stop.bat)"
echo "=================================================="
