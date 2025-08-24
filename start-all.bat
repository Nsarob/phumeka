@echo off
echo Starting HumekaFL Services...
echo.

echo Starting Backend (Python Flask)...
start "Backend" cmd /k "cd humekaFLBackend && python app.py"

echo Waiting 20 seconds for backend to start...
timeout /t 20 /nobreak > nul

echo Starting Proxy Server...
start "Proxy Server" cmd /k "cd proxy-server && npm start"

echo Waiting 15 seconds for proxy to start...
timeout /t 15 /nobreak > nul

echo Starting Frontend (React Native Expo)...
start "Frontend" cmd /k "cd HumekaFL-Mobile && npx expo start"

echo.
echo All services are starting...
echo - Backend: http://localhost:5000
echo - Proxy: http://localhost:3001
echo - Frontend: Expo DevTools will open
echo.
echo Press any key to close this window...
pause > nul
