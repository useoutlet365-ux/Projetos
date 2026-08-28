// =====================================================
// OUTLET 365 — Cart Module com Controle de Estoque
// =====================================================

const Cart = (() => {
  const STORAGE_KEY = 'outlet365_cart';

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

  function _toast(msg, duration = 2800) {
    if (typeof showToast === 'function') {
      showToast(msg, duration);
    } else {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
      }
    }
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  }

  function save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function getItems() { return load(); }

  // ── Consulta Estoque Real Disponível por Variação / Produto ──
  function getAvailableStock(productId, size, productObj = null) {
    const prod = productObj || (window.PRODUCTS || []).find(p => String(p.id) === String(productId));
    if (!prod) return 999; // Fallback se não encontrar objeto

    let vStock = prod.variant_stock || {};
    if (typeof vStock === 'string') {
      try { vStock = JSON.parse(vStock); } catch (e) { vStock = {}; }
    }

    if (size && vStock && vStock[size] !== undefined) {
      return Math.max(0, parseInt(vStock[size]) || 0);
    }

    if (prod.stock !== undefined && prod.stock !== null) {
      return Math.max(0, parseInt(prod.stock) || 0);
    }

    return 999;
  }

  // ── Adicionar Item ao Carrinho com Validação Rígida de Estoque ──
  function addItem(product, size, qty = 1) {
    if (!product || !product.id) return false;
    const chosenSize = size || (Array.isArray(product.sizes) ? product.sizes[0] : (product.sizes ? String(product.sizes).split(',')[0].trim() : 'Único'));
    const avail = getAvailableStock(product.id, chosenSize, product);

    if (avail <= 0) {
      _toast(`⚠️ O tamanho ${chosenSize} de "${product.name}" está esgotado no momento.`, 3200);
      return false;
    }

    const items = load();
    const key = `${product.id}_${chosenSize}`;
    const existing = items.find(i => i.key === key);
    const currentQtyInCart = existing ? (parseInt(existing.qty) || 0) : 0;
    const requestedQty = parseInt(qty) || 1;

    if (currentQtyInCart + requestedQty > avail) {
      if (currentQtyInCart >= avail) {
        _toast(`⚠️ Você já adicionou todo o estoque disponível deste item (${avail} un).`, 3200);
        return false;
      }
      const canAdd = avail - currentQtyInCart;
      if (existing) {
        existing.qty = avail;
      } else {
        items.push({
          key, id: product.id, slug: product.slug,
          name: product.name, price: parseFloat(product.price) || 0,
          image: product.image || product.image_base64 || product.image_url || '',
          size: chosenSize, qty: avail
        });
      }
      save(items);
      updateUI();
      _toast(`⚠️ Adicionado(s) ${canAdd} un de "${product.name}" (${chosenSize}) — limite de estoque atingido.`, 3500);
      return true;
    }

    if (existing) {
      existing.qty += requestedQty;
    } else {
      items.push({
        key, id: product.id, slug: product.slug,
        name: product.name, price: parseFloat(product.price) || 0,
        image: product.image || product.image_base64 || product.image_url || '',
        size: chosenSize, qty: requestedQty
      });
    }

    save(items);
    updateUI();
    _toast(`✓ ${product.name} (${chosenSize}) adicionado ao carrinho!`);

    // ── RASTREAMENTO REAL (Supabase) ──
    if (typeof DB !== 'undefined' && typeof DB.incrementStat === 'function') {
      DB.incrementStat('cart_adds');
    }

    return true;
  }

  function removeItem(key) {
    const items = load().filter(i => i.key !== key);
    save(items);
    updateUI();
  }

  // ── Atualizar Quantidade com Trava de Limite de Estoque ──
  function updateQty(key, delta) {
    const items = load();
    const item = items.find(i => i.key === key);
    if (!item) return;

    if (delta > 0) {
      const avail = getAvailableStock(item.id, item.size);
      if (item.qty + delta > avail) {
        _toast(`⚠️ Limite de estoque atingido para este item (${avail} un disponíveis).`, 3000);
        return;
      }
      item.qty += delta;
    } else if (delta < 0) {
      item.qty = Math.max(1, item.qty + delta);
    }

    save(items);
    updateUI();
  }

  // ── Valida e Ajusta Itens do Carrinho Contra o Estoque Atual ──
  function validateStock() {
    if (!window.PRODUCTS || window.PRODUCTS.length === 0) return;
    const items = load();
    let changed = false;
    const validItems = [];

    items.forEach(item => {
      const avail = getAvailableStock(item.id, item.size);
      if (avail <= 0) {
        changed = true;
        _toast(`⚠️ O item "${item.name} (${item.size})" esgotou e foi removido do carrinho.`, 4000);
      } else if (item.qty > avail) {
        item.qty = avail;
        changed = true;
        validItems.push(item);
        _toast(`⚠️ A quantidade de "${item.name} (${item.size})" foi ajustada para ${avail} un (estoque atual).`, 4000);
      } else {
        validItems.push(item);
      }
    });

    if (changed) {
      save(validItems);
      updateUI();
    }
  }

  function getTotal() {
    return load().reduce((sum, i) => sum + (parseFloat(i.price) || 0) * (parseInt(i.qty) || 1), 0);
  }

  function getCount() {
    return load().reduce((sum, i) => sum + (parseInt(i.qty) || 1), 0);
  }

  function clear() { save([]); updateUI(); }

  function updateUI() {
    const items = load();
    const count = getCount();
    const badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = count;

    const cartItemsEl = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartFooter = document.getElementById('cartFooter');
    const cartSubtotal = document.getElementById('cartSubtotal');

    if (!cartItemsEl) return;

    if (items.length === 0) {
      cartItemsEl.innerHTML = '';
      if (cartEmpty) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'cart-empty';
        emptyDiv.id = 'cartEmpty';
        emptyDiv.innerHTML = `
          <i class="fas fa-shopping-bag"></i>
          <p>Seu carrinho está vazio</p>
          <a href="categoria.html?cat=camisas" class="btn-primary">Ver Produtos</a>
        `;
        cartItemsEl.appendChild(emptyDiv);
      }
      if (cartFooter) cartFooter.style.display = 'none';
    } else {
      cartItemsEl.innerHTML = items.map(item => {
        const safeKey = _escape(item.key);
        const safeName = _escape(item.name);
        const safeSize = _escape(item.size);
        const safeImg = _escape(item.image);
        const safeKeyId = item.key.replace(/[^a-z0-9]/gi, '');
        const avail = getAvailableStock(item.id, item.size);
        const isMaxStock = item.qty >= avail;

        return `
        <div class="cart-item" id="ci-${safeKeyId}">
          <img src="${safeImg}" alt="${safeName}" class="cart-item-img" loading="lazy"/>
          <div class="cart-item-info">
            <p class="cart-item-name">${safeName}</p>
            <p class="cart-item-variant">Tamanho: ${safeSize} ${avail < 999 ? `<span style="font-size:.72rem;color:var(--gray-400);margin-left:.35rem;">(${avail} em estoque)</span>` : ''}</p>
            <p class="cart-item-price">${formatPrice(item.price)}</p>
            <div class="cart-item-controls">
              <button class="qty-btn" onclick="Cart.updateQty('${safeKey}', -1)" title="Diminuir"><i class="fas fa-minus"></i></button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" ${isMaxStock ? 'disabled style="opacity:0.35;cursor:not-allowed;" title="Limite de estoque atingido"' : 'title="Aumentar"'} onclick="Cart.updateQty('${safeKey}', 1)"><i class="fas fa-plus"></i></button>
              <button class="btn-remove-item" onclick="Cart.removeItem('${safeKey}')" title="Remover item">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;}).join('');
      if (cartFooter) cartFooter.style.display = 'flex';
      if (cartSubtotal) cartSubtotal.textContent = formatPrice(getTotal());
    }
  }

  return { getItems, addItem, removeItem, updateQty, getAvailableStock, validateStock, getTotal, getCount, clear, updateUI };
})();

// Init on load
document.addEventListener('DOMContentLoaded', async () => {
  Cart.updateUI();
  if (typeof DB !== 'undefined') {
    await DB.loadProducts();
    Cart.validateStock();
    Cart.updateUI();
  }
});
