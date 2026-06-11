// =====================================================
// OUTLET 365 — Product Detail Page (PDP)
// =====================================================

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
  document.getElementById('pageDesc').setAttribute('content', product.description);

  // Breadcrumb
  const catInfo = CATEGORIES[product.category] || { label: 'Produtos' };
  document.getElementById('pdpBreadCat').textContent = catInfo.label;
  document.getElementById('pdpBreadCat').href = `categoria.html?cat=${product.category}`;
  document.getElementById('pdpBreadName').textContent = product.name;

  let selectedSize = product.sizes[0];
  let currentImgIndex = 0;

  // Build PDP
  document.getElementById('pdpContent').innerHTML = `
    <!-- Gallery -->
    <div class="pdp-gallery">
      <div class="pdp-main-img">
        <img src="${product.images[0]}" alt="${product.name}" id="mainImg" />
      </div>
      ${product.images.length > 1 ? `
      <div class="pdp-thumbs" id="pdpThumbs">
        ${product.images.map((img, i) => `
          <div class="pdp-thumb ${i === 0 ? 'active' : ''}" data-index="${i}" onclick="switchImage(${i})">
            <img src="${img}" alt="${product.name} ${i + 1}" loading="lazy"/>
          </div>
        `).join('')}
      </div>` : ''}
    </div>

    <!-- Info -->
    <div class="pdp-info">
      <p class="pdp-category">${catInfo.label} · ${product.subcategory}</p>
      <h1 class="pdp-name">${product.name}</h1>
      <p class="pdp-price">${formatPrice(product.price)}</p>
      <p class="pdp-installments">${formatInstallments(product.price, product.installments)}</p>

      <hr class="pdp-divider" />

      <!-- Tamanhos -->
      <p class="pdp-label">Tamanho</p>
      <div class="size-grid" id="sizeGrid">
        ${product.sizes.map(s => `
          <button class="size-btn ${s === selectedSize ? 'selected' : ''}"
            data-size="${s}" onclick="selectSize('${s}')">
            ${s}
          </button>
        `).join('')}
      </div>

      <!-- Ações -->
      <div class="pdp-actions">
        <button class="btn-pdp-buy" id="btnBuy" onclick="handleBuy()">
          <i class="fas fa-bolt"></i> COMPRAR AGORA
        </button>
        <button class="btn-pdp-cart" id="btnCart" onclick="handleAddToCart()">
          <i class="fas fa-shopping-bag"></i> ADICIONAR AO CARRINHO
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
        <p>${product.description}</p>
      </div>

      <!-- Compartilhar -->
      <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;">
        <span style="font-size:.78rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#888;">Compartilhar:</span>
        <a href="https://wa.me/?text=Confira ${encodeURIComponent(product.name)} na Outlet 365!" target="_blank"
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
      <article class="product-card" onclick="window.location.href='produto.html?slug=${p.slug}'">
        <div class="product-card-img-wrap">
          <img src="${p.image}" alt="${p.name}" class="product-card-img" loading="lazy"/>
          ${p.new_arrival ? '<span class="product-badge new">Novo</span>' : ''}
        </div>
        <div class="product-card-info">
          <h3 class="product-card-name">${p.name}</h3>
          <p class="product-card-price">${formatPrice(p.price)}</p>
          <p class="product-card-installments">${formatInstallments(p.price, p.installments)}</p>
          <button class="btn-add-card" onclick="event.stopPropagation(); quickAddToCart('${p.id}')">
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
    if (mainImg) mainImg.src = product.images[index];
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
    if (!selectedSize) { showToast('Selecione um tamanho'); return; }
    Cart.addItem(product, selectedSize);
    showToast(`✓ ${product.name} (${selectedSize}) adicionado ao carrinho!`);
    // Open cart drawer
    document.getElementById('cartDrawer')?.classList.add('active');
    document.getElementById('cartOverlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.handleBuy = function() {
    if (!selectedSize) { showToast('Selecione um tamanho'); return; }
    Cart.addItem(product, selectedSize);
    window.location.href = 'checkout.html';
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

    freteNote.textContent = 'Buscando CEP...';
    freteOptions.style.display = 'none';

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      const uf = data.uf || 'CE';
      const cidade = data.localidade || 'Sua cidade';

      let options;
      // Local (CE) vs nacional
      if (uf === 'CE') {
        options = [
          { label: 'PAC Correios', price: 18.50, days: '3 a 5 dias úteis' },
          { label: 'SEDEX', price: 28.90, days: '1 a 2 dias úteis' },
          { label: 'Retirada na Loja', price: 0, days: 'Disponível seg–sáb 08:30–17:30' }
        ];
      } else {
        options = [
          { label: 'PAC Correios', price: 26.90, days: '7 a 12 dias úteis' },
          { label: 'SEDEX', price: 48.50, days: '3 a 5 dias úteis' }
        ];
      }

      freteOptions.style.display = 'flex';
      freteOptions.innerHTML = options.map(o => `
        <div class="frete-option">
          <div class="frete-option-info">
            <p>${o.label}</p>
            <span>${o.days}</span>
          </div>
          <span class="frete-option-price">${o.price === 0 ? 'Grátis' : formatPrice(o.price)}</span>
        </div>
      `).join('');
      freteNote.innerHTML = `<i class="fas fa-map-marker-alt" style="color:var(--green)"></i> Frete para <strong>${cidade} - ${uf}</strong>. O prazo não contabiliza feriados.`;

    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      // Fallback
      freteNote.textContent = 'Calculando...';
      setTimeout(() => {
        let options;
        if (cep.startsWith('63') || cep.startsWith('60') || cep.startsWith('62') || cep.startsWith('61')) {
          options = [
            { label: 'PAC Correios', price: 18.50, days: '3 a 5 dias úteis' },
            { label: 'SEDEX', price: 28.90, days: '1 a 2 dias úteis' },
            { label: 'Retirada na Loja', price: 0, days: 'Disponível seg–sáb 08:30–17:30' }
          ];
        } else {
          options = [
            { label: 'PAC Correios', price: 26.90, days: '7 a 12 dias úteis' },
            { label: 'SEDEX', price: 48.50, days: '3 a 5 dias úteis' }
          ];
        }
        freteOptions.style.display = 'flex';
        freteOptions.innerHTML = options.map(o => `
          <div class="frete-option">
            <div class="frete-option-info">
              <p>${o.label}</p>
              <span>${o.days}</span>
            </div>
            <span class="frete-option-price">${o.price === 0 ? 'Grátis' : formatPrice(o.price)}</span>
          </div>
        `).join('');
        freteNote.textContent = 'O prazo de entrega não contabiliza feriados.';
      }, 500);
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
