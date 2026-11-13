@echo off
echo ============================================================
echo   STARTING YUKTIK 2026 EMERGENCY PLATFORM
echo ============================================================

echo [1/3] Starting Backend Server (Port 8000)...
start "YUKTIK Backend [8000]" cmd /k "cd /d D:\YUTIK\backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Starting ADMIN Frontend (Port 5173)...
start "YUKTIK Admin [5173]" cmd /k "cd /d D:\YUTIK\frontend && npm run dev"

echo [3/3] Starting USER Portal (Port 5174)...
start "YUKTIK User [5174]" cmd /k "cd /d D:\YUKTIK-USER && npm run dev"

echo.
echo All services launched!
echo Backend API & Docs: http://localhost:8000/docs
echo Admin Portal:       http://localhost:5173
echo User Portal:        http://localhost:5174
echo ============================================================
pause

