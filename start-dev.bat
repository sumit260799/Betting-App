@echo off
title APL 2026 - Full Stack Launcher
echo ========================================================
echo   APL 2026 Betting App - Full Stack Development Server
echo ========================================================

echo [1/3] Starting PostgreSQL on port 5433...
start "PostgreSQL-APL" /B "C:\Program Files\PostgreSQL\19\bin\postgres.exe" -D "..\BettingApp-server\pgdata" -p 5433
timeout /t 2 /nobreak >nul

echo [2/3] Starting Express Backend (http://localhost:5000)...
start "APL-Backend" cmd /k "cd /d ..\BettingApp-server && npm start"

timeout /t 2 /nobreak >nul
echo [3/3] Starting Vite Frontend (http://localhost:5173)...
start "APL-Frontend" cmd /k "npm run dev"

echo.
echo All services launched!
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:5173
