// =====================================================
// OUTLET 365 — Product Detail Page (PDP - Seguro contra XSS)
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
  const slug = params.get('slug');

  if (!slug) {
    window.location.href = 'categoria.html';
    return;
  }

  await DB.loadProducts();
  const product = getProductBySlug(slug);
  if (!product) {
    document.getElementById('pdpContent').innerHTML = `
      <div style="text-align:center;padding:4rem;color:#888;grid-column:1/-1;">
        <i class="fas fa-exclamation-circle" style="font-size:2rem;"></i>
        <p style="margin-top:1rem;font-size:1rem;">Produto não encontrado.</p>
        <a href="categoria.html" class="btn-primary" style="margin-top:1rem;display:inline-flex;">Ver Catálogo</a>
      </div>
    `;
    return;
  }

  // Page meta
  document.getElementById('pageTitle').textContent = `${product.name} — Outlet 365`;
  document.getElementById('pageDesc').setAttribute('content', product.description || '');

  // Breadcrumb & Botão Voltar
  const catInfo = CATEGORIES[product.category] || { label: 'Produtos' };
  const catUrl = `categoria.html?cat=${encodeURIComponent(product.category)}`;

  const backBtn = document.getElementById('pdpBackBtn');
  const backText = document.getElementById('pdpBackText');
  if (backBtn) {
    backBtn.href = catUrl;
    backBtn.onclick = (e) => {
      if (document.referrer && document.referrer.includes('categoria.html')) {
        e.preventDefault();
        window.history.back();
      }
    };
  }
  if (backText) backText.textContent = `Voltar para ${catInfo.label}`;

  const breadCat = document.getElementById('pdpBreadCat');
  if (breadCat) {
    breadCat.textContent = catInfo.label;
    breadCat.href = catUrl;
  }
  const breadName = document.getElementById('pdpBreadName');
  if (breadName) breadName.textContent = product.name;

  // Encontra primeiro tamanho disponível em estoque
  const vStockInit = product.variant_stock || {};
  let selectedSize = product.sizes.find(s => {
    const qty = vStockInit[s] !== undefined ? parseInt(vStockInit[s]) : (product.stock || 0);
    return qty > 0;
  }) || (product.sizes.length > 0 ? product.sizes[0] : 'Único');

  let currentImgIndex = 0;

  const safeName = _escape(product.name);
  const safeCatLabel = _escape(catInfo.label);
  const safeSubcat = _escape(product.subcategory || '');
  const safeDesc = _escape(product.description || '');
  const mainImage = _escape(product.images[0] || product.image || '');
  const isEntirelyOutOfStock = (product.stock !== undefined && product.stock <= 0);

  // Build PDP
  document.getElementById('pdpContent').innerHTML = `
    <!-- Gallery -->
    <div class="pdp-gallery">
      <div class="pdp-main-img">
        <img src="${mainImage}" alt="${safeName}" id="mainImg" />
      </div>
      ${product.images.length > 1 ? `
      <div class="pdp-thumbs" id="pdpThumbs">
        ${product.images.map((img, i) => `
          <div class="pdp-thumb ${i === 0 ? 'active' : ''}" data-index="${i}" onclick="switchImage(${i})">
            <img src="${_escape(img)}" alt="${safeName} ${i + 1}" loading="lazy"/>
          </div>
        `).join('')}
      </div>` : ''}
    </div>

    <!-- Info -->
    <div class="pdp-info">
      <p class="pdp-category">${safeCatLabel} · ${safeSubcat}</p>
      <h1 class="pdp-name">${safeName}</h1>
      <p class="pdp-price">${formatPrice(product.price)}</p>
      <p class="pdp-installments">${formatInstallments(product.price, product.installments)}</p>

      <hr class="pdp-divider" />

      <!-- Tamanhos -->
      <p class="pdp-label">Tamanho</p>
      <div class="size-grid" id="sizeGrid">
        ${product.sizes.map(s => {
          const vStock = product.variant_stock || {};
          const qty = vStock[s] !== undefined ? parseInt(vStock[s]) : (product.stock !== undefined ? product.stock : 999);
          const isOut = qty <= 0;
          const safeS = _escape(s);
          return `
            <button class="size-btn ${s === selectedSize ? 'selected' : ''} ${isOut ? 'disabled' : ''}"
              data-size="${safeS}" ${isOut ? 'disabled title="Tamanho esgotado"' : `onclick="selectSize('${safeS}')"`}
              style="${isOut ? 'opacity:0.4;cursor:not-allowed;text-decoration:line-through;' : ''}">
              ${safeS} ${isOut ? '(Esgotado)' : ''}
            </button>
          `;
        }).join('')}
      </div>

      <!-- Ações -->
      <div class="pdp-actions">
        <button class="btn-pdp-buy" id="btnBuy" ${isEntirelyOutOfStock ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} onclick="handleBuy()">
          <i class="fas fa-bolt"></i> ${isEntirelyOutOfStock ? 'ESGOTADO' : 'COMPRAR AGORA'}
        </button>
        <button class="btn-pdp-cart" id="btnCart" ${isEntirelyOutOfStock ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} onclick="handleAddToCart()">
          <i class="fas fa-shopping-bag"></i> ${isEntirelyOutOfStock ? 'PRODUTO ESGOTADO' : 'ADICIONAR AO CARRINHO'}
        </button>
      </div>

      <!-- Frete -->
      <div class="frete-box">
        <p class="frete-box-title"><i class="fas fa-truck" style="color:var(--green);margin-right:.4rem"></i> Calcular Frete</p>
        <div class="frete-input-row">
          <input type="text" class="frete-input" id="freteInput"
            placeholder="Digite seu CEP" maxlength="9" />
          <button class="btn-frete" onclick="calcularFrete()">Calcular</button>
        </div>
        <div class="frete-options" id="freteOptions" style="display:none;"></div>
        <p class="frete-note" id="freteNote"></p>
      </div>

      <hr class="pdp-divider" />

      <!-- Descrição -->
      <div class="pdp-description">
        <h3>Descrição</h3>
        <p>${safeDesc}</p>
      </div>

      <!-- Compartilhar -->
      <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;">
        <span style="font-size:.78rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#888;">Compartilhar:</span>
        <a href="https://wa.me/?text=${encodeURIComponent(`Confira ${product.name} na Outlet 365!`)}" target="_blank"
          style="color:#25D366;font-size:1.2rem;"><i class="fab fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/outlet365__" target="_blank"
          style="color:#e1306c;font-size:1.2rem;"><i class="fab fa-instagram"></i></a>
      </div>
    </div>
  `;

  // Similares
  const similares = getSimilarProducts(product, 6);
  if (similares.length > 0) {
    const sec = document.getElementById('similaresSection');
    const grid = document.getElementById('similaresGrid');
    sec.style.display = 'block';
    grid.innerHTML = similares.map(p => `
      <article class="product-card" onclick="window.location.href='produto.html?slug=${encodeURIComponent(p.slug)}'">
        <div class="product-card-img-wrap">
          <img src="${_escape(p.image)}" alt="${_escape(p.name)}" class="product-card-img" loading="lazy"/>
          ${p.new_arrival ? '<span class="product-badge new">Novo</span>' : ''}
        </div>
        <div class="product-card-info">
          <h3 class="product-card-name">${_escape(p.name)}</h3>
          <p class="product-card-price">${formatPrice(p.price)}</p>
          <p class="product-card-installments">${formatInstallments(p.price, p.installments)}</p>
          <button class="btn-add-card" onclick="event.stopPropagation(); quickAddToCart('${_escape(p.id)}')">
            <i class="fas fa-shopping-bag"></i> Adicionar
          </button>
        </div>
      </article>
    `).join('');
  }

  // ─ FUNCTIONS ─

  window.switchImage = function(index) {
    currentImgIndex = index;
    const mainImg = document.getElementById('mainImg');
    if (mainImg && product.images[index]) mainImg.src = product.images[index];
    document.querySelectorAll('.pdp-thumb').forEach((t, i) => {
      t.classList.toggle('active', i === index);
    });
  };

  window.selectSize = function(size) {
    selectedSize = size;
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.size === size);
    });
  };

  window.handleAddToCart = function() {
    if (!selectedSize) { showToast('Selecione um tamanho disponível'); return; }
    const success = Cart.addItem(product, selectedSize);
    if (success) {
      document.getElementById('cartDrawer')?.classList.add('active');
      document.getElementById('cartOverlay')?.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  window.handleBuy = function() {
    if (!selectedSize) { showToast('Selecione um tamanho disponível'); return; }
    const success = Cart.addItem(product, selectedSize);
    if (success) {
      window.location.href = 'checkout.html';
    }
  };

  window.calcularFrete = async function() {
    const cepInput = document.getElementById('freteInput');
    const cep = cepInput?.value.replace(/\D/g, '');
    const freteOptions = document.getElementById('freteOptions');
    const freteNote = document.getElementById('freteNote');

    if (!cep || cep.length < 8) {
      showToast('Digite um CEP válido com 8 dígitos');
      return;
    }

    freteNote.textContent = 'Calculando frete com SuperFrete...';
    freteOptions.style.display = 'none';

    try {
      const response = await fetch('/api/calculate-shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep,
          package: {
            weight: product.weight || 0.3,
            height: product.height || 5,
            width: product.width || 15,
            length: product.length || 20
          }
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao calcular frete');
      }

      const data = await response.json();
      const options = data.options || [];

      if (options.length === 0) {
        freteNote.textContent = 'Nenhuma opção de frete disponível para este CEP.';
        return;
      }

      freteOptions.style.display = 'flex';
      freteOptions.innerHTML = options.map(o => `
        <div class="frete-option">
          <div class="frete-option-info">
            <p>${_escape(o.name || o.label || '')}</p>
            <span>${_escape(o.description || (o.delivery_time ? `${o.delivery_time} dias úteis` : o.days) || '')}</span>
          </div>
          <span class="frete-option-price">${o.price === 0 ? 'Grátis' : formatPrice(o.price)}</span>
        </div>
      `).join('');

      const safeCity = _escape(data.city || '');
      const safeState = _escape(data.state || '');
      const locationText = safeCity && safeState ? ` para <strong>${safeCity} - ${safeState}</strong>` : '';
      freteNote.innerHTML = `<i class="fas fa-map-marker-alt" style="color:var(--green)"></i> Frete calculado${locationText}. O prazo de entrega não contabiliza feriados.`;

    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      freteNote.textContent = 'Não foi possível calcular o frete para este CEP no momento.';
    }
  };

  // CEP mask
  const freteInput = document.getElementById('freteInput');
  freteInput?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 5) v = v.slice(0,5) + '-' + v.slice(5,8);
    e.target.value = v;
  });

  freteInput?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') calcularFrete();
  });
});
