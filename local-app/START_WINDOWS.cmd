@echo off
setlocal
cd /d "%~dp0"
set NODE_ENV=production

if not exist ".env" (
  echo ERROR: .env was not found.
  echo Run INSTALL_WINDOWS.ps1 first.
  pause
  exit /b 1
)

if not exist "dist\index.html" (
  echo ERROR: The application has not been built.
  echo Run INSTALL_WINDOWS.ps1 first.
  pause
  exit /b 1
)

start "" /b cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:3001"
echo Starting Operations Report at http://127.0.0.1:3001
echo Keep this window open while using the application.
echo Press Ctrl+C to stop it.
echo.
call npm start
pause
