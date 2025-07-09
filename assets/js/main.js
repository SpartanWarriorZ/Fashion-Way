// Produktverwaltung für Fashion-Way
// Diese Datei wird von der index.html geladen und verwaltet die Produkte

// Produkte aus der JSON-Datei laden
async function loadProductsFromFile() {
  try {
    // Versuche zuerst die relative URL
    let response = await fetch('./products-data.json');
    
    // Falls das nicht funktioniert, versuche die absolute URL
    if (!response.ok) {
      response = await fetch('https://spartanwarriorz.github.io/Fashion-Way/products-data.json');
    }
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error('Produktdaten konnten nicht geladen werden');
      return [];
    }
  } catch (error) {
    console.error('Fehler beim Laden der Produktdaten:', error);
    return [];
  }
}

// Produkte laden und in localStorage speichern (falls leer)
async function loadProducts() {
  const saved = localStorage.getItem('fashionWayProducts');
  if (saved) {
    return JSON.parse(saved);
  } else {
    // Wenn keine Produkte im localStorage sind, aus JSON-Datei laden
    const products = await loadProductsFromFile();
    localStorage.setItem('fashionWayProducts', JSON.stringify(products));
    return products;
  }
}

// Funktion zum Aktualisieren der Produkte (wird von der Website aufgerufen)
async function updateProductsFromCMS() {
  const saved = localStorage.getItem('fashionWayProducts');
  if (saved) {
    const products = JSON.parse(saved);
    return products;
  }
  return [];
}

// Event-Listener für localStorage Änderungen
window.addEventListener('storage', function(e) {
  if (e.key === 'fashionWayProducts') {
    // Produkte wurden im CMS geändert
    console.log('Produkte wurden im CMS aktualisiert');
    // Hier könnte die Website neu geladen werden
    if (window.location.reload) {
      // Optional: Seite neu laden um Änderungen zu zeigen
      // window.location.reload();
    }
  }
});

// Exportiere Funktionen für die Website
window.loadProductsFromFile = loadProductsFromFile;
window.loadProducts = loadProducts;
window.updateProductsFromCMS = updateProductsFromCMS;
