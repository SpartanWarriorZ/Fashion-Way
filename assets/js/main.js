gsap.registerPlugin(ScrollTrigger);

gsap.from('.hero h1', {
  opacity: 0,
  y: -50,
  duration: 1.5,
  ease: 'power2.out'
});

// Globale Variablen
let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem('fashionWayCart')) || [];
let currentMainCategory = 'herren';
let currentSubCategory = 'alle';
let scroll; // Locomotive Scroll Instanz global

// DOM-Elemente (werden später initialisiert)
let shopGrid;
let mainCatButtons;
let subCatButtons;
let sortSelect;
let cartCountElements;
let cartBtn;
let mobileCartBtn;
let combinedActionBtn;
let backToTopBtn;
let cartActionBtn;
let combinedCartCount;

// DOM-Elemente initialisieren
function initializeDOMElements() {
  shopGrid = document.getElementById('shopGrid');
  mainCatButtons = document.querySelectorAll('.main-cat-btn');
  subCatButtons = document.querySelectorAll('.sub-cat-btn');
  sortSelect = document.getElementById('sortPrice');
  cartCountElements = document.querySelectorAll('.cart-count');
  cartBtn = document.getElementById('cartBtn');
  mobileCartBtn = document.getElementById('mobileCartBtn');
  combinedActionBtn = document.getElementById('combinedActionBtn');
  backToTopBtn = document.getElementById('backToTopBtn');
  cartActionBtn = document.getElementById('cartActionBtn');
  combinedCartCount = document.getElementById('combinedCartCount');
}

// Produkte aus JSON-Datei laden
async function loadProducts() {
  try {
    const response = await fetch('import-data.json');
    if (!response.ok) {
      throw new Error('Fehler beim Laden der Produkte');
    }
    allProducts = await response.json();
    filterAndDisplayProducts();
    
    // Locomotive Scroll erst nach dem vollständigen Laden der Produkte initialisieren
    setTimeout(() => {
      if (!scroll) {
        scroll = new LocomotiveScroll({
          el: document.querySelector('[data-scroll-container]'),
          smooth: true,
          lerp: 0.08,
          multiplier: 1,
          class: 'is-inview',
          reloadOnContextChange: true,
          touchMultiplier: 2,
          smoothMobile: true
        });
        if (window.ScrollTrigger) {
          scroll.on("scroll", ScrollTrigger.update);
          ScrollTrigger.scrollerProxy("[data-scroll-container]", {
            scrollTop(value) {
              return arguments.length ? scroll.scrollTo(value, 0, 0) : scroll.scroll.instance.scroll.y;
            },
            getBoundingClientRect() {
              return {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight};
            },
            pinType: document.querySelector("[data-scroll-container]").style.transform ? "transform" : "fixed"
          });
          ScrollTrigger.addEventListener("refresh", () => scroll.update());
          ScrollTrigger.refresh();
        }
      } else {
        setTimeout(() => {
          scroll.update();
          if (window.ScrollTrigger && window.ScrollTrigger.refresh) {
            ScrollTrigger.refresh();
          }
        }, 100);
      }
    }, 300); // Verzögerung für bessere Performance
  } catch (error) {
    console.error('Fehler beim Laden der Produkte:', error);
    // Fallback: Versuche LocalStorage
    const storedProducts = JSON.parse(localStorage.getItem('fashionWayProducts')) || [];
    if (storedProducts.length > 0) {
      allProducts = storedProducts;
      filterAndDisplayProducts();
    } else {
      showErrorMessage('Produkte konnten nicht geladen werden. Bitte laden Sie die Seite neu.');
    }
    // Locomotive Scroll trotzdem initialisieren, falls noch nicht geschehen
    setTimeout(() => {
      if (!scroll) {
        scroll = new LocomotiveScroll({
          el: document.querySelector('[data-scroll-container]'),
          smooth: true,
          lerp: 0.08,
          multiplier: 1,
          class: 'is-inview',
          reloadOnContextChange: true,
          touchMultiplier: 2,
          smoothMobile: true
        });
        if (window.ScrollTrigger) {
          scroll.on("scroll", ScrollTrigger.update);
          ScrollTrigger.scrollerProxy("[data-scroll-container]", {
            scrollTop(value) {
              return arguments.length ? scroll.scrollTo(value, 0, 0) : scroll.scroll.instance.scroll.y;
            },
            getBoundingClientRect() {
              return {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight};
            },
            pinType: document.querySelector("[data-scroll-container]").style.transform ? "transform" : "fixed"
          });
          ScrollTrigger.addEventListener("refresh", () => scroll.update());
          ScrollTrigger.refresh();
        }
      }
    }, 300);
  }
}

// Produkte filtern und anzeigen
function filterAndDisplayProducts() {
  filteredProducts = allProducts.filter(product => {
    const matchesMainCat = product.category === currentMainCategory;
    const matchesSubCat = currentSubCategory === 'alle' || product.subcategory === currentSubCategory;
    return matchesMainCat && matchesSubCat;
  });
  
  sortProducts();
  displayProducts();
}

// Produkte sortieren
function sortProducts() {
  const sortValue = sortSelect.value;
  
  switch (sortValue) {
    case 'price-asc':
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    default:
      // Standard-Sortierung nach ID
      filteredProducts.sort((a, b) => a.id - b.id);
  }
}

// Produkte anzeigen
function displayProducts() {
  if (!shopGrid) return;
  
  shopGrid.innerHTML = '';
  
  if (filteredProducts.length === 0) {
    shopGrid.innerHTML = `
      <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
        <h3>Keine Produkte gefunden</h3>
        <p>Für die ausgewählte Kategorie sind derzeit keine Produkte verfügbar.</p>
      </div>
    `;
    // Locomotive Scroll Update nur einmal nach dem Hinzufügen von Inhalt
    if (window.scroll && window.scroll.update) {
      requestAnimationFrame(() => {
        window.scroll.update();
        if (window.ScrollTrigger && window.ScrollTrigger.refresh) {
          ScrollTrigger.refresh();
        }
      });
    }
    return;
  }
  
  // Produktkarten in einem Batch hinzufügen
  const fragment = document.createDocumentFragment();
  filteredProducts.forEach(product => {
    const productCard = createProductCard(product);
    fragment.appendChild(productCard);
  });
  shopGrid.appendChild(fragment);
  
  // Locomotive Scroll Update nur einmal nach dem Hinzufügen aller Karten
  if (window.scroll && window.scroll.update) {
    requestAnimationFrame(() => {
      window.scroll.update();
      if (window.ScrollTrigger && window.ScrollTrigger.refresh) {
        ScrollTrigger.refresh();
      }
    });
  }
}

// Produktkarte erstellen
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-scroll', '');
  card.setAttribute('data-scroll-speed', '0.5');

  const cartItem = cart.find(item => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  card.innerHTML = `
    <div class="product-image">
      <img src="${product.image}" alt="${product.name}" loading="lazy" onclick="openProductImageModal('${product.image}', '${product.name}', '${product.description}')" style="cursor: pointer;">
    </div>
    <div class="product-info">
      <h3 class="product-name">${product.name}</h3>
      <p class="product-description">${product.description}</p>
      <div class="product-price">€${product.price.toFixed(2)}</div>
      <div class="product-stock">${product.stock > 0 ? `${product.stock} verfügbar` : 'Ausverkauft'}</div>
      <button class="add-to-cart-btn" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
        ${product.stock === 0 ? 'Ausverkauft' : 'In den Warenkorb'}
      </button>
      ${quantity > 0 ? `
        <div class="cart-quantity-controls">
          <button onclick="removeFromCart(${product.id})" class="quantity-btn">-</button>
          <span class="quantity-display">${quantity}</span>
          <button onclick="addToCart(${product.id})" class="quantity-btn" ${product.stock <= quantity ? 'disabled' : ''}>+</button>
        </div>
      ` : ''}
    </div>
  `;

  return card;
}

// Warenkorb-Funktionen
function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product || product.stock === 0) return;
  
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    if (existingItem.quantity < product.stock) {
      existingItem.quantity++;
    } else {
      showNotification('Maximale Anzahl erreicht', 'error');
      return;
    }
  } else {
    cart.push({
      id: productId,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }
  
  saveCart();
  updateCartDisplay();
  displayProducts(); // Aktualisiere Produktkarten für neue Mengenanzeige
  showNotification('Produkt zum Warenkorb hinzugefügt', 'success');
}

function removeFromCart(productId) {
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity--;
    if (existingItem.quantity <= 0) {
      cart = cart.filter(item => item.id !== productId);
    }
  }
  
  saveCart();
  updateCartDisplay();
  displayProducts(); // Aktualisiere Produktkarten für neue Mengenanzeige
  showNotification('Produkt aus Warenkorb entfernt', 'info');
}

function saveCart() {
  localStorage.setItem('fashionWayCart', JSON.stringify(cart));
}

function updateCartDisplay() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  cartCountElements.forEach(element => {
    element.textContent = totalItems;
  });
  
  // Kombinierter Button Cart Count aktualisieren
  if (combinedCartCount) {
    combinedCartCount.textContent = totalItems;
  }
}

// Kategorie-Filter
function setupCategoryFilters() {
  mainCatButtons.forEach(button => {
    button.addEventListener('click', () => {
      mainCatButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentMainCategory = button.dataset.maincat;
      
      // Sub-Kategorie zurücksetzen
      subCatButtons.forEach(btn => btn.classList.remove('active'));
      document.querySelector('[data-subcat="alle"]').classList.add('active');
      currentSubCategory = 'alle';
      
      filterAndDisplayProducts();
    });
  });
  
  subCatButtons.forEach(button => {
    button.addEventListener('click', () => {
      subCatButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentSubCategory = button.dataset.subcat;
      filterAndDisplayProducts();
    });
  });
}

// Sortierung
function setupSorting() {
  sortSelect.addEventListener('change', () => {
    filterAndDisplayProducts();
  });
}

// Benachrichtigungen
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Styling für Benachrichtigungen
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    color: white;
    font-weight: 500;
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
  `;
  
  // Farben je nach Typ
  switch (type) {
    case 'success':
      notification.style.backgroundColor = '#10b981';
      break;
    case 'error':
      notification.style.backgroundColor = '#ef4444';
      break;
    case 'warning':
      notification.style.backgroundColor = '#f59e0b';
      break;
    default:
      notification.style.backgroundColor = '#3b82f6';
  }
  
  document.body.appendChild(notification);
  
  // Animation
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Entfernen nach 3 Sekunden
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function showErrorMessage(message) {
  if (shopGrid) {
    shopGrid.innerHTML = `
      <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #ef4444;">
        <h3>Fehler beim Laden</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
          Seite neu laden
        </button>
      </div>
    `;
  }
}

// Mobile Navigation
function setupMobileNavigation() {
  const burgerMenu = document.getElementById('burgerMenu');
  const mobileNav = document.getElementById('mobileNav');
  const closeMobileNav = document.getElementById('closeMobileNav');
  
  if (burgerMenu && mobileNav && closeMobileNav) {
    burgerMenu.addEventListener('click', () => {
      mobileNav.classList.add('active');
    });
    
    closeMobileNav.addEventListener('click', () => {
      mobileNav.classList.remove('active');
    });
    
    // Schließen bei Klick auf Links und spezielle Shop-Navigation
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Spezielle Behandlung für Shop-Link auf Mobile
        if (href === '#shop' && window.innerWidth <= 900) {
          e.preventDefault();
          const shopSection = document.querySelector('#shop');
          if (shopSection && scroll) {
            // Scroll zum Shop mit Offset von 30px nach oben
            scroll.scrollTo(shopSection, { 
              offset: -30, 
              duration: 1000, 
              disableLerp: false 
            });
          } else if (shopSection) {
            // Fallback ohne Locomotive Scroll
            const offsetTop = shopSection.offsetTop - 30;
            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            });
          }
        }
        
        // Mobile Navigation schließen
        mobileNav.classList.remove('active');
      });
    });
  }
}

// Warenkorb Modal erstellen
function createCartModal() {
  const modal = document.createElement('div');
  modal.id = 'cartModal';
  modal.className = 'cart-modal';
  modal.innerHTML = `
    <div class="cart-modal-overlay" id="cartModalOverlay"></div>
    <div class="cart-modal-content">
      <div class="cart-modal-header">
        <h3>Warenkorb</h3>
        <button class="cart-modal-close" id="cartModalClose">&times;</button>
      </div>
      <div class="cart-modal-body" id="cartModalBody">
        <!-- Warenkorb-Inhalt wird hier dynamisch eingefügt -->
      </div>
      <div class="cart-modal-footer">
        <div class="cart-total">
          <span>Gesamt:</span>
          <span id="cartTotalPrice">€0.00</span>
        </div>
        <button class="cart-checkout-btn" id="cartCheckoutBtn" disabled>
          Zur Kasse
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Event Listeners für Modal
  document.getElementById('cartModalClose').addEventListener('click', closeCart);
  document.getElementById('cartModalOverlay').addEventListener('click', closeCart);
  document.getElementById('cartCheckoutBtn').addEventListener('click', checkout);
}

// Warenkorb öffnen
function openCart() {
  const modal = document.getElementById('cartModal');
  if (!modal) {
    createCartModal();
  }
  
  updateCartModal();
  document.getElementById('cartModal').classList.add('active');
  
  // Performance-Optimierung: Locomotive Scroll pausieren
  if (scroll) {
    scroll.stop();
  }
  
  // Body-Scroll verhindern (besser als overflow: hidden)
  document.body.style.position = 'fixed';
  document.body.style.top = `-${window.scrollY}px`;
  document.body.style.width = '100%';
}

// Warenkorb schließen
function closeCart() {
  const modal = document.getElementById('cartModal');
  if (modal) {
    modal.classList.remove('active');
  }
  
  // Performance-Optimierung: Locomotive Scroll wieder starten
  if (scroll) {
    scroll.start();
  }
  
  // Body-Scroll wiederherstellen
  const scrollY = document.body.style.top;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, parseInt(scrollY || '0') * -1);
}

// Warenkorb Modal aktualisieren
function updateCartModal() {
  const cartBody = document.getElementById('cartModalBody');
  const totalPriceElement = document.getElementById('cartTotalPrice');
  const checkoutBtn = document.getElementById('cartCheckoutBtn');
  
  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div class="cart-empty">
        <p>Ihr Warenkorb ist leer</p>
        <button onclick="closeCart()" class="continue-shopping-btn">Weiter einkaufen</button>
      </div>
    `;
    totalPriceElement.textContent = '€0.00';
    checkoutBtn.disabled = true;
    return;
  }
  
  let totalPrice = 0;
  let cartHTML = '';
  
  cart.forEach(item => {
    const product = allProducts.find(p => p.id === item.id);
    if (product) {
      const itemTotal = product.price * item.quantity;
      totalPrice += itemTotal;
      
      cartHTML += `
        <div class="cart-item">
          <div class="cart-item-image">
            <img src="${product.image}" alt="${product.name}">
          </div>
          <div class="cart-item-info">
            <h4>${product.name}</h4>
            <p class="cart-item-price">€${product.price.toFixed(2)}</p>
          </div>
          <div class="cart-item-quantity">
            <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
            <span>${item.quantity}</span>
            <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})" ${item.quantity >= product.stock ? 'disabled' : ''}>+</button>
          </div>
          <div class="cart-item-total">
            €${itemTotal.toFixed(2)}
          </div>
          <button class="cart-item-remove" onclick="removeFromCart(${item.id})">&times;</button>
        </div>
      `;
    }
  });
  
  cartBody.innerHTML = cartHTML;
  totalPriceElement.textContent = `€${totalPrice.toFixed(2)}`;
  checkoutBtn.disabled = false;
}

// Warenkorb-Menge aktualisieren
function updateCartQuantity(productId, newQuantity) {
  if (newQuantity <= 0) {
    removeFromCart(productId);
    return;
  }
  
  const product = allProducts.find(p => p.id === productId);
  if (newQuantity > product.stock) {
    showNotification('Maximale Anzahl erreicht', 'error');
    return;
  }
  
  const cartItem = cart.find(item => item.id === productId);
  if (cartItem) {
    cartItem.quantity = newQuantity;
    saveCart();
    updateCartDisplay();
    updateCartModal();
    displayProducts(); // Aktualisiere Produktkarten
  }
}

// Zur Kasse
function checkout() {
  showNotification('Checkout-Funktion wird noch implementiert', 'info');
  closeCart();
}

// Produktbild Modal Variablen
let currentProductImages = [];
let currentImageIndex = 0;

// Produktbild Modal öffnen
function openProductImageModal(imageSrc, productName, productDescription) {
  const modal = document.getElementById('productImageModal');
  const modalImg = document.getElementById('productImageModalImg');
  const modalTitle = document.getElementById('productImageTitle');
  const modalDescription = document.getElementById('productImageDescription');
  const thumbnailsContainer = document.getElementById('productImageThumbnails');
  
  if (modal && modalImg && modalTitle && modalDescription) {
    // Zoom zurücksetzen
    if (window.resetImageZoom) {
      window.resetImageZoom();
    }
    
    // Aktuelle Produktdaten setzen
    currentProductImages = [imageSrc]; // Für zukünftige Erweiterung mit mehreren Bildern
    currentImageIndex = 0;
    
    // Modal-Inhalt setzen
    modalImg.src = imageSrc;
    modalImg.alt = productName;
    modalTitle.textContent = productName;
    modalDescription.textContent = productDescription;
    
    // Thumbnails erstellen (aktuell nur ein Bild)
    thumbnailsContainer.innerHTML = `
      <div class="product-image-thumbnail active" onclick="showImage(0)">
        <img src="${imageSrc}" alt="${productName}">
      </div>
    `;
    
    // Navigation-Buttons verstecken (da nur ein Bild)
    const prevBtn = document.getElementById('productImagePrev');
    const nextBtn = document.getElementById('productImageNext');
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    
    // Modal öffnen
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus auf Close-Button setzen
    setTimeout(() => {
      const closeBtn = document.getElementById('productImageModalClose');
      if (closeBtn) closeBtn.focus();
    }, 100);
  }
}

// Produktbild Modal schließen
function closeProductImageModal() {
  const modal = document.getElementById('productImageModal');
  if (modal) {
    // Zoom zurücksetzen
    if (window.resetImageZoom) {
      window.resetImageZoom();
    }
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Bestimmtes Bild anzeigen (für zukünftige Bildergalerie)
function showImage(index) {
  if (index >= 0 && index < currentProductImages.length) {
    currentImageIndex = index;
    const modalImg = document.getElementById('productImageModalImg');
    const thumbnails = document.querySelectorAll('.product-image-thumbnail');
    
    if (modalImg) {
      modalImg.src = currentProductImages[index];
    }
    
    // Thumbnail-Aktivität aktualisieren
    thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });
  }
}

// Nächstes Bild (für zukünftige Bildergalerie)
function nextImage() {
  if (currentImageIndex < currentProductImages.length - 1) {
    showImage(currentImageIndex + 1);
  }
}

// Vorheriges Bild (für zukünftige Bildergalerie)
function prevImage() {
  if (currentImageIndex > 0) {
    showImage(currentImageIndex - 1);
  }
}

// Produktbild Modal Setup
function setupProductImageModal() {
  const modal = document.getElementById('productImageModal');
  const overlay = document.getElementById('productImageModalOverlay');
  const closeBtn = document.getElementById('productImageModalClose');
  const prevBtn = document.getElementById('productImagePrev');
  const nextBtn = document.getElementById('productImageNext');
  
  if (modal && overlay && closeBtn) {
    // Modal schließen bei Klick auf Overlay
    overlay.addEventListener('click', closeProductImageModal);
    
    // Modal schließen bei Klick auf Close-Button
    closeBtn.addEventListener('click', closeProductImageModal);
    
    // Navigation-Buttons (für zukünftige Bildergalerie)
    if (prevBtn) {
      prevBtn.addEventListener('click', prevImage);
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', nextImage);
    }
    
    // ESC-Taste schließt Modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeProductImageModal();
      }
      
      // Pfeiltasten für Navigation (für zukünftige Bildergalerie)
      if (modal.classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
          prevImage();
        } else if (e.key === 'ArrowRight') {
          nextImage();
        }
      }
    });
  }
}

// Zoom-Funktionalität
function setupImageZoom() {
  const modalImg = document.getElementById('productImageModalImg');
  const zoomIndicator = document.getElementById('zoomIndicator');
  
  if (modalImg && zoomIndicator) {
    let isZoomed = false;
    let isDragging = false;
    let startX, startY, translateX = 0, translateY = 0;
    let scale = 1;
    const ZOOM_LEVEL = 3;
    
    // Zoom-Indikator anzeigen/verstecken
    function showZoomIndicator() {
      zoomIndicator.classList.add('show');
      setTimeout(() => {
        if (!isZoomed) {
          zoomIndicator.classList.remove('show');
        }
      }, 2000);
    }
    
    // Zoom-Indikator verstecken
    function hideZoomIndicator() {
      zoomIndicator.classList.remove('show');
    }
    

    
    // Transform anwenden
    function applyTransform() {
      modalImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
    
    // Zoom an bestimmter Position
    function zoomAtPosition(clientX, clientY) {
      const rect = modalImg.getBoundingClientRect();
      const containerRect = modalImg.parentElement.getBoundingClientRect();
      
      // Relative Position im Bild berechnen
      const relativeX = (clientX - rect.left) / rect.width;
      const relativeY = (clientY - rect.top) / rect.height;
      
      // Transform-Origin setzen
      modalImg.style.transformOrigin = `${relativeX * 100}% ${relativeY * 100}%`;
      
      // Zoom anwenden
      scale = ZOOM_LEVEL;
      translateX = 0;
      translateY = 0;
      
      modalImg.classList.add('zoomed');
      zoomIndicator.textContent = 'Ziehen zum Navigieren • Klick zum Verkleinern';
      zoomIndicator.classList.add('zoomed');
      showZoomIndicator();
      
      applyTransform();
    }
    
    // Zoom zurücksetzen
    function resetZoom() {
      scale = 1;
      translateX = 0;
      translateY = 0;
      modalImg.style.transformOrigin = 'center';
      modalImg.classList.remove('zoomed');
      modalImg.classList.remove('dragging');
      zoomIndicator.textContent = 'Klick zum Zoomen';
      zoomIndicator.classList.remove('zoomed');
      hideZoomIndicator();
      applyTransform();
    }
    
    // Mouse Events
    let clickStartX, clickStartY;
    let hasMoved = false;
    
    modalImg.addEventListener('mousedown', (e) => {
      if (isZoomed) {
        e.preventDefault();
        isDragging = true;
        hasMoved = false;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        clickStartX = e.clientX;
        clickStartY = e.clientY;
        modalImg.classList.add('dragging');
      } else {
        // Für Zoom: Start-Position merken
        clickStartX = e.clientX;
        clickStartY = e.clientY;
        hasMoved = false;
      }
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging && isZoomed) {
        e.preventDefault();
        
        // Prüfen ob sich die Maus bewegt hat
        const moveDistance = Math.sqrt(
          Math.pow(e.clientX - clickStartX, 2) + 
          Math.pow(e.clientY - clickStartY, 2)
        );
        
        if (moveDistance > 5) {
          hasMoved = true;
        }
        
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        
        // Grenzen setzen (verhindert zu weites Scrollen)
        const rect = modalImg.getBoundingClientRect();
        const containerRect = modalImg.parentElement.getBoundingClientRect();
        const maxTranslateX = (rect.width * scale - containerRect.width) / 2;
        const maxTranslateY = (rect.height * scale - containerRect.height) / 2;
        
        translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX));
        translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY));
        
        applyTransform();
      } else if (!isZoomed) {
        // Prüfen ob sich die Maus bewegt hat (für Zoom-Klick)
        const moveDistance = Math.sqrt(
          Math.pow(e.clientX - clickStartX, 2) + 
          Math.pow(e.clientY - clickStartY, 2)
        );
        
        if (moveDistance > 5) {
          hasMoved = true;
        }
      }
    });
    
    modalImg.addEventListener('click', (e) => {
      // Nur Zoom auslösen wenn sich die Maus nicht bewegt hat
      if (!hasMoved) {
        if (!isZoomed) {
          // Zoom an Klick-Position
          zoomAtPosition(e.clientX, e.clientY);
          isZoomed = true;
        } else {
          // Zoom zurücksetzen
          resetZoom();
          isZoomed = false;
        }
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        modalImg.classList.remove('dragging');
      }
      // Reset für nächsten Klick
      hasMoved = false;
    });
    
    // Zoom-Indikator bei Hover anzeigen
    modalImg.addEventListener('mouseenter', () => {
      if (!isZoomed) {
        showZoomIndicator();
      }
    });
    
    modalImg.addEventListener('mouseleave', () => {
      if (!isZoomed) {
        hideZoomIndicator();
      }
    });
    
    // ESC-Taste zum Zurücksetzen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isZoomed) {
        resetZoom();
        isZoomed = false;
      }
    });
    
    // Touch-Events für Mobile
    let touchStartX, touchStartY, touchTranslateX = 0, touchTranslateY = 0;
    let isTouching = false;
    
    modalImg.addEventListener('touchstart', (e) => {
      if (isZoomed) {
        e.preventDefault();
        const touch = e.touches[0];
        isTouching = true;
        touchStartX = touch.clientX - touchTranslateX;
        touchStartY = touch.clientY - touchTranslateY;
        modalImg.classList.add('dragging');
      } else {
        // Zoom an Touch-Position
        const touch = e.touches[0];
        zoomAtPosition(touch.clientX, touch.clientY);
        isZoomed = true;
      }
    });
    
    // Verhindere Doppelklick auf Mobile (Zoom-Reset)
    let lastTouchTime = 0;
    modalImg.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const timeDiff = currentTime - lastTouchTime;
      
      if (timeDiff < 300 && timeDiff > 0) {
        // Doppelklick erkannt - Zoom zurücksetzen
        e.preventDefault();
        if (isZoomed) {
          resetZoom();
          isZoomed = false;
        }
      }
      
      lastTouchTime = currentTime;
    });
    
    modalImg.addEventListener('touchmove', (e) => {
      if (isTouching && isZoomed) {
        e.preventDefault();
        const touch = e.touches[0];
        touchTranslateX = touch.clientX - touchStartX;
        touchTranslateY = touch.clientY - touchStartY;
        
        // Grenzen setzen
        const rect = modalImg.getBoundingClientRect();
        const containerRect = modalImg.parentElement.getBoundingClientRect();
        const maxTranslateX = (rect.width * scale - containerRect.width) / 2;
        const maxTranslateY = (rect.height * scale - containerRect.height) / 2;
        
        touchTranslateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, touchTranslateX));
        touchTranslateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, touchTranslateY));
        
        translateX = touchTranslateX;
        translateY = touchTranslateY;
        applyTransform();
      }
    });
    
    modalImg.addEventListener('touchend', () => {
      if (isTouching) {
        isTouching = false;
        modalImg.classList.remove('dragging');
      }
    });
    
    // Zoom-Indikator als Reset-Button
    zoomIndicator.addEventListener('click', () => {
      if (isZoomed) {
        resetZoom();
        isZoomed = false;
      }
    });
    
    // Doppelklick zum Zurücksetzen
    modalImg.addEventListener('dblclick', () => {
      if (isZoomed) {
        resetZoom();
        isZoomed = false;
      }
    });
    
    // Zoom zurücksetzen beim Schließen des Modals
    window.resetImageZoom = () => {
      resetZoom();
      isZoomed = false;
    };
  }
}

// Kombinierter Action Button Setup
function setupCombinedActionButton() {
  if (!combinedActionBtn || !backToTopBtn || !cartActionBtn) return;
  
  // Button immer sichtbar machen
  combinedActionBtn.classList.add('visible');
  
  // Back-to-Top Klick-Event
    backToTopBtn.addEventListener('click', () => {
      if (scroll) {
        // Mit Locomotive Scroll
        scroll.scrollTo(0, { duration: 1.5, easing: [0.25, 0.46, 0.45, 0.94] });
      } else {
        // Fallback ohne Locomotive Scroll
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  
  // Warenkorb Klick-Event
  cartActionBtn.addEventListener('click', openCart);
}

// Parallax-Effekt für Hero-Bild wie im alten Inline-Script
function setupHeroParallax() {
  var heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    if (window.innerWidth <= 900) {
      heroBg.setAttribute('data-scroll-speed', '-1');
    } else {
      heroBg.removeAttribute('data-scroll-speed');
    }
  }
}

// Event Listeners für Warenkorb-Buttons
function setupCartButtons() {
  [cartBtn, mobileCartBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', openCart);
    }
  });
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
  initializeDOMElements(); // Initialisiere DOM-Elemente
  setupHeroParallax();
  loadProducts();
  setupCategoryFilters();
  setupSorting();
  setupMobileNavigation();
  setupProductImageModal(); // Produktbild Modal Setup
  setupImageZoom(); // Zoom-Funktionalität Setup
  setupCombinedActionButton(); // Kombinierter Action Button
  setupCartButtons(); // Event-Listener für Warenkorb-Buttons setzen
  updateCartDisplay(); // Aktualisiere Cart-Anzeige nach Initialisierung
  
  // Resize Event Listener für Button-Management
  window.addEventListener('resize', () => {
    setupHeroParallax();
    updateCartDisplay(); // Aktualisiere Button-Anzeige bei Resize
  });
  
  // Locomotive Scroll nach der Initialisierung aktualisieren
  if (window.scroll && window.scroll.update) {
    setTimeout(() => {
      window.scroll.update();
      if (window.ScrollTrigger && window.ScrollTrigger.refresh) {
        ScrollTrigger.refresh();
      }
    }, 200);
  }
});

// Globale Funktionen für onclick-Handler
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.openProductImageModal = openProductImageModal;
window.closeProductImageModal = closeProductImageModal;
window.showImage = showImage;
window.nextImage = nextImage;
window.prevImage = prevImage;
