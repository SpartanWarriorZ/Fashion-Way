@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo    FASHION-WAY DIRECTUS STARTEN
echo ========================================
echo.

echo [INFO] Starte Directus...
docker-compose up -d

echo.
echo [INFO] Warte auf Directus...
timeout /t 15 /nobreak >nul

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

REM Versuche verschiedene Browser-Methoden
set "url=http://localhost:8055"

REM Methode 1: Standard start Befehl
start "" "%url%" 2>nul
if !errorlevel! equ 0 (
    echo [SUCCESS] Admin-Panel geoeffnet!
    goto :end
)

REM Methode 2: Mit cmd /c
cmd /c start "" "%url%" 2>nul
if !errorlevel! equ 0 (
    echo [SUCCESS] Admin-Panel geoeffnet!
    goto :end
)

REM Methode 3: Mit rundll32
rundll32 url.dll,FileProtocolHandler "%url%" 2>nul
if !errorlevel! equ 0 (
    echo [SUCCESS] Admin-Panel geoeffnet!
    goto :end
)

REM Methode 4: Mit explorer
explorer "%url%" 2>nul
if !errorlevel! equ 0 (
    echo [SUCCESS] Admin-Panel geoeffnet!
    goto :end
)

echo [WARNING] Konnte Browser nicht automatisch oeffnen
echo [INFO] Bitte oeffne manuell: %url%
echo [INFO] Oder kopiere diese URL: %url%

:end
echo.
echo [SUCCESS] Viel Spass mit deinem neuen CMS!
echo.
echo [INFO] Druecke eine Taste um zu beenden...
pause >nul 