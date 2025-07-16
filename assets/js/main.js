// Immer beim Laden: LocalStorage für Produkte leeren (Hard-Refresh)
localStorage.removeItem('fashionWayProducts');

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
let currentProduct = null;
let selectedSize = null;
let selectedQuantity = 1;

// DOM-Elemente (werden später initialisiert)
let shopGrid;
let mainCatButtons;
let subCatButtons;
let sortSelect;
let cartCountElements;
let cartBtn;
let mobileCartBtn;
let backToTopBtn;

// DOM-Elemente initialisieren
function initializeDOMElements() {
  shopGrid = document.getElementById('shopGrid');
  mainCatButtons = document.querySelectorAll('.main-cat-btn');
  subCatButtons = document.querySelectorAll('.sub-cat-btn');
  sortSelect = document.getElementById('sortPrice');
  cartCountElements = document.querySelectorAll('.cart-count, .mobile-cart-count, .desktop-cart-count');
  cartBtn = document.getElementById('cartBtn');
  mobileCartBtn = document.getElementById('mobileCartBtn');
  backToTopBtn = document.getElementById('backToTopBtn');
}

// Lazy Loading für Bilder
function setupLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy-image');
          img.classList.add('loaded');
          
          // Shimmer-Effekt stoppen
          const productImage = img.closest('.product-image');
          if (productImage) {
            productImage.classList.add('loaded');
          }
          
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px', // Lade Bilder 50px vor dem Viewport
      threshold: 0.01
    });

    // Beobachte alle lazy-images
    document.querySelectorAll('.lazy-image').forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback für ältere Browser
    document.querySelectorAll('.lazy-image').forEach(img => {
      img.src = img.dataset.src;
      img.classList.remove('lazy-image');
      img.classList.add('loaded');
      
      // Shimmer-Effekt stoppen
      const productImage = img.closest('.product-image');
      if (productImage) {
        productImage.classList.add('loaded');
      }
    });
  }
}

// Lazy Loading für Thumbnails
function setupThumbnailLazyLoading() {
  if ('IntersectionObserver' in window) {
    const thumbnailObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy-thumbnail');
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '20px 0px', // Lade Thumbnails 20px vor dem Viewport
      threshold: 0.01
    });

    // Beobachte alle lazy-thumbnails
    document.querySelectorAll('.lazy-thumbnail').forEach(img => {
      thumbnailObserver.observe(img);
    });
  } else {
    // Fallback für ältere Browser
    document.querySelectorAll('.lazy-thumbnail').forEach(img => {
      img.src = img.dataset.src;
      img.classList.remove('lazy-thumbnail');
      img.classList.add('loaded');
    });
  }
}

// Smooth Scrolling für Desktop Modal Info-Sektion
function setupModalSmoothScrolling() {
  const modalInfoSection = document.querySelector('.product-detail-info');
  if (!modalInfoSection) return;
  
  // Locomotive Scroll für die Info-Sektion einrichten
  if (window.LocomotiveScroll) {
    // Vorherige Instanz entfernen falls vorhanden
    if (window.modalScroll) {
      window.modalScroll.destroy();
    }
    
    window.modalScroll = new LocomotiveScroll({
      el: modalInfoSection,
      smooth: true,
      lerp: 0.1,
      multiplier: 0.8,
      class: 'is-revealed',
      reloadOnContextChange: true,
      touchMultiplier: 2,
      smoothMobile: false, // Nur auf Desktop
      smartphone: {
        smooth: false
      },
      tablet: {
        smooth: false
      }
    });
    
    // Scroll-Update nach kurzer Verzögerung
    setTimeout(() => {
      if (window.modalScroll && window.modalScroll.update) {
        window.modalScroll.update();
      }
    }, 100);
  }
}

// Modal Smooth Scrolling entfernen
function removeModalSmoothScrolling() {
  if (window.modalScroll) {
    window.modalScroll.destroy();
    window.modalScroll = null;
  }
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
          el: document.getElementById('page-wrapper'),
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
          el: document.getElementById('page-wrapper'),
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
  // Nach jedem Rendern: Locomotive Scroll updaten
  if (window.scroll && window.scroll.update) {
    setTimeout(() => {
      window.scroll.update();
      if (window.ScrollTrigger && window.ScrollTrigger.refresh) {
        ScrollTrigger.refresh();
      }
    }, 100);
  }
  // Nach jedem Rendern: Wrapper-Höhe dynamisch setzen
  setTimeout(() => {
    const wrapper = document.getElementById('page-wrapper');
    if (wrapper) {
      const wrapperRect = wrapper.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      if (wrapperRect.height < windowHeight) {
        wrapper.style.minHeight = windowHeight + 'px';
      } else {
        wrapper.style.minHeight = '';
      }
    }
    // Manuelles Resize-Event auslösen
    window.dispatchEvent(new Event('resize'));
    if (window.scroll && window.scroll.update) {
      window.scroll.update();
    }
  }, 100);
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
    // Dynamische min-height für das Grid setzen
    setTimeout(() => {
      const header = document.querySelector('.navbar');
      const footer = document.querySelector('footer');
      const headerHeight = header ? header.offsetHeight : 0;
      const footerHeight = footer ? footer.offsetHeight : 0;
      const minGridHeight = window.innerHeight - headerHeight - footerHeight - 40;
      shopGrid.style.minHeight = minGridHeight > 0 ? minGridHeight + 'px' : '0';
    }, 100);
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
  
  // Lazy Loading für neue Bilder einrichten
  setupLazyLoading();
  
  // Dynamische min-height für das Grid setzen
  setTimeout(() => {
    const header = document.querySelector('.navbar');
    const footer = document.querySelector('footer');
    const headerHeight = header ? header.offsetHeight : 0;
    const footerHeight = footer ? footer.offsetHeight : 0;
    const minGridHeight = window.innerHeight - headerHeight - footerHeight - 40;
    shopGrid.style.minHeight = minGridHeight > 0 ? minGridHeight + 'px' : '0';
  }, 100);
}

// Produktkarte erstellen
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-scroll', '');
  card.setAttribute('data-scroll-speed', '0.5');

  // Warenkorb-Menge für dieses Produkt ermitteln (alle Größen zusammen)
  const cartItemsForProduct = cart.filter(item => item.id === product.id);
  const totalQuantity = cartItemsForProduct.reduce((sum, item) => sum + item.quantity, 0);

  // Sammle alle Bilder (image, image2, ...)
  const images = [product.image];
  if (product.image2) images.push(product.image2);
  if (product.image3) images.push(product.image3);
  if (product.image4) images.push(product.image4);

  // Berechne Gesamtlagerbestand
  let totalStock = 0;
  if (product.sizes) {
    totalStock = product.sizes.reduce((sum, sizeObj) => sum + sizeObj.stock, 0);
  } else {
    totalStock = product.stock || 0;
  }

  // Bewertung rendern falls vorhanden
  let ratingHTML = '';
  if (product.rating) {
    ratingHTML = `
      <div class="product-rating">
        <div class="product-stars">
          ${renderStars(product.rating.stars)}
        </div>
        <span class="product-rating-count">(${product.rating.count})</span>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="product-image" style="cursor:pointer;">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3C/svg%3E" 
           data-src="${product.image}" 
           alt="${product.name}" 
           class="lazy-image"
           loading="lazy">
    </div>
    <div class="product-info">
      <h3 class="product-name">${product.name}</h3>
      <div class="product-price">${product.price.toFixed(2)} €</div>
      ${ratingHTML}
      <div class="product-stock">${totalStock > 0 ? `${totalStock} verfügbar` : 'Ausverkauft'}</div>
      ${totalQuantity > 0 ? `
        <div class="cart-indicator">
          <span class="cart-quantity-badge">${totalQuantity} im Warenkorb</span>
        </div>
      ` : ''}
    </div>
  `;

  // Event Listener für die gesamte Produktkarte
  card.addEventListener('click', function(event) {
    // Verhindere Bubble-Up für spezielle Elemente
    if (event.target.closest('.cart-indicator') || 
        event.target.closest('.cart-quantity-badge')) {
      return;
    }
    
    // Öffne das Produktdetail-Modal
    openProductDetailModal(product);
  });

      // Event Listener für das Bild (öffnet Bild-Modal)
    const productImage = card.querySelector('.product-image');
    productImage.addEventListener('click', function(event) {
      event.stopPropagation(); // Verhindere Bubble-Up zur Karte
      openProductImageModalFromProduct(product.id);
    });

    // Lazy Loading Event Listener für das Bild
    const img = card.querySelector('img');
    if (img) {
      img.addEventListener('load', function() {
        productImage.classList.add('loaded');
      });
    }

  return card;
}

// Notification System
function showNotification(message, type = 'info') {
  // Entferne bestehende Notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => notification.remove());
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Auto-remove nach 3 Sekunden
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
  
  // Close button
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  });
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
function openCart(event) {
  // Event stoppen, um unerwünschte Scroll-Events zu verhindern
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // Hamburger-Menü schließen (falls offen)
  const mobileNav = document.getElementById('mobileNav');
  const burgerMenu = document.getElementById('burgerMenu');
  if (mobileNav && mobileNav.classList.contains('active')) {
    mobileNav.classList.remove('active');
  }
  if (burgerMenu && burgerMenu.classList.contains('active')) {
    burgerMenu.classList.remove('active');
  }
  
  const modal = document.getElementById('cartModal');
  const isNewModal = !modal;
  
  if (isNewModal) {
    createCartModal();
  }
  
  // Animation-Klassen bereinigen
  clearAnimationClasses();
  
  // Modal zuerst anzeigen für flüssigere Übergänge
  document.getElementById('cartModal').classList.add('active');
  
  // Nur aktualisieren wenn es ein neues Modal ist oder der Warenkorb leer ist
  if (isNewModal || cart.length === 0) {
    // Mit leichter Verzögerung aktualisieren für flüssigere Übergänge
    requestAnimationFrame(() => {
      updateCartModal();
    });
  }
  
  // Body-Scroll verhindern
  document.body.style.overflow = 'hidden';
}

// Warenkorb schließen
function closeCart() {
  const modal = document.getElementById('cartModal');
  if (modal) {
    modal.classList.remove('active');
  }
  
  // Body-Scroll wiederherstellen
  document.body.style.overflow = '';
}

// Warenkorb komplett entfernen (für "Weiter einkaufen" Button)
function removeCartModal() {
  const modal = document.getElementById('cartModal');
  if (modal) {
    // Alle Animation-Klassen entfernen
    modal.classList.remove('swiping-out', 'swiping-in');
    modal.remove();
  }
  
  // Body-Scroll wiederherstellen
  document.body.style.overflow = '';
}

// Animation-Klassen bereinigen
function clearAnimationClasses() {
  const cartModal = document.getElementById('cartModal');
  const checkoutModal = document.getElementById('checkoutModal');
  
  if (cartModal) {
    cartModal.classList.remove('swiping-out', 'swiping-in');
  }
  
  if (checkoutModal) {
    checkoutModal.classList.remove('swiping-out', 'swiping-in');
  }
}

// Warenkorb-Modal leise aktualisieren (ohne visuelle Effekte)
function updateCartModalSilently() {
  const cartBody = document.getElementById('cartModalBody');
  const totalPriceElement = document.getElementById('cartTotalPrice');
  const checkoutBtn = document.getElementById('cartCheckoutBtn');
  
  if (!cartBody || !totalPriceElement || !checkoutBtn) return;
  
  // Sanfte Transition für die Aktualisierung
  cartBody.classList.add('updating');
  
  // Verwende requestAnimationFrame für flüssigere Updates
  requestAnimationFrame(() => {
    if (cart.length === 0) {
      cartBody.innerHTML = `
        <div class="cart-empty">
          <p>Ihr Warenkorb ist leer</p>
          <button onclick="continueShopping()" class="continue-shopping-btn">Weiter einkaufen</button>
        </div>
      `;
      totalPriceElement.textContent = '€0.00';
      checkoutBtn.disabled = true;
    } else {
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
                ${item.size ? `<p class="cart-item-size">Größe: ${item.size}</p>` : ''}
                <p class="cart-item-price">${product.price.toFixed(2)} €</p>
              </div>
              <div class="cart-item-quantity">
                <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1}, '${item.size || ''}')" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                <span>${item.quantity}</span>
                <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1}, '${item.size || ''}')" ${item.quantity >= product.stock ? 'disabled' : ''}>+</button>
              </div>
              <div class="cart-item-total">
                ${itemTotal.toFixed(2)} €
              </div>
              <button class="cart-item-remove" onclick="removeProductFromCart(${item.id}, '${item.size || ''}')">&times;</button>
            </div>
          `;
        }
      });
      
      cartBody.innerHTML = cartHTML;
      totalPriceElement.textContent = `${totalPrice.toFixed(2)} €`;
      checkoutBtn.disabled = false;
    }
    
    // Transition-Klasse entfernen
    requestAnimationFrame(() => {
      cartBody.classList.remove('updating');
    });
  });
}

// Sicherheitsmaßnahme: Animation-Klassen nach 2 Sekunden automatisch entfernen
function setupAnimationCleanup() {
  setInterval(() => {
    const cartModal = document.getElementById('cartModal');
    const checkoutModal = document.getElementById('checkoutModal');
    
    if (cartModal && cartModal.classList.contains('swiping-out')) {
      // Wenn swiping-out länger als 2 Sekunden aktiv ist, entfernen
      setTimeout(() => {
        if (cartModal && cartModal.classList.contains('swiping-out')) {
          cartModal.classList.remove('swiping-out');
        }
      }, 2000);
    }
    
    if (checkoutModal && checkoutModal.classList.contains('swiping-out')) {
      // Wenn swiping-out länger als 2 Sekunden aktiv ist, entfernen
      setTimeout(() => {
        if (checkoutModal && checkoutModal.classList.contains('swiping-out')) {
          checkoutModal.classList.remove('swiping-out');
        }
      }, 2000);
    }
  }, 1000);
}

// Warenkorb Modal aktualisieren
function updateCartModal() {
  // Verwende die sanfte Aktualisierung für bessere Performance
  updateCartModalSilently();
}

// Warenkorb-Menge aktualisieren
function updateCartQuantity(productId, newQuantity, size = null) {
  if (newQuantity <= 0) {
    removeProductFromCart(productId, size);
    return;
  }
  
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  
  // Finde das spezifische Warenkorb-Item mit der richtigen Größe
  let cartItem;
  if (size) {
    cartItem = cart.find(item => item.id === productId && item.size === size);
  } else {
    // Fallback für alte Struktur ohne Größen
    cartItem = cart.find(item => item.id === productId);
  }
  
  if (!cartItem) {
    console.error('Warenkorb-Item nicht gefunden:', { productId, size, newQuantity });
    return;
  }
  
  // Prüfe Lagerbestand für die spezifische Größe
  let maxStock = product.stock || 10; // Fallback
  if (product.sizes && cartItem.size) {
    const sizeObj = product.sizes.find(s => s.size === cartItem.size);
    if (sizeObj) {
      maxStock = sizeObj.stock;
    }
  }
  
  if (newQuantity > maxStock) {
    showNotification('Maximale Anzahl für diese Größe erreicht', 'error');
    return;
  }
  
  cartItem.quantity = newQuantity;
  saveCart();
  updateCartDisplay();
  
  // Verwende requestAnimationFrame für flüssigere Updates
  requestAnimationFrame(() => {
    updateCartModal();
  });
  
  // Aktualisiere Produktkarten nur wenn nötig
  if (window.innerWidth > 900) {
    requestAnimationFrame(() => {
      displayProducts();
    });
  }
  
  console.log('Warenkorb-Menge aktualisiert:', { productId, size, newQuantity, cartItem });
}

// Produkt komplett aus Warenkorb entfernen
function removeProductFromCart(productId, size = null) {
  if (size) {
    // Entferne spezifische Größe
    cart = cart.filter(item => !(item.id === productId && item.size === size));
    showNotification(`Produkt (Größe ${size}) aus Warenkorb entfernt`, 'info');
  } else {
    // Entferne alle Größen des Produkts (Fallback für alte Struktur)
    cart = cart.filter(item => item.id !== productId);
    showNotification('Produkt aus Warenkorb entfernt', 'info');
  }
  
  saveCart();
  updateCartDisplay();
  
  // Verwende requestAnimationFrame für flüssigere Updates
  requestAnimationFrame(() => {
    updateCartModal();
  });
  
  // Aktualisiere Produktkarten nur wenn nötig
  if (window.innerWidth > 900) {
    requestAnimationFrame(() => {
      displayProducts();
    });
  }
}

// Checkout-Modal erstellen
function createCheckoutModal() {
  const modal = document.createElement('div');
  modal.id = 'checkoutModal';
  modal.className = 'checkout-modal';
  
  // Berechne Gesamtpreis
  let totalPrice = 0;
  cart.forEach(item => {
    const product = allProducts.find(p => p.id === item.id);
    if (product) {
      totalPrice += product.price * item.quantity;
    }
  });
  
  // Versandkosten (kostenlos ab 50€)
  const shippingCost = totalPrice >= 50 ? 0 : 4.99;
  const finalTotal = totalPrice + shippingCost;
  
  modal.innerHTML = `
    <div class="checkout-modal-overlay" id="checkoutModalOverlay"></div>
    <div class="checkout-modal-content">
      <div class="checkout-modal-header">
        <button class="checkout-back-btn" id="checkoutBackBtn">
          <span>&larr;</span> Zurück zum Warenkorb
        </button>
        <h3>Checkout</h3>
        <button class="checkout-modal-close" id="checkoutModalClose">&times;</button>
      </div>
      
      <div class="checkout-modal-body">
        <div class="checkout-steps">
          <!-- Schritt 1: Lieferadresse -->
          <div class="checkout-step active" id="step1">
            <h4>1. Lieferadresse</h4>
            <form id="addressForm" class="checkout-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="firstName">Vorname *</label>
                  <input type="text" id="firstName" name="firstName" required>
                </div>
                <div class="form-group">
                  <label for="lastName">Nachname *</label>
                  <input type="text" id="lastName" name="lastName" required>
                </div>
              </div>
              
              <div class="form-group">
                <label for="email">E-Mail *</label>
                <input type="email" id="email" name="email" required>
              </div>
              
              <div class="form-group">
                <label for="phone">Telefonnummer</label>
                <input type="tel" id="phone" name="phone">
              </div>
              
              <div class="form-group">
                <label for="street">Straße & Hausnummer *</label>
                <input type="text" id="street" name="street" required>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="zipCode">PLZ *</label>
                  <input type="text" id="zipCode" name="zipCode" required>
                </div>
                <div class="form-group">
                  <label for="city">Stadt *</label>
                  <input type="text" id="city" name="city" required>
                </div>
              </div>
              
              <div class="form-group">
                <label for="country">Land *</label>
                <select id="country" name="country" required>
                  <option value="DE">Deutschland</option>
                  <option value="AT">Österreich</option>
                  <option value="CH">Schweiz</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>
                  <input type="checkbox" id="newsletter" name="newsletter">
                  Ich möchte den Newsletter erhalten
                </label>
              </div>
            </form>
          </div>
          
          <!-- Schritt 2: Versand -->
          <div class="checkout-step" id="step2">
            <h4>2. Versand</h4>
            <div class="shipping-options">
              <div class="shipping-option">
                <input type="radio" id="shipping-dhl" name="shipping" value="dhl" checked>
                <label for="shipping-dhl">
                  <div class="shipping-info">
                    <strong>DHL Express</strong>
                    <span>2-3 Werktage</span>
                  </div>
                  <div class="shipping-price">
                    ${shippingCost === 0 ? 'Kostenlos' : shippingCost.toFixed(2) + ' €'}
                  </div>
                </label>
              </div>
              
              <div class="shipping-option">
                <input type="radio" id="shipping-hermes" name="shipping" value="hermes">
                <label for="shipping-hermes">
                  <div class="shipping-info">
                    <strong>Hermes</strong>
                    <span>3-5 Werktage</span>
                  </div>
                  <div class="shipping-price">
                    ${shippingCost === 0 ? 'Kostenlos' : (shippingCost - 1).toFixed(2) + ' €'}
                  </div>
                </label>
              </div>
              
              <div class="shipping-option">
                <input type="radio" id="shipping-pickup" name="shipping" value="pickup">
                <label for="shipping-pickup">
                  <div class="shipping-info">
                    <strong>Abholung im Store</strong>
                    <span>Ab morgen verfügbar</span>
                  </div>
                  <div class="shipping-price">
                    Kostenlos
                  </div>
                </label>
              </div>
            </div>
            
            <div class="shipping-notice">
              <p><strong>Kostenloser Versand ab 50€ Bestellwert!</strong></p>
              <p>Ihr aktueller Bestellwert: ${totalPrice.toFixed(2)}€</p>
              ${totalPrice < 50 ? `<p>Noch ${(50 - totalPrice).toFixed(2)}€ für kostenlosen Versand</p>` : ''}
            </div>
          </div>
          
          <!-- Schritt 3: Zahlung -->
          <div class="checkout-step" id="step3">
            <h4>3. Zahlung</h4>
            <div class="payment-options">
              <div class="payment-option">
                <input type="radio" id="payment-paypal" name="payment" value="paypal" checked>
                <label for="payment-paypal">
                  <div class="payment-info">
                    <strong>PayPal</strong>
                    <span>Schnell und sicher</span>
                  </div>
                  <div class="payment-icon">💳</div>
                </label>
              </div>
              
              <div class="payment-option">
                <input type="radio" id="payment-creditcard" name="payment" value="creditcard">
                <label for="payment-creditcard">
                  <div class="payment-info">
                    <strong>Kreditkarte</strong>
                    <span>Visa, Mastercard, American Express</span>
                  </div>
                  <div class="payment-icon">💳</div>
                </label>
              </div>
              
              <div class="payment-option">
                <input type="radio" id="payment-invoice" name="payment" value="invoice">
                <label for="payment-invoice">
                  <div class="payment-info">
                    <strong>Rechnung</strong>
                    <span>Zahlung nach Erhalt</span>
                  </div>
                  <div class="payment-icon">📄</div>
                </label>
              </div>
              
              <div class="payment-option">
                <input type="radio" id="payment-sepa" name="payment" value="sepa">
                <label for="payment-sepa">
                  <div class="payment-info">
                    <strong>SEPA-Lastschrift</strong>
                    <span>Direkt von Ihrem Konto</span>
                  </div>
                  <div class="payment-icon">🏦</div>
                </label>
              </div>
            </div>
          </div>
          
          <!-- Schritt 4: Zusammenfassung -->
          <div class="checkout-step" id="step4">
            <h4>4. Bestellübersicht</h4>
            <div class="order-summary">
              <div class="order-items">
                ${cart.map(item => {
                  const product = allProducts.find(p => p.id === item.id);
                  if (product) {
                    return `
                      <div class="order-item">
                        <img src="${product.image}" alt="${product.name}">
                        <div class="order-item-info">
                          <h5>${product.name}</h5>
                          ${item.size ? `<span>Größe: ${item.size}</span>` : ''}
                          <span>Menge: ${item.quantity}</span>
                        </div>
                        <div class="order-item-price">
                          ${(product.price * item.quantity).toFixed(2)} €
                        </div>
                      </div>
                    `;
                  }
                  return '';
                }).join('')}
              </div>
              
              <div class="order-totals">
                <div class="order-total-row">
                  <span>Zwischensumme:</span>
                  <span>${totalPrice.toFixed(2)} €</span>
                </div>
                <div class="order-total-row">
                  <span>Versand:</span>
                  <span>${shippingCost === 0 ? 'Kostenlos' : shippingCost.toFixed(2) + ' €'}</span>
                </div>
                <div class="order-total-row total">
                  <span>Gesamt:</span>
                  <span>${finalTotal.toFixed(2)} €</span>
                </div>
              </div>
            </div>
            
            <div class="terms-checkbox">
              <label>
                <input type="checkbox" id="termsAccepted" required>
                Ich akzeptiere die <a href="#" target="_blank">AGB</a> und <a href="#" target="_blank">Datenschutzerklärung</a> *
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div class="checkout-modal-footer">
        <div class="checkout-navigation">
          <button class="checkout-prev-btn" id="checkoutPrevBtn" style="display: none;">Zurück</button>
          <button class="checkout-next-btn" id="checkoutNextBtn">Weiter</button>
          <button class="checkout-submit-btn" id="checkoutSubmitBtn" style="display: none;">Bestellung abschließen</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event Listeners
  document.getElementById('checkoutModalClose').addEventListener('click', closeCheckout);
  document.getElementById('checkoutModalOverlay').addEventListener('click', closeCheckout);
  document.getElementById('checkoutBackBtn').addEventListener('click', handleCheckoutBackButton);
  document.getElementById('checkoutPrevBtn').addEventListener('click', previousCheckoutStep);
  document.getElementById('checkoutNextBtn').addEventListener('click', nextCheckoutStep);
  document.getElementById('checkoutSubmitBtn').addEventListener('click', submitOrder);
  
  // Form-Validierung
  setupCheckoutFormValidation();
}

// Checkout-Schritte verwalten
let currentCheckoutStep = 1;
const totalCheckoutSteps = 4;

// Zurück-Button Handler für Checkout
function handleCheckoutBackButton() {
  if (currentCheckoutStep > 1) {
    // Wenn nicht im ersten Schritt, gehe einen Schritt zurück
    previousCheckoutStep();
  } else {
    // Wenn im ersten Schritt, gehe zurück zum Warenkorb
    closeCheckout();
  }
}

function nextCheckoutStep() {
  if (validateCurrentStep()) {
    if (currentCheckoutStep < totalCheckoutSteps) {
      currentCheckoutStep++;
      updateCheckoutStep();
    }
  }
}

function previousCheckoutStep() {
  if (currentCheckoutStep > 1) {
    currentCheckoutStep--;
    updateCheckoutStep();
  }
}

function updateCheckoutStep() {
  // Alle Schritte ausblenden
  for (let i = 1; i <= totalCheckoutSteps; i++) {
    const step = document.getElementById(`step${i}`);
    if (step) {
      step.classList.remove('active');
    }
  }
  
  // Aktuellen Schritt anzeigen
  const currentStep = document.getElementById(`step${currentCheckoutStep}`);
  if (currentStep) {
    currentStep.classList.add('active');
  }
  
  // Navigation-Buttons anpassen
  const prevBtn = document.getElementById('checkoutPrevBtn');
  const nextBtn = document.getElementById('checkoutNextBtn');
  const submitBtn = document.getElementById('checkoutSubmitBtn');
  const backBtn = document.getElementById('checkoutBackBtn');
  
  if (prevBtn) prevBtn.style.display = currentCheckoutStep > 1 ? 'block' : 'none';
  if (nextBtn) nextBtn.style.display = currentCheckoutStep < totalCheckoutSteps ? 'block' : 'none';
  if (submitBtn) submitBtn.style.display = currentCheckoutStep === totalCheckoutSteps ? 'block' : 'none';
  
  // Button-Text anpassen
  if (nextBtn) {
    nextBtn.textContent = currentCheckoutStep === totalCheckoutSteps - 1 ? 'Zur Übersicht' : 'Weiter';
  }
  
  // Zurück-Button Text anpassen
  if (backBtn) {
    if (currentCheckoutStep === 1) {
      backBtn.innerHTML = '<span>&larr;</span> Zurück zum Warenkorb';
    } else {
      const stepNames = ['', 'Lieferadresse', 'Versand', 'Zahlung', 'Übersicht'];
      backBtn.innerHTML = `<span>&larr;</span> Zurück zu ${stepNames[currentCheckoutStep - 1]}`;
    }
  }
}

function validateCurrentStep() {
  switch (currentCheckoutStep) {
    case 1:
      return validateAddressForm();
    case 2:
      return validateShippingSelection();
    case 3:
      return validatePaymentSelection();
    case 4:
      return validateTermsAcceptance();
    default:
      return true;
  }
}

function validateAddressForm() {
  const requiredFields = ['firstName', 'lastName', 'email', 'street', 'zipCode', 'city', 'country'];
  let isValid = true;
  
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field && !field.value.trim()) {
      field.classList.add('error');
      isValid = false;
    } else if (field) {
      field.classList.remove('error');
    }
  });
  
  // E-Mail-Validierung
  const emailField = document.getElementById('email');
  if (emailField && emailField.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailField.value)) {
      emailField.classList.add('error');
      isValid = false;
    }
  }
  
  if (!isValid) {
    showNotification('Bitte füllen Sie alle Pflichtfelder korrekt aus', 'error');
  }
  
  return isValid;
}

function validateShippingSelection() {
  const selectedShipping = document.querySelector('input[name="shipping"]:checked');
  if (!selectedShipping) {
    showNotification('Bitte wählen Sie eine Versandart aus', 'error');
    return false;
  }
  return true;
}

function validatePaymentSelection() {
  const selectedPayment = document.querySelector('input[name="payment"]:checked');
  if (!selectedPayment) {
    showNotification('Bitte wählen Sie eine Zahlungsart aus', 'error');
    return false;
  }
  return true;
}

function validateTermsAcceptance() {
  const termsAccepted = document.getElementById('termsAccepted');
  if (!termsAccepted || !termsAccepted.checked) {
    showNotification('Bitte akzeptieren Sie die AGB und Datenschutzerklärung', 'error');
    return false;
  }
  return true;
}

function setupCheckoutFormValidation() {
  // Real-time Validierung für E-Mail
  const emailField = document.getElementById('email');
  if (emailField) {
    emailField.addEventListener('blur', function() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (this.value && !emailRegex.test(this.value)) {
        this.classList.add('error');
      } else {
        this.classList.remove('error');
      }
    });
  }
  
  // Real-time Validierung für PLZ
  const zipField = document.getElementById('zipCode');
  if (zipField) {
    zipField.addEventListener('blur', function() {
      const zipRegex = /^\d{5}$/;
      if (this.value && !zipRegex.test(this.value)) {
        this.classList.add('error');
      } else {
        this.classList.remove('error');
      }
    });
  }
}

function submitOrder() {
  if (validateCurrentStep()) {
    // Hier würde normalerweise die Bestellung an den Server gesendet werden
    showNotification('Bestellung erfolgreich aufgegeben! Vielen Dank für Ihren Einkauf.', 'success');
    
    // Warenkorb leeren
    cart = [];
    saveCart();
    updateCartDisplay();
    
    // Checkout-Modal schließen
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
      checkoutModal.remove();
    }
    
    // Warenkorb-Modal komplett entfernen
    removeCartModal();
    
    // Body-Scroll wiederherstellen
    document.body.style.overflow = '';
    
    // Checkout-Schritt zurücksetzen
    currentCheckoutStep = 1;
  }
}

function closeCheckout() {
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    // Swipe-out Animation
    modal.classList.add('swiping-out');
    
    setTimeout(() => {
      modal.remove();
      currentCheckoutStep = 1;
      
      // Warenkorb wieder öffnen mit Swipe-in Animation
      setTimeout(() => {
        // Warenkorb-Modal wiederherstellen (nicht neu erstellen)
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
          // Alle Animation-Klassen entfernen
          cartModal.classList.remove('swiping-out', 'swiping-in');
          
          // Warenkorb-Inhalt vor dem Anzeigen aktualisieren (ohne Flackern)
          updateCartModalSilently();
          
          cartModal.classList.add('active');
          cartModal.classList.add('swiping-in');
          document.body.style.overflow = 'hidden';
          
          setTimeout(() => {
            cartModal.classList.remove('swiping-in');
          }, 600);
        } else {
          // Fallback: Warenkorb neu erstellen falls er nicht existiert
          openCart();
          const newCartModal = document.getElementById('cartModal');
          if (newCartModal) {
            newCartModal.classList.add('swiping-in');
            setTimeout(() => {
              newCartModal.classList.remove('swiping-in');
            }, 600);
          }
        }
      }, 100);
    }, 300);
  }
}

// Weiter einkaufen - Modal schließen und zum Shop scrollen
function continueShopping() {
  // Hamburger-Menü schließen (falls offen)
  const mobileNav = document.getElementById('mobileNav');
  const burgerMenu = document.getElementById('burgerMenu');
  if (mobileNav && mobileNav.classList.contains('active')) {
    mobileNav.classList.remove('active');
  }
  if (burgerMenu && burgerMenu.classList.contains('active')) {
    burgerMenu.classList.remove('active');
  }
  
  // Body-Scroll wiederherstellen
  document.body.style.overflow = '';
  
  // Warenkorb-Modal komplett entfernen
  removeCartModal();
  
  // Längere Verzögerung für Mobile, damit alle Modals geschlossen sind
  const delay = window.innerWidth <= 900 ? 500 : 300;
  
  setTimeout(() => {
    const shopSection = document.getElementById('shop');
    if (shopSection && scroll) {
      // Scroll zum Shop mit Offset (Desktop: -10px, Mobile: -20px)
      const offset = window.innerWidth > 900 ? -10 : -20;
      scroll.scrollTo(shopSection, { 
        offset: offset, 
        duration: 1000, 
        disableLerp: false 
      });
    } else if (shopSection) {
      // Fallback ohne Locomotive Scroll
      const offset = window.innerWidth > 900 ? -10 : -20;
      const offsetTop = shopSection.offsetTop + offset;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  }, delay);
}

// Zur Kasse
function checkout() {
  if (cart.length === 0) {
    showNotification('Ihr Warenkorb ist leer', 'error');
    return;
  }
  
  // Swipe-Animation starten
  const cartModal = document.getElementById('cartModal');
  if (cartModal) {
    // Alle Animation-Klassen entfernen
    cartModal.classList.remove('swiping-in');
    cartModal.classList.add('swiping-out');
  }
  
  // Nach der Swipe-Animation das Checkout-Modal öffnen
  setTimeout(() => {
    // Warenkorb-Modal nur verstecken (nicht schließen)
    if (cartModal) {
      cartModal.classList.remove('active');
      // Animation-Klasse entfernen
      cartModal.classList.remove('swiping-out');
    }
    
    // Checkout-Modal erstellen und öffnen
    createCheckoutModal();
    const checkoutModal = document.getElementById('checkoutModal');
    checkoutModal.classList.add('active', 'swiping-in');
    document.body.style.overflow = 'hidden';
    
    // Swipe-in Animation-Klasse nach der Animation entfernen
    setTimeout(() => {
      checkoutModal.classList.remove('swiping-in');
    }, 600);
  }, 300);
}

// Event Listeners für Warenkorb-Buttons
function setupCartButtons() {
  [cartBtn, mobileCartBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        openCart(event);
      });
    }
  });
  
  // Mobile Cart Action Button
  const mobileCartActionBtn = document.getElementById('mobileCartActionBtn');
  if (mobileCartActionBtn) {
    mobileCartActionBtn.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      openCart(event);
    });
  }
  
  // Desktop Cart Action Button
  const desktopCartActionBtn = document.getElementById('desktopCartActionBtn');
  if (desktopCartActionBtn) {
    desktopCartActionBtn.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      openCart(event);
    });
  }
}

// Mobile Back to Top Button Setup
function setupMobileBackToTopButton() {
  const mobileBackToTopBtn = document.getElementById('mobileBackToTopBtn');
  
  if (mobileBackToTopBtn) {
    mobileBackToTopBtn.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      console.log('Mobile Back to Top Button clicked!');
      
      // Smooth Scroll nach oben
      if (typeof scroll !== 'undefined' && scroll.scrollTo) {
        scroll.scrollTo(0, { duration: 800, disableLerp: false });
      } else {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  }
}

// Desktop Back to Top Button Setup
function setupDesktopBackToTopButton() {
  const desktopBackToTopBtn = document.getElementById('desktopBackToTopBtn');
  
  if (desktopBackToTopBtn) {
    desktopBackToTopBtn.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      console.log('Desktop Back to Top Button clicked!');
      
      // Smooth Scroll nach oben
      if (typeof scroll !== 'undefined' && scroll.scrollTo) {
        scroll.scrollTo(0, { duration: 800, disableLerp: false });
      } else {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
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
  if (window.mobileNavInitialized) return;
  window.mobileNavInitialized = true;
  const burgerMenu = document.getElementById('burgerMenu');
  const mobileNav = document.getElementById('mobileNav');
  const closeMobileNav = document.getElementById('closeMobileNav');
  
  if (burgerMenu && mobileNav && closeMobileNav) {
    // Burger-Button als Toggle: öffnet und schließt das Menü
    burgerMenu.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      if (mobileNav.classList.contains('active')) {
        // Menü ist offen -> schließen
        mobileNav.classList.remove('active');
        burgerMenu.classList.remove('active');
        document.body.style.overflow = '';
      } else {
        // Menü ist geschlossen -> öffnen
        mobileNav.classList.add('active');
        burgerMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
          const firstLink = mobileNav.querySelector('a');
          if (firstLink) firstLink.focus();
        }, 200);
      }
    });
    
    // Separate Close-Button funktioniert weiterhin
    closeMobileNav.addEventListener('click', () => {
      if (mobileNav.classList.contains('active')) {
        mobileNav.classList.remove('active');
        burgerMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
    
    // Schließen bei Klick auf Links und spezielle Shop-Navigation
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Spezielle Behandlung für Shop-Link auf Mobile
        if (href === '#shop' && window.innerWidth <= 900) {
          e.preventDefault();
          const shopSection = document.querySelector('#shop');
          const navbar = document.querySelector('.navbar');
          const navbarHeight = navbar ? navbar.offsetHeight : 0;
          if (shopSection && scroll) {
            // Scroll zum Shop mit festem negativen Offset von -20px
            scroll.scrollTo(shopSection, { 
              offset: -20, 
              duration: 1000, 
              disableLerp: false 
            });
          } else if (shopSection) {
            // Fallback ohne Locomotive Scroll
            const offsetTop = shopSection.offsetTop - 20;
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
    
    // Bildqualität optimieren
    modalImg.onload = function() {
      // Hochauflösende Version laden falls verfügbar
      const highResSrc = imageSrc.replace('?w=400', '?w=1200');
      if (highResSrc !== imageSrc) {
        const highResImg = new Image();
        highResImg.onload = function() {
          modalImg.src = highResSrc;
        };
        highResImg.src = highResSrc;
      }
    };
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
    
    // Scrollen auf der Hauptseite deaktivieren
    document.body.style.overflow = 'hidden';
    
    // Locomotive Scroll pausieren falls vorhanden
    if (scroll && scroll.stop) {
      scroll.stop();
    }
    
    // Focus auf Close-Button setzen
    setTimeout(() => {
      const closeBtn = document.getElementById('productImageModalClose');
      if (closeBtn) closeBtn.focus();
    }, 100);
  }
}

// Produktbild Modal mit mehreren Bildern öffnen
function openProductImageModalWithImages(images, productName, productDescription) {
  const modal = document.getElementById('productImageModal');
  const modalImg = document.getElementById('productImageModalImg');
  const modalTitle = document.getElementById('productImageTitle');
  const modalDescription = document.getElementById('productImageDescription');
  const thumbnailsContainer = document.getElementById('productImageThumbnails');
  const prevBtn = document.getElementById('productImagePrev');
  const nextBtn = document.getElementById('productImageNext');
  
  if (modal && modalImg && modalTitle && modalDescription) {
    // Zoom zurücksetzen
    if (window.resetImageZoom) {
      window.resetImageZoom();
    }
    
    // Aktuelle Produktdaten setzen
    currentProductImages = images;
    currentImageIndex = 0;
    
    // Modal-Inhalt setzen
    modalImg.src = images[0];
    modalImg.alt = productName;
    
    // Bildqualität optimieren
    modalImg.onload = function() {
      // Hochauflösende Version laden falls verfügbar
      const highResSrc = images[0].replace('?w=400', '?w=1200');
      if (highResSrc !== images[0]) {
        const highResImg = new Image();
        highResImg.onload = function() {
          modalImg.src = highResSrc;
        };
        highResImg.src = highResSrc;
      }
    };
    modalTitle.textContent = productName;
    modalDescription.textContent = productDescription;
    
    // Thumbnails erstellen
    thumbnailsContainer.innerHTML = '';
    images.forEach((image, index) => {
      const thumbnail = document.createElement('div');
      thumbnail.className = `product-image-thumbnail ${index === 0 ? 'active' : ''}`;
      thumbnail.onclick = () => showImage(index);
      thumbnail.innerHTML = `<img src="${image}" alt="${productName}">`;
      thumbnailsContainer.appendChild(thumbnail);
    });
    
    // Navigation-Buttons anzeigen/verstecken
    if (prevBtn) prevBtn.style.display = images.length > 1 ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = images.length > 1 ? 'flex' : 'none';
    
    // Modal öffnen
    modal.classList.add('active');
    
    // Scrollen auf der Hauptseite deaktivieren
    document.body.style.overflow = 'hidden';
    
    // Locomotive Scroll pausieren falls vorhanden
    if (scroll && scroll.stop) {
      scroll.stop();
    }
    
    // Focus auf Close-Button setzen
    setTimeout(() => {
      const closeBtn = document.getElementById('productImageModalClose');
      if (closeBtn) closeBtn.focus();
    }, 100);
  }
}

// Produktdetail Modal von Produkt-ID öffnen
function openProductImageModalFromProduct(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  
  // Produktdaten für das Modal anpassen
  const modalProduct = {
    ...product,
    img: product.image, // image zu img konvertieren
    subcat: product.subcategory // subcategory zu subcat konvertieren
  };
  
  // Öffne das neue Produktdetail Modal
  openProductDetailModal(modalProduct);
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
    
    // Scrollen auf der Hauptseite wieder aktivieren
    document.body.style.overflow = '';
    
    // Locomotive Scroll wieder starten falls vorhanden
    if (scroll && scroll.start) {
      scroll.start();
    }
  }
}

// Bestimmtes Bild anzeigen (für zukünftige Bildergalerie)
function showImage(index) {
  if (index >= 0 && index < currentProductImages.length) {
    currentImageIndex = index;
    const modalImg = document.getElementById('productImageModalImg');
    const thumbnails = document.querySelectorAll('.product-image-thumbnail');
    const prevBtn = document.getElementById('productImagePrev');
    const nextBtn = document.getElementById('productImageNext');
    
    if (modalImg) {
      modalImg.src = currentProductImages[index];
      
      // Bildqualität optimieren
      modalImg.onload = function() {
        // Hochauflösende Version laden falls verfügbar
        const highResSrc = currentProductImages[index].replace('?w=400', '?w=1200');
        if (highResSrc !== currentProductImages[index]) {
          const highResImg = new Image();
          highResImg.onload = function() {
            modalImg.src = highResSrc;
          };
          highResImg.src = highResSrc;
        }
      };
    }
    
    // Thumbnail-Aktivität aktualisieren
    thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });
    
    // Navigation-Buttons Status aktualisieren
    if (prevBtn) {
      prevBtn.style.display = index > 0 ? 'flex' : 'none';
    }
    if (nextBtn) {
      nextBtn.style.display = index < currentProductImages.length - 1 ? 'flex' : 'none';
    }
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

// Produktdetail Modal Setup
function setupProductDetailModal() {
  const modal = document.getElementById('productDetailModal');
  const overlay = document.getElementById('productDetailModalOverlay');
  const closeBtn = document.getElementById('productDetailModalClose');
  const addToCartBtn = document.getElementById('productDetailAddToCartBtn');
  const buyNowBtn = document.getElementById('productDetailBuyNowBtn');
  const quantityMinusBtn = document.getElementById('productDetailQuantityMinus');
  const quantityPlusBtn = document.getElementById('productDetailQuantityPlus');
  
  if (modal && overlay && closeBtn) {
    // Modal schließen bei Klick auf Overlay
    overlay.addEventListener('click', closeProductDetailModal);
    
    // Modal schließen bei Klick auf Close-Button
    closeBtn.addEventListener('click', closeProductDetailModal);
    
    // In den Warenkorb Button
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', addProductToCartFromModal);
    }
    
    // Jetzt kaufen Button
    if (buyNowBtn) {
      buyNowBtn.addEventListener('click', buyProductNowFromModal);
    }
    
    // Menge Buttons
    if (quantityMinusBtn) {
      quantityMinusBtn.addEventListener('click', decreaseQuantity);
    }
    
    if (quantityPlusBtn) {
      quantityPlusBtn.addEventListener('click', increaseQuantity);
    }
    
    // ESC-Taste schließt Modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeProductDetailModal();
      }
    });
  }
}

// Produktdetail Modal öffnen
function openProductDetailModal(product) {
  console.log('Öffne Produktdetail Modal für:', product);
  console.log('Bild-URL:', product.img);
  
  // Prüfe ob das Produkt gültig ist
  if (!product || (!product.img && !product.image)) {
    console.error('Ungültiges Produkt oder fehlende Bild-URL:', product);
    return;
  }
  
  // Verwende img oder image als Fallback
  const imageUrl = product.img || product.image;
  const modal = document.getElementById('productDetailModal');
  const modalImg = document.getElementById('productDetailImage');
  const modalTitle = document.getElementById('productDetailTitle');
  const modalCategory = document.getElementById('productDetailCategory');
  const modalPrice = document.getElementById('productDetailPrice');
  const modalDescription = document.getElementById('productDetailDescription');
  const modalAvailability = document.getElementById('productDetailAvailability');
  const sizeOptions = document.getElementById('sizeOptions');
  const quantityDisplay = document.getElementById('productDetailQuantity');
  
  if (modal && modalImg && modalTitle) {
    // Aktuelle Produktdaten setzen
    currentProduct = product;
    currentProductImages = [imageUrl]; // Für zukünftige Erweiterung mit mehreren Bildern
    currentImageIndex = 0;
    selectedSize = null;
    selectedQuantity = 1;
    
    // Modal-Inhalt setzen
    modalImg.alt = product.name;
    modalTitle.textContent = product.name;
    
    // Bild laden mit Lazy Loading und Preloading
    modalImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'%3E%3Crect width='600' height='800' fill='%23f3f4f6'/%3E%3C/svg%3E";
    modalImg.classList.add('lazy-image');
    
    const img = new Image();
    img.onload = function() {
      modalImg.src = imageUrl;
      modalImg.classList.remove('lazy-image');
      modalImg.classList.add('loaded');
      console.log('Bild erfolgreich geladen:', imageUrl);
      
      // Hochauflösende Version laden falls verfügbar
      const highResSrc = imageUrl.replace('?w=400', '?w=1200');
      if (highResSrc !== imageUrl) {
        const highResImg = new Image();
        highResImg.onload = function() {
          modalImg.src = highResSrc;
          console.log('Hochauflösende Version geladen:', highResSrc);
        };
        highResImg.onerror = function() {
          console.log('Hochauflösende Version konnte nicht geladen werden, verwende Standard-Auflösung');
        };
        highResImg.src = highResSrc;
      }
      
      // Lightbox-Funktionalität direkt nach dem Laden des Bildes einrichten
      setupProductDetailImageZoom();
      
      // --- NEU: Mausrad-Bildwechsel auf Desktop ---
      if (window.innerWidth > 900 && window.currentProductImages && window.currentProductImages.length > 1) {
        // Vorherige Listener entfernen, um Duplikate zu vermeiden
        const imageContainer = document.querySelector('.product-detail-image-container');
        if (imageContainer) {
          imageContainer.removeEventListener('wheel', window._modalImgWheelHandler);
          if (!window._modalImgWheelHandler) {
            window._modalImgWheelHandler = function(e) {
              e.preventDefault();
              if (e.deltaY > 0) {
                // Nächstes Bild
                showProductDetailImage((window.currentImageIndex + 1) % window.currentProductImages.length);
              } else if (e.deltaY < 0) {
                // Vorheriges Bild
                showProductDetailImage((window.currentImageIndex - 1 + window.currentProductImages.length) % window.currentProductImages.length);
              }
            };
          }
          imageContainer.addEventListener('wheel', window._modalImgWheelHandler, { passive: false });
        }
      }
      // --- ENDE NEU ---
      
      // Mobile: Einfache Bildvergrößerung direkt im Modal
      if (window.innerWidth <= 768) {
        modalImg.style.cursor = 'pointer';
        let isExpanded = false;
        
        modalImg.addEventListener('click', function() {
          if (!isExpanded) {
            // Bild vergrößern
            modalImg.style.position = 'fixed';
            modalImg.style.top = '0';
            modalImg.style.left = '0';
            modalImg.style.width = '100vw';
            modalImg.style.height = '100vh';
            modalImg.style.zIndex = '99999';
            modalImg.style.objectFit = 'contain';
            modalImg.style.backgroundColor = 'rgba(0,0,0,0.95)';
            modalImg.style.cursor = 'pointer';
            modalImg.classList.add('mobile-zoomed');
            isExpanded = true;
            
            // Modal-Pfeile ausblenden und Vollbild-Pfeile anzeigen
            removeModalNavigationArrows();
            addMobileFullscreenNavigation();
            
            // Vollbild-Swipe-Navigation aktivieren
            setupMobileFullscreenSwipe(modalImg);
            
            // Vollbild-Zoom-Funktionalität aktivieren
            // setupFullscreenZoom(modalImg); // Diese Zeile entfernen
            
            // Aktuelles Bild in hochauflösender Qualität im Vollbildmodus laden
            loadHighResImageInFullscreen(modalImg);
          } else {
            // Bild zurücksetzen
            modalImg.style.position = '';
            modalImg.style.top = '';
            modalImg.style.left = '';
            modalImg.style.width = '';
            modalImg.style.height = '';
            modalImg.style.zIndex = '';
            modalImg.style.objectFit = '';
            modalImg.style.backgroundColor = '';
            modalImg.style.cursor = '';
            modalImg.style.transform = '';
            modalImg.style.maxWidth = '';
            modalImg.style.maxHeight = '';
            modalImg.style.margin = '';
            modalImg.style.padding = '';
            modalImg.classList.remove('mobile-zoomed');
            isExpanded = false;
            
            // Vollbild-Pfeile ausblenden und Modal-Pfeile wieder anzeigen
            removeMobileFullscreenNavigation();
            removeMobileFullscreenSwipe(modalImg);
            removeFullscreenZoom(modalImg);
            
            // Zusätzlich: Alle Vollbild-Pfeile im DOM entfernen falls noch vorhanden
            document.querySelectorAll('.mobile-fullscreen-nav').forEach(arrow => {
              arrow.remove();
            });
            
            if (window.currentProductImages && window.currentProductImages.length > 1) {
              addModalNavigationArrows();
            }
          }
        });
      }
    };
    img.onerror = function() {
      console.log('Bild konnte nicht geladen werden:', imageUrl);
      // Versuche alternative Bild-URLs
      const alternativeUrls = [
        imageUrl.replace('?w=400', ''),
        imageUrl.replace('?w=400', '?w=800'),
        'https://via.placeholder.com/600x800?text=Kein+Bild+verfügbar'
      ];
      
      let currentIndex = 0;
      const tryNextImage = () => {
        if (currentIndex < alternativeUrls.length) {
          const testImg = new Image();
          testImg.onload = function() {
            modalImg.src = alternativeUrls[currentIndex];
            console.log('Alternative Bild-URL erfolgreich:', alternativeUrls[currentIndex]);
          };
          testImg.onerror = function() {
            currentIndex++;
            tryNextImage();
          };
          testImg.src = alternativeUrls[currentIndex];
        } else {
          modalImg.src = 'https://via.placeholder.com/600x800?text=Kein+Bild+verfügbar';
        }
      };
      tryNextImage();
    };
    img.src = imageUrl;
    
    // Zusätzlicher Fallback für das Modal-Bild
    modalImg.onerror = function() {
      console.log('Modal-Bild konnte nicht geladen werden');
      modalImg.src = 'https://via.placeholder.com/600x800?text=Kein+Bild+verfügbar';
    };
    
    // Debug-Informationen
    console.log('Modal-Elemente gefunden:', {
      modal: !!modal,
      modalImg: !!modalImg,
      modalTitle: !!modalTitle
    });
    
    // Bewertungen zum Modal hinzufügen
    setTimeout(() => {
      addReviewsToProductModal(product.id);
    }, 100);
    
    // Kategorie anzeigen
    if (modalCategory) {
      modalCategory.textContent = product.subcat || 'Fashion';
    }
    
    // Preis anzeigen
    if (modalPrice) {
      modalPrice.textContent = `${product.price.toFixed(2)} €`;
    }
    
    // Beschreibung anzeigen
    if (modalDescription) {
      modalDescription.textContent = product.description || 'Ein hochwertiges Produkt aus unserer exklusiven Kollektion. Perfekt für jeden Anlass und stilvoll gestaltet für maximalen Komfort und Eleganz.';
    }
    
    // Verfügbarkeit anzeigen
    if (modalAvailability) {
      let totalStock = 0;
      let availableSizes = 0;
      
      if (product.sizes) {
        totalStock = product.sizes.reduce((sum, sizeObj) => sum + sizeObj.stock, 0);
        availableSizes = product.sizes.filter(sizeObj => sizeObj.stock > 0).length;
      } else {
        totalStock = product.stock || 10;
        availableSizes = totalStock > 0 ? 1 : 0;
      }
      
      if (totalStock > 5) {
        modalAvailability.className = 'product-detail-availability in-stock';
        modalAvailability.innerHTML = `
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <span>Verfügbar (${totalStock} Stück in ${availableSizes} Größen)</span>
        `;
      } else if (totalStock > 0) {
        modalAvailability.className = 'product-detail-availability low-stock';
        modalAvailability.innerHTML = `
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>Nur noch ${totalStock} Stück verfügbar</span>
        `;
      } else {
        modalAvailability.className = 'product-detail-availability out-of-stock';
        modalAvailability.innerHTML = `
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
          </svg>
          <span>Ausverkauft</span>
        `;
      }
    }
    
    // Größenauswahl erstellen
    if (sizeOptions) {
      let sizesHTML = '';
      
      if (product.sizes) {
        // Neue Struktur mit individuellem Lagerbestand
        sizesHTML = product.sizes.map(sizeObj => {
          // Wenn sizeObj.stock nicht gesetzt ist, als 0 behandeln
          const stockValue = (typeof sizeObj.stock === 'number' && !isNaN(sizeObj.stock)) ? sizeObj.stock : 0;
          const isAvailable = stockValue > 0;
          const stockText = isAvailable ? `(${stockValue})` : '(ausverkauft)';
          // Warenkorb-Menge für diese Größe ermitteln
          const cartItem = cart.find(item => item.id === product.id && item.size === sizeObj.size);
          const cartQuantity = cartItem ? cartItem.quantity : 0;
          return `
            <div class="size-option-container">
              <button class="size-option ${!isAvailable ? 'disabled' : ''}" 
                      data-size="${sizeObj.size}" 
                      onclick="${isAvailable ? `selectSize('${sizeObj.size}')` : ''}"
                      ${!isAvailable ? 'disabled' : ''}>
                <span class="size-label">${sizeObj.size}</span>
                <span class="stock-info">${stockText}</span>
              </button>
              ${cartQuantity > 0 ? `
                <div class="cart-quantity-badge">
                  <span class="cart-quantity-number">${cartQuantity}</span>
                  <span class="cart-quantity-text">im Warenkorb</span>
                </div>
              ` : ''}
            </div>
          `;
        }).join('');
      } else {
        // Fallback für alte Struktur
        const sizes = getSizesForCategory(product.subcat);
        sizesHTML = sizes.map(size => {
          // Warenkorb-Menge für diese Größe ermitteln
          const cartItem = cart.find(item => item.id === product.id && item.size === size);
          const cartQuantity = cartItem ? cartItem.quantity : 0;
          
          return `
            <div class="size-option-container">
              <button class="size-option" data-size="${size}" onclick="selectSize('${size}')">
                <span class="size-label">${size}</span>
              </button>
              ${cartQuantity > 0 ? `
                <div class="cart-quantity-badge">
                  <span class="cart-quantity-number">${cartQuantity}</span>
                  <span class="cart-quantity-text">im Warenkorb</span>
                </div>
              ` : ''}
            </div>
          `;
        }).join('');
      }
      
      sizeOptions.innerHTML = sizesHTML;
    }
    
    // Menge initialisieren (nicht mit Warenkorb synchronisieren)
    if (quantityDisplay) {
      // Starte immer mit 1, außer wenn eine Größe bereits ausgewählt ist
      if (!selectedSize) {
        selectedQuantity = 1;
        quantityDisplay.textContent = '1';
        console.log('Modal geöffnet - starte mit Menge 1');
      }
      // Wenn eine Größe ausgewählt ist, wird die Menge in selectSize() gesetzt
    }
    
    // Sammle alle verfügbaren Bilder
    const allImages = [imageUrl]; // Hauptbild
    if (product.image2) allImages.push(product.image2);
    if (product.image3) allImages.push(product.image3);
    if (product.image4) allImages.push(product.image4);
    if (product.image5) allImages.push(product.image5);
    if (product.image6) allImages.push(product.image6);
    
    // Aktuelle Bilder für das Modal setzen
    currentProductImages = allImages;
    window.currentProductImages = allImages; // Auch global setzen für Navigation
    currentImageIndex = 0;
    window.currentImageIndex = 0; // Auch global setzen für Navigation
    
    // Thumbnails erstellen
    const thumbnailsContainer = document.getElementById('productDetailThumbnails');
    if (thumbnailsContainer) {
      thumbnailsContainer.innerHTML = allImages.map((img, index) => `
        <div class="product-detail-thumbnail ${index === 0 ? 'active' : ''}" onclick="showProductDetailImage(${index})">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3C/svg%3E" 
               data-src="${img}" 
               alt="${product.name}" 
               class="lazy-thumbnail"
               loading="lazy"
               onerror="this.src='https://via.placeholder.com/100x100?text=Kein+Bild'">
        </div>
      `).join('');
      
      // Lazy Loading für Thumbnails einrichten
      setupThumbnailLazyLoading();
    }
    
    // Modal öffnen
    modal.classList.add('active');
    
    // Scrollen auf der Hauptseite deaktivieren
    document.body.style.overflow = 'hidden';
    
    // Locomotive Scroll pausieren falls vorhanden
    if (scroll && scroll.stop) {
      scroll.stop();
    }
    
    // Smooth Scrolling für Desktop Modal Info-Sektion einrichten
    if (window.innerWidth > 900) {
      setupModalSmoothScrolling();
    }
    
    // Swipe-Navigation und Pfeil-Navigation für das Modal einrichten (alle Geräte)
    console.log('Modal öffnen: Anzahl Bilder:', allImages.length);
    if (allImages.length > 1) {
      console.log('Modal öffnen: Richte Navigation ein');
      if (window.innerWidth > 900) {
        setupModalSwipeNavigation();
      }
      addModalNavigationArrows();
    } else {
      console.log('Modal öffnen: Keine Navigation nötig - nur ein Bild');
    }
    
    // Focus auf Close-Button setzen
    setTimeout(() => {
      const closeBtn = document.getElementById('productDetailModalClose');
      if (closeBtn) closeBtn.focus();
    }, 100);

    // Zoom-Hinweis sofort anzeigen
    const zoomIndicator = document.getElementById('productDetailZoomIndicator');
    if (zoomIndicator) {
      zoomIndicator.classList.add('show');
      zoomIndicator.textContent = 'Klick zum Zoomen';
      zoomIndicator.classList.remove('zoomed');
    }
  }
}

// Produktdetail Bild anzeigen
function showProductDetailImage(index) {
  if (!currentProductImages || !currentProductImages[index]) return;
  
  const modalImg = document.getElementById('productDetailImage');
  if (modalImg) {
    // Nur bei mehreren Bildern die Bildwechsel-Logik anwenden
    if (currentProductImages.length > 1) {
      // Zoom-State zurücksetzen
      if (window.productDetailZoomState) {
        window.productDetailZoomState.isZoomed = false;
        window.productDetailZoomState.scale = 1;
        window.productDetailZoomState.translateX = 0;
        window.productDetailZoomState.translateY = 0;
      }
      
      // Zoom-Indikator zurücksetzen
      const zoomIndicator = document.getElementById('productDetailZoomIndicator');
      if (zoomIndicator) {
        zoomIndicator.classList.add('show');
        zoomIndicator.textContent = 'Klick zum Zoomen';
        zoomIndicator.classList.remove('zoomed');
      }
      
      // WICHTIG: Bild-Element komplett neu erstellen um alle "Beschädigungen" zu entfernen
      const container = modalImg.parentNode;
      
      // Altes Bild komplett entfernen
      container.removeChild(modalImg);
      
      // Neues Bild-Element erstellen
      const newImg = document.createElement('img');
      newImg.id = 'productDetailImage';
      newImg.className = 'product-detail-image';
      newImg.alt = currentProduct?.name || 'Produktbild';
      
      // Neues Bild zum Container hinzufügen
      container.appendChild(newImg);
      
      // WICHTIG: Gleiche Logik wie beim ersten Laden verwenden
      const imageUrl = currentProductImages[index];
      
      // Bild laden mit Lazy Loading und Preloading (wie beim ersten Laden)
      newImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'%3E%3Crect width='600' height='800' fill='%23f3f4f6'/%3E%3C/svg%3E";
      newImg.classList.add('lazy-image');
      
      const img = new Image();
      img.onload = function() {
        newImg.src = imageUrl;
        newImg.classList.remove('lazy-image');
        newImg.classList.add('loaded');
        console.log('Bild erfolgreich geladen:', imageUrl);
        
        // Hochauflösende Version laden falls verfügbar (wie beim ersten Laden)
        const highResSrc = imageUrl.replace('?w=400', '?w=1200');
        if (highResSrc !== imageUrl) {
          const highResImg = new Image();
          highResImg.onload = function() {
            newImg.src = highResSrc;
            console.log('Hochauflösende Version geladen:', highResSrc);
          };
          highResImg.onerror = function() {
            console.log('Hochauflösende Version konnte nicht geladen werden, verwende Standard-Auflösung');
          };
          highResImg.src = highResSrc;
        }
      };
      img.onerror = function() {
        console.log('Bild konnte nicht geladen werden:', imageUrl);
        newImg.src = 'https://via.placeholder.com/600x800?text=Kein+Bild+verfügbar';
      };
      img.src = imageUrl;
      
      // Zusätzlicher Fallback für das Modal-Bild
      newImg.onerror = function() {
        console.log('Modal-Bild konnte nicht geladen werden');
        newImg.src = 'https://via.placeholder.com/600x800?text=Kein+Bild+verfügbar';
      };
      
      // Zoom-Funktionalität für das neue Bild-Element neu einrichten
      setupProductDetailImageZoom();
      
      // --- NEU: Mausrad-Bildwechsel auch nach Bildwechsel auf Desktop ---
      if (window.innerWidth > 900 && window.currentProductImages && window.currentProductImages.length > 1) {
        // Vorherige Listener entfernen, um Duplikate zu vermeiden
        const imageContainer = document.querySelector('.product-detail-image-container');
        if (imageContainer) {
          imageContainer.removeEventListener('wheel', window._modalImgWheelHandler);
          if (!window._modalImgWheelHandler) {
            window._modalImgWheelHandler = function(e) {
              e.preventDefault();
              if (e.deltaY > 0) {
                // Nächstes Bild
                showProductDetailImage((window.currentImageIndex + 1) % window.currentProductImages.length);
              } else if (e.deltaY < 0) {
                // Vorheriges Bild
                showProductDetailImage((window.currentImageIndex - 1 + window.currentProductImages.length) % window.currentProductImages.length);
              }
            };
          }
          imageContainer.addEventListener('wheel', window._modalImgWheelHandler, { passive: false });
        }
      }
      // --- ENDE NEU ---
      
      currentImageIndex = index;
      window.currentImageIndex = index; // Auch global aktualisieren
      
      // Thumbnail-Aktivität aktualisieren
      document.querySelectorAll('.product-detail-thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
      });
    } else {
      // Bei nur einem Bild: Nur Thumbnail-Aktivität aktualisieren, Bild nicht neu laden
      currentImageIndex = index;
      window.currentImageIndex = index; // Auch global aktualisieren
      
      // Thumbnail-Aktivität aktualisieren
      document.querySelectorAll('.product-detail-thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
      });
    }
  }
}

// Produktdetail Modal schließen
function closeProductDetailModal() {
  const modal = document.getElementById('productDetailModal');
  if (modal) {
    modal.classList.remove('active');
    
    // Scrollen auf der Hauptseite wieder aktivieren
    document.body.style.overflow = '';
    
    // Locomotive Scroll wieder starten falls vorhanden
    if (scroll && scroll.start) {
      scroll.start();
    }
    
    // Modal Smooth Scrolling entfernen
    removeModalSmoothScrolling();
    
    // Zoom zurücksetzen
    if (window.productDetailZoomState) {
      window.productDetailZoomState.isZoomed = false;
      window.productDetailZoomState.scale = 1;
      window.productDetailZoomState.translateX = 0;
      window.productDetailZoomState.translateY = 0;
    }
    
    // Zoom-Indikator zurücksetzen
    const zoomIndicator = document.getElementById('productDetailZoomIndicator');
    if (zoomIndicator) {
      zoomIndicator.classList.add('show');
      zoomIndicator.textContent = 'Klick zum Zoomen';
      zoomIndicator.classList.remove('zoomed');
    }
    
    // Vollbildmodus zurücksetzen falls aktiv
    const modalImg = document.getElementById('productDetailImage');
    if (modalImg && modalImg.classList.contains('mobile-zoomed')) {
      modalImg.style.position = '';
      modalImg.style.top = '';
      modalImg.style.left = '';
      modalImg.style.width = '';
      modalImg.style.height = '';
      modalImg.style.zIndex = '';
      modalImg.style.objectFit = '';
      modalImg.style.backgroundColor = '';
      modalImg.style.cursor = '';
      modalImg.style.transform = '';
      modalImg.style.maxWidth = '';
      modalImg.style.maxHeight = '';
      modalImg.style.margin = '';
      modalImg.style.padding = '';
      modalImg.classList.remove('mobile-zoomed');
    }
    
    // Vollbild-Navigation entfernen
    removeMobileFullscreenNavigation();
    
    // Vollbild-Swipe-Navigation entfernen
    if (modalImg) {
      removeMobileFullscreenSwipe(modalImg);
      removeFullscreenZoom(modalImg);
    }
    
    // Zusätzlich: Alle Vollbild-Pfeile im DOM entfernen falls noch vorhanden
    document.querySelectorAll('.mobile-fullscreen-nav').forEach(arrow => {
      arrow.remove();
    });
    
    // Modal-Swipe-Navigation entfernen
    removeModalSwipeNavigation();
    removeModalNavigationArrows();
    
    // Bewertungen und Kommentar-Formular entfernen
    const reviewsSection = modal.querySelector('.product-reviews-section');
    if (reviewsSection) {
      reviewsSection.remove();
    }
    
    const writeReviewSection = modal.querySelector('.write-review-section');
    if (writeReviewSection) {
      writeReviewSection.remove();
    }
    
    // Globale Variablen zurücksetzen
    currentProduct = null;
    currentProductImages = null;
    window.currentProductImages = null;
    currentImageIndex = null;
    window.currentImageIndex = null;
    selectedSize = null;
    selectedQuantity = 1;
  }
}

// Größen für Kategorie zurückgeben
function getSizesForCategory(subcategory) {
  // Wenn currentProduct verfügbar ist, verwende die Größen aus der Datenstruktur
  if (currentProduct && currentProduct.sizes) {
    return currentProduct.sizes.map(sizeObj => sizeObj.size);
  }
  
  // Fallback für alte Struktur
  const sizeMap = {
    'shirts': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    'hosen': ['28', '30', '32', '34', '36', '38', '40', '42'],
    'schuhe': ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
    'kleider': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    'accessoires': ['One Size'],
    'sneaker': ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
  };
  
  return sizeMap[subcategory] || ['S', 'M', 'L', 'XL'];
}

// Größe auswählen
function selectSize(size) {
  selectedSize = size;
  
  // Alle Größen-Buttons zurücksetzen
  document.querySelectorAll('.size-option').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  // Ausgewählte Größe markieren
  const selectedBtn = document.querySelector(`[data-size="${size}"]`);
  if (selectedBtn) {
    selectedBtn.classList.add('selected');
  }
  
  // Menge basierend auf verfügbarem Lagerbestand und Warenkorb setzen
  if (currentProduct && currentProduct.sizes) {
    const sizeObj = currentProduct.sizes.find(s => s.size === size);
    if (sizeObj) {
      // Prüfe ob das Produkt bereits im Warenkorb ist (gleiche Größe)
      const productId = currentProduct.id || Date.now();
      const cartItem = cart.find(item => item.id === productId && item.size === size);
      
      if (cartItem) {
        // Verwende die Warenkorb-Menge, aber nicht mehr als verfügbar
        selectedQuantity = Math.min(cartItem.quantity, sizeObj.stock);
        console.log(`Größe ${size} ausgewählt, Warenkorb-Menge: ${cartItem.quantity}, gesetzt auf: ${selectedQuantity}`);
      } else {
        // Starte mit 1, aber nicht mehr als verfügbar
        selectedQuantity = Math.min(1, sizeObj.stock);
        console.log(`Größe ${size} ausgewählt, neue Größe, Menge auf ${selectedQuantity} gesetzt (Lagerbestand: ${sizeObj.stock})`);
      }
      
      // Aktualisiere die Anzeige
      const quantityDisplay = document.getElementById('productDetailQuantity');
      if (quantityDisplay) {
        quantityDisplay.textContent = selectedQuantity;
      }
    }
  }
}

// Menge erhöhen
function increaseQuantity() {
  const quantityDisplay = document.getElementById('productDetailQuantity');
  if (quantityDisplay && currentProduct && selectedSize) {
    const productId = currentProduct.id || Date.now();
    
    // Finde den Lagerbestand für die ausgewählte Größe
    let maxStock = 10; // Fallback
    if (currentProduct.sizes) {
      const sizeObj = currentProduct.sizes.find(s => s.size === selectedSize);
      if (sizeObj) {
        maxStock = sizeObj.stock;
      }
    } else {
      maxStock = currentProduct.stock || 10;
    }
    
    selectedQuantity = Math.min(selectedQuantity + 1, maxStock);
    quantityDisplay.textContent = selectedQuantity;
    
    // KEINE direkte Warenkorb-Aktualisierung - nur temporär im Modal
    console.log(`Menge temporär auf ${selectedQuantity} erhöht (${selectedSize})`);
  }
}

// Menge verringern
function decreaseQuantity() {
  const quantityDisplay = document.getElementById('productDetailQuantity');
  if (quantityDisplay && currentProduct) {
    const productId = currentProduct.id || Date.now();
    
    selectedQuantity = Math.max(selectedQuantity - 1, 0); // Erlaube 0
    quantityDisplay.textContent = selectedQuantity;
    
    // KEINE direkte Warenkorb-Aktualisierung - nur temporär im Modal
    console.log(`Menge temporär auf ${selectedQuantity} verringert (${selectedSize})`);
  }
}

// Warenkorb aus Modal aktualisieren
function updateCartFromModal(productId, newQuantity) {
  if (!currentProduct || !selectedSize) return;
  
  const existingItemIndex = cart.findIndex(item => 
    item.id === productId && item.size === selectedSize
  );
  
  if (existingItemIndex >= 0) {
    if (newQuantity <= 0) {
      // Produkt aus Warenkorb entfernen wenn Menge 0
      cart.splice(existingItemIndex, 1);
      showNotification(`${currentProduct.name} (${selectedSize}) wurde aus dem Warenkorb entfernt`, 'info');
    } else {
      // Menge aktualisieren
      cart[existingItemIndex].quantity = newQuantity;
      showNotification(`Menge für ${currentProduct.name} (${selectedSize}) auf ${newQuantity} aktualisiert`, 'success');
    }
  } else if (newQuantity > 0 && selectedSize) {
    // Neues Produkt zum Warenkorb hinzufügen
    const cartItem = {
      id: productId,
      name: currentProduct.name,
      price: currentProduct.price,
      img: currentProduct.img || currentProduct.image,
      size: selectedSize,
      quantity: newQuantity
    };
    cart.push(cartItem);
    showNotification(`${currentProduct.name} (${selectedSize}) wurde zum Warenkorb hinzugefügt`, 'success');
  }
  
  saveCart();
  updateCartDisplay();
  displayProducts(); // Aktualisiere Produktkarten
  
  // Größenauswahl im Modal aktualisieren
  updateSizeOptionsInModal();
}

// Produkt zum Warenkorb hinzufügen (aus Modal)
function addProductToCartFromModal() {
  if (!currentProduct) return;
  
  if (!selectedSize) {
    showNotification('Bitte wählen Sie eine Größe aus', 'warning');
    return;
  }
  
  // Produkt mit aktueller Größe und Menge zum Warenkorb hinzufügen
  const productId = currentProduct.id || Date.now();
  
  // Prüfe ob das Produkt bereits im Warenkorb ist (gleiche Größe)
  const existingItemIndex = cart.findIndex(item => 
    item.id === productId && item.size === selectedSize
  );
  
  if (existingItemIndex >= 0) {
    if (selectedQuantity <= 0) {
      // Produkt aus Warenkorb entfernen wenn Menge 0
      cart.splice(existingItemIndex, 1);
      showNotification(`${currentProduct.name} (${selectedSize}) wurde aus dem Warenkorb entfernt`, 'info');
    } else {
      // Menge aktualisieren
      cart[existingItemIndex].quantity = selectedQuantity;
      showNotification(`Menge für ${currentProduct.name} (${selectedSize}) auf ${selectedQuantity} aktualisiert`, 'success');
    }
  } else {
    // Nur neue Produkte hinzufügen wenn Menge > 0
    if (selectedQuantity <= 0) {
      showNotification('Bitte wählen Sie eine Menge größer als 0', 'warning');
      return;
    }
    
    // Neues Produkt zum Warenkorb hinzufügen
    const cartItem = {
      id: productId,
      name: currentProduct.name,
      price: currentProduct.price,
      img: currentProduct.img || currentProduct.image,
      size: selectedSize,
      quantity: selectedQuantity
    };
    cart.push(cartItem);
    showNotification(`${currentProduct.name} (${selectedSize}) wurde zum Warenkorb hinzugefügt`, 'success');
  }
  
  saveCart();
  updateCartDisplay();
  displayProducts(); // Aktualisiere Produktkarten
  
  // Größenauswahl im Modal aktualisieren
  updateSizeOptionsInModal();
  
  // Warenkorb-Modal aktualisieren falls es geöffnet ist
  const cartModal = document.getElementById('cartModal');
  if (cartModal && cartModal.classList.contains('active')) {
    updateCartModal();
  }
  
  // Modal bleibt offen für weitere Aktionen
}

// Größenauswahl im Modal aktualisieren
function updateSizeOptionsInModal() {
  if (!currentProduct) return;
  
  const sizeOptions = document.getElementById('sizeOptions');
  if (!sizeOptions) return;
  
  let sizesHTML = '';
  
  if (currentProduct.sizes) {
    // Neue Struktur mit individuellem Lagerbestand
    sizesHTML = currentProduct.sizes.map(sizeObj => {
      // Wenn sizeObj.stock nicht gesetzt ist, als 0 behandeln
      const stockValue = (typeof sizeObj.stock === 'number' && !isNaN(sizeObj.stock)) ? sizeObj.stock : 0;
      const isAvailable = stockValue > 0;
      const stockText = isAvailable ? `(${stockValue})` : '(ausverkauft)';
      // Warenkorb-Menge für diese Größe ermitteln
      const cartItem = cart.find(item => item.id === currentProduct.id && item.size === sizeObj.size);
      const cartQuantity = cartItem ? cartItem.quantity : 0;
      const isSelected = selectedSize === sizeObj.size;
      return `
        <div class="size-option-container">
          <button class="size-option ${!isAvailable ? 'disabled' : ''} ${isSelected ? 'selected' : ''}" 
                  data-size="${sizeObj.size}" 
                  onclick="${isAvailable ? `selectSize('${sizeObj.size}')` : ''}"
                  ${!isAvailable ? 'disabled' : ''}>
            <span class="size-label">${sizeObj.size}</span>
            <span class="stock-info">${stockText}</span>
          </button>
          ${cartQuantity > 0 ? `
            <div class="cart-quantity-badge">
              <span class="cart-quantity-number">${cartQuantity}</span>
              <span class="cart-quantity-text">im Warenkorb</span>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  } else {
    // Fallback für alte Struktur
    const sizes = getSizesForCategory(currentProduct.subcat);
    sizesHTML = sizes.map(size => {
      // Warenkorb-Menge für diese Größe ermitteln
      const cartItem = cart.find(item => item.id === currentProduct.id && item.size === size);
      const cartQuantity = cartItem ? cartItem.quantity : 0;
      
      const isSelected = selectedSize === size;
      
      return `
        <div class="size-option-container">
          <button class="size-option ${isSelected ? 'selected' : ''}" data-size="${size}" onclick="selectSize('${size}')">
            <span class="size-label">${size}</span>
          </button>
          ${cartQuantity > 0 ? `
            <div class="cart-quantity-badge">
              <span class="cart-quantity-number">${cartQuantity}</span>
              <span class="cart-quantity-text">im Warenkorb</span>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }
  
  sizeOptions.innerHTML = sizesHTML;
}

// Produkt jetzt kaufen (aus Modal)
function buyProductNowFromModal() {
  if (!currentProduct) return;
  
  if (!selectedSize) {
    showNotification('Bitte wählen Sie eine Größe aus', 'warning');
    return;
  }
  
  // Produkt zum Warenkorb hinzufügen
  addProductToCartFromModal();
  
  // Warenkorb öffnen
  setTimeout(() => {
    openCart();
  }, 500);
}

// Produktbild Modal Setup (Legacy - für Kompatibilität)
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
    
    // Mausrad-Scrolling für Bildnavigation
    modal.addEventListener('wheel', function(e) {
      e.preventDefault(); // Verhindert Scrollen auf der Hauptseite
      
      if (currentProductImages.length <= 1) return; // Nur wenn mehrere Bilder vorhanden
      
      if (e.deltaY > 0) {
        // Nach unten scrollen = nächstes Bild
        nextImage();
      } else if (e.deltaY < 0) {
        // Nach oben scrollen = vorheriges Bild
        prevImage();
      }
    }, { passive: false }); // Wichtig für preventDefault()
    
    // ESC-Taste schließt Modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeProductImageModal();
      }
      
      // Pfeiltasten für Navigation
      if (modal.classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
          prevImage();
        } else if (e.key === 'ArrowRight') {
          nextImage();
        } else if (e.key === ' ' || e.key === 'Spacebar') {
          // Leertaste für Zoom
          e.preventDefault();
          const modalImg = document.getElementById('productImageModalImg');
          if (modalImg) {
            const rect = modalImg.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            modalImg.click();
          }
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
    const ZOOM_LEVEL = 4; // Höhere Zoom-Stufe für bessere Detailansicht
    
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
      
      // Bildqualität für Zoom optimieren
      modalImg.style.imageRendering = 'auto';
      modalImg.style.imageRendering = '-webkit-optimize-contrast';
      modalImg.style.imageRendering = 'crisp-edges';
      
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
      zoomIndicator.classList.add('show'); // Hinweis dauerhaft anzeigen
      modalImg.style.imageRendering = '';
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

// Back to Top Button Setup
function setupBackToTopButton() {
  if (!backToTopBtn) return;
  
  // Button immer sichtbar machen
  backToTopBtn.classList.add('visible');
  
  // Back-to-Top Klick-Event
  backToTopBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
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



// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
  initializeDOMElements(); // Initialisiere DOM-Elemente
  setupHeroParallax();
  loadProducts();
  setupCategoryFilters();
  setupSorting();
  setupMobileNavigation();
  setupProductImageModal(); // Produktbild Modal Setup
  setupProductDetailModal(); // Produktdetail Modal Setup
  setupImageZoom(); // Zoom-Funktionalität Setup
  setupBackToTopButton(); // Back to Top Button
  setupMobileBackToTopButton(); // Mobile Back to Top Button
  setupDesktopBackToTopButton(); // Desktop Back to Top Button
  setupCartButtons(); // Warenkorb Button Setup
  updateCartDisplay(); // Aktualisiere Cart-Anzeige nach Initialisierung
  setupAnimationCleanup(); // Animation-Cleanup Setup
  
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
window.removeProductFromCart = removeProductFromCart;
window.updateCartQuantity = updateCartQuantity;
window.updateCartFromModal = updateCartFromModal;
window.openProductImageModal = openProductImageModal;
window.openProductImageModalWithImages = openProductImageModalWithImages;
window.openProductImageModalFromProduct = openProductImageModalFromProduct;
window.openProductDetailModal = openProductDetailModal;
window.selectSize = selectSize;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.closeProductImageModal = closeProductImageModal;
window.showImage = showImage;
window.nextImage = nextImage;
window.prevImage = prevImage;
window.showProductDetailImage = showProductDetailImage;

// Zoom-Setup für das Produktdetail-Modal
setupProductDetailImageZoom();

// Neue Funktion für Zoom im Produktdetail-Modal
function setupProductDetailImageZoom() {
  const modalImg = document.getElementById('productDetailImage');
  const zoomIndicator = document.getElementById('productDetailZoomIndicator');
  if (!modalImg || !zoomIndicator) return;

  // Globale Zoom-Variablen für Zugriff beim Bildwechsel
  window.productDetailZoomState = {
    isZoomed: false,
    isDragging: false,
    isTouching: false,
    startX: 0,
    startY: 0,
    translateX: 0,
    translateY: 0,
    scale: 1,
    ZOOM_LEVEL: 3.5
  };
  
  const state = window.productDetailZoomState;

  function showZoomIndicator() {
    zoomIndicator.classList.add('show');
    setTimeout(() => {
      if (!state.isZoomed) zoomIndicator.classList.remove('show');
    }, 2000);
  }
  function hideZoomIndicator() {
    zoomIndicator.classList.remove('show');
  }
  function applyTransform() {
    modalImg.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
  }
  function zoomAtPosition(clientX, clientY) {
    const rect = modalImg.getBoundingClientRect();
    const relativeX = (clientX - rect.left) / rect.width;
    const relativeY = (clientY - rect.top) / rect.height;
    modalImg.style.transformOrigin = `${relativeX * 100}% ${relativeY * 100}%`;
    state.scale = state.ZOOM_LEVEL;
    state.translateX = 0;
    state.translateY = 0;
    state.isZoomed = true;
    modalImg.classList.add('zoomed');
    zoomIndicator.textContent = 'Ziehen zum Navigieren • Klick zum Verkleinern';
    zoomIndicator.classList.add('zoomed');
    showZoomIndicator();
    modalImg.style.imageRendering = 'auto';
    modalImg.style.imageRendering = '-webkit-optimize-contrast';
    modalImg.style.imageRendering = 'crisp-edges';
    applyTransform();
  }
  function resetZoom() {
    state.scale = 1;
    state.translateX = 0;
    state.translateY = 0;
    state.isZoomed = false;
    modalImg.style.transformOrigin = 'center';
    modalImg.classList.remove('zoomed');
    modalImg.classList.remove('dragging');
    zoomIndicator.textContent = 'Klick zum Zoomen';
    zoomIndicator.classList.remove('zoomed');
    zoomIndicator.classList.add('show'); // Hinweis dauerhaft anzeigen
    modalImg.style.imageRendering = '';
    applyTransform();
  }

  // Klick zum Zoomen/Zurücksetzen oder Bildvergrößerung
  modalImg.addEventListener('click', (e) => {
    // Auf Mobilgeräten: Bildschirmfüllende Anzeige, auf Desktop: Zoom
    if (window.innerWidth <= 768) {
      // Mobile: Bildschirmfüllende Anzeige
      if (!modalImg.classList.contains('mobile-zoomed')) {
        // Bild bildschirmfüllend machen
        modalImg.classList.add('mobile-zoomed');
        modalImg.style.position = 'fixed';
        modalImg.style.top = '0';
        modalImg.style.left = '0';
        modalImg.style.width = '100vw';
        modalImg.style.height = '100vh';
        modalImg.style.objectFit = 'contain';
        modalImg.style.zIndex = '10000';
        modalImg.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modalImg.style.cursor = 'zoom-out';
        zoomIndicator.textContent = 'Swipe oder Pfeile zum Wechseln • Klick zum Verkleinern';
        zoomIndicator.classList.add('show');
        
        // Swipe-Funktionalität für Vollbild aktivieren
        setupMobileFullscreenSwipe(modalImg);
        
        // Navigations-Pfeile hinzufügen (nur wenn mehrere Bilder vorhanden)
        if (window.currentProductImages && window.currentProductImages.length > 1) {
          addMobileFullscreenNavigation();
        }
      } else {
        // Bild zurücksetzen
        modalImg.classList.remove('mobile-zoomed');
        modalImg.style.position = '';
        modalImg.style.top = '';
        modalImg.style.left = '';
        modalImg.style.width = '';
        modalImg.style.height = '';
        modalImg.style.objectFit = '';
        modalImg.style.zIndex = '';
        modalImg.style.backgroundColor = '';
        modalImg.style.cursor = 'zoom-in';
        zoomIndicator.textContent = 'Klick zum Vergrößern';
        zoomIndicator.classList.remove('show');
        
        // Swipe-Funktionalität deaktivieren
        removeMobileFullscreenSwipe(modalImg);
        
        // Navigations-Pfeile entfernen
        removeMobileFullscreenNavigation();
      }
    } else {
      // Desktop: Zoom-Funktionalität
      if (!state.isZoomed) {
        zoomAtPosition(e.clientX, e.clientY);
      } else {
        resetZoom();
      }
    }
  });

  // Maus-Drag zum Verschieben
  modalImg.addEventListener('mousedown', (e) => {
    if (state.isZoomed) {
      e.preventDefault();
      state.isDragging = true;
      state.startX = e.clientX - state.translateX;
      state.startY = e.clientY - state.translateY;
      modalImg.classList.add('dragging');
    }
  });
  document.addEventListener('mousemove', (e) => {
    if (state.isZoomed && state.isDragging) {
      state.translateX = e.clientX - state.startX;
      state.translateY = e.clientY - state.startY;
      applyTransform();
    }
  });
  document.addEventListener('mouseup', () => {
    if (state.isZoomed && state.isDragging) {
      state.isDragging = false;
      modalImg.classList.remove('dragging');
    }
  });

  // Touch-Events nur für Desktop (Zoom-Funktionalität)
  if (window.innerWidth > 768) {
    modalImg.addEventListener('touchstart', (e) => {
      if (state.isZoomed) {
        state.isTouching = true;
        const touch = e.touches[0];
        state.startX = touch.clientX - state.translateX;
        state.startY = touch.clientY - state.translateY;
        modalImg.classList.add('dragging');
      }
    });
    modalImg.addEventListener('touchmove', (e) => {
      if (state.isZoomed && state.isTouching) {
        const touch = e.touches[0];
        state.translateX = touch.clientX - state.startX;
        state.translateY = touch.clientY - state.startY;
        applyTransform();
      }
    });
    modalImg.addEventListener('touchend', () => {
      if (state.isZoomed && state.isTouching) {
        state.isTouching = false;
        modalImg.classList.remove('dragging');
      }
    });
  }

  // Zoom zurücksetzen beim Schließen des Modals
  const modal = document.getElementById('productDetailModal');
  if (modal) {
    modal.addEventListener('transitionend', () => {
      if (!modal.classList.contains('active')) resetZoom();
    });
  }

  // Initialtext für den Zoom-Indikator (nur Desktop)
  if (window.innerWidth > 768) {
    zoomIndicator.textContent = 'Klick zum Zoomen';
  } else {
    zoomIndicator.textContent = 'Klick zum Vergrößern';
  }
}

// Mobile Vollbild-Swipe-Funktionalität
function setupMobileFullscreenSwipe(modalImg) {
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let isSwiping = false;
  let swipeThreshold = 50;

  // Touch-Events für Swipe
  modalImg.addEventListener('touchstart', handleTouchStart, { passive: false });
  modalImg.addEventListener('touchmove', handleTouchMove, { passive: false });
  modalImg.addEventListener('touchend', handleTouchEnd, { passive: false });

  // Keyboard-Events für Pfeil-Navigation
  document.addEventListener('keydown', handleKeyDown);

  function handleTouchStart(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isSwiping = true;
  }

  function handleTouchMove(e) {
    if (!isSwiping) return;
    
    currentX = e.touches[0].clientX;
    currentY = e.touches[0].clientY;
    
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    // Nur horizontale Swipes erlauben (weniger vertikale Bewegung)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
  }

  function handleTouchEnd(e) {
    if (!isSwiping) return;
    
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    // Horizontale Swipe-Erkennung
    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        // Swipe nach rechts = vorheriges Bild
        showPreviousImage();
      } else {
        // Swipe nach links = nächstes Bild
        showNextImage();
      }
    }
    
    isSwiping = false;
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowLeft') {
      showPreviousImage();
    } else if (e.key === 'ArrowRight') {
      showNextImage();
    } else if (e.key === 'Escape') {
      // ESC-Taste zum Verkleinern
      modalImg.click();
    }
  }



  // Event-Listener-Referenzen speichern für späteres Entfernen
  modalImg._fullscreenEventListeners = {
    touchstart: handleTouchStart,
    touchmove: handleTouchMove,
    touchend: handleTouchEnd,
    keydown: handleKeyDown
  };
}

function removeMobileFullscreenSwipe(modalImg) {
  if (modalImg._fullscreenEventListeners) {
    modalImg.removeEventListener('touchstart', modalImg._fullscreenEventListeners.touchstart);
    modalImg.removeEventListener('touchmove', modalImg._fullscreenEventListeners.touchmove);
    modalImg.removeEventListener('touchend', modalImg._fullscreenEventListeners.touchend);
    document.removeEventListener('keydown', modalImg._fullscreenEventListeners.keydown);
    delete modalImg._fullscreenEventListeners;
  }
}

// Vollbild-Navigation-Pfeile hinzufügen
function addMobileFullscreenNavigation() {
  // Bestehende Pfeile entfernen falls vorhanden
  removeMobileFullscreenNavigation();
  
  // Nur Pfeile hinzufügen wenn es mehrere Bilder gibt
  if (!window.currentProductImages || window.currentProductImages.length <= 1) {
    return;
  }
  
  const prevBtn = document.createElement('div');
  prevBtn.className = 'mobile-fullscreen-nav prev';
  prevBtn.innerHTML = '‹';
  prevBtn.addEventListener('click', () => {
    const modalImg = document.getElementById('productDetailImage');
    if (modalImg && modalImg.classList.contains('mobile-zoomed')) {
      showPreviousImage(modalImg);
    }
  });
  
  const nextBtn = document.createElement('div');
  nextBtn.className = 'mobile-fullscreen-nav next';
  nextBtn.innerHTML = '›';
  nextBtn.addEventListener('click', () => {
    const modalImg = document.getElementById('productDetailImage');
    if (modalImg && modalImg.classList.contains('mobile-zoomed')) {
      showNextImage(modalImg);
    }
  });
  
  document.body.appendChild(prevBtn);
  document.body.appendChild(nextBtn);
  
  // CSS-Klasse 'show' hinzufügen um die Pfeile sichtbar zu machen
  prevBtn.classList.add('show');
  nextBtn.classList.add('show');
  
  // Referenzen speichern
  window._mobileFullscreenNav = { prevBtn, nextBtn };
}

// Vollbild-Navigation-Pfeile entfernen
function removeMobileFullscreenNavigation() {
  // Referenzen entfernen
  if (window._mobileFullscreenNav) {
    if (window._mobileFullscreenNav.prevBtn) {
      window._mobileFullscreenNav.prevBtn.remove();
    }
    if (window._mobileFullscreenNav.nextBtn) {
      window._mobileFullscreenNav.nextBtn.remove();
    }
    delete window._mobileFullscreenNav;
  }
  
  // Zusätzlich: Alle Vollbild-Pfeile im DOM entfernen (Sicherheitsmaßnahme)
  document.querySelectorAll('.mobile-fullscreen-nav').forEach(arrow => {
    arrow.remove();
  });
}

// Hilfsfunktionen für Bildwechsel (werden von Swipe und Pfeilen verwendet)
function showNextImage(modalImg = null) {
  if (!modalImg) {
    modalImg = document.getElementById('productDetailImage');
  }
  
  if (window.currentProductImages && window.currentProductImages.length > 1) {
    const currentIndex = window.currentImageIndex || 0;
    const nextIndex = (currentIndex + 1) % window.currentProductImages.length;
    
    // Prüfe ob wir im Vollbildmodus sind
    if (modalImg.classList.contains('mobile-zoomed')) {
      // Im Vollbildmodus: Hochauflösende Bildqualitäts-Logik verwenden
      const imageUrl = window.currentProductImages[nextIndex];
      
      // Bild laden mit Preloading (wie im normalen Modal)
      const img = new Image();
      img.onload = function() {
        modalImg.src = imageUrl;
        console.log('Vollbild: Bild erfolgreich geladen:', imageUrl);
        
        // Hochauflösende Version laden falls verfügbar (wie im normalen Modal)
        const highResSrc = imageUrl.replace('?w=400', '?w=1200');
        if (highResSrc !== imageUrl) {
          const highResImg = new Image();
          highResImg.onload = function() {
            modalImg.src = highResSrc;
            console.log('Vollbild: Hochauflösende Version geladen:', highResSrc);
          };
          highResImg.onerror = function() {
            console.log('Vollbild: Hochauflösende Version konnte nicht geladen werden, verwende Standard-Auflösung');
          };
          highResImg.src = highResSrc;
        }
      };
      img.onerror = function() {
        console.log('Vollbild: Bild konnte nicht geladen werden:', imageUrl);
        modalImg.src = 'https://via.placeholder.com/600x800?text=Kein+Bild+verfügbar';
      };
      img.src = imageUrl;
      
      // Zusätzlicher Fallback für das Vollbild-Bild
      modalImg.onerror = function() {
        console.log('Vollbild: Bild konnte nicht geladen werden');
        modalImg.src = 'https://via.placeholder.com/600x800?text=Kein+Bild+verfügbar';
      };
      
      // Zoom zurücksetzen beim Bildwechsel
      if (modalImg._fullscreenZoom && modalImg._fullscreenZoom.resetZoom) {
        modalImg._fullscreenZoom.resetZoom();
      }
      
      window.currentImageIndex = nextIndex;
      
      // Thumbnail-Aktivität aktualisieren
      document.querySelectorAll('.product-detail-thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === nextIndex);
      });
    } else {
      // Im normalen Modal: Normale Bildwechsel-Logik verwenden
      showProductDetailImage(nextIndex);
    }
  }
}

function showPreviousImage(modalImg = null) {
  if (!modalImg) {
    modalImg = document.getElementById('productDetailImage');
  }
  
  if (window.currentProductImages && window.currentProductImages.length > 1) {
    const currentIndex = window.currentImageIndex || 0;
    const prevIndex = currentIndex === 0 ? window.currentProductImages.length - 1 : currentIndex - 1;
    
    // Prüfe ob wir im Vollbildmodus sind
    if (modalImg.classList.contains('mobile-zoomed')) {
      // Im Vollbildmodus: Hochauflösende Bildqualitäts-Logik verwenden
      const imageUrl = window.currentProductImages[prevIndex];
      
      // Bild laden mit Preloading (wie im normalen Modal)
      const img = new Image();
      img.onload = function() {
        modalImg.src = imageUrl;
        console.log('Vollbild: Bild erfolgreich geladen:', imageUrl);
        
        // Hochauflösende Version laden falls verfügbar (wie im normalen Modal)
        const highResSrc = imageUrl.replace('?w=400', '?w=1200');
        if (highResSrc !== imageUrl) {
          const highResImg = new Image();
          highResImg.onload = function() {
            modalImg.src = highResSrc;
            console.log('Vollbild: Hochauflösende Version geladen:', highResSrc);
          };
          highResImg.onerror = function() {
            console.log('Vollbild: Hochauflösende Version konnte nicht geladen werden, verwende Standard-Auflösung');
          };
          highResImg.src = highResSrc;
        }
      };
      img.onerror = function() {
        console.log('Vollbild: Bild konnte nicht geladen werden:', imageUrl);
        modalImg.src = 'https://via.placeholder.com/600x800?text=Kein+Bild+verfügbar';
      };
      img.src = imageUrl;
      
      // Zusätzlicher Fallback für das Vollbild-Bild
      modalImg.onerror = function() {
        console.log('Vollbild: Bild konnte nicht geladen werden');
        modalImg.src = 'https://via.placeholder.com/600x800?text=Kein+Bild+verfügbar';
      };
      
      // Zoom zurücksetzen beim Bildwechsel
      if (modalImg._fullscreenZoom && modalImg._fullscreenZoom.resetZoom) {
        modalImg._fullscreenZoom.resetZoom();
      }
      
      window.currentImageIndex = prevIndex;
      
      // Thumbnail-Aktivität aktualisieren
      document.querySelectorAll('.product-detail-thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === prevIndex);
      });
    } else {
      // Im normalen Modal: Normale Bildwechsel-Logik verwenden
      showProductDetailImage(prevIndex);
    }
  }
}

// Modal Swipe-Navigation (für normales Modal, nicht Vollbild)
function setupModalSwipeNavigation() {
  const modal = document.getElementById('productDetailModal');
  const modalImg = document.getElementById('productDetailImage');
  
  if (!modal || !modalImg) return;
  
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let isSwiping = false;
  let swipeThreshold = 50;
  
  // Touch-Events für Swipe
  modal.addEventListener('touchstart', handleModalTouchStart, { passive: false });
  modal.addEventListener('touchmove', handleModalTouchMove, { passive: false });
  modal.addEventListener('touchend', handleModalTouchEnd, { passive: false });
  
  // Keyboard-Events für Pfeil-Navigation (global für das gesamte Dokument)
  document.addEventListener('keydown', handleModalKeyDown);
  window._modalKeyDownListener = handleModalKeyDown;
  
  function handleModalTouchStart(e) {
    // Nur auf dem Bild-Bereich Swipe erlauben
    if (e.target.closest('.product-detail-image-container')) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwiping = true;
    }
  }
  
  function handleModalTouchMove(e) {
    if (!isSwiping) return;
    
    currentX = e.touches[0].clientX;
    currentY = e.touches[0].clientY;
    
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    // Nur horizontale Swipes erlauben (weniger vertikale Bewegung)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
  }
  
  function handleModalTouchEnd(e) {
    if (!isSwiping) return;
    
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    // Horizontale Swipe-Erkennung
    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        // Swipe nach rechts = vorheriges Bild
        showProductDetailImage((window.currentImageIndex || 0) === 0 ? 
          window.currentProductImages.length - 1 : (window.currentImageIndex || 0) - 1);
      } else {
        // Swipe nach links = nächstes Bild
        showProductDetailImage(((window.currentImageIndex || 0) + 1) % window.currentProductImages.length);
      }
    }
    
    isSwiping = false;
  }
  
  function handleModalKeyDown(e) {
    // Nur reagieren wenn das Modal offen ist
    const modal = document.getElementById('productDetailModal');
    if (!modal || !modal.classList.contains('active')) return;
    
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      showProductDetailImage((window.currentImageIndex || 0) === 0 ? 
        window.currentProductImages.length - 1 : (window.currentImageIndex || 0) - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      showProductDetailImage(((window.currentImageIndex || 0) + 1) % window.currentProductImages.length);
    }
  }
  
  // Event-Listener-Referenzen speichern für späteres Entfernen
  modal._modalSwipeEventListeners = {
    touchstart: handleModalTouchStart,
    touchmove: handleModalTouchMove,
    touchend: handleModalTouchEnd,
    keydown: handleModalKeyDown
  };
}

function removeModalSwipeNavigation() {
  const modal = document.getElementById('productDetailModal');
  if (modal && modal._modalSwipeEventListeners) {
    modal.removeEventListener('touchstart', modal._modalSwipeEventListeners.touchstart);
    modal.removeEventListener('touchmove', modal._modalSwipeEventListeners.touchmove);
    modal.removeEventListener('touchend', modal._modalSwipeEventListeners.touchend);
    document.removeEventListener('keydown', modal._modalSwipeEventListeners.keydown);
    delete modal._modalSwipeEventListeners;
  }
  
  // Zusätzlich: Alle globalen Keyboard-Event-Listener entfernen falls vorhanden
  if (window._modalKeyDownListener) {
    document.removeEventListener('keydown', window._modalKeyDownListener);
    delete window._modalKeyDownListener;
  }
}

// Modal-Navigations-Pfeile hinzufügen
function addModalNavigationArrows() {
  // Bestehende Pfeile entfernen falls vorhanden
  removeModalNavigationArrows();
  
  // Nur Pfeile hinzufügen wenn es mehrere Bilder gibt
  console.log('Modal Navigation: Prüfe Bilder:', window.currentProductImages);
  console.log('Modal Navigation: Anzahl Bilder:', window.currentProductImages ? window.currentProductImages.length : 0);
  if (!window.currentProductImages || window.currentProductImages.length <= 1) {
    console.log('Modal Navigation: Keine Pfeile nötig - nur ein Bild vorhanden');
    return;
  }
  
  const imageContainer = document.querySelector('.product-detail-image-container');
  if (!imageContainer) {
    console.log('Modal Navigation: Image container nicht gefunden');
    return;
  }
  
  console.log('Modal Navigation: Erstelle Pfeil-Buttons');
  console.log('Aktuelle Bilder:', window.currentProductImages);
  console.log('Aktueller Index:', window.currentImageIndex);
  
  const prevBtn = document.createElement('div');
  prevBtn.className = 'modal-nav-arrow prev';
  prevBtn.innerHTML = '‹';
  prevBtn.style.display = 'flex';
  prevBtn.style.zIndex = '10003';
  prevBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Modal Navigation: Vorheriger Button geklickt');
    if (window.currentProductImages && window.currentProductImages.length > 1) {
      const currentIndex = window.currentImageIndex || 0;
      const prevIndex = currentIndex === 0 ? window.currentProductImages.length - 1 : currentIndex - 1;
      console.log('Wechsle von Index', currentIndex, 'zu', prevIndex);
      showProductDetailImage(prevIndex);
    }
  });
  
  const nextBtn = document.createElement('div');
  nextBtn.className = 'modal-nav-arrow next';
  nextBtn.innerHTML = '›';
  nextBtn.style.display = 'flex';
  nextBtn.style.zIndex = '10003';
  nextBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Modal Navigation: Nächster Button geklickt');
    if (window.currentProductImages && window.currentProductImages.length > 1) {
      const currentIndex = window.currentImageIndex || 0;
      const nextIndex = (currentIndex + 1) % window.currentProductImages.length;
      console.log('Wechsle von Index', currentIndex, 'zu', nextIndex);
      showProductDetailImage(nextIndex);
    }
  });
  
  imageContainer.appendChild(prevBtn);
  imageContainer.appendChild(nextBtn);
  
  // Referenzen speichern
  window._modalNavArrows = { prevBtn, nextBtn };
  
  console.log('Modal Navigation: Pfeil-Buttons erstellt und hinzugefügt');
  console.log('Modal Navigation: Pfeile im DOM:', imageContainer.querySelectorAll('.modal-nav-arrow').length);
  console.log('Modal Navigation: Image Container:', imageContainer);
}

// Modal-Navigations-Pfeile entfernen
function removeModalNavigationArrows() {
  if (window._modalNavArrows) {
    if (window._modalNavArrows.prevBtn) {
      window._modalNavArrows.prevBtn.remove();
    }
    if (window._modalNavArrows.nextBtn) {
      window._modalNavArrows.nextBtn.remove();
    }
    delete window._modalNavArrows;
  }
}

// Mobile Bildvergrößerung ist jetzt direkt in openProductDetailModal integriert

// Die Lightbox-Logik ist jetzt in setupProductDetailImageZoom() integriert

// Vollbildmodus mit hochauflösender Bildqualität laden
function loadHighResImageInFullscreen(modalImg) {
  if (!modalImg || !window.currentProductImages || !window.currentImageIndex) return;
  
  const currentImageUrl = window.currentProductImages[window.currentImageIndex];
  
  // Bild laden mit Preloading (wie im normalen Modal)
  const img = new Image();
  img.onload = function() {
    modalImg.src = currentImageUrl;
    console.log('Vollbild: Aktuelles Bild erfolgreich geladen:', currentImageUrl);
    
    // Hochauflösende Version laden falls verfügbar (wie im normalen Modal)
    const highResSrc = currentImageUrl.replace('?w=400', '?w=1200');
    if (highResSrc !== currentImageUrl) {
      const highResImg = new Image();
      highResImg.onload = function() {
        modalImg.src = highResSrc;
        console.log('Vollbild: Hochauflösende Version des aktuellen Bildes geladen:', highResSrc);
      };
      highResImg.onerror = function() {
        console.log('Vollbild: Hochauflösende Version konnte nicht geladen werden, verwende Standard-Auflösung');
      };
      highResImg.src = highResSrc;
    }
  };
  img.onerror = function() {
    console.log('Vollbild: Aktuelles Bild konnte nicht geladen werden:', currentImageUrl);
    modalImg.src = 'https://via.placeholder.com/600x800?text=Kein+Bild+verfügbar';
  };
  img.src = currentImageUrl;
  
  // Zusätzlicher Fallback für das Vollbild-Bild
  modalImg.onerror = function() {
    console.log('Vollbild: Aktuelles Bild konnte nicht geladen werden');
    modalImg.src = 'https://via.placeholder.com/600x800?text=Kein+Bild+verfügbar';
  };
}

// Vollbild-Zoom-Funktionalität
function setupFullscreenZoom(modalImg) {
  if (!modalImg) return;
  
  let isZoomed = false;
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let isDragging = false;
  let initialDistance = 0;
  let initialScale = 1;
  
  // Zoom-Indikator erstellen
  const zoomIndicator = document.createElement('div');
  zoomIndicator.id = 'fullscreenZoomIndicator';
  zoomIndicator.className = 'fullscreen-zoom-indicator';
  zoomIndicator.textContent = 'Doppeltipp zum Zoomen';
  zoomIndicator.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    z-index: 100002;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  `;
  document.body.appendChild(zoomIndicator);
  
  function showZoomIndicator() {
    zoomIndicator.style.opacity = '1';
    setTimeout(() => {
      zoomIndicator.style.opacity = '0';
    }, 2000);
  }
  
  function hideZoomIndicator() {
    zoomIndicator.style.opacity = '0';
  }
  
  function applyTransform() {
    modalImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }
  
  function resetZoom() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    isZoomed = false;
    applyTransform();
    modalImg.style.cursor = 'pointer';
    hideZoomIndicator();
  }
  
  function zoomAtPosition(clientX, clientY) {
    const rect = modalImg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Zoom um den Klickpunkt
    const newScale = scale === 1 ? 3 : 1;
    const scaleChange = newScale / scale;
    
    // Berechne neue Position
    translateX = clientX - (clientX - translateX) * scaleChange;
    translateY = clientY - (clientY - translateY) * scaleChange;
    
    scale = newScale;
    isZoomed = scale > 1;
    
    applyTransform();
    modalImg.style.cursor = isZoomed ? 'grab' : 'pointer';
    
    if (isZoomed) {
      showZoomIndicator();
      zoomIndicator.textContent = 'Ziehen zum Verschieben • Doppeltipp zum Zurücksetzen';
    } else {
      hideZoomIndicator();
    }
  }
  
  // Doppelklick zum Zoomen
  let lastClickTime = 0;
  modalImg.addEventListener('click', function(e) {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastClickTime;
    
    if (timeDiff < 300 && timeDiff > 0) {
      // Doppelklick erkannt
      e.preventDefault();
      e.stopPropagation();
      zoomAtPosition(e.clientX, e.clientY);
    }
    
    lastClickTime = currentTime;
  });
  
  // Touch-Events für Pinch-to-Zoom
  modalImg.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      // Einzelner Touch - für Drag
      const touch = e.touches[0];
      startX = touch.clientX - translateX;
      startY = touch.clientY - translateY;
      lastX = touch.clientX;
      lastY = touch.clientY;
      isDragging = isZoomed;
    } else if (e.touches.length === 2) {
      // Zwei Touches - für Pinch-to-Zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      initialScale = scale;
    }
  }, { passive: false });
  
  modalImg.addEventListener('touchmove', function(e) {
    if (e.touches.length === 1 && isDragging) {
      // Drag
      const touch = e.touches[0];
      translateX = touch.clientX - startX;
      translateY = touch.clientY - startY;
      applyTransform();
    } else if (e.touches.length === 2) {
      // Pinch-to-Zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (initialDistance > 0) {
        scale = Math.max(1, Math.min(5, initialScale * (currentDistance / initialDistance)));
        isZoomed = scale > 1;
        applyTransform();
        modalImg.style.cursor = isZoomed ? 'grab' : 'pointer';
      }
    }
  }, { passive: false });
  
  modalImg.addEventListener('touchend', function(e) {
    isDragging = false;
    if (scale < 1.1) {
      resetZoom();
    }
  });
  
  // ESC-Taste zum Zurücksetzen
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isZoomed) {
      resetZoom();
    }
  });
  
  // Zoom-Indikator beim ersten Laden anzeigen
  setTimeout(() => {
    showZoomIndicator();
  }, 500);
  
  // Referenz für späteres Entfernen speichern
  modalImg._fullscreenZoom = {
    zoomIndicator,
    resetZoom,
    cleanup: function() {
      if (zoomIndicator && zoomIndicator.parentNode) {
        zoomIndicator.parentNode.removeChild(zoomIndicator);
      }
    }
  };
}

// Vollbild-Zoom entfernen
function removeFullscreenZoom(modalImg) {
  if (modalImg && modalImg._fullscreenZoom) {
    modalImg._fullscreenZoom.cleanup();
    delete modalImg._fullscreenZoom;
  }
  
  // Zusätzlich: Alle Zoom-Indikatoren entfernen
  const zoomIndicators = document.querySelectorAll('.fullscreen-zoom-indicator');
  zoomIndicators.forEach(indicator => {
    if (indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  });
}

// Beim Öffnen des Modals (nach modal.classList.add('active');):
document.body.style.overflow = 'hidden';
document.documentElement.style.overflow = 'hidden';
window._modalNoScrollHandler = function(e) { e.preventDefault(); };
document.body.addEventListener('touchmove', window._modalNoScrollHandler, { passive: false });

// Beim Schließen des Modals (nach modal.classList.remove('active');):
document.body.style.overflow = '';
document.documentElement.style.overflow = '';
if (window._modalNoScrollHandler) {
  document.body.removeEventListener('touchmove', window._modalNoScrollHandler, { passive: false });
  delete window._modalNoScrollHandler;
}

// Nach dem Laden der Seite: Resize-Event und scroll.update()
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
    if (window.scroll && window.scroll.update) {
      window.scroll.update();
    }
  }, 200);
});

// Bewertungs- und Kommentarsystem
function generateProductReviews(productId) {
  // Beispiel-Bewertungen für verschiedene Produkte
  const sampleReviews = {
    // Damenkleid
    1: [
      {
        author: "Sarah M.",
        rating: 5,
        title: "Perfektes Kleid für besondere Anlässe",
        text: "Das Kleid ist wunderschön und sitzt perfekt. Die Qualität ist erstklassig und es ist sehr bequem zu tragen. Ich habe es bereits bei mehreren Anlässen getragen und immer Komplimente bekommen.",
        date: "2024-01-15",
        helpful: 12
      },
      {
        author: "Lisa K.",
        rating: 4.5,
        title: "Sehr schön, aber etwas teuer",
        text: "Das Design ist wirklich elegant und die Verarbeitung ist hochwertig. Der Preis ist etwas hoch, aber die Qualität rechtfertigt es. Ich würde es weiterempfehlen.",
        date: "2024-01-10",
        helpful: 8
      },
      {
        author: "Anna W.",
        rating: 5,
        title: "Absolut empfehlenswert!",
        text: "Eines der schönsten Kleider, die ich je besessen habe. Der Stoff ist weich und fällt wunderschön. Die Passform ist perfekt und es ist sehr vielseitig einsetzbar.",
        date: "2024-01-05",
        helpful: 15
      }
    ],
    // Herrenhemd
    2: [
      {
        author: "Michael B.",
        rating: 4,
        title: "Gute Qualität für den Preis",
        text: "Das Hemd ist gut verarbeitet und sitzt angenehm. Der Stoff ist atmungsaktiv und bügelt sich leicht. Für Business-Anlässe sehr gut geeignet.",
        date: "2024-01-12",
        helpful: 6
      },
      {
        author: "Thomas R.",
        rating: 5,
        title: "Exzellente Passform",
        text: "Endlich ein Hemd, das wirklich passt! Die Größen sind genau und der Schnitt ist modern. Sehr zufrieden mit dem Kauf.",
        date: "2024-01-08",
        helpful: 9
      }
    ],
    // Kinder-Jeans
    3: [
      {
        author: "Mama von Max",
        rating: 4.5,
        title: "Robust und bequem",
        text: "Mein Sohn liebt diese Jeans! Sie sind sehr robust und halten auch wildes Spielen aus. Die Waschbarkeit ist super und sie behalten ihre Form.",
        date: "2024-01-14",
        helpful: 11
      },
      {
        author: "Familie Schmidt",
        rating: 5,
        title: "Perfekt für aktive Kinder",
        text: "Wir haben bereits mehrere Paare gekauft. Die Qualität ist konstant gut und die Kinder finden sie bequem. Sehr empfehlenswert!",
        date: "2024-01-06",
        helpful: 7
      }
    ],
    // Damen Bluse
    4: [
      {
        author: "Julia H.",
        rating: 4,
        title: "Elegant und vielseitig",
        text: "Die Bluse ist sehr elegant und lässt sich gut kombinieren. Der Stoff ist angenehm auf der Haut und die Verarbeitung ist sauber.",
        date: "2024-01-11",
        helpful: 5
      },
      {
        author: "Claudia M.",
        rating: 4.5,
        title: "Perfekt fürs Büro",
        text: "Ideal für den Arbeitsalltag. Die Bluse ist professionell, aber nicht langweilig. Die Qualität ist gut und sie ist pflegeleicht.",
        date: "2024-01-09",
        helpful: 8
      }
    ],
    // Herren Jeans
    5: [
      {
        author: "Andreas K.",
        rating: 5,
        title: "Beste Jeans die ich je hatte",
        text: "Die Passform ist perfekt und der Stoff ist hochwertig. Sie sind bequem und sehen trotzdem elegant aus. Definitiv ein Kaufempfehlung!",
        date: "2024-01-13",
        helpful: 14
      },
      {
        author: "Peter W.",
        rating: 4,
        title: "Gute Qualität",
        text: "Solide Jeans mit guter Verarbeitung. Der Preis ist fair für die Qualität. Ich bin zufrieden mit dem Kauf.",
        date: "2024-01-07",
        helpful: 6
      }
    ]
  };

  // Fallback für Produkte ohne spezifische Bewertungen
  const fallbackReviews = [
    {
      author: "Kunde",
      rating: 4.5,
      title: "Sehr zufrieden",
      text: "Das Produkt entspricht voll und ganz meinen Erwartungen. Die Qualität ist gut und der Preis ist fair. Gerne wieder!",
      date: "2024-01-15",
      helpful: 3
    },
    {
      author: "Zufriedener Kunde",
      rating: 4,
      title: "Empfehlenswert",
      text: "Gute Qualität für den Preis. Das Produkt ist wie beschrieben und wurde schnell geliefert.",
      date: "2024-01-10",
      helpful: 2
    }
  ];

  // Benutzerdefinierte Bewertungen hinzufügen
  let allReviews = sampleReviews[productId] || fallbackReviews;
  
  // Benutzerdefinierte Bewertungen hinzufügen falls vorhanden
  if (window.userReviews && window.userReviews[productId]) {
    allReviews = [...allReviews, ...window.userReviews[productId]];
  }
  
  return allReviews;
}

function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let starsHTML = '';
  
  // Volle Sterne
  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<span class="star filled">★</span>';
  }
  
  // Halber Stern
  if (hasHalfStar) {
    starsHTML += '<span class="star half">★</span>';
  }
  
  // Leere Sterne
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<span class="star empty">★</span>';
  }
  
  return starsHTML;
}

function calculateAverageRating(reviews) {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function renderProductReviews(productId) {
  const reviews = generateProductReviews(productId);
  const averageRating = calculateAverageRating(reviews);
  
  if (reviews.length === 0) {
    return `
      <div class="product-reviews-section">
        <div class="product-reviews-header">
          <h3 class="product-reviews-title">Bewertungen & Kommentare</h3>
        </div>
        <p style="text-align: center; color: #6b7280; padding: 2rem;">
          Noch keine Bewertungen vorhanden. Seien Sie der Erste!
        </p>
      </div>
    `;
  }
  
  let reviewsHTML = `
    <div class="product-reviews-section">
      <div class="product-reviews-header">
        <h3 class="product-reviews-title">Bewertungen & Kommentare</h3>
        <div class="product-reviews-summary">
          <div class="product-reviews-average">
            <div class="stars">
              ${renderStars(averageRating)}
            </div>
            <span>${averageRating}</span>
          </div>
          <div class="product-reviews-count">
            ${reviews.length} Bewertung${reviews.length !== 1 ? 'en' : ''}
          </div>
        </div>
      </div>
      <div class="product-reviews-list">
  `;
  
  reviews.forEach((review, index) => {
    reviewsHTML += `
      <div class="product-review-item">
        <div class="product-review-header">
          <div class="product-review-author">${review.author}</div>
          <div class="product-review-date">${formatDate(review.date)}</div>
        </div>
        <div class="product-review-rating">
          <div class="product-review-stars">
            ${renderStars(review.rating)}
          </div>
          <span>${review.rating}/5</span>
        </div>
        <div class="product-review-title">${review.title}</div>
        <div class="product-review-text">${review.text}</div>
        <div class="product-review-helpful">
          <button class="product-review-helpful-btn" onclick="markReviewHelpful(${index})">
            👍 Hilfreich
          </button>
          <span class="product-review-helpful-count">${review.helpful} fanden das hilfreich</span>
        </div>
      </div>
    `;
  });
  
  reviewsHTML += `
      </div>
    </div>
  `;
  
  return reviewsHTML;
}

function markReviewHelpful(reviewIndex) {
  const button = event.target;
  if (button.classList.contains('active')) {
    button.classList.remove('active');
    button.textContent = '👍 Hilfreich';
  } else {
    button.classList.add('active');
    button.textContent = '✅ Hilfreich';
  }
}

// Funktion zum Hinzufügen der Bewertungen zum Produktdetail-Modal
function addReviewsToProductModal(productId) {
  const modalBody = document.querySelector('.product-detail-info-section');
  if (!modalBody) return;
  
  // Entferne vorhandene Bewertungen falls vorhanden
  const existingReviews = modalBody.querySelector('.product-reviews-section');
  if (existingReviews) {
    existingReviews.remove();
  }
  
  // Füge neue Bewertungen nach den zusätzlichen Informationen hinzu
  const additionalInfoSection = modalBody.querySelector('.product-detail-additional-info');
  if (additionalInfoSection) {
    const reviewsHTML = renderProductReviews(productId);
    const writeReviewHTML = renderWriteReviewSection(productId);
    additionalInfoSection.insertAdjacentHTML('afterend', reviewsHTML + writeReviewHTML);
  } else {
    // Fallback: Am Ende hinzufügen
    const reviewsHTML = renderProductReviews(productId);
    const writeReviewHTML = renderWriteReviewSection(productId);
    modalBody.insertAdjacentHTML('beforeend', reviewsHTML + writeReviewHTML);
  }
  
  // Event-Listener für das Bewertungsformular hinzufügen
  setupReviewFormListeners();
}

// Bewertung schreiben Sektion rendern
function renderWriteReviewSection(productId) {
  return `
    <div class="write-review-section">
      <h3 class="write-review-title">Bewertung schreiben</h3>
      <form class="write-review-form" id="writeReviewForm">
        <div class="review-form-row">
          <div class="review-form-group">
            <label for="reviewFirstName">Vorname *</label>
            <input type="text" id="reviewFirstName" name="firstName" required>
          </div>
          <div class="review-form-group">
            <label for="reviewLastName">Nachname *</label>
            <input type="text" id="reviewLastName" name="lastName" required>
          </div>
        </div>
        
        <div class="rating-input-section">
          <label class="rating-input-label">Ihre Bewertung *</label>
          <div class="rating-input-stars" id="ratingInputStars">
            <span class="rating-input-star" data-rating="1">★</span>
            <span class="rating-input-star" data-rating="2">★</span>
            <span class="rating-input-star" data-rating="3">★</span>
            <span class="rating-input-star" data-rating="4">★</span>
            <span class="rating-input-star" data-rating="5">★</span>
            <span class="rating-input-text" id="ratingText">Klicken Sie auf einen Stern</span>
          </div>
          <input type="hidden" id="selectedRating" name="rating" value="0">
        </div>
        
        <div class="review-form-group">
          <label for="reviewTitle">Titel Ihrer Bewertung *</label>
          <input type="text" id="reviewTitle" name="title" placeholder="z.B. 'Sehr zufrieden' oder 'Gute Qualität'" required>
        </div>
        
        <div class="review-form-group">
          <label for="reviewText">Ihr Kommentar *</label>
          <textarea id="reviewText" name="text" placeholder="Teilen Sie Ihre Erfahrungen mit diesem Produkt..." required></textarea>
        </div>
        
        <button type="submit" class="submit-review-btn" id="submitReviewBtn" disabled>
          Bewertung absenden
        </button>
      </form>
    </div>
  `;
}

// Event-Listener für das Bewertungsformular einrichten
function setupReviewFormListeners() {
  // Sterne-Bewertung
  const ratingStars = document.querySelectorAll('.rating-input-star');
  const selectedRatingInput = document.getElementById('selectedRating');
  const ratingText = document.getElementById('ratingText');
  const submitBtn = document.getElementById('submitReviewBtn');
  
  if (ratingStars.length > 0) {
    ratingStars.forEach(star => {
      star.addEventListener('click', function() {
        const rating = parseInt(this.getAttribute('data-rating'));
        setRating(rating);
      });
      
      star.addEventListener('mouseenter', function() {
        const rating = parseInt(this.getAttribute('data-rating'));
        highlightStars(rating);
        updateRatingText(rating);
      });
    });
    
    // Mouseleave für Sterne-Container
    const starsContainer = document.getElementById('ratingInputStars');
    if (starsContainer) {
      starsContainer.addEventListener('mouseleave', function() {
        const currentRating = parseInt(selectedRatingInput.value) || 0;
        highlightStars(currentRating);
        updateRatingText(currentRating);
      });
    }
  }
  
  // Formular-Submit
  const reviewForm = document.getElementById('writeReviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitReview();
    });
  }
  
  // Validierung für Submit-Button
  const formInputs = document.querySelectorAll('#writeReviewForm input, #writeReviewForm textarea');
  formInputs.forEach(input => {
    input.addEventListener('input', validateReviewForm);
  });
}

// Sterne-Bewertung setzen
function setRating(rating) {
  const selectedRatingInput = document.getElementById('selectedRating');
  const submitBtn = document.getElementById('submitReviewBtn');
  
  selectedRatingInput.value = rating;
  highlightStars(rating);
  updateRatingText(rating);
  validateReviewForm();
}

// Sterne hervorheben
function highlightStars(rating) {
  const ratingStars = document.querySelectorAll('.rating-input-star');
  
  ratingStars.forEach((star, index) => {
    const starRating = index + 1;
    if (starRating <= rating) {
      star.classList.add('filled');
      star.classList.remove('active');
    } else {
      star.classList.remove('filled', 'active');
    }
  });
}

// Bewertungstext aktualisieren
function updateRatingText(rating) {
  const ratingText = document.getElementById('ratingText');
  const ratingDescriptions = {
    0: 'Klicken Sie auf einen Stern',
    1: 'Sehr schlecht',
    2: 'Schlecht',
    3: 'Durchschnittlich',
    4: 'Gut',
    5: 'Sehr gut'
  };
  
  if (ratingText) {
    ratingText.textContent = ratingDescriptions[rating] || 'Klicken Sie auf einen Stern';
  }
}

// Bewertungsformular validieren
function validateReviewForm() {
  const firstName = document.getElementById('reviewFirstName')?.value.trim();
  const lastName = document.getElementById('reviewLastName')?.value.trim();
  const rating = parseInt(document.getElementById('selectedRating')?.value) || 0;
  const title = document.getElementById('reviewTitle')?.value.trim();
  const text = document.getElementById('reviewText')?.value.trim();
  const submitBtn = document.getElementById('submitReviewBtn');
  
  const isValid = firstName && lastName && rating > 0 && title && text;
  
  if (submitBtn) {
    submitBtn.disabled = !isValid;
  }
}

// Bewertung absenden
function submitReview() {
  const firstName = document.getElementById('reviewFirstName')?.value.trim();
  const lastName = document.getElementById('reviewLastName')?.value.trim();
  const rating = parseInt(document.getElementById('selectedRating')?.value) || 0;
  const title = document.getElementById('reviewTitle')?.value.trim();
  const text = document.getElementById('reviewText')?.value.trim();
  
  if (!firstName || !lastName || rating === 0 || !title || !text) {
    showNotification('Bitte füllen Sie alle Pflichtfelder aus', 'error');
    return;
  }
  
  // Neue Bewertung erstellen
  const newReview = {
    author: `${firstName} ${lastName}`,
    rating: rating,
    title: title,
    text: text,
    date: new Date().toISOString().split('T')[0],
    helpful: 0
  };
  
  // Bewertung zu den bestehenden hinzufügen (in der Praxis würde man das an einen Server senden)
  const productId = currentProduct?.id;
  if (productId) {
    // Hier würde normalerweise ein API-Call erfolgen
    console.log('Neue Bewertung:', newReview);
    
    // Bewertung zur lokalen Liste hinzufügen (für Demo-Zwecke)
    if (!window.userReviews) {
      window.userReviews = {};
    }
    if (!window.userReviews[productId]) {
      window.userReviews[productId] = [];
    }
    window.userReviews[productId].push(newReview);
    
    // Formular zurücksetzen
    resetReviewForm();
    
    // Bewertungen neu rendern
    addReviewsToProductModal(productId);
    
    showNotification('Vielen Dank für Ihre Bewertung!', 'success');
  }
}

// Bewertungsformular zurücksetzen
function resetReviewForm() {
  const form = document.getElementById('writeReviewForm');
  if (form) {
    form.reset();
  }
  
  // Sterne zurücksetzen
  setRating(0);
  
  // Submit-Button deaktivieren
  const submitBtn = document.getElementById('submitReviewBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
  }
}
