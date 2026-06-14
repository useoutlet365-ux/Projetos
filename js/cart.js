// =====================================================
// OUTLET 365 — Cart Module
// =====================================================

const Cart = (() => {
  const STORAGE_KEY = 'outlet365_cart';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  }

  function save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function getItems() { return load(); }

  function addItem(product, size, qty = 1) {
    const items = load();
    const key = `${product.id}_${size}`;
    const existing = items.find(i => i.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        key, id: product.id, slug: product.slug,
        name: product.name, price: product.price,
        image: product.image, size, qty
      });
    }
    save(items);
    updateUI();

    // ── RASTREAMENTO REAL (Supabase) ──
    if (typeof DB !== 'undefined' && typeof DB.incrementStat === 'function') {
      DB.incrementStat('cart_adds');
    }
  }

  function removeItem(key) {
    const items = load().filter(i => i.key !== key);
    save(items);
    updateUI();
  }

  function updateQty(key, delta) {
    const items = load();
    const item = items.find(i => i.key === key);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    save(items);
    updateUI();
  }

  function getTotal() {
    return load().reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function getCount() {
    return load().reduce((sum, i) => sum + i.qty, 0);
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
      cartItemsEl.innerHTML = items.map(item => `
        <div class="cart-item" id="ci-${item.key.replace(/[^a-z0-9]/gi, '')}">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img" loading="lazy"/>
          <div class="cart-item-info">
            <p class="cart-item-name">${item.name}</p>
            <p class="cart-item-variant">Tamanho: ${item.size}</p>
            <p class="cart-item-price">${formatPrice(item.price)}</p>
            <div class="cart-item-controls">
              <button class="qty-btn" onclick="Cart.updateQty('${item.key}', -1)"><i class="fas fa-minus"></i></button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" onclick="Cart.updateQty('${item.key}', 1)"><i class="fas fa-plus"></i></button>
              <button class="btn-remove-item" onclick="Cart.removeItem('${item.key}')">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('');
      if (cartFooter) cartFooter.style.display = 'flex';
      if (cartSubtotal) cartSubtotal.textContent = formatPrice(getTotal());
    }
  }

  return { getItems, addItem, removeItem, updateQty, getTotal, getCount, clear, updateUI };
})();

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateUI();
});
