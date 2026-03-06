@echo off
title Vault lite
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed or not in PATH.
  echo Install from https://nodejs.org and try again.
  pause
  exit /b 1
)

start "Vault lite server" /min node server.js
timeout /t 2 /nobreak >nul
start "" "http://localhost:3080"
echo Browser opened. Server is running in the background.
echo Close the "Vault lite server" window to stop the app.
timeout /t 2 /nobreak >nul
