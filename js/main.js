// =====================================================
// OUTLET 365 — Main JS (Seguro contra XSS)
// =====================================================

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
window.escapeHtml = escapeHtml;

document.addEventListener('DOMContentLoaded', async () => {
  // ── MENU LATERAL ──
  const menuToggle = document.getElementById('menuToggle');
  const menuClose = document.getElementById('menuClose');
  const sideMenu = document.getElementById('sideMenu');
  const menuOverlay = document.getElementById('menuOverlay');

  function openMenu() {
    sideMenu?.classList.add('active');
    menuOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    sideMenu?.classList.remove('active');
    menuOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }
  menuToggle?.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', closeMenu);
  menuOverlay?.addEventListener('click', closeMenu);

  // ── CARRINHO DRAWER ──
  const cartToggle = document.getElementById('cartToggle');
  const cartClose = document.getElementById('cartClose');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const continueShopping = document.getElementById('continueShopping');

  function openCart() {
    cartDrawer?.classList.add('active');
    cartOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    cartDrawer?.classList.remove('active');
    cartOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }
  window.openCart = openCart;
  window.closeCart = closeCart;

  cartToggle?.addEventListener('click', openCart);
  cartClose?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);
  continueShopping?.addEventListener('click', closeCart);

  // Carrega produtos do Supabase para renderizar vitrines e catálogo
  if (typeof DB !== 'undefined') await DB.loadProducts();

  // ── RASTREAMENTO DE TRÁFEGO REAL (Supabase) ──
  if (typeof DB !== 'undefined' && typeof DB.incrementStat === 'function') {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastVisit = localStorage.getItem('outlet365_vdate');
      let isNewVisitor = false;
      if (lastVisit !== todayStr) {
        localStorage.setItem('outlet365_vdate', todayStr);
        isNewVisitor = true;
      }
      DB.incrementStat('page_views', isNewVisitor);
    } catch (e) {
      console.error('Error tracking page view:', e);
    }
  }

  // ── SEARCH (Protegido contra DOM XSS) ──
  const searchToggle = document.getElementById('searchToggle');
  const searchBar = document.getElementById('searchBar');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const searchResults = document.getElementById('searchResults');

  searchToggle?.addEventListener('click', () => {
    searchBar?.classList.toggle('active');
    if (searchBar?.classList.contains('active')) searchInput?.focus();
  });

  function doSearch() {
    const q = searchInput?.value.trim();
    if (!q || !searchResults) return;
    const results = searchProducts(q);
    if (results.length === 0) {
      const box = document.createElement('div');
      box.className = 'search-result-item';
      const info = document.createElement('div');
      info.className = 'search-result-info';
      const p = document.createElement('p');
      p.textContent = `Nenhum produto encontrado para "${q}"`;
      info.appendChild(p);
      box.appendChild(info);
      searchResults.replaceChildren(box);
      searchResults.classList.add('active');
      return;
    }
    searchResults.innerHTML = results.map(p => `
      <div class="search-result-item" onclick="window.location.href='produto.html?slug=${encodeURIComponent(p.slug)}'">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="search-result-img" loading="lazy"/>
        <div class="search-result-info">
          <p>${escapeHtml(p.name)}</p>
          <span>${formatPrice(p.price)}</span>
        </div>
      </div>
    `).join('');
    searchResults.classList.add('active');
  }

  searchBtn?.addEventListener('click', doSearch);
  searchInput?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') doSearch();
    else if (searchInput.value.trim() === '') {
      searchResults?.classList.remove('active');
    }
  });

  document.addEventListener('click', (e) => {
    if (!searchBar?.contains(e.target) && !searchToggle?.contains(e.target)) {
      searchResults?.classList.remove('active');
    }
  });

  // ── HERO SLIDER (Carregamento Otimizado e Sob Demanda) ──
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.dot');
  let currentSlide = 0;
  let sliderInterval;

  function loadSlideBg(slide) {
    if (slide && slide.dataset.bg && !slide.style.backgroundImage) {
      slide.style.backgroundImage = `url('${slide.dataset.bg}')`;
    }
  }

  function goToSlide(n) {
    slides[currentSlide]?.classList.remove('active');
    dots[currentSlide]?.classList.remove('active');
    currentSlide = (n + slides.length) % slides.length;
    loadSlideBg(slides[currentSlide]);
    slides[currentSlide]?.classList.add('active');
    dots[currentSlide]?.classList.add('active');
  }

  function startAutoSlide() {
    sliderInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
  }
  function resetAutoSlide() {
    clearInterval(sliderInterval);
    startAutoSlide();
  }

  document.getElementById('heroNext')?.addEventListener('click', () => { goToSlide(currentSlide + 1); resetAutoSlide(); });
  document.getElementById('heroPrev')?.addEventListener('click', () => { goToSlide(currentSlide - 1); resetAutoSlide(); });
  dots.forEach(dot => {
    dot.addEventListener('click', () => { goToSlide(+dot.dataset.slide); resetAutoSlide(); });
  });

  if (slides.length > 0) startAutoSlide();

  // Carrega as fotos restantes do banner apenas após o site carregar completamente
  window.addEventListener('load', () => {
    setTimeout(() => {
      slides.forEach((slide, idx) => {
        if (idx > 0) loadSlideBg(slide);
      });
    }, 1500);
  });

  // ── FEATURED PRODUCTS ──
  const featuredGrid = document.getElementById('featuredGrid');
  if (featuredGrid) {
    const featured = getFeaturedProducts().slice(0, 8);
    featuredGrid.innerHTML = renderProductCards(featured);
  }

  // ── NEW ARRIVALS ──
  const newGrid = document.getElementById('newArrivalsGrid');
  if (newGrid) {
    const news = getNewArrivals().slice(0, 4);
    newGrid.innerHTML = renderProductCards(news);
  }

  // ── TOAST ──
  window.showToast = function(msg, duration = 2800) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  };

  // ── HEADER SCROLL ──
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) header?.classList.add('scrolled');
    else header?.classList.remove('scrolled');
  });

});

// ── PRODUCT CARD RENDERER (Sanitizado contra XSS) ──
function renderProductCards(products) {
  if (!products || products.length === 0) {
    return '<p style="color:#888;text-align:center;padding:2rem">Nenhum produto encontrado.</p>';
  }
  return products.map(p => `
    <article class="product-card" onclick="window.location.href='produto.html?slug=${encodeURIComponent(p.slug)}'">
      <div class="product-card-img-wrap">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="product-card-img" loading="lazy"/>
        ${p.new_arrival ? '<span class="product-badge new">Novo</span>' : ''}
        ${p.featured && !p.new_arrival ? '<span class="product-badge">Destaque</span>' : ''}
      </div>
      <div class="product-card-info">
        <h3 class="product-card-name">${escapeHtml(p.name)}</h3>
        <p class="product-card-price">${formatPrice(p.price)}</p>
        <p class="product-card-installments">${formatInstallments(p.price, p.installments)}</p>
        <button class="btn-add-card" onclick="event.stopPropagation(); quickAddToCart('${escapeHtml(p.id)}')">
          <i class="fas fa-shopping-bag"></i> Adicionar
        </button>
      </div>
    </article>
  `).join('');
}

// ── QUICK ADD TO CART ──
function quickAddToCart(productId) {
  const product = (window.PRODUCTS || []).find(p => String(p.id) === String(productId));
  if (!product) return;
  const vStock = product.variant_stock || {};
  let size = null;
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    size = product.sizes.find(s => {
      const q = vStock[s] !== undefined ? parseInt(vStock[s]) : (product.stock || 0);
      return q > 0;
    }) || product.sizes[0];
  } else {
    size = 'Único';
  }
  const added = Cart.addItem(product, size);
  if (added && typeof window.openCart === 'function') {
    window.openCart();
  }
}
