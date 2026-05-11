@echo off
echo Installing Customer Management Application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found. Installing dependencies...
echo.

REM Install npm dependencies
npm install

if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Installation completed successfully!
echo.
echo To run the application:
echo   - Development mode: npm run dev
echo   - Production mode: npm start
echo   - Build for distribution: npm run build
echo.
pause
