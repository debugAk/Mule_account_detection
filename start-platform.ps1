Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting Mule Sentinel Platform (Backend + Frontend)    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Ensure port 8000 is free or notify
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "Port 8000 is already in use by process $($port8000.OwningProcess)." -ForegroundColor Yellow
} else {
    Write-Host "Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
    $backend = Start-Process python -ArgumentList "-m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload" -PassThru
}

Write-Host "`nOpening Web Workspace on http://127.0.0.1:5173..." -ForegroundColor Green
Write-Host "Press Ctrl+C to terminate both servers when finished.`n" -ForegroundColor Yellow

try {
    pnpm --filter web dev
} finally {
    if ($backend -and -not $backend.HasExited) {
        Stop-Process -Id $backend.Id -Force
    }
}
