// =====================================================
// OUTLET 365 — Database Module (Supabase)
// =====================================================

const DB = (() => {
  let _loaded = false;
  let _promise = null;

  function normalizeProduct(p) {
    const img = p.image_base64 || p.image_url || '';
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
      images:         img ? [img] : [],
      image_base64:   p.image_base64 || '',
      image_url:      p.image_url || '',
      featured:       !!p.featured,
      new_arrival:    !!p.new_arrival,
      weekly_promo:   !!p.weekly_promo,
      hero_card:      !!p.hero_card,
      category_cover: !!p.category_cover,
      weight:         parseFloat(p.weight) || 0.3,
      height:         parseFloat(p.height) || 5,
      width:          parseFloat(p.width) || 15,
      length:         parseFloat(p.length) || 20,
      stock:          computedStock,
      variant_stock:  vStock,
      active:         p.active !== false,
    };
  }

  return {
    // ── Products (public) ───────────────────────────
    async loadProducts() {
      // 1. Carrega imediatamente do cache local para que produtos e fotos apareçam em 0ms
      if (!window.PRODUCTS || window.PRODUCTS.length === 0) {
        try {
          const cached = localStorage.getItem('outlet365_products_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              window.PRODUCTS = parsed;
              _loaded = true;
            }
          }
        } catch (e) {}
      }

      if (_loaded && window.PRODUCTS && window.PRODUCTS.length > 0) {
        // Revalida em background sem travar o carregamento do site
        if (!_promise) {
          _promise = (async () => {
            try {
              const { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .eq('active', true)
                .order('created_at', { ascending: false });
              if (!error && data) {
                window.PRODUCTS = data.map(normalizeProduct);
                try {
                  localStorage.setItem('outlet365_products_cache', JSON.stringify(window.PRODUCTS));
                } catch (e) {}
              }
            } catch (err) {
              console.warn('Revalidação de produtos em background:', err);
            } finally {
              _promise = null;
            }
            return window.PRODUCTS;
          })();
        }
        return window.PRODUCTS;
      }

      if (_promise) return _promise;
      _promise = (async () => {
        try {
          const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });
          if (error) {
            console.error('DB.loadProducts:', error);
            if (!window.PRODUCTS) window.PRODUCTS = [];
          } else {
            window.PRODUCTS = (data || []).map(normalizeProduct);
            try {
              localStorage.setItem('outlet365_products_cache', JSON.stringify(window.PRODUCTS));
            } catch (e) {}
          }
        } catch (e) {
          console.error('DB.loadProducts error:', e);
          if (!window.PRODUCTS) window.PRODUCTS = [];
        }
        _loaded = true;
        _promise = null;
        return window.PRODUCTS;
      })();
      return _promise;
    },

    async getProductBySlugOrId(identifier) {
      if (!identifier) return null;
      const target = decodeURIComponent(String(identifier)).trim();

      // 1. Busca rápida na memória caso o catálogo já tenha sido carregado
      if (window.PRODUCTS && window.PRODUCTS.length > 0) {
        const found = window.PRODUCTS.find(p =>
          (p.slug && p.slug.toLowerCase() === target.toLowerCase()) ||
          (p.id && String(p.id).toLowerCase() === target.toLowerCase())
        );
        if (found) return found;
      }

      // 2. Consulta direta ultra-rápida no Supabase (por slug ou por id)
      try {
        let { data, error } = await supabaseClient
          .from('products')
          .select('*')
          .eq('slug', target)
          .limit(1)
          .maybeSingle();

        if (!data) {
          const res = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', target)
            .limit(1)
            .maybeSingle();
          data = res.data;
          error = res.error;
        }

        if (!error && data) {
          const prod = normalizeProduct(data);
          if (!window.PRODUCTS) window.PRODUCTS = [];
          if (!window.PRODUCTS.some(p => p.id === prod.id)) {
            window.PRODUCTS.push(prod);
          }
          return prod;
        }
      } catch (e) {
        console.warn('DB.getProductBySlugOrId:', e);
      }

      // 3. Fallback: carrega catálogo completo
      await this.loadProducts();
      return (window.PRODUCTS || []).find(p =>
        (p.slug && p.slug.toLowerCase() === target.toLowerCase()) ||
        (p.id && String(p.id).toLowerCase() === target.toLowerCase())
      ) || null;
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
        category_cover: !!raw.category_cover,
        weight:         parseFloat(raw.weight) || 0.3,
        height:         parseFloat(raw.height) || 5,
        width:          parseFloat(raw.width) || 15,
        length:         parseFloat(raw.length) || 20,
        stock:          parseInt(raw.stock) || 0,
        variant_stock:  raw.variant_stock || {},
        active:         raw.active !== false,
        sales_count:    0,
      };
      let { data, error } = await supabaseClient.from('products').insert(row).select().single();
      if (error && error.message) {
        const copy = { ...row };
        let modified = false;
        ['category_cover', 'weight', 'height', 'width', 'length'].forEach(col => {
          if (error.message.includes(col)) { delete copy[col]; modified = true; }
        });
        if (modified) {
          const retry = await supabaseClient.from('products').insert(copy).select().single();
          if (retry.error) throw retry.error;
          data = retry.data;
          error = null;
        }
      }
      if (error) throw error;
      _loaded = false; // invalidate cache
      try { localStorage.removeItem('outlet365_products_cache'); } catch (e) {}
      return data;
    },

    async updateProduct(id, raw) {
      const updates = {};
      const allowed = ['name','category','subcategory','price','original_price','installments',
        'sizes','description','image_base64','image_url','featured','new_arrival',
        'weekly_promo','hero_card','category_cover','weight','height','width','length','stock','variant_stock','active','slug'];
      allowed.forEach(k => { if (k in raw) updates[k] = raw[k]; });
      let { data, error } = await supabaseClient.from('products').update(updates).eq('id', id).select().single();
      if (error && error.message) {
        let modified = false;
        ['category_cover', 'weight', 'height', 'width', 'length'].forEach(col => {
          if (error.message.includes(col)) { delete updates[col]; modified = true; }
        });
        if (modified) {
          const retry = await supabaseClient.from('products').update(updates).eq('id', id).select().single();
          if (retry.error) throw retry.error;
          data = retry.data;
          error = null;
        }
      }
      if (error) throw error;
      _loaded = false;
      try { localStorage.removeItem('outlet365_products_cache'); } catch (e) {}
      return data;
    },

    async decrementStockForOrder(items) {
      // items = [{ id, size, qty }, ...]
      for (const item of items) {
        if (!item.id) continue;
        try {
          const { error: rpcErr } = await supabaseClient.rpc('decrement_product_stock', {
            item_id: item.id,
            qty_to_sub: parseInt(item.qty) || 1,
            item_size: item.size || null
          });
          if (rpcErr) {
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
          }
        } catch (err) {
          console.error(`Erro ao dar baixa no estoque do produto ${item.id}:`, err);
        }
      }
      _loaded = false;
      try { localStorage.removeItem('outlet365_products_cache'); } catch (e) {}
    },

    async deleteProduct(id) {
      const { error } = await supabaseClient.from('products').delete().eq('id', id);
      if (error) throw error;
      _loaded = false;
      try { localStorage.removeItem('outlet365_products_cache'); } catch (e) {}
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
    // ── Storage (Imagens) ───────────────────────────
    base64ToBlob(base64Data) {
      if (!base64Data || typeof base64Data !== 'string') return null;
      try {
        const parts = base64Data.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'image/jpeg';
        const raw = window.atob(parts[1] || parts[0]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        return new Blob([uInt8Array], { type: contentType });
      } catch (err) {
        console.error('base64ToBlob error:', err);
        return null;
      }
    },

    async uploadProductImage(fileOrBlob, fileName) {
      if (!fileOrBlob) throw new Error('Nenhum arquivo ou imagem fornecido para upload.');
      const ext = (fileOrBlob.type && fileOrBlob.type.includes('png')) ? 'png' 
                : (fileOrBlob.type && fileOrBlob.type.includes('webp')) ? 'webp' : 'jpg';
      const cleanName = fileName ? fileName.replace(/[^a-zA-Z0-9_-]/g, '_') : 'prod';
      const path = `photos/${cleanName}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
      
      const { data, error } = await supabaseClient.storage
        .from('products')
        .upload(path, fileOrBlob, {
          cacheControl: '31536000',
          upsert: true,
          contentType: fileOrBlob.type || 'image/jpeg'
        });

      if (error) throw error;

      const { data: publicUrlData } = supabaseClient.storage
        .from('products')
        .getPublicUrl(path);

      return publicUrlData.publicUrl;
    },
  };
})();
