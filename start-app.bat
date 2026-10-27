@echo off
title AV-Overseas Starter
echo ========================================================
echo        Starting AV-Overseas Full-Stack Platform
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
set "MAVEN_BIN=%ROOT_DIR%maven\apache-maven-3.9.6\bin"
set "PATH=%MAVEN_BIN%;%PATH%"

echo [1/3] Launching Spring Boot Backend on http://localhost:8080...
start "AV-Overseas Backend (Port 8080)" cmd /k "cd /d "%ROOT_DIR%av-overseas-backend" && mvn spring-boot:run"

echo [2/3] Launching React + Vite Frontend on http://localhost:5173...
start "AV-Overseas Frontend (Port 5173)" cmd /k "cd /d "%ROOT_DIR%av-overseas-frontend" && npm run dev"

echo.
echo [3/3] Waiting 6 seconds for services to initialize...
timeout /t 6 /nobreak >nul

echo Opening browser at http://localhost:5173...
start http://localhost:5173

echo.
echo ========================================================
echo Services started!
echo Frontend UI : http://localhost:5173
echo Backend API : http://localhost:8080
echo ========================================================
echo Keep the backend and frontend terminal windows open.
echo.
pause
