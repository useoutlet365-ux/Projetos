// =====================================================
// OUTLET 365 — Catalog Page JS (Seguro contra XSS)
// =====================================================

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

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  let currentCat = params.get('cat') || 'todos';

  const pageTitle    = document.getElementById('pageTitle');
  const pageDesc     = document.getElementById('pageDesc');
  const breadcrumbCat = document.getElementById('breadcrumbCat');
  const catalogGrid  = document.getElementById('catalogGrid');
  const catalogCount = document.getElementById('catalogCount');
  const filterBtns   = document.querySelectorAll('.filter-btn');

  // Carrega produtos do Supabase
  await DB.loadProducts();

  function updateHeader(cat) {
    if (cat === 'todos' || !CATEGORIES[cat]) {
      if (pageTitle)     pageTitle.textContent    = 'Todos os Produtos';
      if (pageDesc)      pageDesc.textContent     = 'Explore nossa coleção completa de moda masculina';
      if (breadcrumbCat) breadcrumbCat.textContent = 'Todos os Produtos';
    } else {
      if (pageTitle)     pageTitle.textContent    = CATEGORIES[cat].label;
      if (pageDesc)      pageDesc.textContent     = CATEGORIES[cat].description;
      if (breadcrumbCat) breadcrumbCat.textContent = CATEGORIES[cat].label;
    }
  }

  function renderCatalog(cat) {
    currentCat = cat;
    updateHeader(cat);
    const products = getProductsByCategory(cat);
    if (catalogCount) catalogCount.textContent = `${products.length} produto${products.length !== 1 ? 's' : ''}`;
    if (catalogGrid) {
      if (products.length === 0) {
        catalogGrid.innerHTML = '<p style="color:#888;text-align:center;padding:3rem;grid-column:1/-1;">Nenhum produto nesta categoria ainda.</p>';
      } else {
        catalogGrid.innerHTML = products.map(p => {
          const hasDiscount = p.original_price && p.original_price > p.price;
          const discPct     = hasDiscount ? Math.round((1 - p.price / p.original_price) * 100) : 0;
          const safeName    = _escape(p.name);
          const safeImg     = _escape(p.image);
          return `
            <article class="product-card" onclick="window.location.href='produto.html?slug=${encodeURIComponent(p.slug)}'">
              <div class="product-card-img-wrap">
                <img src="${safeImg}" alt="${safeName}" class="product-card-img" loading="lazy"/>
                ${p.weekly_promo && discPct > 0 ? `<span class="promo-discount-badge" style="position:absolute;top:.6rem;right:.6rem;background:#ef4444;color:white;font-size:.65rem;font-weight:800;padding:.25rem .5rem;border-radius:50px;">-${discPct}%</span>` : ''}
                ${p.new_arrival && !p.weekly_promo ? '<span class="product-badge new">Novo</span>' : ''}
                ${p.featured && !p.new_arrival && !p.weekly_promo ? '<span class="product-badge">Destaque</span>' : ''}
                ${p.weekly_promo && discPct === 0 ? '<span class="product-badge" style="background:#ef4444;">🔥 Promo</span>' : ''}
              </div>
              <div class="product-card-info">
                <h3 class="product-card-name">${safeName}</h3>
                <p class="product-card-price" style="${p.weekly_promo ? 'color:#ef4444;' : ''}">${formatPrice(p.price)}</p>
                ${hasDiscount ? `<p style="font-size:.73rem;text-decoration:line-through;color:#9ca3af;">${formatPrice(p.original_price)}</p>` : ''}
                <p class="product-card-installments">${formatInstallments(p.price, p.installments)}</p>
                <button class="btn-add-card" onclick="event.stopPropagation(); quickAddToCart('${_escape(p.id)}')">
                  <i class="fas fa-shopping-bag"></i> Adicionar
                </button>
              </div>
            </article>
          `;
        }).join('');
      }
    }

    filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === cat);
    });

    const url = new URL(window.location.href);
    if (cat === 'todos') url.searchParams.delete('cat');
    else url.searchParams.set('cat', cat);
    window.history.replaceState({}, '', url.toString());
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => renderCatalog(btn.dataset.cat));
  });

  renderCatalog(currentCat);
});
