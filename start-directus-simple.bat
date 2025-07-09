@echo off
echo.
echo ========================================
echo    FASHION-WAY DIRECTUS STARTEN
echo ========================================
echo.

echo [INFO] Starte Directus...
docker-compose up -d

echo.
echo [INFO] Warte auf Directus...
timeout /t 10 /nobreak >nul

echo.
echo [SUCCESS] Directus ist bereit!
echo.
echo [INFO] Admin-Panel: http://localhost:8055
echo [INFO] Email: admin@fashion-way.de
echo [INFO] Passwort: admin123
echo.
echo [INFO] Website: http://localhost:5500 (oder dein Live Server)
echo.

REM Versuche verschiedene Methoden um die URL zu oeffnen
echo [INFO] Oeffne Admin-Panel...
start "" "http://localhost:8055" 2>nul
if errorlevel 1 (
    echo [WARNING] Konnte Browser nicht automatisch oeffnen
    echo [INFO] Bitte oeffne manuell: http://localhost:8055
)

echo.
echo [SUCCESS] Viel Spass mit deinem neuen CMS!
echo.
echo [INFO] Druecke eine Taste um zu beenden...
pause >nul 