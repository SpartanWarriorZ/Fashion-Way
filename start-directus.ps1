# Fashion-Way Directus Starter (PowerShell)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    FASHION-WAY DIRECTUS STARTEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[INFO] Starte Directus..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "[INFO] Warte auf Directus..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "[SUCCESS] Directus ist bereit!" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] Admin-Panel: http://localhost:8055" -ForegroundColor White
Write-Host "[INFO] Email: admin@fashion-way.de" -ForegroundColor White
Write-Host "[INFO] Passwort: admin123" -ForegroundColor White
Write-Host ""
Write-Host "[INFO] Website: http://localhost:5500 (oder dein Live Server)" -ForegroundColor White
Write-Host ""

Write-Host "[INFO] Oeffne Admin-Panel..." -ForegroundColor Yellow
try {
    Start-Process "http://localhost:8055"
    Write-Host "[SUCCESS] Browser geoeffnet!" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Konnte Browser nicht automatisch oeffnen" -ForegroundColor Red
    Write-Host "[INFO] Bitte oeffne manuell: http://localhost:8055" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[SUCCESS] Viel Spass mit deinem neuen CMS!" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] Druecke eine Taste um zu beenden..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 