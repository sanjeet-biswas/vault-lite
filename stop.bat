@echo off
setlocal
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3080" ^| findstr "LISTENING"') do (
  taskkill /PID %%a /F >nul 2>&1
  echo Stopped process on port 3080 (PID %%a)
  exit /b 0
)
echo No process found listening on port 3080.
exit /b 0
