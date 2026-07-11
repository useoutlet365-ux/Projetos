// =====================================================
// OUTLET 365 — Admin Panel JS (localStorage)
// =====================================================

// ── STORAGE (site_stats em localStorage — dados de demo) ──
const STORE = {
  _p: 'outlet365_',
  get(key) {
    try { return JSON.parse(localStorage.getItem(this._p + key) || '[]'); }
    catch { return []; }
  },
  set(key, data) { localStorage.setItem(this._p + key, JSON.stringify(data)); },
  genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
};

// ── FETCH HELPERS (Supabase) ──
async function fetchAll(table) {
  if (table === 'admin_products') return DB.getAllProducts();
  if (table === 'orders')         return DB.getAllOrders();
  if (table === 'site_stats')     return DB.getSiteStats();
  return [];
}

async function createRecord(table, data) {
  if (table === 'admin_products') {
    const id = STORE.genId();
    return DB.createProduct({ ...data, id });
  }
  return null;
}

async function updateRecord(table, id, data) {
  if (table === 'admin_products') return DB.updateProduct(id, data);
  if (table === 'orders')         return DB.updateOrderStatus(id, data.status);
  return null;
}

async function deleteRecord(table, id) {
  if (table === 'admin_products') return DB.deleteProduct(id);
}

// ── SEED DEMO DATA (apenas site_stats) ──
function seedDemoData() {
  const today = new Date();
  const revs = [1240, 890, 1560, 2100, 780, 1340, 1680];
  const stats = revs.map((rev, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return {
      id: STORE.genId(),
      date: d.toISOString().split('T')[0],
      revenue: rev,
      unique_visitors: Math.round(rev / 14),
      page_views: Math.round(rev / 7),
      cart_adds: Math.round(rev / 48),
      checkouts: Math.round(rev / 82)
    };
  });
  STORE.set('site_stats', stats);
}

// ── SEED DEMO ORDERS (apenas chamado manualmente se necessário) ──
function seedDemoOrders_UNUSED() {
  const today = new Date();
  const customers = [
    { name: 'João Silva',     phone: '(88) 99999-1234', email: 'joao@email.com',   city: 'Madalena',        state: 'CE' },
    { name: 'Pedro Oliveira', phone: '(85) 99887-5566', email: 'pedro@email.com',  city: 'Fortaleza',       state: 'CE' },
    { name: 'Carlos Santos',  phone: '(88) 98765-4321', email: 'carlos@email.com', city: 'Quixeramobim',   state: 'CE' },
    { name: 'André Costa',    phone: '(88) 91234-5678', email: 'andre@email.com',  city: 'Senador Pompeu', state: 'CE' },
    { name: 'Lucas Ferreira', phone: '(85) 98765-1234', email: 'lucas@email.com',  city: 'Sobral',          state: 'CE' },
    { name: 'Marcos Lima',    phone: '(88) 99123-4567', email: 'marcos@email.com', city: 'Tauá',            state: 'CE' },
    { name: 'Rafael Souza',   phone: '(85) 98888-7777', email: 'rafael@email.com', city: 'Fortaleza',       state: 'CE' },
    { name: 'Felipe Alves',   phone: '(88) 97654-3210', email: 'felipe@email.com', city: 'Madalena',        state: 'CE' },
  ];
  const statuses = ['pendente','confirmado','confirmado','enviado','entregue','entregue','entregue','cancelado'];
  const methods  = ['PIX','PIX','Cartão','PIX','Boleto','Cartão','PIX','PIX'];
  const itemSets = [
    [{ name:'Camisa Básica Fio 40.1',   size:'M',    qty:1, price:75.00  }],
    [{ name:'Short Sarja',              size:'G',    qty:1, price:105.37 }, { name:'Gola Polo',        size:'M',    qty:1, price:127.00 }],
    [{ name:'Chinelo Crocs',            size:'42',   qty:1, price:109.00 }],
    [{ name:'Calça Caunt Jeans',        size:'42',   qty:1, price:189.99 }],
    [{ name:'Camisa Pima Peruana',      size:'G',    qty:2, price:116.00 }],
    [{ name:'Short Jeans',              size:'40',   qty:1, price:126.45 }, { name:'Boné',             size:'Único',qty:1, price:44.90  }],
    [{ name:'Chinelo Nuvem',            size:'41',   qty:1, price:84.90  }],
    [{ name:'Camisa Longline',          size:'P',    qty:1, price:89.57  }],
  ];

  const orders = customers.map((c, i) => {
    const items = itemSets[i];
    const sub = items.reduce((s, x) => s + x.price * x.qty, 0);
    const d = new Date(today);
    d.setDate(d.getDate() - Math.floor(Math.random() * 7));
    return {
      id: STORE.genId(),
      customer_name: c.name, customer_phone: c.phone, customer_email: c.email,
      city: c.city, state: c.state,
      subtotal: sub, shipping: sub > 200 ? 0 : 15, total: sub + (sub > 200 ? 0 : 15),
      status: statuses[i], payment_method: methods[i],
      items_json: JSON.stringify(items), notes: '',
      created_at: d.toISOString()
    };
  });
  STORE.set('orders', orders);
} // fim seedDemoOrders_UNUSED

// ── STATE ──
let allOrders = [];
let allStats  = [];
let allAdminProducts = [];
let editingProductId = null;
let photosData = [];

// ── NAVIGATION ──
function navigateTo(section) {
  document.querySelectorAll('.adm-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.adm-nav-item').forEach(i => i.classList.remove('active'));
  const sec = document.getElementById(`sec-${section}`);
  if (sec) sec.classList.add('active');
  const btn = document.querySelector(`[data-section="${section}"]`);
  if (btn) btn.classList.add('active');
  const titles = {
    dashboard: 'Dashboard', financeiro: 'Financeiro', pedidos: 'Pedidos',
    produtos: 'Produtos', 'novo-produto': 'Novo Produto', 'hero-config': 'Card Principal'
  };
  document.getElementById('topbarTitle').textContent = titles[section] || section;
  if (section === 'produtos')     renderAdminProducts();
  if (section === 'hero-config')  renderHeroConfig();
  if (section === 'novo-produto') { resetForm(); updateHeroCounter(); }
  document.getElementById('admSidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

document.querySelectorAll('.adm-nav-item').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.section));
});
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
  document.getElementById('admSidebar').classList.toggle('mobile-open');
  document.getElementById('sidebarOverlay').classList.toggle('active');
});
document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
  document.getElementById('admSidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.remove('active');
});

// ── TOAST ──
function admToast(msg, type = 'success') {
  const t = document.getElementById('admToast');
  const icons = { success: '✓', error: '✗', info: 'ℹ' };
  t.textContent = `${icons[type] || '•'} ${msg}`;
  t.className = `adm-toast show ${type}`;
  setTimeout(() => t.classList.remove('show'), 3200);
}

function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

// ── FORMAT ──
function fmtCurrency(v) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str + (str.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
// ── CONSOLIDATE STATS ──
function consolidateStats() {
  // 1. Agrupar receita real dos pedidos por dia (excluindo os cancelados)
  const revenueByDate = {};
  allOrders.forEach(o => {
    if (o.status === 'cancelado') return;
    const dateStr = o.created_at ? o.created_at.substring(0, 10) : '';
    if (dateStr) {
      revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + parseFloat(o.total || 0);
    }
  });

  // 2. Fazer o merge com os dados de site_stats vindos do Supabase
  const statsMap = {};
  
  // Inicializa o mapa com as estatísticas do banco
  allStats.forEach(s => {
    statsMap[s.date] = {
      id: s.date,
      date: s.date,
      revenue: 0,
      unique_visitors: parseInt(s.unique_visitors) || 0,
      page_views: parseInt(s.page_views) || 0,
      cart_adds: parseInt(s.cart_adds) || 0,
      checkouts: parseInt(s.checkouts) || 0
    };
  });

  // Insere/atualiza a receita real dos pedidos e garante que o dia existe no mapa
  Object.entries(revenueByDate).forEach(([dateStr, totalRev]) => {
    if (!statsMap[dateStr]) {
      statsMap[dateStr] = {
        id: dateStr,
        date: dateStr,
        revenue: totalRev,
        unique_visitors: 0,
        page_views: 0,
        cart_adds: 0,
        checkouts: 0
      };
    } else {
      statsMap[dateStr].revenue = totalRev;
    }
  });

  // 3. Substitui allStats pelo array combinado, ordenado cronologicamente
  allStats = Object.values(statsMap).sort((a, b) => a.date.localeCompare(b.date));
}

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
async function init() {
  // Auth guard — redireciona se não logado
  const user = await DB.getUser();
  if (!user) { window.location.href = 'admin-login.html'; return; }

  // Mostra email do usuário logado
  const userEl = document.getElementById('adminUserEmail');
  if (userEl) userEl.textContent = user.email;

  [allOrders, allStats] = await Promise.all([fetchAll('orders'), fetchAll('site_stats')]);
  allAdminProducts = await fetchAll('admin_products');
  
  consolidateStats();

  renderKPIs();
  renderRevenueChart();
  renderEngageChart();
  renderRecentOrders();
  renderTopProducts();
  renderFinanceiro();
  renderOrdersTable();
}

// ══════════════════════════════════════════
// KPIs
// ══════════════════════════════════════════
function renderKPIs() {
  const totalRevenue   = allStats.reduce((s, d) => s + (d.revenue || 0), 0);
  const totalOrders    = allOrders.length;
  const totalVisitors  = allStats.reduce((s, d) => s + (d.unique_visitors || 0), 0);
  const totalCheckouts = allStats.reduce((s, d) => s + (d.checkouts || 0), 0);
  const convRate = totalVisitors > 0 ? ((totalCheckouts / totalVisitors) * 100).toFixed(1) : '0.0';
  document.getElementById('kpi-revenue').textContent    = fmtCurrency(totalRevenue);
  document.getElementById('kpi-orders').textContent     = totalOrders;
  document.getElementById('kpi-visitors').textContent   = totalVisitors.toLocaleString('pt-BR');
  document.getElementById('kpi-conversion').textContent = convRate + '%';
  document.getElementById('kpi-rev-delta').innerHTML    = `<i class="fas fa-arrow-up"></i> +18%`;
  document.getElementById('kpi-ord-delta').innerHTML    = `<i class="fas fa-arrow-up"></i> +3`;
}

// ══════════════════════════════════════════
// CHARTS — DASHBOARD
// ══════════════════════════════════════════
function renderRevenueChart() {
  const sorted = [...allStats].sort((a, b) => a.date > b.date ? 1 : -1);
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: sorted.map(d => fmtDate(d.date)),
      datasets: [{
        label: 'Receita (R$)', data: sorted.map(d => d.revenue || 0),
        borderColor: '#1a6b3c', backgroundColor: 'rgba(26,107,60,.1)',
        borderWidth: 2.5, fill: true, tension: 0.4,
        pointBackgroundColor: '#1a6b3c', pointRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => 'R$' + (v/1000).toFixed(1)+'k', font: { size: 11 } }, grid: { color: '#f3f4f6' } },
        x: { ticks: { font: { size: 11 } }, grid: { display: false } }
      }
    }
  });
}

function renderEngageChart() {
  const ctx = document.getElementById('engageChart');
  if (!ctx) return;
  const tv  = allStats.reduce((s, d) => s + (d.page_views || 0), 0);
  const tc  = allStats.reduce((s, d) => s + (d.cart_adds || 0), 0);
  const tco = allStats.reduce((s, d) => s + (d.checkouts || 0), 0);
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Visualizações', 'Carrinhos', 'Checkouts'],
      datasets: [{ data: [tv, tc, tco], backgroundColor: ['#1a6b3c','#2563eb','#f59e0b'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } } },
      cutout: '65%'
    }
  });
}

// ══════════════════════════════════════════
// RECENT ORDERS & TOP PRODUCTS (dashboard)
// ══════════════════════════════════════════
function renderRecentOrders() {
  const tbody = document.getElementById('recentOrdersBody');
  if (!tbody) return;
  tbody.innerHTML = [...allOrders].slice(-5).reverse().map(o => `
    <tr>
      <td><span class="fw-700">${o.customer_name}</span></td>
      <td>${o.city}/${o.state}</td>
      <td class="fw-700 text-green">${fmtCurrency(o.total)}</td>
      <td><span class="order-status ${o.status}">${o.status}</span></td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="text-align:center;color:#9ca3af;">Sem pedidos</td></tr>';
}

function renderTopProducts() {
  const el = document.getElementById('topProductsList');
  if (!el) return;
  const counts = {};
  allOrders.forEach(o => {
    try { JSON.parse(o.items_json||'[]').forEach(item => { counts[item.name] = (counts[item.name]||0) + (item.qty||1); }); } catch {}
  });
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const max = sorted[0]?.[1] || 1;
  el.innerHTML = sorted.map(([name,qty],i) => `
    <div style="margin-bottom:.85rem;">
      <div style="display:flex;justify-content:space-between;margin-bottom:.3rem;">
        <span style="font-size:.82rem;font-weight:600;">${i+1}. ${name}</span>
        <span style="font-size:.78rem;color:var(--adm-muted);">${qty} vend${qty!==1?'idos':'ido'}</span>
      </div>
      <div style="height:6px;background:#f3f4f6;border-radius:50px;overflow:hidden;">
        <div style="height:100%;width:${(qty/max*100).toFixed(0)}%;background:var(--adm-green);border-radius:50px;transition:width .6s;"></div>
      </div>
    </div>
  `).join('') || '<p style="color:#9ca3af;font-size:.85rem;">Sem dados de vendas ainda.</p>';
}

// ══════════════════════════════════════════
// FINANCEIRO
// ══════════════════════════════════════════
function renderFinanceiro() {
  const sorted  = [...allStats].sort((a,b) => a.date > b.date ? 1 : -1);
  const totalRev = sorted.reduce((s,d) => s+(d.revenue||0), 0);
  const totalCO  = allOrders.length;
  const ticket   = totalCO > 0 ? totalRev / totalCO : 0;
  const bestDay  = sorted.reduce((best,d) => d.revenue>(best?.revenue||0)?d:best, null);

  document.getElementById('fin-total').textContent         = fmtCurrency(totalRev);
  document.getElementById('fin-total-orders').textContent  = `${totalCO} pedidos no período`;
  document.getElementById('fin-ticket').textContent        = fmtCurrency(ticket);
  document.getElementById('fin-best-day').textContent      = fmtCurrency(bestDay?.revenue||0);
  document.getElementById('fin-best-date').textContent     = bestDay ? fmtDate(bestDay.date) : '—';

  const tbody = document.getElementById('statsTableBody');
  if (tbody) {
    tbody.innerHTML = sorted.map(d => `
      <tr>
        <td class="fw-700">${fmtDate(d.date)}</td>
        <td>${d.page_views||0}</td>
        <td>${d.unique_visitors||0}</td>
        <td>${d.cart_adds||0}</td>
        <td>${d.checkouts||0}</td>
        <td class="fw-700 text-green">${fmtCurrency(d.revenue)}</td>
      </tr>
    `).join('');
  }

  const cityEl = document.getElementById('cityList');
  if (cityEl) {
    const cities = {};
    allOrders.forEach(o => { const k=`${o.city}/${o.state}`; cities[k]=(cities[k]||0)+1; });
    const sorted2 = Object.entries(cities).sort((a,b)=>b[1]-a[1]);
    const max2 = sorted2[0]?.[1] || 1;
    cityEl.innerHTML = sorted2.map(([city,count]) => `
      <div style="margin-bottom:.75rem;">
        <div style="display:flex;justify-content:space-between;margin-bottom:.25rem;">
          <span style="font-size:.82rem;font-weight:600;">${city}</span>
          <span style="font-size:.78rem;color:var(--adm-muted);">${count} ped${count!==1?'idos':'ido'}</span>
        </div>
        <div style="height:5px;background:#f3f4f6;border-radius:50px;overflow:hidden;">
          <div style="height:100%;width:${(count/max2*100).toFixed(0)}%;background:#7c3aed;border-radius:50px;"></div>
        </div>
      </div>
    `).join('') || '<p style="color:#9ca3af;font-size:.85rem;">Sem dados ainda.</p>';
  }

  setTimeout(() => {
    const ctx = document.getElementById('finBarChart');
    if (!ctx || ctx._chartInstance) return;
    ctx._chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(d => fmtDate(d.date)),
        datasets: [{
          label: 'Receita (R$)', data: sorted.map(d => d.revenue||0),
          backgroundColor: sorted.map((_,i) => i===sorted.length-1?'rgba(26,107,60,.4)':'#1a6b3c'),
          borderRadius: 6, borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: v=>'R$'+v.toLocaleString('pt-BR'), font:{size:11} }, grid:{color:'#f3f4f6'} },
          x: { ticks: { font:{size:11} }, grid:{display:false} }
        }
      }
    });

    const ctx2 = document.getElementById('funnelChart');
    if (!ctx2 || ctx2._chartInstance) return;
    ctx2._chartInstance = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: ['Visitantes','Adicionaram ao Carrinho','Checkout'],
        datasets: [{
          data: [
            sorted.reduce((s,d)=>s+(d.unique_visitors||0),0),
            sorted.reduce((s,d)=>s+(d.cart_adds||0),0),
            sorted.reduce((s,d)=>s+(d.checkouts||0),0)
          ],
          backgroundColor: ['#2563eb','#f59e0b','#1a6b3c'],
          borderRadius: 6, borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero:true, grid:{color:'#f3f4f6'}, ticks:{font:{size:11}} },
          y: { ticks:{font:{size:11}}, grid:{display:false} }
        }
      }
    });
  }, 200);
}

// ══════════════════════════════════════════
// ORDERS TABLE
// ══════════════════════════════════════════
function renderOrdersTable(filter = '') {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  let orders = [...allOrders].reverse();
  if (filter) orders = orders.filter(o => o.status === filter);
  tbody.innerHTML = orders.map(o => {
    let items = [];
    try { items = JSON.parse(o.items_json||'[]'); } catch {}
    return `
      <tr>
        <td><span class="fw-700" style="font-size:.75rem;color:var(--adm-muted);">#${(o.id||'').slice(-4).toUpperCase()}</span></td>
        <td>
          <div class="fw-700" style="font-size:.85rem;">${o.customer_name}</div>
          <div style="font-size:.73rem;color:var(--adm-muted);">${o.customer_phone||'—'}</div>
        </td>
        <td>${o.city}/${o.state}</td>
        <td style="font-size:.78rem;">${items.length} item${items.length!==1?'s':''}</td>
        <td class="fw-700 text-green">${fmtCurrency(o.total)}</td>
        <td style="font-size:.8rem;">${o.payment_method||'—'}</td>
        <td>
          <select class="status-select" data-id="${o.id}" style="padding:.3rem .5rem;border:1.5px solid var(--adm-border);border-radius:6px;font-size:.74rem;font-weight:700;background:#fff;cursor:pointer;" onchange="changeOrderStatus(this)">
            ${['pendente','confirmado','enviado','entregue','cancelado'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </td>
        <td>
          <button class="adm-btn-sm adm-btn-edit" style="width:auto;padding:.4rem .65rem;" onclick="viewOrder('${o.id}')">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#9ca3af;">Nenhum pedido encontrado.</td></tr>';
}

document.getElementById('statusFilter')?.addEventListener('change', e => renderOrdersTable(e.target.value));

async function changeOrderStatus(sel) {
  const { id, value: status } = sel.dataset;
  const selId = sel.dataset.id;
  await updateRecord('orders', selId, { status });
  const ord = allOrders.find(o => o.id === selId);
  if (ord) ord.status = status;
  admToast(`Status atualizado para "${status}"`);
}

function viewOrder(id) {
  const o = allOrders.find(x => x.id === id);
  if (!o) return;
  let items = [];
  try { items = JSON.parse(o.items_json||'[]'); } catch {}
  document.getElementById('orderModalBody').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem;">
      <div>
        <p style="font-size:.7rem;font-weight:700;color:var(--adm-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.3rem;">Cliente</p>
        <p class="fw-700">${o.customer_name}</p>
        <p style="font-size:.82rem;">${o.customer_phone||'—'}</p>
        <p style="font-size:.82rem;">${o.customer_email||'—'}</p>
      </div>
      <div>
        <p style="font-size:.7rem;font-weight:700;color:var(--adm-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.3rem;">Entrega</p>
        <p class="fw-700">${o.city}/${o.state}</p>
        <p style="font-size:.82rem;">Pagamento: ${o.payment_method||'—'}</p>
      </div>
    </div>
    <hr style="border:none;border-top:1px solid var(--adm-border);margin:1rem 0;"/>
    <p style="font-size:.7rem;font-weight:700;color:var(--adm-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.6rem;">Itens do Pedido</p>
    ${items.map(item=>`
      <div style="display:flex;justify-content:space-between;align-items:center;padding:.6rem 0;border-bottom:1px solid #f3f4f6;">
        <div>
          <span class="fw-700" style="font-size:.88rem;">${item.name}</span>
          <span style="font-size:.78rem;color:var(--adm-muted);margin-left:.5rem;">Tam: ${item.size} · Qtd: ${item.qty}</span>
        </div>
        <span class="fw-700 text-green">${fmtCurrency(item.price*item.qty)}</span>
      </div>
    `).join('')}
    <div style="margin-top:1rem;text-align:right;">
      <div style="font-size:.82rem;color:var(--adm-muted);">Subtotal: ${fmtCurrency(o.subtotal)}</div>
      <div style="font-size:.82rem;color:var(--adm-muted);">Frete: ${o.shipping>0?fmtCurrency(o.shipping):'Grátis'}</div>
      <div class="fw-700" style="font-size:1.1rem;color:var(--adm-green);margin-top:.25rem;">Total: ${fmtCurrency(o.total)}</div>
    </div>
    ${o.notes?`<div style="margin-top:.75rem;padding:.65rem;background:#fef9ec;border-radius:6px;font-size:.82rem;"><i class="fas fa-sticky-note" style="color:var(--adm-yellow);margin-right:.35rem;"></i>${o.notes}</div>`:''}
  `;
  document.getElementById('orderModal').classList.add('active');
}

// ══════════════════════════════════════════
// ADMIN PRODUCTS
// ══════════════════════════════════════════
async function renderAdminProducts(catFilter='todos', search='') {
  const grid = document.getElementById('adminProductsGrid');
  if (!grid) return;
  allAdminProducts = await fetchAll('admin_products');
  let products = [...allAdminProducts];
  if (catFilter === 'promocoes') products = products.filter(p => p.weekly_promo);
  else if (catFilter !== 'todos') products = products.filter(p => p.category===catFilter);
  if (search) products = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <i class="fas fa-box-open"></i>
        <p>Nenhum produto encontrado.<br/>Cadastre o primeiro produto!</p>
        <button class="adm-btn adm-btn-primary" style="margin-top:1rem;" onclick="navigateTo('novo-produto')">
          <i class="fas fa-plus"></i> Novo Produto
        </button>
      </div>`;
    return;
  }

  const catLabels = { 'camisas':'Camisas','shorts-calcas':'Shorts/Calças','calcados-chinelos':'Calçados','acessorios':'Acessórios','perfumes':'Perfumes' };
  grid.innerHTML = products.map(p => {
    const imgEl = p.image_base64
      ? `<img src="${p.image_base64}" class="adm-product-img" alt="${p.name}"/>`
      : p.image_url
        ? `<img src="${p.image_url}" class="adm-product-img" alt="${p.name}"/>`
        : `<div class="adm-product-img-placeholder"><i class="fas fa-image"></i></div>`;
    return `
      <div class="adm-product-card" id="pcard-${p.id}">
        ${imgEl}
        <div class="adm-product-body">
          <div class="adm-product-name">${p.name}</div>
          <div class="adm-product-price">${fmtCurrency(p.price)}
            ${p.original_price>p.price?`<span style="font-size:.75rem;text-decoration:line-through;color:#9ca3af;margin-left:.35rem;">${fmtCurrency(p.original_price)}</span>`:''}
          </div>
          <div class="adm-product-meta">
            <span class="adm-tag cat">${catLabels[p.category]||p.category}</span>
            ${p.weekly_promo?'<span class="adm-tag promo">🔥 Promo</span>':''}
            ${p.hero_card?'<span class="adm-tag hero">⭐ Card</span>':''}
            <span class="adm-tag ${p.active!==false?'active':'inactive'}">${p.active!==false?'Ativo':'Inativo'}</span>
          </div>
        </div>
        <div class="adm-product-actions">
          <button class="adm-btn-sm adm-btn-edit" onclick="editProduct('${p.id}')">
            <i class="fas fa-pencil-alt"></i> Editar
          </button>
          <button class="adm-btn-sm adm-btn-toggle ${p.active!==false?'on':''}" onclick="toggleProductActive('${p.id}',${p.active!==false})">
            <i class="fas ${p.active!==false?'fa-eye':'fa-eye-slash'}"></i>
          </button>
          <button class="adm-btn-sm adm-btn-delete" onclick="confirmDelete('${p.id}','${(p.name||'').replace(/'/g,"\\'")}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

document.querySelectorAll('.adm-filter-btn[data-pcat]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.adm-filter-btn[data-pcat]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderAdminProducts(btn.dataset.pcat, document.getElementById('prodSearch')?.value||'');
  });
});
document.getElementById('prodSearch')?.addEventListener('input', e => {
  const cat = document.querySelector('.adm-filter-btn[data-pcat].active')?.dataset.pcat||'todos';
  renderAdminProducts(cat, e.target.value);
});

async function toggleProductActive(id, currentActive) {
  await updateRecord('admin_products', id, { active: !currentActive });
  admToast(currentActive ? 'Produto desativado' : 'Produto ativado');
  renderAdminProducts();
}

function confirmDelete(id, name) {
  document.getElementById('deleteProductName').textContent = name;
  document.getElementById('deleteModal').classList.add('active');
  document.getElementById('confirmDeleteBtn').onclick = async () => {
    await deleteRecord('admin_products', id);
    allAdminProducts = allAdminProducts.filter(p => p.id !== id);
    closeModal('deleteModal');
    renderAdminProducts();
    admToast('Produto excluído');
  };
}

async function editProduct(id) {
  const p = allAdminProducts.find(x => x.id === id);
  if (!p) return;
  editingProductId = id;
  navigateTo('novo-produto');
  document.getElementById('formProductTitle').textContent = 'Editar Produto';
  document.getElementById('editProductId').value = id;
  document.getElementById('prodName').value          = p.name||'';
  document.getElementById('prodCategory').value      = p.category||'';
  updateSubcategory();
  setTimeout(() => { document.getElementById('prodSubcategory').value = p.subcategory||''; }, 100);
  document.getElementById('prodPrice').value         = p.price||'';
  document.getElementById('prodOriginalPrice').value = p.original_price||'';
  document.getElementById('prodInstallments').value  = p.installments||3;
  document.getElementById('prodStock').value         = p.stock||0;
  document.getElementById('prodDescription').value   = p.description||'';
  document.getElementById('prodActive').checked      = p.active!==false;
  document.getElementById('prodFeatured').checked    = !!p.featured;
  document.getElementById('prodNew').checked         = !!p.new_arrival;
  document.getElementById('prodPromo').checked       = !!p.weekly_promo;
  document.getElementById('prodHeroCard').checked    = !!p.hero_card;
  photosData = [];
  const prev = document.getElementById('photoPreviews');
  if (p.image_base64) {
    photosData.push(p.image_base64);
    prev.innerHTML = `<div class="photo-preview-item"><img src="${p.image_base64}"/><button onclick="removePhoto(0)"><i class="fas fa-times"></i></button></div>`;
  } else if (p.image_url) {
    prev.innerHTML = `<p style="font-size:.78rem;color:#9ca3af;">Foto URL: ${p.image_url}</p>`;
  }
  const sizesStr = p.sizes||'';
  setTimeout(() => {
    const buttons = document.querySelectorAll('.size-option-btn');
    sizesStr.split(',').map(s=>s.trim()).forEach(s => {
      const btn = [...buttons].find(b=>b.dataset.size===s);
      if (btn) { btn.classList.add('selected'); toggleSizeBtn(btn); }
    });
  }, 200);
  updateHeroCounter();
}

// ══════════════════════════════════════════
// PRODUCT FORM
// ══════════════════════════════════════════
const SUBCATEGORIES = {
  'camisas':           ['Básicas','Polo','Premium','Street','Outras'],
  'shorts-calcas':     ['Shorts','Calças','Outras'],
  'calcados-chinelos': ['Chinelos','Slides','Tênis/Sapatos','Outros'],
  'acessorios':        ['Bonés','Roupas Íntimas','Outros'],
  'perfumes':          ['Perfumes Árabes','Perfumes Nacionais','Outros']
};
const SIZE_GROUPS = {
  'camisas':           ['P','M','G','GG'],
  'shorts-calcas':     ['P','M','G','GG','38','40','42','44','46','48'],
  'calcados-chinelos': ['37','38','39','40','41','42','43','44','38-39','40-41','42-43'],
  'acessorios':        ['P','M','G','GG','Único'],
  'perfumes':          ['30ml','50ml','100ml','Único']
};

function updateSubcategory() {
  const cat = document.getElementById('prodCategory').value;
  const subSel = document.getElementById('prodSubcategory');
  subSel.innerHTML = `<option value="">Selecionar subcategoria</option>` +
    (SUBCATEGORIES[cat]||[]).map(s=>`<option value="${s}">${s}</option>`).join('');
  const sizes = SIZE_GROUPS[cat]||['P','M','G','GG'];
  document.getElementById('sizesSelector').innerHTML = sizes.map(s => `
    <button type="button" class="size-option-btn" data-size="${s}"
      style="min-width:44px;height:40px;border-radius:8px;border:1.5px solid var(--adm-border);font-size:.82rem;font-weight:600;transition:all .2s;padding:0 .5rem;background:#fff;"
      onclick="toggleSizeBtn(this)">${s}</button>
  `).join('');
}

function toggleSizeBtn(btn) {
  btn.classList.toggle('selected');
  if (btn.classList.contains('selected')) {
    btn.style.background='#1a6b3c'; btn.style.color='#fff'; btn.style.borderColor='#1a6b3c';
  } else {
    btn.style.background='#fff'; btn.style.color=''; btn.style.borderColor='var(--adm-border)';
  }
}

function getSelectedSizes() {
  const selected = [...document.querySelectorAll('.size-option-btn.selected')].map(b=>b.dataset.size);
  const custom = document.getElementById('customSizes')?.value.trim();
  return selected.length>0 ? selected.join(', ') : (custom||'');
}

function compressImage(file, maxWidth = 600, quality = 0.70) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let w = img.width;
          let h = img.height;
          if (w === 0 || h === 0) {
            reject(new Error("Dimensões inválidas da imagem."));
            return;
          }
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const base64 = canvas.toDataURL('image/jpeg', quality);
          
          // Limpa o canvas e referências para liberar memória imediatamente no iOS Safari
          canvas.width = 1;
          canvas.height = 1;
          img.src = '';
          
          resolve(base64);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => {
        img.src = '';
        reject(new Error("Erro ao carregar a imagem para compressão."));
      };
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo de imagem."));
    reader.readAsDataURL(file);
  });
}

async function handlePhotoInput(event) {
  const files = Array.from(event.target.files);
  if (photosData.length + files.length > 4) { admToast('Máximo de 4 fotos por produto','error'); return; }
  for (const file of files) {
    try {
      const compressed = await compressImage(file);
      photosData.push(compressed);
      renderPhotoPreviews();
    } catch (err) {
      console.error("Erro ao processar imagem:", err);
      admToast(err.message || 'Erro ao processar a foto selecionada', 'error');
    }
  }
}

function renderPhotoPreviews() {
  document.getElementById('photoPreviews').innerHTML = photosData.map((src,i) => `
    <div class="photo-preview-item">
      <img src="${src}"/>
      <button type="button" onclick="removePhoto(${i})"><i class="fas fa-times"></i></button>
    </div>
  `).join('');
}

window.removePhoto = function(index) { photosData.splice(index,1); renderPhotoPreviews(); };

async function updateHeroCounter() {
  const products = await fetchAll('admin_products');
  const heroCount = products.filter(p=>p.hero_card).length;
  const el = document.getElementById('heroCountText');
  const heroCheckbox = document.getElementById('prodHeroCard');
  if (el) el.textContent = `${heroCount}/5 produtos no card principal`;
  if (heroCount>=5 && heroCheckbox && !heroCheckbox.checked) {
    heroCheckbox.disabled = true;
    if (el) el.textContent = `⚠ Limite atingido (5/5). Remova um produto para adicionar novo.`;
  } else if (heroCheckbox) {
    heroCheckbox.disabled = false;
  }
}

async function saveProduct(event) {
  event.preventDefault();
  const name        = document.getElementById('prodName').value.trim();
  const category    = document.getElementById('prodCategory').value;
  const price       = parseFloat(document.getElementById('prodPrice').value);
  const description = document.getElementById('prodDescription').value.trim();
  const sizes       = getSelectedSizes();

  if (!name||!category||!price||!description) {
    admToast('Preencha todos os campos obrigatórios','error'); return;
  }

  const heroChecked = document.getElementById('prodHeroCard').checked;
  if (heroChecked) {
    const all = await fetchAll('admin_products');
    const heroCount = all.filter(p=>p.hero_card&&p.id!==editingProductId).length;
    if (heroCount>=5) {
      admToast('Limite de 5 produtos no card principal atingido!','error');
      document.getElementById('prodHeroCard').checked = false;
      return;
    }
  }

  const data = {
    name, category,
    subcategory:     document.getElementById('prodSubcategory').value,
    price,
    original_price:  parseFloat(document.getElementById('prodOriginalPrice').value)||0,
    installments:    parseInt(document.getElementById('prodInstallments').value),
    stock:           parseInt(document.getElementById('prodStock').value)||0,
    description,
    sizes:           sizes||'Único',
    image_base64:    photosData[0]||'',
    image_url:       '',
    featured:        document.getElementById('prodFeatured').checked,
    new_arrival:     document.getElementById('prodNew').checked,
    weekly_promo:    document.getElementById('prodPromo').checked,
    hero_card:       heroChecked,
    active:          document.getElementById('prodActive').checked,
    slug:            slugify(name),
    sales_count:     0
  };

  const saveBtn = document.querySelector('#productForm [type="submit"]');
  try {
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'; }
    if (editingProductId) { await updateRecord('admin_products',editingProductId,data); admToast('Produto atualizado!'); }
    else                  { await createRecord('admin_products',data); admToast('Produto cadastrado!'); }
    resetForm();
    navigateTo('produtos');
  } catch(e) {
    console.error('saveProduct error:', e);
    const msg = e?.message || e?.error_description || 'verifique a conexão';
    admToast('Erro ao salvar: ' + msg, 'error');
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Produto'; }
  }
}

function resetForm() {
  editingProductId = null;
  document.getElementById('editProductId').value = '';
  document.getElementById('productForm').reset();
  document.getElementById('formProductTitle').textContent = 'Novo Produto';
  photosData = [];
  document.getElementById('photoPreviews').innerHTML  = '';
  document.getElementById('sizesSelector').innerHTML  = '';
  document.getElementById('prodSubcategory').innerHTML = '<option value="">Selecione a categoria primeiro</option>';
  updateHeroCounter();
}

// ══════════════════════════════════════════
// HERO CARD CONFIG
// ══════════════════════════════════════════
async function renderHeroConfig() {
  allAdminProducts = await fetchAll('admin_products');
  const heroProducts = allAdminProducts.filter(p=>p.hero_card);
  const count = heroProducts.length;
  const badge = document.getElementById('heroCounterBadge');
  if (badge) { badge.textContent=`${count}/5`; badge.className=`hero-card-counter${count>=5?' full':''}`; }

  const listEl = document.getElementById('heroCardProductsList');
  if (listEl) {
    listEl.innerHTML = heroProducts.length===0
      ? `<div class="empty-state"><i class="fas fa-star"></i><p>Nenhum produto no card principal ainda.</p></div>`
      : heroProducts.map(p=>`
        <div style="display:flex;align-items:center;gap:1rem;padding:.75rem;border-bottom:1px solid var(--adm-border);">
          ${p.image_base64?`<img src="${p.image_base64}" style="width:56px;height:64px;object-fit:cover;border-radius:6px;"/>`:`<div style="width:56px;height:64px;background:#f3f4f6;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#ccc;"><i class="fas fa-image"></i></div>`}
          <div style="flex:1;">
            <div class="fw-700" style="font-size:.88rem;">${p.name}</div>
            <div style="font-size:.8rem;color:var(--adm-green);font-weight:700;">${fmtCurrency(p.price)}</div>
          </div>
          <button class="adm-btn-sm adm-btn-delete" style="width:auto;" onclick="removeFromHero('${p.id}')">
            <i class="fas fa-times"></i> Remover
          </button>
        </div>
      `).join('');
  }

  const heroTable = document.getElementById('heroTableBody');
  if (heroTable) {
    heroTable.innerHTML = allAdminProducts.map(p=>`
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:.65rem;">
            ${p.image_base64?`<img src="${p.image_base64}" style="width:40px;height:46px;object-fit:cover;border-radius:4px;"/>`:`<div style="width:40px;height:46px;background:#f3f4f6;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:.8rem;"><i class="fas fa-image"></i></div>`}
            <span class="fw-700" style="font-size:.85rem;">${p.name}</span>
          </div>
        </td>
        <td style="font-size:.8rem;">${p.category}</td>
        <td class="fw-700 text-green">${fmtCurrency(p.price)}</td>
        <td>
          <label class="adm-toggle-item">
            <input type="checkbox" ${p.hero_card?'checked':''} onchange="toggleHeroCard('${p.id}',this.checked)"/>
            <span class="adm-toggle-switch"></span>
          </label>
        </td>
      </tr>
    `).join('');
  }
}

async function toggleHeroCard(id, value) {
  const heroProducts = allAdminProducts.filter(p=>p.hero_card&&p.id!==id);
  if (value && heroProducts.length>=5) {
    admToast('Limite de 5 produtos no card principal atingido!','error');
    renderHeroConfig(); return;
  }
  await updateRecord('admin_products',id,{hero_card:value});
  allAdminProducts = await fetchAll('admin_products');
  admToast(value?'⭐ Adicionado ao card principal!':'Removido do card principal');
  renderHeroConfig();
}

async function removeFromHero(id) {
  await updateRecord('admin_products',id,{hero_card:false});
  allAdminProducts = await fetchAll('admin_products');
  admToast('Removido do card principal');
  renderHeroConfig();
}

// ── LOGOUT ──
document.getElementById('btnLogout')?.addEventListener('click', async () => {
  await DB.signOut();
  window.location.href = 'admin-login.html';
});

// ── BOOT ──
init();
