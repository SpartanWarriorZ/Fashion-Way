// Migration-Skript: Produkte von products.json zu Directus migrieren
// Führe dieses Skript aus, nachdem Directus läuft

const fs = require('fs');

async function migrateProducts() {
  try {
    // Lade bestehende Produkte
    const productsData = JSON.parse(fs.readFileSync('products.json', 'utf8'));
    
    console.log('🚀 Starte Migration zu Directus...');
    
    // API URL
    const DIRECTUS_URL = 'http://localhost:8055';
    
    // Alle Produkte durchgehen
    for (const [category, products] of Object.entries(productsData)) {
      console.log(`📦 Migriere ${category}: ${products.length} Produkte`);
      
      for (const product of products) {
        // Produkt für Directus vorbereiten
        const directusProduct = {
          name: product.name,
          price: parseFloat(product.price.replace('€', '').replace(',', '.')),
          category: category,
          subcategory: product.subcat,
          description: `Produkt aus der Kategorie ${category}`,
          stock: 10,
          active: true
        };
        
        // Produkt zu Directus hinzufügen
        const response = await fetch(`${DIRECTUS_URL}/items/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(directusProduct)
        });
        
        if (response.ok) {
          console.log(`✅ ${product.name} migriert`);
        } else {
          console.error(`❌ Fehler bei ${product.name}:`, await response.text());
        }
      }
    }
    
    console.log('🎉 Migration abgeschlossen!');
    console.log('📝 Gehe zu http://localhost:8055 um die Produkte zu verwalten');
    
  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error);
  }
}

// Skript ausführen
migrateProducts(); 