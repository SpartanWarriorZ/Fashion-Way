# 🛍️ Fashion-Way mit Directus CMS

## 🚀 Schnellstart (5 Minuten)

### 1. Directus starten
```bash
docker-compose up -d
```

### 2. Admin-Panel öffnen
- **URL:** http://localhost:8055
- **Email:** admin@fashion-way.de  
- **Passwort:** admin123

### 3. Produkt-Schema erstellen
1. Gehe zu **Settings** → **Data Model**
2. Klicke **Create Collection**
3. Name: `products`
4. Klicke **Create**

### 4. Felder hinzufügen
Füge diese Felder zur `products` Collection hinzu:

| Feld | Typ | Einstellungen |
|------|-----|---------------|
| `name` | String | Required ✓ |
| `price` | Decimal | Required ✓ |
| `category` | String | Required ✓, Choices: herren, damen, kinder |
| `subcategory` | String | Required ✓, Choices: oberteile, hosen, schuhe, accessoires |
| `image` | File | Required ✓ |
| `description` | Text | Optional |
| `stock` | Integer | Required ✓, Default: 0 |
| `active` | Boolean | Required ✓, Default: true |

### 5. Berechtigungen setzen
1. **Settings** → **Roles & Permissions**
2. Wähle **Public** Role
3. Aktiviere für `products`: **Read** ✓

### 6. Produkte hinzufügen
1. **Content** → **products**
2. **Create Item**
3. Fülle die Felder aus
4. **Save**

## 🎯 Was du jetzt kannst

### ✅ Einfache Produktverwaltung
- Produkte hinzufügen/bearbeiten/löschen
- Bilder per Drag & Drop hochladen
- Kategorien und Unterkategorien verwalten
- Lagerbestand verfolgen

### ✅ Benutzerfreundlich
- Keine technischen Kenntnisse nötig
- Übersichtliche Tabellen
- Schnellfilter und Suche
- Live-Vorschau

### ✅ Automatische Integration
- Website lädt Produkte automatisch
- Änderungen sofort sichtbar
- Keine manuellen Datei-Updates

## 🔧 Nützliche Features

### Bild-Upload
- **Drag & Drop** Bilder direkt in das Feld
- Automatische **Bildoptimierung**
- Verschiedene **Größen** verfügbar

### Kategorien
- **Hauptkategorien:** Herren, Damen, Kinder
- **Unterkategorien:** Oberteile, Hosen, Schuhe, Accessoires
- **Schnellfilter** in der Tabelle

### Produktdetails
- **Name** und **Beschreibung**
- **Preis** mit Dezimalstellen
- **Lagerbestand** verfolgen
- **Aktiv/Inaktiv** Status

## 🛠️ Troubleshooting

### Directus startet nicht
```bash
# Neustart
docker-compose down
docker-compose up -d

# Logs anzeigen
docker-compose logs directus
```

### Website zeigt keine Produkte
1. Prüfe ob Directus läuft: http://localhost:8055
2. Prüfe Browser-Konsole auf Fehler
3. Stelle sicher, dass Produkte `active: true` haben

### Port belegt
Ändere in `docker-compose.yml`:
```yaml
ports:
  - "8056:8055"  # Anderer Port
```

## 📱 Mobile Admin
- Directus funktioniert auch auf dem Handy
- Responsive Design
- Touch-optimiert

## 🔒 Sicherheit
- **Starke Passwörter** verwenden
- **HTTPS** für Produktion
- **Regelmäßige Backups**

---

**🎉 Fertig!** Du hast jetzt ein professionelles CMS für deine Fashion-Website! 