// =====================================================
// OUTLET 365 — Home Dynamic Sections (Seguro contra XSS)
// Carrega Categorias Dinâmicas, Card Principal, Promoções e Instagram Feed
// =====================================================

const CAT_ICONS = {
  'camisas': 'fas fa-tshirt',
  'shorts-calcas': 'fas fa-vest',
  'calcados-chinelos': 'fas fa-shoe-prints',
  'acessorios': 'fas fa-glasses',
  'perfumes': 'fas fa-spray-can-sparkles'
};

const CAT_GRADIENTS = {
  'camisas': 'linear-gradient(135deg, #1e3a29 0%, #0f172a 100%)',
  'shorts-calcas': 'linear-gradient(135deg, #1e293b 0%, #172554 100%)',
  'calcados-chinelos': 'linear-gradient(135deg, #312e81 0%, #0f172a 100%)',
  'acessorios': 'linear-gradient(135deg, #3730a3 0%, #18181b 100%)',
  'perfumes': 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)'
};

function _escape(str) {
  if (typeof escapeHtml === 'function') return escapeHtml(str);
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPriceFn(value) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function addHeroToCart(id, name, price, image, size) {
  const product = (window.PRODUCTS || []).find(p => String(p.id) === String(id)) || { id, slug: id, name: decodeURIComponent(name), price, image, sizes: [size] };
  if (typeof Cart !== 'undefined' && Cart.addItem) {
    const added = Cart.addItem(product, size);
    if (added && typeof window.openCart === 'function') {
      window.openCart();
    }
  }
}

// ── 1. CARREGA FOTOS REAIS DAS CATEGORIAS ──
function loadCategoryImages() {
  const products = (window.PRODUCTS || []).filter(p => p.active !== false);
  const catCards = document.querySelectorAll('[data-cat-img]');

  catCards.forEach(imgEl => {
    const cat = imgEl.getAttribute('data-cat-img');
    if (!cat) return;

    // Filtra produtos desta categoria
    const catProducts = products.filter(p => p.category === cat);

    const chosen = catProducts.find(p => p.category_cover && (p.image || p.image_base64 || p.image_url))
      || catProducts.find(p => p.featured && (p.image || p.image_base64 || p.image_url))
      || catProducts.find(p => p.hero_card && (p.image || p.image_base64 || p.image_url))
      || catProducts.find(p => (p.image || p.image_base64 || p.image_url))
      || catProducts[0];

    if (chosen) {
      const imgUrl = chosen.image_base64 || chosen.image_url || chosen.image;
      if (imgUrl) {
        imgEl.style.backgroundImage = `url('${encodeURI(imgUrl)}')`;
        imgEl.style.backgroundSize = 'cover';
        imgEl.style.backgroundPosition = 'center';
        imgEl.style.backgroundColor = 'transparent';
        imgEl.innerHTML = '';
      } else {
        const iconClass = CAT_ICONS[cat] || 'fas fa-tag';
        imgEl.style.backgroundImage = 'none';
        imgEl.style.background = CAT_GRADIENTS[cat] || 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
        imgEl.innerHTML = `<i class="${iconClass} category-placeholder-icon"></i>`;
      }
    } else {
      const iconClass = CAT_ICONS[cat] || 'fas fa-tag';
      imgEl.style.backgroundImage = 'none';
      imgEl.style.background = CAT_GRADIENTS[cat] || 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
      imgEl.innerHTML = `<i class="${iconClass} category-placeholder-icon"></i>`;
    }
  });
}

// ── 2. CARREGA FEED DO INSTAGRAM COM PRODUTOS REAIS ──
function loadInstagramFeed() {
  const instaGrid = document.getElementById('instagramGrid');
  if (!instaGrid) return;

  const products = (window.PRODUCTS || []).filter(p => p.active !== false);
  const productsWithImg = products.filter(p => p.image_base64 || p.image_url || p.image);

  if (productsWithImg.length > 0) {
    const displayItems = productsWithImg.slice(0, 6);
    instaGrid.innerHTML = displayItems.map(p => {
      const img = _escape(p.image_base64 || p.image_url || p.image);
      const safeName = _escape(p.name);
      return `
        <a href="produto.html?slug=${encodeURIComponent(p.slug)}" class="insta-cell" title="${safeName}">
          <img src="${img}" alt="${safeName}" loading="lazy" />
          <div class="insta-overlay"><i class="fas fa-shopping-bag"></i></div>
        </a>
      `;
    }).join('');
  }
}

// ── 3. CARREGA TODAS AS SEÇÕES DINÂMICAS ──
function loadDynamicSections() {
  const products = (window.PRODUCTS || []).filter(p => p.active !== false);

  loadCategoryImages();
  loadInstagramFeed();

  // ── CARD PRINCIPAL ──
  const heroProducts = products.filter(p => p.hero_card);
  const heroSection  = document.getElementById('heroCardSection');
  const heroGrid     = document.getElementById('heroCardGrid');

  if (heroProducts.length > 0 && heroGrid && heroSection) {
    heroSection.style.display = 'block';
    heroGrid.innerHTML = heroProducts.slice(0, 5).map(p => {
      const hasDiscount = p.original_price && p.original_price > p.price;
      const imgSrc = _escape(p.image || p.image_base64 || p.image_url || '');
      const safeName = _escape(p.name);
      const firstSize = Array.isArray(p.sizes) ? p.sizes[0] : (p.sizes ? p.sizes.split(',')[0].trim() : 'Único');
      const safeFirstSize = _escape(firstSize);
      return `
        <div class="hero-card-item" onclick="window.location.href='produto.html?slug=${encodeURIComponent(p.slug)}'">
          <div class="hero-card-img-wrap">
            ${imgSrc ? `<img src="${imgSrc}" alt="${safeName}" class="hero-card-img" loading="lazy"/>` : '<div class="hero-card-img" style="background:#2d3748;display:flex;align-items:center;justify-content:center;color:#fff;"><i class="fas fa-tshirt"></i></div>'}
            ${hasDiscount ? `<span class="promo-discount-badge">-${Math.round((1-p.price/p.original_price)*100)}%</span>` : ''}
          </div>
          <div class="hero-card-info">
            <p class="hero-card-name">${safeName}</p>
            <p class="hero-card-price">
              ${formatPriceFn(p.price)}
              ${hasDiscount ? `<span class="hero-card-orig">${formatPriceFn(p.original_price)}</span>` : ''}
            </p>
          </div>
          <button class="hero-card-btn" onclick="event.stopPropagation();addHeroToCart('${_escape(p.id)}','${encodeURIComponent(p.name)}',${p.price},'${imgSrc}','${safeFirstSize}')">
            <i class="fas fa-shopping-bag"></i> Adicionar
          </button>
        </div>
      `;
    }).join('');
  }

  // ── PROMOÇÕES DA SEMANA ──
  const promoProducts = products.filter(p => p.weekly_promo);
  const promoSection  = document.getElementById('promoSection');
  const promoGrid     = document.getElementById('promoGrid');

  if (promoProducts.length > 0 && promoGrid && promoSection) {
    promoSection.style.display = 'block';
    promoGrid.innerHTML = promoProducts.slice(0, 8).map(p => {
      const hasDiscount = p.original_price && p.original_price > p.price;
      const discPct     = hasDiscount ? Math.round((1 - p.price / p.original_price) * 100) : 0;
      const imgSrc      = _escape(p.image || p.image_base64 || p.image_url || '');
      const safeName    = _escape(p.name);
      const firstSize   = Array.isArray(p.sizes) ? p.sizes[0] : (p.sizes ? p.sizes.split(',')[0].trim() : 'Único');
      const safeFirstSize = _escape(firstSize);
      return `
        <article class="product-card" onclick="window.location.href='produto.html?slug=${encodeURIComponent(p.slug)}'">
          <div class="product-card-img-wrap">
            ${imgSrc ? `<img src="${imgSrc}" alt="${safeName}" class="product-card-img" loading="lazy"/>` : '<div class="product-card-img" style="background:#2d3748;display:flex;align-items:center;justify-content:center;color:#fff;"><i class="fas fa-tshirt"></i></div>'}
            ${discPct>0 ? `<span class="promo-discount-badge">-${discPct}%</span>` : '<span class="product-badge new">🔥 Promo</span>'}
          </div>
          <div class="product-card-info">
            <h3 class="product-card-name">${safeName}</h3>
            <p class="product-card-price" style="color:#ef4444;">${formatPriceFn(p.price)}</p>
            ${hasDiscount ? `<p class="promo-original-price">${formatPriceFn(p.original_price)}</p>` : ''}
            <p class="product-card-installments">${p.installments>1 ? `ou ${p.installments}x de ${formatPriceFn(p.price/p.installments)}` : 'À vista'}</p>
            <button class="btn-add-card" onclick="event.stopPropagation();addHeroToCart('${_escape(p.id)}','${encodeURIComponent(p.name)}',${p.price},'${imgSrc}','${safeFirstSize}')">
              <i class="fas fa-shopping-bag"></i> Adicionar
            </button>
          </div>
        </article>
      `;
    }).join('');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof DB !== 'undefined') {
    await DB.loadProducts();
  }
  loadDynamicSections();
});
