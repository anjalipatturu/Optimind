@echo off
echo ========================================================
echo   Starting Optimind - Self-Evolving Prompt Optimizer
echo ========================================================
echo.

:: Start Backend in a new window
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "Optimind Backend" cmd /k "cd /d %~dp0 && set PYTHONPATH=backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

:: Wait 2 seconds
timeout /t 2 /nobreak >nul

:: Start Frontend in a new window
echo [2/2] Starting Vite Frontend on http://localhost:5173 ...
start "Optimind Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo   Optimind is launching!
echo   Frontend: http://localhost:5173
echo   Backend Docs: http://localhost:8000/api/v1/docs
echo   Demo Login: demo@optimind.ai / password123
echo ========================================================
pause

