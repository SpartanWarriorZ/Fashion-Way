# Directus Setup für Fashion-Way

## 🚀 Quick Start

### 1. Directus starten
```bash
docker-compose up -d
```

### 2. Admin-Interface öffnen
- Gehe zu: http://localhost:8055
- Login: admin@fashion-way.de
- Passwort: admin123

### 3. Produkt-Schema erstellen

#### Schritt 1: Collection "products" erstellen
1. Gehe zu "Settings" → "Data Model"
2. Klicke "Create Collection"
3. Name: `products`
4. Icon: 🛍️
5. Klicke "Create"

#### Schritt 2: Felder hinzufügen
Füge diese Felder zur "products" Collection hinzu:

| Feldname | Typ | Einstellungen |
|----------|-----|---------------|
| `name` | String | Required, Primary Key |
| `price` | Decimal | Required, Precision: 10, Scale: 2 |
| `category` | String | Required, Choices: herren, damen, kinder |
| `subcategory` | String | Required, Choices: oberteile, hosen, schuhe, accessoires |
| `image` | File | Required, Interface: File |
| `description` | Text | Optional |
| `stock` | Integer | Required, Default: 0 |
| `active` | Boolean | Required, Default: true |

#### Schritt 3: Berechtigungen setzen
1. Gehe zu "Settings" → "Roles & Permissions"
2. Wähle "Public" Role
3. Aktiviere für "products":
   - Read: ✓
   - Create: ✗
   - Update: ✗
   - Delete: ✗

### 4. Produkte hinzufügen
1. Gehe zu "Content" → "products"
2. Klicke "Create Item"
3. Fülle die Felder aus
4. Speichere

## 🔧 API Integration

Die Website lädt jetzt automatisch Produkte von Directus über die API.

### API Endpoints:
- Alle Produkte: `http://localhost:8055/items/products`
- Nach Kategorie: `http://localhost:8055/items/products?filter[category][_eq]=herren`

## 📱 Benutzerfreundliche Features

### Drag & Drop Bild-Upload
- Einfach Bilder per Drag & Drop hochladen
- Automatische Bildoptimierung
- Verschiedene Größen verfügbar

### Einfache Produktverwaltung
- Übersichtliche Tabelle
- Schnellfilter nach Kategorien
- Bulk-Edit Funktionen
- Suchfunktion

### Live Preview
- Änderungen sofort sichtbar
- Keine technischen Kenntnisse nötig
- Intuitive Benutzeroberfläche

## 🛠️ Troubleshooting

### Directus startet nicht
```bash
# Container stoppen und neu starten
docker-compose down
docker-compose up -d

# Logs anzeigen
docker-compose logs directus
```

### Datenbank zurücksetzen
```bash
# Container und Daten löschen
docker-compose down -v
docker-compose up -d
```

### Port bereits belegt
Ändere in `docker-compose.yml`:
```yaml
ports:
  - "8056:8055"  # Anderer Port
```

## 🔒 Sicherheit

### Produktions-Setup
Für die Produktion:
1. Starke Passwörter verwenden
2. HTTPS aktivieren
3. Firewall konfigurieren
4. Regelmäßige Backups

### Backup
```bash
# Datenbank sichern
docker exec fashion-way-directus sqlite3 /directus/database/data.db ".backup /directus/database/backup.db"
``` 