# 🔑 GitHub Token Setup für automatische CMS-Speicherung

## Ziel: CMS-Änderungen automatisch in GitHub speichern

Du möchtest, dass alle Änderungen im CMS automatisch in dein GitHub Repository gespeichert werden, sodass sie dauerhaft für alle Besucher verfügbar sind.

## Schritt 1: GitHub Personal Access Token erstellen

### 1. Gehe zu GitHub Settings
- Öffne [GitHub.com](https://github.com)
- Klicke auf dein Profilbild (oben rechts)
- Wähle "Settings"

### 2. Developer Settings öffnen
- Scrolle nach unten zu "Developer settings" (ganz unten links)
- Klicke darauf

### 3. Personal Access Tokens erstellen
- Klicke auf "Personal access tokens"
- Wähle "Tokens (classic)"
- Klicke "Generate new token (classic)"

### 4. Token konfigurieren
- **Note**: `Fashion-Way CMS Auto-Save`
- **Expiration**: Wähle "No expiration" oder "90 days"
- **Scopes**: Aktiviere nur diese:
  - ✅ `repo` (Full control of private repositories)
  - ✅ `workflow` (Update GitHub Action workflows)

### 5. Token generieren
- Klicke "Generate token"
- **WICHTIG**: Kopiere das Token sofort! Du siehst es nur einmal.

## Schritt 2: CMS konfigurieren

### 1. CMS öffnen
- Gehe zu: `https://spartanwarriorz.github.io/Fashion-Way/simple-cms.html`

### 2. GitHub Integration aktivieren
- Klicke auf den Button "🚀 GitHub Auto-Save aktivieren"
- Gib deine Repository URL ein: `https://github.com/spartanwarriorz/Fashion-Way`
- Gib dein GitHub Token ein (das du gerade erstellt hast)
- Klicke "Verbindung testen"
- Klicke "Auto-Save aktivieren"

## Schritt 3: Testen

### 1. Produkt hinzufügen
- Gehe zum Tab "➕ Produkt hinzufügen"
- Fülle alle Felder aus
- Klicke "Produkt hinzufügen"

### 2. Automatische Speicherung
- Das CMS zeigt: "Speichere Änderungen auf GitHub..."
- Nach erfolgreicher Speicherung: "✅ Änderungen erfolgreich auf GitHub gespeichert!"

### 3. Überprüfung
- Gehe zu deinem Repository: `https://github.com/spartanwarriorz/Fashion-Way`
- Klicke auf `products-data.json`
- Du siehst dein neues Produkt in der Datei!

## Schritt 4: Website überprüfen

### 1. Website öffnen
- Gehe zu: `https://spartanwarriorz.github.io/Fashion-Way/`
- Dein neues Produkt sollte sichtbar sein!

### 2. Cache leeren (falls nötig)
- Drücke `Ctrl+F5` (Windows) oder `Cmd+Shift+R` (Mac)
- Oder öffne die Website in einem Inkognito-Fenster

## ✅ Ergebnis

Jetzt funktioniert dein CMS so:

1. **Du fügst ein Produkt hinzu** im CMS
2. **Automatisch wird es in GitHub gespeichert**
3. **Alle Besucher sehen es sofort** auf der Website
4. **Änderungen sind dauerhaft** - gehen nie verloren

## 🔧 Troubleshooting

### Problem: "Fehler beim Speichern auf GitHub"
**Lösung:**
- Überprüfe dein GitHub Token
- Stelle sicher, dass das Token die richtigen Berechtigungen hat
- Überprüfe die Repository URL

### Problem: Produkte werden nicht angezeigt
**Lösung:**
- Warte 1-2 Minuten (GitHub Pages braucht Zeit zum Aktualisieren)
- Leere den Browser-Cache
- Überprüfe die `products-data.json` Datei in deinem Repository

### Problem: Token funktioniert nicht
**Lösung:**
- Erstelle ein neues Token
- Stelle sicher, dass `repo` Scope aktiviert ist
- Überprüfe, ob das Token nicht abgelaufen ist

## 🎯 Sicherheit

### Token schützen:
- Teile dein Token niemals mit anderen
- Verwende es nur für dein Fashion-Way Projekt
- Du kannst das Token jederzeit widerrufen

### Repository schützen:
- Das Token hat nur Zugriff auf dein Fashion-Way Repository
- Es kann keine anderen Repositories ändern

## 🚀 Fertig!

Dein CMS ist jetzt vollständig automatisiert:
- ✅ Änderungen werden automatisch in GitHub gespeichert
- ✅ Alle Besucher sehen sofort die Änderungen
- ✅ Produkte sind dauerhaft verfügbar
- ✅ Keine manuellen Uploads mehr nötig

**Genieße dein automatisiertes CMS! 🛍️✨** 