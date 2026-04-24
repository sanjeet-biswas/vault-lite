@echo off
title Vault lite
cd /d "%~dp0"
setlocal

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed or not in PATH.
  echo Install from https://nodejs.org and try again.
  pause
  exit /b 1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3080" ^| findstr "LISTENING"') do (
  echo Stopping existing process on port 3080 - PID %%a ...
  taskkill /PID %%a /F >nul 2>&1
)

start "Vault lite server" /min node server.js
ping -n 3 127.0.0.1 >nul

set "cachebust=%RANDOM%%RANDOM%"

REM ✅ Open as PWA instead of browser
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
--profile-directory=Default ^
--app-id=olmcehalmdglchkcmgpeoafhpmdkdfhl ^
"http://localhost:3080/?v=%cachebust%"

echo App opened as PWA. Server is running in background.
echo Close the "Vault lite server" window to stop the app.