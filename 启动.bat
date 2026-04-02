@echo off
cd /d "%~dp0"

title Cyber-Edict IDE - Desktop

echo.
echo ========================================
echo   Cyber-Edict IDE - Desktop (Electron)
echo ========================================
echo.

if not exist "node_modules\" (
  echo [1/2] Running npm install...
  call npm install
  if errorlevel 1 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
  )
  echo.
)

if not exist "dist\index.html" (
  echo dist\index.html not found. Running npm run build...
  call npm run build
  if errorlevel 1 (
    echo ERROR: build failed. Fix TypeScript errors and retry.
    pause
    exit /b 1
  )
  echo.
)

echo Starting Electron. Close this CMD window to quit the app.
echo GPU: HW acceleration off by default. Set CYBER_EDICT_USE_GPU=1 to try GPU on.
echo If NO window and instant exit: kill stray "Electron" in Task Manager, then retry.
echo Or debug multi-instance: set CYBER_EDICT_ALLOW_MULTI=1 before this script.
echo.
echo dist check: "%CD%\dist\index.html"
echo.

call npx electron .
set "ELECTRON_EXIT=%ERRORLEVEL%"

echo.
echo Electron exited.
exit /b %ELECTRON_EXIT%
