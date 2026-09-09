@echo off
echo ==========================================
echo  Agentflow_AI: Starting Dev Services
echo ==========================================
echo Starting Backend Server on http://localhost:5000...
start "Agentflow_AI Backend" cmd /k "cd /d %~dp0server && npm.cmd run dev"

echo Starting Frontend Client on http://localhost:3000...
start "Agentflow_AI Frontend" cmd /k "cd /d %~dp0client && npm.cmd run dev"

echo.
echo Both services started in separate terminal windows!
echo - Backend:  http://localhost:5000
echo - Frontend: http://localhost:3000
