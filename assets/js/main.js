gsap.registerPlugin(ScrollTrigger);

gsap.from('.hero h1', {
  opacity: 0,
  y: -50,
  duration: 1.5,
  ease: 'power2.out'
});

// Produktverwaltung
let products = [];

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

// Produkte laden
async function loadProducts() {
  const saved = localStorage.getItem('fashionWayProducts');
  if (saved) {
    products = JSON.parse(saved);
  } else {
    // Wenn keine Produkte im localStorage sind, aus JSON-Datei laden
    products = await loadProductsFromFile();
    localStorage.setItem('fashionWayProducts', JSON.stringify(products));
  }
  renderProducts();
}

// Produkte anzeigen
function renderProducts() {
  const productsContainer = document.getElementById('products');
  if (!productsContainer) return;

  productsContainer.innerHTML = products.map(product => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}" class="product-image">
      <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-price">${product.price} €</p>
        <p class="product-category">${product.category} - ${product.subcategory}</p>
        <button class="btn btn-primary">In den Warenkorb</button>
      </div>
    </div>
  `).join('');
}

// Produkte beim Laden der Seite initialisieren
document.addEventListener('DOMContentLoaded', function() {
  loadProducts();
});

// Funktion zum Aktualisieren der Produkte (wird vom CMS aufgerufen)
function updateProductsFromCMS() {
  const saved = localStorage.getItem('fashionWayProducts');
  if (saved) {
    products = JSON.parse(saved);
    renderProducts();
  }
}

// Event-Listener für localStorage Änderungen
window.addEventListener('storage', function(e) {
  if (e.key === 'fashionWayProducts') {
    updateProductsFromCMS();
  }
});
