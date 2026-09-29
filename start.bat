@echo off
set "SCRIPT_DIR=%~dp0"

echo ==================================================
echo  Starting Online Collaborative Compiler Services
echo ==================================================

echo [1/2] Starting Spring Boot Backend on port 8082...
start "Compiler-Backend-8082" /MIN cmd /c ""%SCRIPT_DIR%Compiler\run-backend.bat""

echo [2/2] Starting Vite Frontend on port 5173...
start "Compiler-Frontend-5173" /MIN cmd /c ""%SCRIPT_DIR%Compiler-frontend\run-frontend.bat""

echo ==================================================
echo  Services started!
echo  - Frontend: http://localhost:5173
echo  - Backend:  http://localhost:8082
echo  To stop services, run: stop.bat (or stop.sh)
echo ==================================================
