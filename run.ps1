Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting Optimind - Self-Evolving Prompt Optimizer" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Start Backend in new process
Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONPATH='backend'; Set-Location '$PSScriptRoot'; .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

# 2. Start Frontend in new process
Write-Host "[2/2] Starting Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev"

Write-Host "`nOptimind launched successfully!" -ForegroundColor Yellow
Write-Host "-> Frontend URL:    http://localhost:5173" -ForegroundColor White
Write-Host "-> Backend Swagger: http://localhost:8000/api/v1/docs" -ForegroundColor White
Write-Host "-> Demo Account:    demo@optimind.ai / password123" -ForegroundColor White

