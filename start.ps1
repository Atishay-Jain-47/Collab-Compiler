# ==============================================================================
# Online Collaborative Compiler - PowerShell Startup Script
# ==============================================================================

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path "$Root\logs")) { New-Item -ItemType Directory -Path "$Root\logs" | Out-Null }

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Starting Online Collaborative Compiler Services" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Start Backend on Port 8082
Write-Host "[1/2] Starting Spring Boot Backend on port 8082..." -ForegroundColor Yellow
$backendProc = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c `"$Root\Compiler\run-backend.bat`"" `
    -WorkingDirectory "$Root\Compiler" `
    -RedirectStandardOutput "$Root\logs\backend.log" `
    -RedirectStandardError "$Root\logs\backend.err" `
    -PassThru

$backendProc.Id | Out-File -FilePath "$Root\.backend.pid" -Encoding ascii
Write-Host "      Backend started with PID: $($backendProc.Id)" -ForegroundColor Green

# 2. Start Frontend on Port 5173
Write-Host "[2/2] Starting Vite Frontend on port 5173..." -ForegroundColor Yellow
$frontendProc = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c `"$Root\Compiler-frontend\run-frontend.bat`"" `
    -WorkingDirectory "$Root\Compiler-frontend" `
    -RedirectStandardOutput "$Root\logs\frontend.log" `
    -RedirectStandardError "$Root\logs\frontend.err" `
    -PassThru

$frontendProc.Id | Out-File -FilePath "$Root\.frontend.pid" -Encoding ascii
Write-Host "      Frontend started with PID: $($frontendProc.Id)" -ForegroundColor Green

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Services launched successfully!" -ForegroundColor Green
Write-Host " - Frontend: http://localhost:5173"
Write-Host " - Backend:  http://localhost:8082"
Write-Host " - Logs:     logs/backend.log, logs/frontend.log"
Write-Host " To stop services, run: .\stop.bat (or .\stop.ps1)"
Write-Host "==================================================" -ForegroundColor Cyan
