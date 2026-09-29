# ==============================================================================
# Online Collaborative Compiler - PowerShell Shutdown Script
# ==============================================================================

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Stopping Online Collaborative Compiler Services" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Terminate using saved PIDs
$pidFiles = @("$Root\.backend.pid", "$Root\.frontend.pid")
foreach ($f in $pidFiles) {
    if (Test-Path $f) {
        $id = Get-Content $f -ErrorAction SilentlyContinue
        if ($id) {
            Write-Host "Terminating saved PID $id..." -ForegroundColor Yellow
            Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
        }
        Remove-Item $f -Force -ErrorAction SilentlyContinue
    }
}

# Ensure ports 8082 and 5173 are freed
$ports = @(8082, 5173)
foreach ($p in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "Stopping active process on port $p (PID: $($conn.OwningProcess))..." -ForegroundColor Yellow
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " All services have been stopped." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
