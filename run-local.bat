@echo off
title ReelVault - Smart Reels Library Loader
color 0B

echo ====================================================================
echo                REELVAULT - PORTABLE CONTROL CENTER
echo ====================================================================
echo.

:: Check for Node.js Installation
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js environment was not detected on this system!
    echo Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b
)

:: Verify dependencies
if not exist "node_modules\" (
    echo [STATUS] First time launch detected. Installing workspace packages...
    echo [STATUS] This may take up to a minute, please stand by...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Package installation failed! Check your connection parameters.
        echo.
        pause
        exit /b
    )
    echo.
    echo [SUCCESS] Core packages successfully installed!
    echo.
)

echo [STATUS] Workspace dependencies verified.
echo [STATUS] Compiling local modules and starting server...
echo [STATUS] Launching http://localhost:5173 in default browser...
echo.
echo ====================================================================
echo          Press Ctrl+C inside this window to terminate the server.
echo ====================================================================
echo.

:: Auto-launch standard Vite development port
start http://localhost:5173

:: Run Vite Dev Server
call npm run dev

pause
