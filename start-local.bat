@echo off
title Guided Annual Planner - Local Runner
echo ============================================================
echo   Guided Annual Planner - Starting Local Stack
echo ============================================================

REM Check if MongoDB binary exists in cache
set MONGO_BIN=%USERPROFILE%\.cache\mongodb-binaries\mongod-x64-win32-8.2.6.exe

if exist "%MONGO_BIN%" (
    echo [1/3] Starting Local MongoDB on port 27017...
    start "MongoDB" "%MONGO_BIN%" --dbpath ".data\db" --port 27017 --bind_ip 127.0.0.1
) else (
    echo [1/3] MongoDB binary not found in cache, using memory/external server.
)

echo [2/3] Starting Backend API (port 5000)...
start "Planner Server" cmd /k "npm run dev:server"

echo [3/3] Starting Frontend Vite App (port 5173)...
start "Planner Client" cmd /k "npm run dev:client"

echo ============================================================
echo   Planner is launching!
echo   Open in browser: http://localhost:5173
echo ============================================================
pause
