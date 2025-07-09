@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo    FASHION-WAY DIRECTUS (NODE.JS)
echo ========================================
echo.

echo [INFO] Pruefe Node.js Installation...
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Node.js ist nicht installiert!
    echo [INFO] Bitte lade Node.js von https://nodejs.org herunter
    echo [INFO] Installiere Node.js und starte dieses Skript erneut
    pause
    exit /b 1
)

echo [SUCCESS] Node.js gefunden!

echo.
echo [INFO] Installiere Directus Abhaengigkeiten...
if not exist "node_modules" (
    npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Installation fehlgeschlagen!
        pause
        exit /b 1
    )
)

echo.
echo [INFO] Erstelle Datenbank-Ordner...
if not exist "database" mkdir database

echo.
echo [INFO] Initialisiere Directus...
if not exist "database/data.db" (
    npx directus init --force
    if !errorlevel! neq 0 (
        echo [ERROR] Initialisierung fehlgeschlagen!
        pause
        exit /b 1
    )
)

echo.
echo [INFO] Starte Directus...
echo [INFO] Admin-Panel wird unter http://localhost:8055 verfuegbar sein
echo [INFO] Email: admin@fashion-way.de
echo [INFO] Passwort: admin123
echo.
echo [INFO] Druecke STRG+C um Directus zu stoppen
echo.

npx directus start 