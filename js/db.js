// =====================================================
// OUTLET 365 — Database Module (Supabase)
// =====================================================

const DB = (() => {
  let _loaded = false;
  let _promise = null;

  function normalizeProduct(p) {
    const img = p.image_base64 || p.image_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80';
    let vStock = {};
    if (p.variant_stock) {
      try {
        vStock = typeof p.variant_stock === 'string' ? JSON.parse(p.variant_stock) : p.variant_stock;
      } catch (e) { vStock = {}; }
    }
    const sizesArr = (p.sizes || 'Único').split(',').map(s => s.trim()).filter(Boolean);
    let computedStock = p.stock || 0;
    if (Object.keys(vStock).length > 0) {
      computedStock = Object.values(vStock).reduce((acc, cur) => acc + (parseInt(cur) || 0), 0);
    }
    return {
      id:             p.id,
      slug:           p.slug,
      name:           p.name,
      category:       p.category,
      subcategory:    p.subcategory || '',
      price:          parseFloat(p.price) || 0,
      original_price: parseFloat(p.original_price) || 0,
      installments:   p.installments || 3,
      sizes:          sizesArr,
      description:    p.description || '',
      image:          img,
      images:         [img],
      image_base64:   p.image_base64 || '',
      image_url:      p.image_url || '',
      featured:       !!p.featured,
      new_arrival:    !!p.new_arrival,
      weekly_promo:   !!p.weekly_promo,
      hero_card:      !!p.hero_card,
      stock:          computedStock,
      variant_stock:  vStock,
      active:         p.active !== false,
    };
  }

  return {
    // ── Products (public) ───────────────────────────
    async loadProducts() {
      if (_loaded) return window.PRODUCTS;
      if (_promise) return _promise;
      _promise = (async () => {
        const { data, error } = await supabaseClient
          .from('products')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });
        if (error) { console.error('DB.loadProducts:', error); window.PRODUCTS = []; }
        else { window.PRODUCTS = (data || []).map(normalizeProduct); }
        _loaded = true;
        _promise = null;
        return window.PRODUCTS;
      })();
      return _promise;
    },

    // ── Products (admin) ────────────────────────────
    async getAllProducts() {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(normalizeProduct);
    },

    async createProduct(raw) {
      const id = raw.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7));
      const row = {
        id,
        slug:           raw.slug,
        name:           raw.name,
        category:       raw.category,
        subcategory:    raw.subcategory || '',
        price:          parseFloat(raw.price) || 0,
        original_price: parseFloat(raw.original_price) || 0,
        installments:   parseInt(raw.installments) || 3,
        sizes:          raw.sizes || 'Único',
        description:    raw.description || '',
        image_base64:   raw.image_base64 || '',
        image_url:      raw.image_url || '',
        featured:       !!raw.featured,
        new_arrival:    !!raw.new_arrival,
        weekly_promo:   !!raw.weekly_promo,
        hero_card:      !!raw.hero_card,
        stock:          parseInt(raw.stock) || 0,
        variant_stock:  raw.variant_stock || {},
        active:         raw.active !== false,
        sales_count:    0,
      };
      const { data, error } = await supabaseClient.from('products').insert(row).select().single();
      if (error) throw error;
      _loaded = false; // invalidate cache
      return data;
    },

    async updateProduct(id, raw) {
      const updates = {};
      const allowed = ['name','category','subcategory','price','original_price','installments',
        'sizes','description','image_base64','image_url','featured','new_arrival',
        'weekly_promo','hero_card','stock','variant_stock','active','slug'];
      allowed.forEach(k => { if (k in raw) updates[k] = raw[k]; });
      const { data, error } = await supabaseClient.from('products').update(updates).eq('id', id).select().single();
      if (error) throw error;
      _loaded = false;
      return data;
    },

    async decrementStockForOrder(items) {
      // items = [{ id, size, qty }, ...]
      for (const item of items) {
        if (!item.id) continue;
        try {
          const { data: prod } = await supabaseClient.from('products').select('stock, variant_stock').eq('id', item.id).single();
          if (!prod) continue;
          let vStock = prod.variant_stock || {};
          if (typeof vStock === 'string') {
            try { vStock = JSON.parse(vStock); } catch (e) { vStock = {}; }
          }
          const currentTotal = prod.stock || 0;
          const qtyToSub = parseInt(item.qty) || 1;
          const newTotal = Math.max(0, currentTotal - qtyToSub);

          if (item.size && vStock && (item.size in vStock)) {
            const currentSizeQty = parseInt(vStock[item.size]) || 0;
            vStock[item.size] = Math.max(0, currentSizeQty - qtyToSub);
          }

          await supabaseClient.from('products').update({
            stock: newTotal,
            variant_stock: vStock
          }).eq('id', item.id);
        } catch (err) {
          console.error(`Erro ao dar baixa no estoque do produto ${item.id}:`, err);
        }
      }
      _loaded = false;
    },

    async deleteProduct(id) {
      const { error } = await supabaseClient.from('products').delete().eq('id', id);
      if (error) throw error;
      _loaded = false;
    },

    // ── Orders ──────────────────────────────────────
    async createOrder(orderData) {
      let { data, error } = await supabaseClient.from('orders').insert(orderData).select().single();
      if (error && error.message && error.message.includes('channel')) {
        console.warn('Coluna channel ainda não existe na tabela orders do Supabase. Salvando sem a coluna...');
        const copy = { ...orderData };
        delete copy.channel;
        const retry = await supabaseClient.from('orders').insert(copy).select().single();
        if (retry.error) throw retry.error;
        return retry.data;
      }
      if (error) throw error;
      return data;
    },

    async getAllOrders() {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async updateOrderStatus(id, status) {
      const { error } = await supabaseClient.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    },

    // ── Auth ────────────────────────────────────────
    async signIn(email, password) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },

    async signOut() {
      await supabaseClient.auth.signOut();
    },

    async getUser() {
      const { data: { user } } = await supabaseClient.auth.getUser();
      return user;
    },

    // ── site_stats ──────────────────────────────────
    async getSiteStats() {
      const { data, error } = await supabaseClient
        .from('site_stats')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },

    async incrementStat(col, isNewVisitor = false) {
      try {
        const { error } = await supabaseClient.rpc('increment_stat', {
          stat_col: col,
          is_new_visitor: isNewVisitor
        });
        if (error) console.error('incrementStat error:', error);
      } catch (err) {
        console.error('incrementStat exception:', err);
      }
    },
  };
})();
