@echo off
chcp 65001 >nul
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
echo [INFO] Oeffne Admin-Panel...
start "" "http://localhost:8055"

echo.
echo [SUCCESS] Viel Spass mit deinem neuen CMS!
echo.
pause 