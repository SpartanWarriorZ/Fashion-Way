# 🛍️ Produktverwaltung - Fashion-Way

## 📝 Wie Sie Produkte bearbeiten können

### **Einfache Methode: JSON-Datei bearbeiten**

1. **Öffnen Sie die Datei `products.json`** mit einem Texteditor (Notepad++, Visual Studio Code, etc.)

2. **Produkt hinzufügen:**
   ```json
   {
     "name": "Neues Produkt",
     "price": "39,99 €",
     "img": "https://ihr-bild-url.com/bild.jpg",
     "subcat": "oberteile"
   }
   ```

3. **Produkt bearbeiten:**
   - Ändern Sie den `name` für den Produktnamen
   - Ändern Sie den `price` für den Preis
   - Ändern Sie die `img` URL für ein neues Bild
   - Ändern Sie `subcat` für die Kategorie (oberteile, hosen, schuhe, accessoires)

4. **Produkt löschen:**
   - Entfernen Sie einfach den gesamten Produkt-Block aus der JSON-Datei

### **Kategorien:**
- **herren** - Produkte für Herren
- **damen** - Produkte für Damen  
- **kinder** - Produkte für Kinder

### **Unterkategorien:**
- **oberteile** - Shirts, Blusen, etc.
- **hosen** - Jeans, Hosen, etc.
- **schuhe** - Sneaker, Schuhe, etc.
- **accessoires** - Taschen, Caps, etc.

### **Bild-URLs:**
- Verwenden Sie Unsplash URLs: `https://images.unsplash.com/photo-...`
- Oder laden Sie Bilder auf einen Bildhoster hoch
- Empfohlene Größe: 600x600 Pixel

### **Wichtige Regeln:**
- ✅ Verwenden Sie deutsche Umlaute (ä, ö, ü)
- ✅ Preise im Format: "XX,XX €"
- ✅ Kommas zwischen Produkten nicht vergessen
- ❌ Keine Kommas nach dem letzten Produkt
- ❌ Keine Anführungszeichen in den URLs vergessen

### **Beispiel für ein neues Produkt:**
```json
{
  "name": "Stylische Damen Bluse",
  "price": "44,99 €", 
  "img": "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80",
  "subcat": "oberteile"
}
```

### **Nach Änderungen:**
1. Speichern Sie die `products.json` Datei
2. Laden Sie die Website neu (F5)
3. Die Änderungen sind sofort sichtbar!

---

## 🚀 Professionelle Lösung: Strapi CMS

Für eine noch benutzerfreundlichere Verwaltung können wir Strapi installieren:

### **Vorteile von Strapi:**
- ✅ Drag & Drop Interface
- ✅ Bild-Upload per Mausklick
- ✅ Mobile App verfügbar
- ✅ Automatische Backups
- ✅ Benutzerfreundliche Oberfläche

### **Installation:**
```bash
npx create-strapi-app@latest fashion-way-cms --quickstart
```

---

## 📞 Support

Bei Fragen oder Problemen kontaktieren Sie uns gerne! 