@echo off
echo ========================================
echo    SPUSTENIE PORTAL APLIKACIE
echo ========================================
echo.

echo 1. Zastavujem existujuce procesy...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

echo 2. Spustam backend server...
cd backend
start "Backend Server" cmd /k "node server.js"
timeout /t 5 >nul

echo 3. Spustam frontend server...
cd ..
start "Frontend Server" cmd /k "npm start"
timeout /t 10 >nul

echo.
echo ========================================
echo    SERVERY SPUSTENE!
echo ========================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Pre zastavenie stlacte Ctrl+C v kazdom okne
echo alebo zatvorte okna
echo.
pause
