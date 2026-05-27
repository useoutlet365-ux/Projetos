// =====================================================
// OUTLET 365 — Home Dynamic Sections (Supabase)
// Carrega Card Principal e Promoções da Semana
// =====================================================

function formatPriceFn(value) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function addHeroToCart(id, name, price, image, size) {
  const product = PRODUCTS.find(p => p.id === id) || { id, slug: id, name: decodeURIComponent(name), price, image, sizes: [size] };
  Cart.addItem(product, size);
  if (typeof showToast === 'function') showToast(`✓ ${decodeURIComponent(name)} adicionado ao carrinho!`);
}

function loadDynamicSections() {
  const products = (window.PRODUCTS || []).filter(p => p.active !== false);

  // ── CARD PRINCIPAL ──
  const heroProducts = products.filter(p => p.hero_card);
  const heroSection  = document.getElementById('heroCardSection');
  const heroGrid     = document.getElementById('heroCardGrid');

  if (heroProducts.length > 0 && heroGrid && heroSection) {
    heroSection.style.display = 'block';
    heroGrid.innerHTML = heroProducts.slice(0, 5).map(p => {
      const hasDiscount = p.original_price && p.original_price > p.price;
      const imgSrc = p.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80';
      const firstSize = Array.isArray(p.sizes) ? p.sizes[0] : 'Único';
      return `
        <div class="hero-card-item" onclick="window.location.href='produto.html?slug=${p.slug}'">
          <div class="hero-card-img-wrap">
            <img src="${imgSrc}" alt="${p.name}" class="hero-card-img" loading="lazy"/>
            ${hasDiscount ? `<span class="promo-discount-badge">-${Math.round((1-p.price/p.original_price)*100)}%</span>` : ''}
          </div>
          <div class="hero-card-info">
            <p class="hero-card-name">${p.name}</p>
            <p class="hero-card-price">
              ${formatPriceFn(p.price)}
              ${hasDiscount ? `<span class="hero-card-orig">${formatPriceFn(p.original_price)}</span>` : ''}
            </p>
          </div>
          <button class="hero-card-btn" onclick="event.stopPropagation();addHeroToCart('${p.id}','${encodeURIComponent(p.name)}',${p.price},'${imgSrc}','${firstSize}')">
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
      const imgSrc      = p.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80';
      const firstSize   = Array.isArray(p.sizes) ? p.sizes[0] : 'Único';
      return `
        <article class="product-card" onclick="window.location.href='produto.html?slug=${p.slug}'">
          <div class="product-card-img-wrap">
            <img src="${imgSrc}" alt="${p.name}" class="product-card-img" loading="lazy"/>
            ${discPct>0 ? `<span class="promo-discount-badge">-${discPct}%</span>` : '<span class="product-badge new">🔥 Promo</span>'}
          </div>
          <div class="product-card-info">
            <h3 class="product-card-name">${p.name}</h3>
            <p class="product-card-price" style="color:#ef4444;">${formatPriceFn(p.price)}</p>
            ${hasDiscount ? `<p class="promo-original-price">${formatPriceFn(p.original_price)}</p>` : ''}
            <p class="product-card-installments">${p.installments>1 ? `ou ${p.installments}x de ${formatPriceFn(p.price/p.installments)}` : 'À vista'}</p>
            <button class="btn-add-card" onclick="event.stopPropagation();addHeroToCart('${p.id}','${encodeURIComponent(p.name)}',${p.price},'${imgSrc}','${firstSize}')">
              <i class="fas fa-shopping-bag"></i> Adicionar
            </button>
          </div>
        </article>
      `;
    }).join('');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await DB.loadProducts(); // retorna do cache se já iniciado por main.js
  loadDynamicSections();
});
