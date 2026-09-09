@echo off
echo ==========================================
echo  Agentflow_AI: Installing Dependencies
echo ==========================================
echo.
echo [1/2] Installing Backend Server dependencies...
cd /d "%~dp0server"
call npm.cmd install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Server dependency installation failed.
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Installing Frontend Client dependencies...
cd /d "%~dp0client"
call npm.cmd install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Client dependency installation failed.
    exit /b %ERRORLEVEL%
)

cd /d "%~dp0"
echo.
echo ==========================================
echo  All dependencies installed successfully!
echo ==========================================
