# 🔧 Fehlerbehebung - Fashion-Way

## Problem: Produkte werden nicht geladen

### Schritt 1: Test-Datei verwenden
1. Öffne: `https://spartanwarriorz.github.io/Fashion-Way/test-products.html`
2. Diese Seite zeigt dir, ob die Produkte geladen werden können
3. Schau dir die Status-Meldung an

### Schritt 2: Browser-Konsole prüfen
1. Öffne die Hauptseite: `https://spartanwarriorz.github.io/Fashion-Way/`
2. Drücke `F12` (Entwicklertools öffnen)
3. Gehe zum "Console" Tab
4. Schaue nach Fehlermeldungen

### Schritt 3: Cache leeren
1. Drücke `Ctrl+F5` (Windows) oder `Cmd+Shift+R` (Mac)
2. Oder öffne die Seite in einem Inkognito-Fenster

### Schritt 4: localStorage prüfen
1. In der Konsole eingeben: `localStorage.getItem('fashionWayProducts')`
2. Sollte eine JSON-Zeichenkette zurückgeben
3. Falls `null`: Produkte werden nicht geladen

## Problem: Back-to-Top Button funktioniert nicht

### Schritt 1: Locomotive Scroll prüfen
1. In der Konsole eingeben: `typeof scroll`
2. Sollte `"object"` zurückgeben
3. Falls `"undefined"`: Locomotive Scroll ist nicht geladen

### Schritt 2: Button-Element prüfen
1. In der Konsole eingeben: `document.getElementById('backToTop')`
2. Sollte das Button-Element zurückgeben
3. Falls `null`: Button existiert nicht

### Schritt 3: Event-Listener prüfen
1. Klicke auf den Back-to-Top Button
2. Schaue in der Konsole nach Meldungen
3. Sollte "scrollToTop called" anzeigen

## Häufige Lösungen

### Lösung 1: Produkte manuell laden
```javascript
// In der Browser-Konsole eingeben:
fetch('./products-data.json')
  .then(response => response.json())
  .then(data => {
    localStorage.setItem('fashionWayProducts', JSON.stringify(data));
    location.reload();
  });
```

### Lösung 2: Locomotive Scroll neu initialisieren
```javascript
// In der Browser-Konsole eingeben:
if (typeof scroll !== 'undefined') {
  scroll.update();
  ScrollTrigger.refresh();
}
```

### Lösung 3: Seite komplett neu laden
1. Cache leeren: `Ctrl+F5`
2. Falls das nicht hilft: Inkognito-Modus verwenden

## Debugging-Schritte

### 1. Produktladung debuggen
```javascript
// In der Konsole eingeben:
console.log('localStorage:', localStorage.getItem('fashionWayProducts'));
fetch('./products-data.json')
  .then(response => {
    console.log('Response status:', response.status);
    return response.json();
  })
  .then(data => console.log('Produkte:', data))
  .catch(error => console.error('Fehler:', error));
```

### 2. Locomotive Scroll debuggen
```javascript
// In der Konsole eingeben:
console.log('Scroll object:', scroll);
console.log('Scroll methods:', Object.getOwnPropertyNames(scroll));
```

### 3. Event-Listener debuggen
```javascript
// In der Konsole eingeben:
const backToTopBtn = document.getElementById('backToTop');
console.log('Button:', backToTopBtn);
if (backToTopBtn) {
  backToTopBtn.addEventListener('click', () => {
    console.log('Button clicked!');
  });
}
```

## Erwartetes Verhalten

### ✅ Wenn alles funktioniert:
- **Produkte**: 45 Produkte werden angezeigt
- **Back-to-Top**: Button scrollt smooth nach oben
- **Console**: Keine Fehlermeldungen
- **Test-Seite**: Zeigt "✅ X Produkte geladen"

### ❌ Wenn es Probleme gibt:
- **Produkte**: Keine Produkte sichtbar
- **Back-to-Top**: Button reagiert nicht
- **Console**: Rote Fehlermeldungen
- **Test-Seite**: Zeigt Fehlermeldung

## Notfall-Lösung

Falls nichts funktioniert:

1. **Alle Dateien neu hochladen** auf GitHub
2. **Cache komplett leeren** (Browser-Daten löschen)
3. **Neuen Browser verwenden**
4. **GitHub Pages neu deployen** (Settings → Pages → Re-deploy)

## Support

Falls die Probleme weiterhin bestehen:
1. Screenshot der Konsole machen
2. Fehlermeldungen notieren
3. Browser und Version angeben
4. Problem beschreiben

**Die meisten Probleme lassen sich durch Cache-Leeren und Neuladen lösen!** 🔧 