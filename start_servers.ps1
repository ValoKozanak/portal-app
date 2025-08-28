Write-Host "========================================" -ForegroundColor Green
Write-Host "    SPUSTENIE PORTAL APLIKACIE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "1. Zastavujem existujuce procesy..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "2. Spustam backend server..." -ForegroundColor Yellow
Set-Location "backend"
Start-Process -FilePath "cmd" -ArgumentList "/k", "node server.js" -WindowStyle Normal
Start-Sleep -Seconds 5

Write-Host "3. Spustam frontend server..." -ForegroundColor Yellow
Set-Location ".."
Start-Process -FilePath "cmd" -ArgumentList "/k", "npm start" -WindowStyle Normal
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    SERVERY SPUSTENE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: tro kvôli tomu?http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pre zastavenie zatvorte okna alebo stlacte Ctrl+C" -ForegroundColor Yellow
Write-Host ""
Read-Host "Stlacte Enter pre ukoncenie"
