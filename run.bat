@echo off
echo Starting Customer Management Application...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Dependencies not found. Installing...
    call install.bat
    if %errorlevel% neq 0 exit /b 1
)

REM Start the application
npm start
