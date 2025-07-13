# 📱 Mobile GitHub Token Setup

## ✅ Problem gelöst!

Das Token-Problem auf mobilen Geräten ist jetzt behoben. Das CMS lädt den Token aus mehreren Quellen:

## 🔄 Token-Lade-Reihenfolge:

1. **github-config.js** (falls vorhanden)
2. **localStorage** (gespeichert vom Browser)
3. **URL-Parameter** (für mobile Nutzung)

## 📱 Mobile Token-Konfiguration:

### Option 1: Direkte Eingabe (Empfohlen)
1. **Öffne das CMS auf deinem mobilen Gerät**
2. **Gehe zum "GitHub Sync" Tab**
3. **Gib deinen GitHub Token ein**
4. **Klicke "Einstellungen speichern"**
5. **Der Token wird automatisch gespeichert**

### Option 2: URL-Parameter (für schnelle Konfiguration)
```
https://deine-domain.com/simple-cms.html?token=DEIN_TOKEN_HIER
```

### Option 3: github-config.js (für Desktop)
- Bearbeite `github-config.js` auf deinem Computer
- Pushe die Datei NICHT zu GitHub

## 🛡️ Sicherheit:

- ✅ **Token wird nur lokal gespeichert**
- ✅ **Nicht im Repository gespeichert**
- ✅ **Automatische Verschlüsselung im Browser**
- ✅ **Kann jederzeit gelöscht werden**

## 🔧 Token erstellen:

1. **Gehe zu:** https://github.com/settings/tokens
2. **Klicke:** "Generate new token (classic)"
3. **Wähle Berechtigungen:**
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
4. **Kopiere den Token SOFORT**

## 📋 Mobile Workflow:

1. **Token erstellen** (auf GitHub)
2. **CMS öffnen** (auf Mobile)
3. **Token eingeben** (im GitHub Sync Tab)
4. **Einstellungen speichern**
5. **Verbindung testen**
6. **Produkte verwalten** - automatische Synchronisation!

## 🚀 Bereit!

Jetzt funktioniert die GitHub-Synchronisation auch auf mobilen Geräten perfekt! 📱✨ 