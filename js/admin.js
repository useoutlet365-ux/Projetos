// =====================================================
// OUTLET 365 — Admin Panel JS (Seguro contra XSS)
// =====================================================

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
window.escapeHtml = escapeHtml;

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
  if (table === 'orders') return DB.getAllOrders();
  if (table === 'site_stats') return DB.getSiteStats();
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
  if (table === 'orders') return DB.updateOrderStatus(id, data.status);
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
    { name: 'João Silva', phone: '(88) 99999-1234', email: 'joao@email.com', city: 'Madalena', state: 'CE' },
    { name: 'Pedro Oliveira', phone: '(85) 99887-5566', email: 'pedro@email.com', city: 'Fortaleza', state: 'CE' },
    { name: 'Carlos Santos', phone: '(88) 98765-4321', email: 'carlos@email.com', city: 'Quixeramobim', state: 'CE' },
    { name: 'André Costa', phone: '(88) 91234-5678', email: 'andre@email.com', city: 'Senador Pompeu', state: 'CE' },
    { name: 'Lucas Ferreira', phone: '(85) 98765-1234', email: 'lucas@email.com', city: 'Sobral', state: 'CE' },
    { name: 'Marcos Lima', phone: '(88) 99123-4567', email: 'marcos@email.com', city: 'Tauá', state: 'CE' },
    { name: 'Rafael Souza', phone: '(85) 98888-7777', email: 'rafael@email.com', city: 'Fortaleza', state: 'CE' },
    { name: 'Felipe Alves', phone: '(88) 97654-3210', email: 'felipe@email.com', city: 'Madalena', state: 'CE' },
  ];
  const statuses = ['pendente', 'confirmado', 'confirmado', 'enviado', 'entregue', 'entregue', 'entregue', 'cancelado'];
  const methods = ['PIX', 'PIX', 'Cartão', 'PIX', 'Boleto', 'Cartão', 'PIX', 'PIX'];
  const itemSets = [
    [{ name: 'Camisa Básica Fio 40.1', size: 'M', qty: 1, price: 75.00 }],
    [{ name: 'Short Sarja', size: 'G', qty: 1, price: 105.37 }, { name: 'Gola Polo', size: 'M', qty: 1, price: 127.00 }],
    [{ name: 'Chinelo Crocs', size: '42', qty: 1, price: 109.00 }],
    [{ name: 'Calça Caunt Jeans', size: '42', qty: 1, price: 189.99 }],
    [{ name: 'Camisa Pima Peruana', size: 'G', qty: 2, price: 116.00 }],
    [{ name: 'Short Jeans', size: '40', qty: 1, price: 126.45 }, { name: 'Boné', size: 'Único', qty: 1, price: 44.90 }],
    [{ name: 'Chinelo Nuvem', size: '41', qty: 1, price: 84.90 }],
    [{ name: 'Camisa Longline', size: 'P', qty: 1, price: 89.57 }],
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
let allStats = [];
let allAdminProducts = [];
let editingProductId = null;
let photosData = [];

// ── NAVIGATION ──
function navigateTo(section, shouldReset = true) {
  document.querySelectorAll('.adm-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.adm-nav-item').forEach(i => i.classList.remove('active'));
  const sec = document.getElementById(`sec-${section}`);
  if (sec) sec.classList.add('active');
  const btn = document.querySelector(`[data-section="${section}"]`);
  if (btn) btn.classList.add('active');
  const titles = {
    dashboard: 'Dashboard', pdv: 'PDV (Balcão)', financeiro: 'Financeiro', pedidos: 'Pedidos',
    produtos: 'Produtos', 'novo-produto': 'Novo Produto', 'hero-config': 'Card Principal'
  };
  document.getElementById('topbarTitle').textContent = titles[section] || section;
  if (section === 'pdv') renderPdvCatalog();
  if (section === 'produtos') renderAdminProducts();
  if (section === 'hero-config') renderHeroConfig();
  if (section === 'novo-produto') {
    if (shouldReset) resetForm();
    updateHeroCounter();
  }
  document.getElementById('admSidebar')?.classList.remove('mobile-open');
  document.getElementById('sidebarOverlay')?.classList.remove('active');
}

// ── CONTROLE DA BARRA LATERAL (MINIMIZAR / EXPANDIR / GAVETA MOBILE) ──
function toggleAdminSidebar(forceState = null) {
  const isMobile = window.innerWidth <= 768;
  const sidebar = document.getElementById('admSidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (isMobile) {
    if (forceState !== null) {
      if (forceState) {
        sidebar?.classList.add('mobile-open');
        overlay?.classList.add('active');
      } else {
        sidebar?.classList.remove('mobile-open');
        overlay?.classList.remove('active');
      }
    } else {
      sidebar?.classList.toggle('mobile-open');
      overlay?.classList.toggle('active');
    }
  } else {
    const isCurrentlyCollapsed = document.body.classList.contains('adm-sidebar-collapsed');
    const shouldCollapse = forceState !== null ? forceState : !isCurrentlyCollapsed;

    if (shouldCollapse) {
      document.body.classList.add('adm-sidebar-collapsed');
      sidebar?.classList.add('collapsed');
      localStorage.setItem('outlet365_adm_sidebar_collapsed', '1');
    } else {
      document.body.classList.remove('adm-sidebar-collapsed');
      sidebar?.classList.remove('collapsed');
      localStorage.setItem('outlet365_adm_sidebar_collapsed', '0');
    }

    // Dispara evento de redimensionamento para ajustar gráficos Chart.js
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 280);
  }
}

function initSidebarPreference() {
  if (window.innerWidth > 768) {
    const saved = localStorage.getItem('outlet365_adm_sidebar_collapsed');
    if (saved === '1') {
      document.body.classList.add('adm-sidebar-collapsed');
      document.getElementById('admSidebar')?.classList.add('collapsed');
    }
  }
}

// Inicializa preferência imediatamente
initSidebarPreference();

document.querySelectorAll('.adm-nav-item').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.section));
});
document.getElementById('sidebarToggleBtn')?.addEventListener('click', () => toggleAdminSidebar());
document.getElementById('sidebarCollapseBtn')?.addEventListener('click', () => toggleAdminSidebar());
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => toggleAdminSidebar());
document.getElementById('sidebarOverlay')?.addEventListener('click', () => toggleAdminSidebar(false));

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

  initPdvModule();
  renderKPIs();
  renderRevenueChart();
  renderEngageChart();
  renderRecentOrders();
  renderTopProducts();
  renderFinanceiro();
  renderOrdersTable();
}

// ══════════════════════════════════════════
// DATE FILTER HELPERS
// ══════════════════════════════════════════
function isDateInPeriod(dateStr, period, customStart = null, customEnd = null) {
  if (!dateStr) return false;
  if (period === 'all') return true;

  const d = new Date(dateStr);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const itemDateStr = d.toISOString().slice(0, 10);

  if (period === 'today') {
    return itemDateStr === todayStr;
  }
  if (period === 'yesterday') {
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    return itemDateStr === yest.toISOString().slice(0, 10);
  }
  if (period === '7d') {
    const past7 = new Date(now);
    past7.setDate(past7.getDate() - 7);
    return d >= past7;
  }
  if (period === '30d') {
    const past30 = new Date(now);
    past30.setDate(past30.getDate() - 30);
    return d >= past30;
  }
  if (period === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  if (period === 'last_month') {
    const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return d >= lastM && d <= lastMEnd;
  }
  if (period === 'custom') {
    if (customStart && itemDateStr < customStart) return false;
    if (customEnd && itemDateStr > customEnd) return false;
    return true;
  }
  return true;
}

function fmtDateTime(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return str; }
}

// ══════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════
let currentDashPeriod = '7d';
let revChartInstance = null;
let engageChartInstance = null;

function renderKPIs() {
  const filteredOrders = allOrders.filter(o => {
    if (o.status === 'cancelado') return false;
    return isDateInPeriod(o.created_at, currentDashPeriod);
  });

  const totalRevenue = filteredOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const revOnline = filteredOrders.filter(o => o.channel !== 'pdv').reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const revPdv = filteredOrders.filter(o => o.channel === 'pdv').reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const ticketMedio = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const pendingCount = allOrders.filter(o => o.status === 'pendente' || o.status === 'confirmado').length;

  let lowStockCount = 0;
  allAdminProducts.forEach(p => {
    const st = parseInt(p.stock) || 0;
    if (st < 3) lowStockCount++;
  });

  const kpiRev = document.getElementById('kpi-revenue');
  if (kpiRev) kpiRev.textContent = fmtCurrency(totalRevenue);

  const kpiOnline = document.getElementById('kpi-rev-online');
  if (kpiOnline) kpiOnline.textContent = fmtCurrency(revOnline);

  const kpiPdv = document.getElementById('kpi-rev-pdv');
  if (kpiPdv) kpiPdv.textContent = fmtCurrency(revPdv);

  const kpiOrd = document.getElementById('kpi-orders');
  if (kpiOrd) kpiOrd.textContent = totalOrders;

  const kpiTicket = document.getElementById('kpi-ticket-sub');
  if (kpiTicket) kpiTicket.innerHTML = `Ticket Médio: <strong>${fmtCurrency(ticketMedio)}</strong>`;

  const kpiPending = document.getElementById('kpi-pending');
  if (kpiPending) kpiPending.textContent = pendingCount;

  const kpiLowStock = document.getElementById('kpi-low-stock');
  if (kpiLowStock) kpiLowStock.textContent = lowStockCount;
}

function renderRevenueChart() {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  if (revChartInstance) {
    revChartInstance.destroy();
    revChartInstance = null;
  }

  // Agrupa pedidos válidos por data de acordo com o período
  const dailyMap = {};
  const orders = allOrders.filter(o => o.status !== 'cancelado' && isDateInPeriod(o.created_at, currentDashPeriod));

  // Inicializa últimos 7 ou 30 dias para não ficar vazio
  if (currentDashPeriod === '7d' || currentDashPeriod === '30d') {
    const days = currentDashPeriod === '7d' ? 7 : 30;
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      dailyMap[ds] = 0;
    }
  }

  orders.forEach(o => {
    const ds = o.created_at ? o.created_at.slice(0, 10) : '';
    if (ds) dailyMap[ds] = (dailyMap[ds] || 0) + parseFloat(o.total || 0);
  });

  const sortedDates = Object.keys(dailyMap).sort();
  const labels = sortedDates.map(d => fmtDate(d));
  const data = sortedDates.map(d => dailyMap[d]);

  revChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['Sem dados'],
      datasets: [{
        label: 'Vendas (R$)',
        data: data.length ? data : [0],
        borderColor: '#080ce6',
        backgroundColor: 'rgba(8,12,230,.12)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#080ce6',
        pointRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `Vendas: ${fmtCurrency(ctx.raw)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: v => fmtCurrency(v), font: { size: 11 } },
          grid: { color: '#f3f4f6' }
        },
        x: { ticks: { font: { size: 11 } }, grid: { display: false } }
      }
    }
  });
}

function renderEngageChart() {
  const ctx = document.getElementById('engageChart');
  if (!ctx) return;

  if (engageChartInstance) {
    engageChartInstance.destroy();
    engageChartInstance = null;
  }

  const filteredOrders = allOrders.filter(o => o.status !== 'cancelado' && isDateInPeriod(o.created_at, currentDashPeriod));
  const onlineCount = filteredOrders.filter(o => o.channel !== 'pdv').length;
  const pdvCount = filteredOrders.filter(o => o.channel === 'pdv').length;

  engageChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Loja Online', 'Balcão / PDV'],
      datasets: [{
        data: [onlineCount || 0, pdvCount || 0],
        backgroundColor: ['#2563eb', '#f59e0b'],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw} vendas`
          }
        }
      },
      cutout: '65%'
    }
  });
}

function renderRecentOrders() {
  const tbody = document.getElementById('recentOrdersBody');
  if (!tbody) return;

  const recents = [...allOrders].slice(-6).reverse();
  tbody.innerHTML = recents.map(o => {
    const isPdv = o.channel === 'pdv';
    const channelBadge = isPdv
      ? `<span class="badge-channel pdv"><i class="fas fa-cash-register"></i> PDV</span>`
      : `<span class="badge-channel online"><i class="fas fa-globe"></i> Online</span>`;

    const safeName = escapeHtml(o.customer_name || 'Cliente');
    const safeCity = escapeHtml(o.city || '—');
    const safeState = escapeHtml(o.state || '—');
    const safeStatus = escapeHtml(o.status || 'pendente');

    return `
      <tr>
        <td>${channelBadge}</td>
        <td><span class="fw-700">${safeName}</span></td>
        <td>${safeCity}/${safeState}</td>
        <td class="fw-700 text-green">${fmtCurrency(o.total)}</td>
        <td><span class="order-status ${safeStatus}">${safeStatus}</span></td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:1.5rem;">Nenhum pedido recente.</td></tr>';
}

function renderTopProducts() {
  const el = document.getElementById('topProductsList');
  if (!el) return;

  const counts = {};
  const revenueByProd = {};

  allOrders.forEach(o => {
    if (o.status === 'cancelado') return;
    try {
      JSON.parse(o.items_json || '[]').forEach(item => {
        const name = item.name || 'Produto';
        const qty = parseInt(item.qty) || 1;
        const pr = parseFloat(item.price) || 0;
        counts[name] = (counts[name] || 0) + qty;
        revenueByProd[name] = (revenueByProd[name] || 0) + (pr * qty);
      });
    } catch { }
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = sorted[0]?.[1] || 1;

  el.innerHTML = sorted.map(([name, qty], i) => `
    <div style="margin-bottom:.85rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem;">
        <span style="font-size:.82rem;font-weight:700;color:var(--adm-text);">${i + 1}. ${escapeHtml(name)}</span>
        <span style="font-size:.78rem;font-weight:700;color:var(--adm-green);">${fmtCurrency(revenueByProd[name] || 0)} <small style="font-weight:500;color:var(--adm-muted);">(${qty} un)</small></span>
      </div>
      <div style="height:6px;background:#f3f4f6;border-radius:50px;overflow:hidden;">
        <div style="height:100%;width:${(qty / max * 100).toFixed(0)}%;background:var(--adm-green);border-radius:50px;transition:width .6s;"></div>
      </div>
    </div>
  `).join('') || '<p style="color:#9ca3af;font-size:.85rem;padding:.75rem 0;">Sem dados de vendas ainda.</p>';
}

document.getElementById('dashPeriodSelect')?.addEventListener('change', (e) => {
  currentDashPeriod = e.target.value;
  renderKPIs();
  renderRevenueChart();
  renderEngageChart();
});

// ══════════════════════════════════════════
// FINANCEIRO
// ══════════════════════════════════════════
let currentFinPeriod = 'month';
let finChartInstance = null;

function renderFinanceiro() {
  const filteredOrders = allOrders.filter(o => {
    if (o.status === 'cancelado') return false;
    return isDateInPeriod(o.created_at, currentFinPeriod);
  });

  const totalRev = filteredOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const ticket = totalOrders > 0 ? totalRev / totalOrders : 0;

  // Encontrar melhor dia no período
  const revByDate = {};
  filteredOrders.forEach(o => {
    const ds = o.created_at ? o.created_at.slice(0, 10) : '';
    if (ds) revByDate[ds] = (revByDate[ds] || 0) + parseFloat(o.total || 0);
  });

  let bestDayDate = '—';
  let bestDayVal = 0;
  Object.entries(revByDate).forEach(([ds, val]) => {
    if (val > bestDayVal) {
      bestDayVal = val;
      bestDayDate = fmtDate(ds);
    }
  });

  document.getElementById('fin-total').textContent = fmtCurrency(totalRev);
  document.getElementById('fin-total-orders').textContent = `${totalOrders} pedidos no período`;
  document.getElementById('fin-ticket').textContent = fmtCurrency(ticket);
  document.getElementById('fin-best-day').textContent = fmtCurrency(bestDayVal);
  document.getElementById('fin-best-date').textContent = bestDayDate !== '—' ? `Recorde em ${bestDayDate}` : '—';

  // Formas de Pagamento
  let pixTotal = 0, creditTotal = 0, debitTotal = 0, cashTotal = 0;
  filteredOrders.forEach(o => {
    const m = (o.payment_method || '').toLowerCase();
    const val = parseFloat(o.total || 0);
    if (m.includes('pix')) pixTotal += val;
    else if (m.includes('crédito') || m.includes('credito') || m.includes('credit')) creditTotal += val;
    else if (m.includes('débito') || m.includes('debito') || m.includes('debit')) debitTotal += val;
    else if (m.includes('dinheiro') || m.includes('cash') || m.includes('espécie')) cashTotal += val;
    else creditTotal += val; // Fallback
  });

  document.getElementById('fin-pay-pix').textContent = fmtCurrency(pixTotal);
  document.getElementById('fin-pay-credit').textContent = fmtCurrency(creditTotal);
  document.getElementById('fin-pay-debit').textContent = fmtCurrency(debitTotal);
  document.getElementById('fin-pay-cash').textContent = fmtCurrency(cashTotal);

  // Gráfico de barras financeiro
  const sortedDates = Object.keys(revByDate).sort();
  const ctx = document.getElementById('finBarChart');
  if (ctx) {
    if (finChartInstance) {
      finChartInstance.destroy();
      finChartInstance = null;
    }
    finChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedDates.map(d => fmtDate(d)),
        datasets: [{
          label: 'Receita (R$)',
          data: sortedDates.map(d => revByDate[d]),
          backgroundColor: '#080ce6',
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (c) => `Receita: ${fmtCurrency(c.raw)}` }
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { callback: v => fmtCurrency(v), font: { size: 11 } }, grid: { color: '#f3f4f6' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
  }

  // Tabela Extrato
  const tbody = document.getElementById('statsTableBody');
  const countEl = document.getElementById('statsTableCount');
  if (tbody) {
    const statsFiltered = allStats.filter(s => isDateInPeriod(s.date, currentFinPeriod));
    if (countEl) countEl.textContent = `${statsFiltered.length} registros`;

    tbody.innerHTML = statsFiltered.map(d => `
      <tr>
        <td class="fw-700">${fmtDate(d.date)}</td>
        <td>${d.page_views || 0}</td>
        <td>${d.unique_visitors || 0}</td>
        <td>${d.cart_adds || 0}</td>
        <td>${d.checkouts || 0}</td>
        <td class="fw-700 text-green">${fmtCurrency(d.revenue)}</td>
      </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:#9ca3af;">Nenhum registro para o período.</td></tr>';
  }
}

document.getElementById('finPeriodSelect')?.addEventListener('change', (e) => {
  currentFinPeriod = e.target.value;
  renderFinanceiro();
});

// Exportação CSV do Financeiro
document.getElementById('btnExportFinanceCsv')?.addEventListener('click', () => {
  const statsFiltered = allStats.filter(s => isDateInPeriod(s.date, currentFinPeriod));
  if (!statsFiltered.length) {
    admToast('Nenhum dado financeiro para exportar no período.', 'info');
    return;
  }

  const headers = ['Data', 'Visualizacoes', 'Visitantes_Unicos', 'Adicoes_Carrinho', 'Checkouts', 'Receita_Total_BRL'];
  const rows = statsFiltered.map(s => [
    s.date,
    s.page_views || 0,
    s.unique_visitors || 0,
    s.cart_adds || 0,
    s.checkouts || 0,
    (s.revenue || 0).toFixed(2).replace('.', ',')
  ]);

  downloadCsv('extrato_financeiro_outlet365.csv', headers, rows);
  admToast('Extrato financeiro exportado com sucesso!');
});

// Impressão / PDF do Relatório Financeiro
document.getElementById('btnPrintFinanceReport')?.addEventListener('click', () => {
  window.print();
});

// ══════════════════════════════════════════
// ORDERS TABLE & ADVANCED MULTI-FILTER ENGINE
// ══════════════════════════════════════════
const orderFilterState = {
  search: '',
  status: '',
  period: 'all',
  startDate: '',
  endDate: '',
  payment: '',
  channel: ''
};

let currentModalOrderId = null;

function getFilteredOrders() {
  return allOrders.filter(o => {
    // 1. Busca textual (nome, telefone, email, id, cidade, cep)
    if (orderFilterState.search) {
      const q = orderFilterState.search.toLowerCase().trim();
      const idMatch = (o.id || '').toLowerCase().includes(q);
      const nameMatch = (o.customer_name || '').toLowerCase().includes(q);
      const phoneMatch = (o.customer_phone || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) || (o.customer_phone || '').toLowerCase().includes(q);
      const emailMatch = (o.customer_email || '').toLowerCase().includes(q);
      const cityMatch = (o.city || '').toLowerCase().includes(q);
      const cepMatch = (o.cep || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''));
      if (!idMatch && !nameMatch && !phoneMatch && !emailMatch && !cityMatch && !cepMatch) return false;
    }

    // 2. Status
    if (orderFilterState.status && (o.status || '').toLowerCase() !== orderFilterState.status.toLowerCase()) {
      return false;
    }

    // 3. Período / Datas
    if (!isDateInPeriod(o.created_at, orderFilterState.period, orderFilterState.startDate, orderFilterState.endDate)) {
      return false;
    }

    // 4. Forma de Pagamento
    if (orderFilterState.payment) {
      const pay = (o.payment_method || '').toLowerCase();
      if (!pay.includes(orderFilterState.payment.toLowerCase())) return false;
    }

    // 5. Canal / Origem
    if (orderFilterState.channel) {
      if (orderFilterState.channel === 'pdv' && o.channel !== 'pdv') return false;
      if (orderFilterState.channel === 'online' && o.channel === 'pdv') return false;
    }

    return true;
  });
}

function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  const filtered = getFilteredOrders();
  const sorted = [...filtered].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

  // Atualizar Mini-KPIs
  const totalVal = sorted.filter(o => o.status !== 'cancelado').reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const countVal = sorted.length;
  const ticketVal = countVal > 0 ? totalVal / (sorted.filter(o => o.status !== 'cancelado').length || 1) : 0;
  const pendingVal = sorted.filter(o => o.status === 'pendente' || o.status === 'confirmado').length;

  document.getElementById('ordKpiCount').textContent = countVal;
  document.getElementById('ordKpiTotal').textContent = fmtCurrency(totalVal);
  document.getElementById('ordKpiTicket').textContent = fmtCurrency(ticketVal);
  document.getElementById('ordKpiPending').textContent = pendingVal;

  const countText = document.getElementById('orderFilterCountText');
  if (countText) {
    countText.textContent = `Exibindo ${sorted.length} de ${allOrders.length} pedido${allOrders.length !== 1 ? 's' : ''}`;
  }

  tbody.innerHTML = sorted.map(o => {
    let items = [];
    try { items = JSON.parse(o.items_json || '[]'); } catch { }

    const isPdv = o.channel === 'pdv';
    const channelBadge = isPdv
      ? `<span class="badge-channel pdv"><i class="fas fa-cash-register"></i> Balcão</span>`
      : `<span class="badge-channel online"><i class="fas fa-globe"></i> Online</span>`;

    const payMethod = o.payment_method || 'PIX';
    let payIcon = 'fas fa-bolt';
    if (payMethod.toLowerCase().includes('crédito') || payMethod.toLowerCase().includes('credito')) payIcon = 'fas fa-credit-card';
    else if (payMethod.toLowerCase().includes('débito') || payMethod.toLowerCase().includes('debito')) payIcon = 'far fa-credit-card';
    else if (payMethod.toLowerCase().includes('dinheiro')) payIcon = 'fas fa-money-bill-wave';
    else if (payMethod.toLowerCase().includes('boleto')) payIcon = 'fas fa-barcode';

    const safeId = escapeHtml(o.id || '');
    const safeCustName = escapeHtml(o.customer_name || 'Cliente Balcão');
    const safePhone = escapeHtml(o.customer_phone || '—');
    const safeCity = escapeHtml(o.city || 'Madalena');
    const safeState = escapeHtml(o.state || 'CE');
    const safePayMethod = escapeHtml(payMethod);
    const safeStatus = escapeHtml(o.status || 'pendente');

    return `
      <tr>
        <td>
          <div class="fw-700" style="font-size:.82rem;color:var(--adm-text);">#${safeId.slice(-6).toUpperCase()}</div>
          <div style="font-size:.72rem;color:var(--adm-muted);">${fmtDateTime(o.created_at)}</div>
        </td>
        <td>${channelBadge}</td>
        <td>
          <div class="fw-700" style="font-size:.84rem;">${safeCustName}</div>
          <div style="font-size:.73rem;color:var(--adm-muted);">${safePhone}</div>
        </td>
        <td>${safeCity}/${safeState}</td>
        <td style="font-size:.78rem;">
          <strong>${items.reduce((s, x) => s + (parseInt(x.qty) || 1), 0)}</strong> un
          <span style="color:var(--adm-muted);font-size:.72rem;">(${items.length} item${items.length !== 1 ? 's' : ''})</span>
        </td>
        <td class="fw-700 text-green">${fmtCurrency(o.total)}</td>
        <td>
          <span class="badge-pay"><i class="${payIcon}"></i> ${safePayMethod}</span>
        </td>
        <td>
          <select class="status-select" data-id="${safeId}" style="padding:.32rem .55rem;border:1.5px solid var(--adm-border);border-radius:6px;font-size:.74rem;font-weight:700;background:#fff;cursor:pointer;" onchange="changeOrderStatus(this)">
            ${['pendente', 'confirmado', 'enviado', 'entregue', 'cancelado'].map(s => `
              <option value="${s}" ${o.status === s ? 'selected' : ''}>
                ${s === 'pendente' ? '⏳ Pendente' : s === 'confirmado' ? '✅ Confirmado' : s === 'enviado' ? '📦 Enviado' : s === 'entregue' ? '🎉 Entregue' : '❌ Cancelado'}
              </option>
            `).join('')}
          </select>
        </td>
        <td style="text-align:center;white-space:nowrap;">
          <button class="adm-btn-sm adm-btn-edit" style="width:auto;padding:.4rem .65rem;" onclick="viewOrder('${safeId}')" title="Ver Detalhes">
            <i class="fas fa-eye"></i>
          </button>
          <button class="adm-btn-sm" style="width:auto;padding:.4rem .65rem;background:#25D366;color:#fff;border:none;" onclick="quickNotifyWhatsApp('${safeId}')" title="Notificar WhatsApp">
            <i class="fab fa-whatsapp"></i>
          </button>
          <button class="adm-btn-sm adm-btn-secondary" style="width:auto;padding:.4rem .65rem;" onclick="printOrderReceipt('${safeId}')" title="Imprimir Comprovante">
            <i class="fas fa-print"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="9" style="text-align:center;color:#9ca3af;padding:2rem;">Nenhum pedido encontrado com estes filtros.</td></tr>';
}

// Eventos de Filtro dos Pedidos
document.getElementById('orderSearchInput')?.addEventListener('input', (e) => {
  orderFilterState.search = e.target.value;
  renderOrdersTable();
});

document.getElementById('orderStatusFilter')?.addEventListener('change', (e) => {
  orderFilterState.status = e.target.value;
  renderOrdersTable();
});

document.getElementById('orderPeriodFilter')?.addEventListener('change', (e) => {
  orderFilterState.period = e.target.value;
  const customRow = document.getElementById('orderCustomDateRow');
  if (customRow) {
    customRow.style.display = e.target.value === 'custom' ? 'grid' : 'none';
  }
  renderOrdersTable();
});

document.getElementById('orderStartDate')?.addEventListener('change', (e) => {
  orderFilterState.startDate = e.target.value;
  renderOrdersTable();
});

document.getElementById('orderEndDate')?.addEventListener('change', (e) => {
  orderFilterState.endDate = e.target.value;
  renderOrdersTable();
});

document.getElementById('orderPaymentFilter')?.addEventListener('change', (e) => {
  orderFilterState.payment = e.target.value;
  renderOrdersTable();
});

document.getElementById('orderChannelFilter')?.addEventListener('change', (e) => {
  orderFilterState.channel = e.target.value;
  renderOrdersTable();
});

document.getElementById('btnClearOrderFilters')?.addEventListener('click', () => {
  orderFilterState.search = '';
  orderFilterState.status = '';
  orderFilterState.period = 'all';
  orderFilterState.startDate = '';
  orderFilterState.endDate = '';
  orderFilterState.payment = '';
  orderFilterState.channel = '';

  const searchInput = document.getElementById('orderSearchInput');
  if (searchInput) searchInput.value = '';
  const statusSelect = document.getElementById('orderStatusFilter');
  if (statusSelect) statusSelect.value = '';
  const periodSelect = document.getElementById('orderPeriodFilter');
  if (periodSelect) periodSelect.value = 'all';
  const paySelect = document.getElementById('orderPaymentFilter');
  if (paySelect) paySelect.value = '';
  const channelSelect = document.getElementById('orderChannelFilter');
  if (channelSelect) channelSelect.value = '';

  const customRow = document.getElementById('orderCustomDateRow');
  if (customRow) customRow.style.display = 'none';

  renderOrdersTable();
  admToast('Filtros limpos com sucesso!', 'info');
});

// Atualização de Status
async function changeOrderStatus(sel) {
  const selId = sel.dataset.id;
  const status = sel.value;
  await updateRecord('orders', selId, { status });
  const ord = allOrders.find(o => o.id === selId);
  if (ord) ord.status = status;
  renderOrdersTable();
  renderKPIs();
  admToast(`Status do pedido #${selId.slice(-4).toUpperCase()} alterado para "${status}"!`);
}

// ══════════════════════════════════════════
// EXPORTAÇÃO CSV & PDF DE PEDIDOS
// ══════════════════════════════════════════
function downloadCsv(filename, headers, rows) {
  // UTF-8 BOM para garantir acentos corretos no Excel
  const bom = '\uFEFF';
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => {
      const str = String(cell ?? '').replace(/"/g, '""');
      return `"${str}"`;
    }).join(';'))
  ].join('\r\n');

  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.getElementById('btnExportOrdersCsv')?.addEventListener('click', () => {
  const filtered = getFilteredOrders();
  if (!filtered.length) {
    admToast('Nenhum pedido para exportar com os filtros atuais.', 'info');
    return;
  }

  const headers = [
    'ID_Pedido', 'Data_Hora', 'Canal_Origem', 'Cliente_Nome', 'WhatsApp', 'Email',
    'Cidade', 'UF', 'CEP', 'Forma_Pagamento', 'Status', 'Qtd_Itens', 'Itens_Detalhados',
    'Subtotal_BRL', 'Frete_BRL', 'Total_BRL', 'Codigo_Rastreio', 'Observacoes'
  ];

  const rows = filtered.map(o => {
    let itemsStr = '';
    let totalQty = 0;
    try {
      const items = JSON.parse(o.items_json || '[]');
      itemsStr = items.map(i => `${i.name} (Tam: ${i.size}, Qtd: ${i.qty}, R$ ${i.price})`).join(' | ');
      totalQty = items.reduce((s, x) => s + (parseInt(x.qty) || 1), 0);
    } catch { }

    return [
      o.id,
      fmtDateTime(o.created_at),
      o.channel === 'pdv' ? 'Balcao / PDV' : 'Loja Online',
      o.customer_name || 'Cliente Balcao',
      o.customer_phone || '',
      o.customer_email || '',
      o.city || 'Madalena',
      o.state || 'CE',
      o.cep || '',
      o.payment_method || 'PIX',
      o.status || 'pendente',
      totalQty,
      itemsStr,
      (parseFloat(o.subtotal) || 0).toFixed(2).replace('.', ','),
      (parseFloat(o.shipping) || 0).toFixed(2).replace('.', ','),
      (parseFloat(o.total) || 0).toFixed(2).replace('.', ','),
      o.tracking_code || '',
      o.notes || ''
    ];
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`pedidos_outlet365_${dateStr}.csv`, headers, rows);
  admToast(`Exportados ${filtered.length} pedidos em planilha Excel/CSV!`);
});

document.getElementById('btnPrintOrdersReport')?.addEventListener('click', () => {
  window.print();
});

// ══════════════════════════════════════════
// MODAL DE DETALHES DO PEDIDO
// ══════════════════════════════════════════
function viewOrder(id) {
  const o = allOrders.find(x => x.id === id);
  if (!o) return;
  currentModalOrderId = id;

  let items = [];
  try { items = JSON.parse(o.items_json || '[]'); } catch { }

  const isPdv = o.channel === 'pdv';

  const safeCustName = escapeHtml(o.customer_name || 'Cliente Balcão');
  const safePhone = escapeHtml(o.customer_phone || 'Não informado');
  const safeEmail = escapeHtml(o.customer_email || 'Não informado');
  const safeCity = escapeHtml(o.city || 'Madalena');
  const safeState = escapeHtml(o.state || 'CE');
  const safePayMethod = escapeHtml(o.payment_method || 'PIX');
  const safeTracking = escapeHtml(o.tracking_code || '');
  const safeOrderId = escapeHtml(o.id || '');
  const safeNotes = escapeHtml(o.notes || '');

  document.getElementById('orderModalBody').innerHTML = `
    <div class="order-detail-grid" style="margin-bottom:1rem;">
      <div class="order-box-section">
        <p style="font-size:.7rem;font-weight:700;color:var(--adm-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.35rem;">
          <i class="fas fa-user" style="color:var(--adm-blue);"></i> Dados do Cliente
        </p>
        <p class="fw-700" style="font-size:.95rem;">${safeCustName}</p>
        <p style="font-size:.82rem;color:var(--adm-muted);"><i class="fas fa-phone-alt" style="font-size:.75rem;"></i> ${safePhone}</p>
        <p style="font-size:.82rem;color:var(--adm-muted);"><i class="fas fa-envelope" style="font-size:.75rem;"></i> ${safeEmail}</p>
        <div style="margin-top:.4rem;">
          <span class="badge-channel ${isPdv ? 'pdv' : 'online'}">${isPdv ? '🏬 Balcão / Loja Física' : '🌐 Loja Online (Site)'}</span>
        </div>
      </div>

      <div class="order-box-section">
        <p style="font-size:.7rem;font-weight:700;color:var(--adm-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.35rem;">
          <i class="fas fa-truck" style="color:var(--adm-yellow);"></i> Entrega & Pagamento
        </p>
        <p class="fw-700" style="font-size:.85rem;">${safeCity}/${safeState}</p>
        <p style="font-size:.82rem;color:var(--adm-muted);">Forma: <strong>${safePayMethod}</strong></p>
        <p style="font-size:.82rem;color:var(--adm-muted);">Data: ${fmtDateTime(o.created_at)}</p>

        <!-- Código de Rastreio -->
        <div style="margin-top:.5rem;">
          <label style="font-size:.72rem;font-weight:700;color:var(--adm-muted);text-transform:uppercase;">Código de Rastreio</label>
          <div class="order-tracking-input-group">
            <input type="text" id="modalTrackingCode" placeholder="Ex: BR123456789CE" value="${safeTracking}" />
            <button class="adm-btn adm-btn-secondary" style="padding:.35rem .65rem;font-size:.75rem;" onclick="saveTrackingCode('${safeOrderId}')" title="Salvar Rastreio">Salvar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Status do Pedido Selector -->
    <div style="background:#fff;border:1.5px solid var(--adm-border);border-radius:8px;padding:.75rem 1rem;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between;">
      <label style="font-size:.82rem;font-weight:700;">Status Atual:</label>
      <select id="modalStatusSelect" style="padding:.4rem .8rem;border:1.5px solid var(--adm-border);border-radius:6px;font-weight:700;background:#fff;font-size:.85rem;">
        <option value="pendente" ${o.status === 'pendente' ? 'selected' : ''}>⏳ Pendente</option>
        <option value="confirmado" ${o.status === 'confirmado' ? 'selected' : ''}>✅ Confirmado / Pago</option>
        <option value="enviado" ${o.status === 'enviado' ? 'selected' : ''}>📦 Enviado / Em trânsito</option>
        <option value="entregue" ${o.status === 'entregue' ? 'selected' : ''}>🎉 Entregue</option>
        <option value="cancelado" ${o.status === 'cancelado' ? 'selected' : ''}>❌ Cancelado</option>
      </select>
    </div>

    <!-- Itens do Pedido -->
    <div style="background:#fff;border:1px solid var(--adm-border);border-radius:8px;padding:1rem;">
      <p style="font-size:.72rem;font-weight:700;color:var(--adm-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.6rem;">
        <i class="fas fa-tshirt" style="color:var(--adm-green);"></i> Itens Comprados (${items.length})
      </p>
      ${items.map(item => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:.55rem 0;border-bottom:1px solid #f3f4f6;">
          <div>
            <span class="fw-700" style="font-size:.88rem;color:var(--adm-text);">${escapeHtml(item.name || 'Item')}</span>
            <div style="font-size:.76rem;color:var(--adm-muted);">Tamanho: <strong>${escapeHtml(item.size || 'Único')}</strong> · Quantidade: <strong>${parseInt(item.qty) || 1}</strong></div>
          </div>
          <span class="fw-700 text-green" style="font-size:.9rem;">${fmtCurrency((parseFloat(item.price) || 0) * (parseInt(item.qty) || 1))}</span>
        </div>
      `).join('')}

      <div style="margin-top:.85rem;text-align:right;">
        <div style="font-size:.82rem;color:var(--adm-muted);">Subtotal: ${fmtCurrency(o.subtotal || o.total)}</div>
        ${o.shipping > 0 ? `<div style="font-size:.82rem;color:var(--adm-muted);">Frete: ${fmtCurrency(o.shipping)}</div>` : ''}
        <div class="fw-700" style="font-size:1.2rem;color:var(--adm-green);margin-top:.3rem;">Total: ${fmtCurrency(o.total)}</div>
      </div>
    </div>

    ${safeNotes ? `
      <div style="margin-top:.75rem;padding:.75rem;background:#fef9ec;border:1px solid #fef08a;border-radius:6px;font-size:.82rem;color:#854d0e;">
        <i class="fas fa-sticky-note" style="margin-right:.35rem;"></i><strong>Obs:</strong> ${safeNotes}
      </div>
    ` : ''}
  `;

  // Configura botões do footer do modal
  const updateBtn = document.getElementById('updateStatusBtn');
  if (updateBtn) {
    updateBtn.onclick = async () => {
      const newStatus = document.getElementById('modalStatusSelect').value;
      await updateRecord('orders', o.id, { status: newStatus });
      o.status = newStatus;
      renderOrdersTable();
      renderKPIs();
      admToast(`Status atualizado para "${newStatus}"!`);
      closeModal('orderModal');
    };
  }

  const wappBtn = document.getElementById('orderModalWappBtn');
  if (wappBtn) {
    wappBtn.onclick = () => quickNotifyWhatsApp(o.id);
  }

  const printBtn = document.getElementById('orderModalPrintBtn');
  if (printBtn) {
    printBtn.onclick = () => printOrderReceipt(o.id);
  }

  document.getElementById('orderModal').classList.add('active');
}

async function saveTrackingCode(orderId) {
  const code = (document.getElementById('modalTrackingCode')?.value || '').trim();
  const o = allOrders.find(x => x.id === orderId);
  if (o) {
    o.tracking_code = code;
    try {
      await supabaseClient.from('orders').update({ tracking_code: code }).eq('id', orderId);
    } catch { }
    admToast('Código de rastreio salvo com sucesso!');
  }
}

// WhatsApp Notifier
function quickNotifyWhatsApp(orderId) {
  const o = allOrders.find(x => x.id === orderId);
  if (!o) return;

  const phone = (o.customer_phone || '').replace(/\D/g, '');
  if (!phone) {
    admToast('Cliente não possui telefone cadastrado.', 'error');
    return;
  }

  const cleanPhone = phone.length <= 11 ? '55' + phone : phone;
  const status = (o.status || 'pendente').toLowerCase();
  const name = (o.customer_name || 'Cliente').split(' ')[0];
  const orderNum = (o.id || '').slice(-6).toUpperCase();

  let msg = `Olá, ${name}! Tudo bem?\nAqui é da *Outlet 365* 👕👟\n\n`;

  if (status === 'confirmado') {
    msg += `Passando para confirmar que recebemos seu pedido *#${orderNum}* no valor de *${fmtCurrency(o.total)}*.\nJá estamos preparando seus produtos para envio! 📦✨`;
  } else if (status === 'enviado') {
    msg += `Boas notícias! Seu pedido *#${orderNum}* foi *ENVIADO*! 🚀📦\n`;
    if (o.tracking_code) msg += `Código de rastreamento: *${o.tracking_code}*\n`;
    msg += `Em breve chegará até você. Qualquer dúvida estamos à disposição!`;
  } else if (status === 'entregue') {
    msg += `Seu pedido *#${orderNum}* consta como *ENTREGUE*! 🎉\nEsperamos que você ame suas peças! Se puder, tire uma foto e marque a gente no Instagram! 📸👕`;
  } else {
    msg += `Atualização sobre seu pedido *#${orderNum}*:\nStatus atual: *${o.status.toUpperCase()}*\nValor: *${fmtCurrency(o.total)}*\nEstamos à disposição para qualquer dúvida!`;
  }

  const wappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
  window.open(wappUrl, '_blank');
}

// Impressão de Cupom do Pedido
function printOrderReceipt(orderId) {
  const o = allOrders.find(x => x.id === orderId);
  if (!o) return;

  let items = [];
  try { items = JSON.parse(o.items_json || '[]'); } catch { }

  const printWindow = window.open('', '_blank', 'width=420,height=600');
  if (!printWindow) {
    admToast('Por favor, permita pop-ups para imprimir o cupom.', 'error');
    return;
  }

  const isPdv = o.channel === 'pdv';

  const receiptHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Comprovante Pedido #${(o.id || '').slice(-6).toUpperCase()}</title>
      <style>
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          margin: 0;
          padding: 15px;
          color: #000;
          background: #fff;
        }
        .header { text-align: center; margin-bottom: 12px; }
        .logo { font-size: 18px; font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .bold { font-weight: bold; }
        .total-row { font-size: 15px; font-weight: bold; margin: 8px 0; }
        .footer { text-align: center; margin-top: 15px; font-size: 11px; }
      </style>
    </head>
    <body onload="window.print();">
      <div class="header">
        <div class="logo">OUTLET 365</div>
        <div>Moda Masculina, Calçados & Acessórios</div>
        <div>Loja Física: Madalena - CE</div>
        <div class="bold">COMPROVANTE DE PEDIDO</div>
      </div>
      <div class="divider"></div>
      <div class="row"><span>PEDIDO:</span><span class="bold">#${escapeHtml((o.id || '').slice(-6).toUpperCase())}</span></div>
      <div class="row"><span>DATA:</span><span>${fmtDateTime(o.created_at)}</span></div>
      <div class="row"><span>ORIGEM:</span><span>${isPdv ? 'Balcão / Loja Física' : 'Loja Online (Site)'}</span></div>
      <div class="row"><span>CLIENTE:</span><span>${escapeHtml(o.customer_name || 'Cliente Balcão')}</span></div>
      ${o.customer_phone ? `<div class="row"><span>FONE:</span><span>${escapeHtml(o.customer_phone)}</span></div>` : ''}
      <div class="divider"></div>
      <div class="bold" style="margin-bottom:6px;">ITENS:</div>
      ${items.map(it => `
        <div class="row">
          <span>${parseInt(it.qty) || 1}x ${escapeHtml(it.name || 'Item')} (${escapeHtml(it.size || 'Único')})</span>
          <span>${fmtCurrency((parseFloat(it.price) || 0) * (parseInt(it.qty) || 1))}</span>
        </div>
      `).join('')}
      <div class="divider"></div>
      <div class="row"><span>SUBTOTAL:</span><span>${fmtCurrency(o.subtotal || o.total)}</span></div>
      ${o.shipping > 0 ? `<div class="row"><span>FRETE:</span><span>${fmtCurrency(o.shipping)}</span></div>` : ''}
      <div class="row total-row"><span>TOTAL:</span><span>${fmtCurrency(o.total)}</span></div>
      <div class="row"><span>PAGAMENTO:</span><span class="bold">${escapeHtml(o.payment_method || 'PIX')}</span></div>
      <div class="row"><span>STATUS:</span><span class="bold">${escapeHtml((o.status || 'pendente').toUpperCase())}</span></div>
      <div class="divider"></div>
      <div class="footer">
        <div>Obrigado pela preferência!</div>
        <div>Instagram: @outlet365</div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(receiptHtml);
  printWindow.document.close();
}

// ══════════════════════════════════════════
// ADMIN PRODUCTS
// ══════════════════════════════════════════
async function renderAdminProducts(catFilter = 'todos', search = '', sortOrder = '') {
  const grid = document.getElementById('adminProductsGrid');
  if (!grid) return;
  allAdminProducts = await fetchAll('admin_products');
  let products = [...allAdminProducts];
  if (catFilter === 'promocoes') products = products.filter(p => p.weekly_promo);
  else if (catFilter !== 'todos') products = products.filter(p => p.category === catFilter);
  if (search) products = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  // Ordenação
  const sort = sortOrder || document.getElementById('prodSortOrder')?.value || 'newest';
  if (sort === 'newest') {
    products.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  } else if (sort === 'oldest') {
    products.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
  } else if (sort === 'name_asc') {
    products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (sort === 'price_asc') {
    products.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
  } else if (sort === 'price_desc') {
    products.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
  } else if (sort === 'stock_asc') {
    products.sort((a, b) => (parseInt(a.stock) || 0) - (parseInt(b.stock) || 0));
  }

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

  const catLabels = { 'camisas': 'Camisas', 'shorts-calcas': 'Shorts/Calças', 'calcados-chinelos': 'Calçados', 'acessorios': 'Acessórios', 'perfumes': 'Perfumes' };
  grid.innerHTML = products.map(p => {
    const safeName = escapeHtml(p.name || 'Produto');
    const safeId = escapeHtml(p.id || '');
    const imgEl = p.image_base64
      ? `<img src="${escapeHtml(p.image_base64)}" class="adm-product-img" alt="${safeName}"/>`
      : p.image_url
        ? `<img src="${escapeHtml(p.image_url)}" class="adm-product-img" alt="${safeName}"/>`
        : `<div class="adm-product-img-placeholder"><i class="fas fa-image"></i></div>`;
    
    // Grades de tamanhos
    const rawSizes = p.sizes ? (Array.isArray(p.sizes) ? p.sizes : String(p.sizes).split(',')) : [];
    const cleanSizes = rawSizes.map(s => String(s).trim()).filter(Boolean);
    const sizesPills = cleanSizes.length > 0
      ? cleanSizes.slice(0, 6).map(s => `<span class="adm-size-pill">${escapeHtml(s)}</span>`).join('') + (cleanSizes.length > 6 ? `<span class="adm-size-pill" style="background:#e2e8f0;">+${cleanSizes.length - 6}</span>` : '')
      : '<span style="color:#9ca3af;font-size:.72rem;">Único</span>';

    // Estoque total e badge
    const totalStock = parseInt(p.stock) || 0;
    const stockClass = totalStock <= 0 ? 'out-stock' : (totalStock <= 3 ? 'low-stock' : 'in-stock');
    const stockIcon = totalStock <= 0 ? 'fa-times-circle' : (totalStock <= 3 ? 'fa-exclamation-triangle' : 'fa-check-circle');
    const stockText = totalStock <= 0 ? 'Esgotado' : `${totalStock} un em estoque`;

    return `
      <div class="adm-product-card" id="pcard-${safeId}">
        ${imgEl}
        <div class="adm-product-body">
          <div class="adm-product-name">${safeName}</div>
          <div class="adm-product-price">${fmtCurrency(p.price)}
            ${p.original_price > p.price ? `<span style="font-size:.75rem;text-decoration:line-through;color:#9ca3af;margin-left:.35rem;">${fmtCurrency(p.original_price)}</span>` : ''}
          </div>
          <div class="adm-product-meta">
            <span class="adm-tag cat">${escapeHtml(catLabels[p.category] || p.category)}</span>
            ${p.category_cover ? '<span class="adm-tag" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;">🏷️ Capa</span>' : ''}
            ${p.weekly_promo ? '<span class="adm-tag promo">🔥 Promo</span>' : ''}
            ${p.hero_card ? '<span class="adm-tag hero">⭐ Card</span>' : ''}
            <span class="adm-tag ${p.active !== false ? 'active' : 'inactive'}">${p.active !== false ? 'Ativo' : 'Inativo'}</span>
          </div>

          <div class="adm-product-specs">
            <div class="adm-spec-row">
              <span style="font-size:.72rem;color:var(--adm-muted);white-space:nowrap;"><i class="fas fa-ruler" style="margin-right:.25rem;"></i>Tamanhos:</span>
              <div class="adm-size-pills">${sizesPills}</div>
            </div>
            <div class="adm-spec-row" style="margin-top:.25rem;">
              <span class="adm-stock-badge ${stockClass}">
                <i class="fas ${stockIcon}"></i> ${stockText}
              </span>
            </div>
          </div>
        </div>
        <div class="adm-product-actions">
          <button class="adm-btn-sm adm-btn-edit" onclick="editProduct('${safeId}')">
            <i class="fas fa-pencil-alt"></i> Editar
          </button>
          <button class="adm-btn-sm adm-btn-duplicate" onclick="duplicateProduct('${safeId}')" title="Duplicar anúncio para criar variação">
            <i class="fas fa-copy"></i> Duplicar
          </button>
          <button class="adm-btn-sm adm-btn-toggle ${p.active !== false ? 'on' : ''}" onclick="toggleProductActive('${safeId}',${p.active !== false})">
            <i class="fas ${p.active !== false ? 'fa-eye' : 'fa-eye-slash'}"></i>
          </button>
          <button class="adm-btn-sm adm-btn-delete" onclick="confirmDelete('${safeId}','${safeName.replace(/'/g, "\\'")}')">
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
    renderAdminProducts(btn.dataset.pcat, document.getElementById('prodSearch')?.value || '', document.getElementById('prodSortOrder')?.value || '');
  });
});
document.getElementById('prodSearch')?.addEventListener('input', e => {
  const cat = document.querySelector('.adm-filter-btn[data-pcat].active')?.dataset.pcat || 'todos';
  renderAdminProducts(cat, e.target.value, document.getElementById('prodSortOrder')?.value || '');
});
document.getElementById('prodSortOrder')?.addEventListener('change', e => {
  const cat = document.querySelector('.adm-filter-btn[data-pcat].active')?.dataset.pcat || 'todos';
  renderAdminProducts(cat, document.getElementById('prodSearch')?.value || '', e.target.value);
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

  resetForm();
  editingProductId = id;
  navigateTo('novo-produto', false);

  document.getElementById('formProductTitle').textContent = 'Editar Produto';
  document.getElementById('editProductId').value = id;
  document.getElementById('prodName').value = p.name || '';

  const saveBtn = document.querySelector('#productForm [type="submit"]');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
  }

  const catSel = document.getElementById('prodCategory');
  if (catSel) {
    if (![...catSel.options].some(o => o.value === p.category)) {
      const opt = document.createElement('option');
      opt.value = p.category;
      opt.textContent = p.category;
      catSel.appendChild(opt);
    }
    catSel.value = p.category || '';
  }
  onCategoryChange();

  setTimeout(() => {
    const subSel = document.getElementById('prodSubcategory');
    if (subSel && p.subcategory) {
      if (![...subSel.options].some(o => o.value === p.subcategory)) {
        const opt = document.createElement('option');
        opt.value = p.subcategory;
        opt.textContent = p.subcategory;
        subSel.appendChild(opt);
      }
      subSel.value = p.subcategory;
    }
  }, 100);

  document.getElementById('prodPrice').value = p.price || '';
  document.getElementById('prodOriginalPrice').value = p.original_price || '';
  document.getElementById('prodInstallments').value = p.installments || 3;
  document.getElementById('prodStock').value = p.stock || 0;
  document.getElementById('prodWeight').value = p.weight !== undefined ? p.weight : 0.300;
  document.getElementById('prodHeight').value = p.height !== undefined ? p.height : 5;
  document.getElementById('prodWidth').value = p.width !== undefined ? p.width : 15;
  document.getElementById('prodLength').value = p.length !== undefined ? p.length : 20;
  document.getElementById('prodDescription').value = p.description || '';
  document.getElementById('prodActive').checked = p.active !== false;
  document.getElementById('prodFeatured').checked = !!p.featured;
  document.getElementById('prodNew').checked = !!p.new_arrival;
  document.getElementById('prodPromo').checked = !!p.weekly_promo;
  document.getElementById('prodHeroCard').checked = !!p.hero_card;
  if (document.getElementById('prodCategoryCover')) document.getElementById('prodCategoryCover').checked = !!p.category_cover;
  photosData = [];
  if (p.image_url) {
    photosData.push({ isNew: false, url: p.image_url, preview: p.image_url });
  } else if (p.image_base64) {
    photosData.push({ isNew: false, base64: p.image_base64, preview: p.image_base64 });
  }
  renderPhotoPreviews();

  setTimeout(() => {
    populateProductSizes(p.sizes, p.variant_stock);
  }, 120);
  updateHeroCounter();
}

async function duplicateProduct(id) {
  const p = allAdminProducts.find(x => x.id === id);
  if (!p) return;

  resetForm();
  editingProductId = null; // Forces creation of a NEW product on save!
  navigateTo('novo-produto', false);

  document.getElementById('formProductTitle').textContent = `Duplicar Anúncio: ${p.name}`;
  document.getElementById('editProductId').value = '';
  document.getElementById('prodName').value = `${p.name} (Cópia)`;

  const saveBtn = document.querySelector('#productForm [type="submit"]');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Produto';
  }

  const catSel = document.getElementById('prodCategory');
  if (catSel) {
    if (![...catSel.options].some(o => o.value === p.category)) {
      const opt = document.createElement('option');
      opt.value = p.category;
      opt.textContent = p.category;
      catSel.appendChild(opt);
    }
    catSel.value = p.category || '';
  }
  onCategoryChange();

  setTimeout(() => {
    const subSel = document.getElementById('prodSubcategory');
    if (subSel && p.subcategory) {
      if (![...subSel.options].some(o => o.value === p.subcategory)) {
        const opt = document.createElement('option');
        opt.value = p.subcategory;
        opt.textContent = p.subcategory;
        subSel.appendChild(opt);
      }
      subSel.value = p.subcategory;
    }
  }, 100);

  document.getElementById('prodPrice').value = p.price || '';
  document.getElementById('prodOriginalPrice').value = p.original_price || '';
  document.getElementById('prodInstallments').value = p.installments || 3;
  document.getElementById('prodStock').value = p.stock || 0;
  document.getElementById('prodWeight').value = p.weight !== undefined ? p.weight : 0.300;
  document.getElementById('prodHeight').value = p.height !== undefined ? p.height : 5;
  document.getElementById('prodWidth').value = p.width !== undefined ? p.width : 15;
  document.getElementById('prodLength').value = p.length !== undefined ? p.length : 20;
  document.getElementById('prodDescription').value = p.description || '';
  document.getElementById('prodActive').checked = true;
  document.getElementById('prodFeatured').checked = !!p.featured;
  document.getElementById('prodNew').checked = !!p.new_arrival;
  document.getElementById('prodPromo').checked = !!p.weekly_promo;
  document.getElementById('prodHeroCard').checked = false;
  if (document.getElementById('prodCategoryCover')) document.getElementById('prodCategoryCover').checked = false;

  photosData = [];
  if (p.image_url) {
    photosData.push({ isNew: false, url: p.image_url, preview: p.image_url });
  } else if (p.image_base64) {
    photosData.push({ isNew: false, base64: p.image_base64, preview: p.image_base64 });
  }
  renderPhotoPreviews();

  setTimeout(() => {
    populateProductSizes(p.sizes, p.variant_stock);
  }, 120);

  updateHeroCounter();
  admToast('Anúncio clonado! Edite os campos e clique em Salvar.', 'info');
}

// ══════════════════════════════════════════
// PRODUCT FORM & DYNAMIC CATEGORIES
// ══════════════════════════════════════════
const SUBCATEGORIES = {
  'camisas': ['Básicas', 'Polo', 'Premium', 'Street', 'Outras'],
  'shorts-calcas': ['Shorts', 'Calças', 'Outras'],
  'calcados-chinelos': ['Chinelos', 'Slides', 'Tênis/Sapatos', 'Outros'],
  'acessorios': ['Bonés', 'Roupas Íntimas', 'Outros'],
  'perfumes': ['Perfumes Árabes', 'Perfumes Nacionais', 'Outros']
};

const SIZE_GROUPS = {
  'camisas': ['P', 'M', 'G', 'GG', 'XG', 'XGG'],
  'shorts-calcas': ['P', 'M', 'G', 'GG', '36', '38', '40', '42', '44', '46', '48', '50'],
  'calcados-chinelos': [
    '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48',
    '33/34', '35/36', '37/38', '39/40', '41/42', '43/44', '45/46', '47/48',
    '34/35', '36/37', '38/39', '40/41', '42/43', '44/45', '46/47'
  ],
  'acessorios': ['P', 'M', 'G', 'GG', 'Único'],
  'perfumes': ['30ml', '50ml', '100ml', 'Único']
};

function onCategoryChange() {
  const catSel = document.getElementById('prodCategory');
  const customCatInput = document.getElementById('customCategoryInput');
  const cat = catSel ? catSel.value : '';

  if (cat === '__new_category__') {
    if (customCatInput) {
      customCatInput.style.display = 'block';
      customCatInput.focus();
    }
  } else {
    if (customCatInput) {
      customCatInput.style.display = 'none';
      customCatInput.value = '';
    }
  }
  updateSubcategory();
}

function onSubcategoryChange() {
  const subSel = document.getElementById('prodSubcategory');
  const customSubInput = document.getElementById('customSubcategoryInput');
  const sub = subSel ? subSel.value : '';

  if (sub === '__new_subcategory__') {
    if (customSubInput) {
      customSubInput.style.display = 'block';
      customSubInput.focus();
    }
  } else {
    if (customSubInput) {
      customSubInput.style.display = 'none';
      customSubInput.value = '';
    }
  }
}

function updateSubcategory() {
  const catSel = document.getElementById('prodCategory');
  let cat = catSel ? catSel.value : '';
  if (cat === '__new_category__') {
    const customInp = document.getElementById('customCategoryInput');
    cat = customInp ? customInp.value.trim().toLowerCase().replace(/\s+/g, '-') : '';
  }

  const subSel = document.getElementById('prodSubcategory');
  if (!subSel) return;

  const defaultSubs = SUBCATEGORIES[cat] || ['Geral', 'Outras'];
  subSel.innerHTML = `<option value="">Selecionar subcategoria</option>` +
    defaultSubs.map(s => `<option value="${s}">${s}</option>`).join('') +
    `<option value="__new_subcategory__">+ Criar Nova Subcategoria...</option>`;

  const sizesSelector = document.getElementById('sizesSelector');
  if (sizesSelector) {
    if (cat === 'calcados-chinelos') {
      const simples = ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];
      const duplasA = ['33/34', '35/36', '37/38', '39/40', '41/42', '43/44', '45/46', '47/48'];
      const duplasB = ['34/35', '36/37', '38/39', '40/41', '42/43', '44/45', '46/47'];

      sizesSelector.innerHTML = `
        <div class="size-quick-actions">
          <button type="button" class="size-quick-btn" onclick="quickSelectSizes('simples-comuns')">
            <i class="fas fa-bolt"></i> 37 ao 44 (Simples)
          </button>
          <button type="button" class="size-quick-btn" onclick="quickSelectSizes('dupla-a-comuns')">
            <i class="fas fa-bolt"></i> 37/38 ao 43/44 (Dupla A)
          </button>
          <button type="button" class="size-quick-btn" onclick="quickSelectSizes('dupla-b-comuns')">
            <i class="fas fa-bolt"></i> 38/39 ao 44/45 (Dupla B)
          </button>
          <button type="button" class="size-quick-btn danger" onclick="quickSelectSizes('limpar')">
            <i class="fas fa-trash-alt"></i> Limpar Seleção
          </button>
        </div>

        <div class="size-group-box">
          <div class="size-group-header">
            <span>🔢 Numeração Simples (33 a 48)</span>
            <small style="font-size:.68rem;color:var(--adm-muted);font-weight:600;">Sapatos, Tênis, Chinelos</small>
          </div>
          <div style="display:flex;gap:.4rem;flex-wrap:wrap;">
            ${simples.map(s => `
              <button type="button" class="size-option-btn" data-size="${s}" onclick="toggleSizeBtn(this)">${s}</button>
            `).join('')}
          </div>
        </div>

        <div class="size-group-box">
          <div class="size-group-header">
            <span>👥 Numeração Dupla A — Ímpar/Par (Havaianas, Ipanema, Cartago...)</span>
            <small style="font-size:.68rem;color:var(--adm-muted);font-weight:600;">35/36, 37/38, 39/40...</small>
          </div>
          <div style="display:flex;gap:.4rem;flex-wrap:wrap;">
            ${duplasA.map(s => `
              <button type="button" class="size-option-btn" data-size="${s}" onclick="toggleSizeBtn(this)">${s}</button>
            `).join('')}
          </div>
        </div>

        <div class="size-group-box">
          <div class="size-group-header">
            <span>👥 Numeração Dupla B — Par/Ímpar (Kenner, Rider, Crocs, Slides...)</span>
            <small style="font-size:.68rem;color:var(--adm-muted);font-weight:600;">36/37, 38/39, 40/41...</small>
          </div>
          <div style="display:flex;gap:.4rem;flex-wrap:wrap;">
            ${duplasB.map(s => `
              <button type="button" class="size-option-btn" data-size="${s}" onclick="toggleSizeBtn(this)">${s}</button>
            `).join('')}
          </div>
        </div>

        <div id="customSizesBox" class="size-group-box" style="display:none;">
          <div class="size-group-header">
            <span>🏷️ Tamanhos Personalizados Adicionados</span>
          </div>
          <div id="customSizesContainer" style="display:flex;gap:.4rem;flex-wrap:wrap;"></div>
        </div>
      `;
    } else {
      const sizes = SIZE_GROUPS[cat] || ['P', 'M', 'G', 'GG'];
      sizesSelector.innerHTML = `
        <div class="size-quick-actions">
          <button type="button" class="size-quick-btn" onclick="quickSelectSizes('todos')">
            <i class="fas fa-check-double"></i> Selecionar Todos
          </button>
          <button type="button" class="size-quick-btn danger" onclick="quickSelectSizes('limpar')">
            <i class="fas fa-trash-alt"></i> Limpar Seleção
          </button>
        </div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
          ${sizes.map(s => `
            <button type="button" class="size-option-btn" data-size="${s}" onclick="toggleSizeBtn(this)">${s}</button>
          `).join('')}
        </div>
        <div id="customSizesBox" class="size-group-box" style="display:none;margin-top:.6rem;">
          <div class="size-group-header">
            <span>🏷️ Tamanhos Personalizados Adicionados</span>
          </div>
          <div id="customSizesContainer" style="display:flex;gap:.4rem;flex-wrap:wrap;"></div>
        </div>
      `;
    }
  }
}

function toggleSizeBtn(btn) {
  btn.classList.toggle('selected');
  if (btn.classList.contains('selected')) {
    btn.style.background = '#080ce6'; btn.style.color = '#fff'; btn.style.borderColor = '#080ce6';
  } else {
    btn.style.background = '#fff'; btn.style.color = ''; btn.style.borderColor = 'var(--adm-border)';
  }
  renderVariantStockFields();
}

function quickSelectSizes(type) {
  const allBtns = [...document.querySelectorAll('#sizesSelector .size-option-btn')];
  
  if (type === 'limpar') {
    allBtns.forEach(b => {
      b.classList.remove('selected');
      b.style.background = '#fff';
      b.style.color = '';
      b.style.borderColor = 'var(--adm-border)';
    });
    const customContainer = document.getElementById('customSizesContainer');
    if (customContainer) customContainer.innerHTML = '';
    const customBox = document.getElementById('customSizesBox');
    if (customBox) customBox.style.display = 'none';
  } else if (type === 'todos') {
    allBtns.forEach(b => {
      b.classList.add('selected');
      b.style.background = '#080ce6';
      b.style.color = '#fff';
      b.style.borderColor = '#080ce6';
    });
  } else {
    // Desmarca todos antes do preset específico
    allBtns.forEach(b => {
      b.classList.remove('selected');
      b.style.background = '#fff';
      b.style.color = '';
      b.style.borderColor = 'var(--adm-border)';
    });

    let targetSizes = [];
    if (type === 'simples-comuns') {
      targetSizes = ['37', '38', '39', '40', '41', '42', '43', '44'];
    } else if (type === 'dupla-a-comuns') {
      targetSizes = ['37/38', '39/40', '41/42', '43/44'];
    } else if (type === 'dupla-b-comuns') {
      targetSizes = ['38/39', '40/41', '42/43', '44/45'];
    }

    allBtns.forEach(b => {
      if (targetSizes.includes(b.dataset.size)) {
        b.classList.add('selected');
        b.style.background = '#080ce6';
        b.style.color = '#fff';
        b.style.borderColor = '#080ce6';
      }
    });
  }

  renderVariantStockFields();
}

function addCustomSizeButton(sizeStr, triggerStockUpdate = true) {
  const norm = String(sizeStr).trim().replace(/\s*-\s*/g, '/');
  if (!norm) return null;

  let customContainer = document.getElementById('customSizesContainer');
  let customBox = document.getElementById('customSizesBox');

  if (!customContainer) {
    const selector = document.getElementById('sizesSelector');
    if (!selector) return null;
    customBox = document.createElement('div');
    customBox.id = 'customSizesBox';
    customBox.className = 'size-group-box';
    customBox.innerHTML = `
      <div class="size-group-header"><span>🏷️ Tamanhos Personalizados</span></div>
      <div id="customSizesContainer" style="display:flex;gap:.4rem;flex-wrap:wrap;"></div>
    `;
    selector.appendChild(customBox);
    customContainer = document.getElementById('customSizesContainer');
  }

  if (customBox) customBox.style.display = 'block';

  // Verifica se já existe esse botão no container personalizado
  const existing = customContainer.querySelector(`[data-size="${norm}"]`);
  if (existing) {
    existing.classList.add('selected');
    existing.style.background = '#080ce6';
    existing.style.color = '#fff';
    existing.style.borderColor = '#080ce6';
    if (triggerStockUpdate) renderVariantStockFields();
    return existing;
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'size-option-btn selected';
  btn.dataset.size = norm;
  btn.style.background = '#080ce6';
  btn.style.color = '#fff';
  btn.style.borderColor = '#080ce6';
  btn.innerHTML = `${escapeHtml(norm)} <i class="fas fa-times" style="margin-left:.4rem;font-size:.65rem;opacity:.7;" title="Remover" onclick="event.stopPropagation();removeCustomSizeBtn(this.parentElement)"></i>`;
  btn.onclick = () => toggleSizeBtn(btn);

  customContainer.appendChild(btn);
  if (triggerStockUpdate) renderVariantStockFields();
  return btn;
}

function addCustomSizeFromInput() {
  const inp = document.getElementById('customSizeInput');
  if (!inp) return;
  const raw = inp.value.trim();
  if (!raw) {
    admToast('Digite um tamanho para adicionar (ex: 34, 47/48, XGG)', 'error');
    return;
  }

  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  let addedCount = 0;

  parts.forEach(s => {
    const norm = s.replace(/\s*-\s*/g, '/');
    // Verifica se já existe na grade padrão
    const allStandard = [...document.querySelectorAll('#sizesSelector .size-option-btn:not(#customSizesContainer .size-option-btn)')];
    const standardBtn = allStandard.find(b => b.dataset.size.toLowerCase() === norm.toLowerCase() || b.dataset.size.toLowerCase() === s.toLowerCase());

    if (standardBtn) {
      standardBtn.classList.add('selected');
      standardBtn.style.background = '#080ce6';
      standardBtn.style.color = '#fff';
      standardBtn.style.borderColor = '#080ce6';
      addedCount++;
    } else {
      addCustomSizeButton(norm, false);
      addedCount++;
    }
  });

  inp.value = '';
  renderVariantStockFields();
  admToast(`${addedCount} tamanho(s) ativado(s)!`, 'info');
}

function removeCustomSizeBtn(btn) {
  if (btn && btn.parentElement) {
    const parent = btn.parentElement;
    btn.remove();
    if (parent.children.length === 0) {
      const box = document.getElementById('customSizesBox');
      if (box) box.style.display = 'none';
    }
    renderVariantStockFields();
  }
}

function populateProductSizes(sizes, variantStock = null) {
  // Desmarca tudo primeiro
  document.querySelectorAll('.size-option-btn').forEach(btn => {
    btn.classList.remove('selected');
    btn.style.background = '#fff';
    btn.style.color = '';
    btn.style.borderColor = 'var(--adm-border)';
  });

  const raw = Array.isArray(sizes) ? sizes : (typeof sizes === 'string' ? sizes.split(',') : []);
  const cleanList = raw.map(s => String(s).trim()).filter(Boolean);

  cleanList.forEach(s => {
    const norm = s.replace(/\s*-\s*/g, '/');
    const allBtns = [...document.querySelectorAll('.size-option-btn')];
    let btn = allBtns.find(b => {
      const bSize = (b.dataset.size || '').trim();
      return bSize.toLowerCase() === norm.toLowerCase() || bSize.toLowerCase() === s.toLowerCase();
    });

    if (!btn) {
      btn = addCustomSizeButton(norm || s, false);
    }

    if (btn) {
      btn.classList.add('selected');
      btn.style.background = '#080ce6';
      btn.style.color = '#fff';
      btn.style.borderColor = '#080ce6';
    }
  });

  renderVariantStockFields(variantStock);
}

function renderVariantStockFields(customVariantStock = null) {
  const wrap = document.getElementById('variantStockWrap');
  const container = document.getElementById('variantStockInputs');
  const totalBadge = document.getElementById('variantStockTotalBadge');
  if (!wrap || !container) return;

  const sizes = getSelectedSizesList();
  if (sizes.length === 0) {
    wrap.style.display = 'none';
    container.innerHTML = '';
    if (totalBadge) totalBadge.textContent = '0 un';
    return;
  }

  wrap.style.display = 'block';

  const currentInputs = {};
  container.querySelectorAll('input[data-vsize]').forEach(input => {
    currentInputs[input.dataset.vsize] = input.value;
  });

  let pVariantStock = customVariantStock || {};
  if (!customVariantStock && editingProductId) {
    const p = allAdminProducts.find(x => x.id === editingProductId);
    if (p && p.variant_stock) {
      pVariantStock = typeof p.variant_stock === 'string' ? JSON.parse(p.variant_stock) : p.variant_stock;
    }
  }

  container.innerHTML = sizes.map(size => {
    const norm = size.replace(/\s*-\s*/g, '/');
    const alt = size.replace(/\//g, '-');
    let savedVal = undefined;
    if (pVariantStock[size] !== undefined) savedVal = pVariantStock[size];
    else if (pVariantStock[norm] !== undefined) savedVal = pVariantStock[norm];
    else if (pVariantStock[alt] !== undefined) savedVal = pVariantStock[alt];

    const val = currentInputs[size] !== undefined
      ? currentInputs[size]
      : (savedVal !== undefined ? savedVal : 5);

    return `
      <div style="background:#fff;padding:.45rem .6rem;border-radius:6px;border:1.5px solid var(--adm-border);">
        <label style="font-size:0.75rem;font-weight:800;color:var(--adm-text);display:block;margin-bottom:0.25rem;">${escapeHtml(size)}</label>
        <input type="number" data-vsize="${escapeHtml(size)}" value="${val}" min="0" placeholder="0" oninput="updateTotalStockFromVariants()" style="width:100%;padding:0.4rem;border:1.5px solid var(--adm-border);border-radius:6px;font-size:0.85rem;font-weight:800;text-align:center;" />
      </div>
    `;
  }).join('');

  updateTotalStockFromVariants();
}

function updateTotalStockFromVariants() {
  const inputs = document.querySelectorAll('input[data-vsize]');
  let total = 0;
  inputs.forEach(inp => {
    total += parseInt(inp.value) || 0;
  });
  const stockInput = document.getElementById('prodStock');
  if (stockInput) stockInput.value = total;
  const totalBadge = document.getElementById('variantStockTotalBadge');
  if (totalBadge) totalBadge.textContent = `${total} un`;
}

function getVariantStockData() {
  const inputs = document.querySelectorAll('input[data-vsize]');
  if (inputs.length === 0) return null;
  const data = {};
  inputs.forEach(inp => {
    data[inp.dataset.vsize] = Math.max(0, parseInt(inp.value) || 0);
  });
  return data;
}

function getSelectedSizesList() {
  const selected = [...document.querySelectorAll('.size-option-btn.selected')].map(b => (b.dataset.size || '').trim()).filter(Boolean);
  return selected;
}

function getSelectedSizes() {
  const list = getSelectedSizesList();
  return list.length > 0 ? list.join(', ') : '';
}
function compressImage(file, maxWidth = 900, quality = 0.80) {
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

          // Tenta exportar como WebP, senão JPEG
          canvas.toBlob((blob) => {
            if (!blob) {
              const base64 = canvas.toDataURL('image/jpeg', quality);
              const fallbackBlob = DB.base64ToBlob(base64);
              canvas.width = 1; canvas.height = 1; img.src = '';
              resolve({
                isNew: true,
                blob: fallbackBlob,
                preview: base64,
                name: file.name
              });
              return;
            }
            const previewUrl = URL.createObjectURL(blob);
            canvas.width = 1; canvas.height = 1; img.src = '';
            resolve({
              isNew: true,
              blob: blob,
              preview: previewUrl,
              name: file.name
            });
          }, 'image/webp', quality);
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
  if (photosData.length + files.length > 4) { admToast('Máximo de 4 fotos por produto', 'error'); return; }
  for (const file of files) {
    try {
      const photoObj = await compressImage(file);
      photosData.push(photoObj);
      renderPhotoPreviews();
    } catch (err) {
      console.error("Erro ao processar imagem:", err);
      admToast(err.message || 'Erro ao processar a foto selecionada', 'error');
    }
  }
}

function renderPhotoPreviews() {
  const container = document.getElementById('photoPreviews');
  if (!container) return;
  container.innerHTML = photosData.map((item, i) => {
    const src = typeof item === 'string' ? item : (item.preview || item.url || item.base64 || '');
    return `
      <div class="photo-preview-item">
        <img src="${escapeHtml(src)}"/>
        <button type="button" onclick="removePhoto(${i})"><i class="fas fa-times"></i></button>
      </div>
    `;
  }).join('');
}

window.removePhoto = function (index) { photosData.splice(index, 1); renderPhotoPreviews(); };

async function updateHeroCounter() {
  const products = await fetchAll('admin_products');
  const heroCount = products.filter(p => p.hero_card).length;
  const el = document.getElementById('heroCountText');
  const heroCheckbox = document.getElementById('prodHeroCard');
  if (el) el.textContent = `${heroCount}/5 produtos no card principal`;
  if (heroCount >= 5 && heroCheckbox && !heroCheckbox.checked) {
    heroCheckbox.disabled = true;
    if (el) el.textContent = `⚠ Limite atingido (5/5). Remova um produto para adicionar novo.`;
  } else if (heroCheckbox) {
    heroCheckbox.disabled = false;
  }
}

async function saveProduct(event) {
  event.preventDefault();
  const name = document.getElementById('prodName').value.trim();

  let category = document.getElementById('prodCategory').value;
  if (category === '__new_category__') {
    const customCat = (document.getElementById('customCategoryInput')?.value || '').trim();
    if (!customCat) { admToast('Digite o nome da nova categoria', 'error'); return; }
    category = slugify(customCat);
  }

  let subcategory = document.getElementById('prodSubcategory').value;
  if (subcategory === '__new_subcategory__') {
    const customSub = (document.getElementById('customSubcategoryInput')?.value || '').trim();
    if (customSub) subcategory = customSub;
  }

  const price = parseFloat(document.getElementById('prodPrice').value);
  const description = document.getElementById('prodDescription').value.trim();
  const sizes = getSelectedSizes();

  if (!name || !category || !price || !description) {
    admToast('Preencha todos os campos obrigatórios', 'error'); return;
  }

  const saveBtn = document.querySelector('#productForm [type="submit"]');
  const currentEditingId = editingProductId || document.getElementById('editProductId')?.value || null;

  try {
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'; }

    const heroChecked = document.getElementById('prodHeroCard').checked;
    const allProducts = await fetchAll('admin_products');

    if (heroChecked) {
      const heroCount = allProducts.filter(p => p.hero_card && p.id !== currentEditingId).length;
      if (heroCount >= 5) {
        admToast('Limite de 5 produtos no card principal atingido!', 'error');
        document.getElementById('prodHeroCard').checked = false;
        return;
      }
    }

    // Gera um slug único baseado no nome
    const baseSlug = slugify(name);
    let finalSlug = baseSlug;
    let counter = 1;
    while (allProducts.some(p => p.slug === finalSlug && p.id !== currentEditingId)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const vStockData = getVariantStockData();
    const computedStock = vStockData && Object.keys(vStockData).length > 0
      ? Object.values(vStockData).reduce((a, b) => a + (parseInt(b) || 0), 0)
      : (parseInt(document.getElementById('prodStock').value) || 0);

    // Processamento da Foto (Upload para Supabase Storage)
    let finalImageUrl = '';
    let finalImageBase64 = '';

    if (photosData.length > 0) {
      const mainPhoto = photosData[0];
      if (typeof mainPhoto === 'string') {
        if (mainPhoto.startsWith('data:image')) {
          finalImageBase64 = mainPhoto;
        } else {
          finalImageUrl = mainPhoto;
        }
      } else if (mainPhoto.isNew && mainPhoto.blob) {
        if (saveBtn) { saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando foto para o Storage...'; }
        finalImageUrl = await DB.uploadProductImage(mainPhoto.blob, finalSlug || slugify(name));
        finalImageBase64 = '';
      } else if (mainPhoto.url) {
        finalImageUrl = mainPhoto.url;
        finalImageBase64 = '';
      } else if (mainPhoto.base64) {
        finalImageBase64 = mainPhoto.base64;
      }
    }

    const data = {
      name, category,
      subcategory,
      price,
      original_price: parseFloat(document.getElementById('prodOriginalPrice').value) || 0,
      installments: parseInt(document.getElementById('prodInstallments').value) || 3,
      stock: computedStock,
      variant_stock: vStockData || {},
      description,
      sizes: sizes || 'Único',
      image_base64: finalImageBase64,
      image_url: finalImageUrl,
      featured: document.getElementById('prodFeatured').checked,
      new_arrival: document.getElementById('prodNew').checked,
      weekly_promo: document.getElementById('prodPromo').checked,
      hero_card: heroChecked,
      category_cover: document.getElementById('prodCategoryCover')?.checked || false,
      weight: parseFloat(document.getElementById('prodWeight')?.value) || 0.3,
      height: parseFloat(document.getElementById('prodHeight')?.value) || 5,
      width: parseFloat(document.getElementById('prodWidth')?.value) || 15,
      length: parseFloat(document.getElementById('prodLength')?.value) || 20,
      active: document.getElementById('prodActive').checked,
      slug: finalSlug,
      sales_count: 0
    };

    if (currentEditingId) {
      await updateRecord('admin_products', currentEditingId, data);
      admToast('Produto atualizado com sucesso!');
    } else {
      await createRecord('admin_products', data);
      admToast('Produto cadastrado com sucesso!');
    }
    resetForm();
    navigateTo('produtos');
  } catch (e) {
    console.error('saveProduct error:', e);
    const msg = e?.message || e?.error_description || 'verifique a conexão';
    admToast('Erro ao salvar: ' + msg, 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> ' + (editingProductId ? 'Salvar Alterações' : 'Salvar Produto');
    }
  }
}

function resetForm() {
  editingProductId = null;
  document.getElementById('editProductId').value = '';
  document.getElementById('productForm').reset();
  document.getElementById('formProductTitle').textContent = 'Novo Produto';
  photosData = [];
  document.getElementById('photoPreviews').innerHTML = '';
  document.getElementById('sizesSelector').innerHTML = '';
  if (document.getElementById('customSizeInput')) document.getElementById('customSizeInput').value = '';
  if (document.getElementById('variantStockWrap')) document.getElementById('variantStockWrap').style.display = 'none';
  if (document.getElementById('variantStockInputs')) document.getElementById('variantStockInputs').innerHTML = '';
  if (document.getElementById('variantStockTotalBadge')) document.getElementById('variantStockTotalBadge').textContent = '0 un';
  document.getElementById('prodSubcategory').innerHTML = '<option value="">Selecione a categoria primeiro</option>';
  if (document.getElementById('prodCategoryCover')) document.getElementById('prodCategoryCover').checked = false;
  if (document.getElementById('prodWeight')) document.getElementById('prodWeight').value = '0.300';
  if (document.getElementById('prodHeight')) document.getElementById('prodHeight').value = '5';
  if (document.getElementById('prodWidth')) document.getElementById('prodWidth').value = '15';
  if (document.getElementById('prodLength')) document.getElementById('prodLength').value = '20';

  const saveBtn = document.querySelector('#productForm [type="submit"]');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Produto';
  }

  updateHeroCounter();
}

// ─── FERRAMENTA DE MIGRAÇÃO: BASE64 -> SUPABASE STORAGE ─────────────────────
async function migrateOldPhotosToStorage() {
  const btn = document.getElementById('btnMigratePhotos');
  const statusEl = document.getElementById('migratePhotosStatus');

  if (!confirm('Deseja iniciar a otimização de todas as fotos antigas salvas em Base64 para o Supabase Storage? Isso deixará o banco de dados e o site muito mais rápidos.')) {
    return;
  }

  try {
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando produtos...'; }
    if (statusEl) { statusEl.textContent = 'Buscando produtos no banco de dados...'; statusEl.style.display = 'block'; }

    const products = await DB.getAllProducts();
    const toMigrate = products.filter(p => p.image_base64 && p.image_base64.startsWith('data:image'));

    if (toMigrate.length === 0) {
      admToast('Todos os produtos já estão otimizados no Storage!', 'success');
      if (statusEl) statusEl.textContent = '✅ Todos os produtos já estão no Supabase Storage ou sem Base64.';
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Otimizar Fotos no Storage'; }
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < toMigrate.length; i++) {
      const p = toMigrate[i];
      if (statusEl) {
        statusEl.textContent = `Otimizando foto ${i + 1} de ${toMigrate.length}: "${p.name}"...`;
      }
      try {
        const blob = DB.base64ToBlob(p.image_base64);
        if (!blob) throw new Error('Não foi possível converter o Base64 em arquivo.');

        const publicUrl = await DB.uploadProductImage(blob, p.slug || p.id);

        await DB.updateProduct(p.id, {
          image_url: publicUrl,
          image_base64: ''
        });
        successCount++;
      } catch (err) {
        console.error(`Erro ao migrar foto do produto "${p.name}" (${p.id}):`, err);
        failCount++;
      }
    }

    admToast(`Otimização concluída! ${successCount} fotos migradas para o Storage com sucesso.${failCount > 0 ? ` (${failCount} erros)` : ''}`, successCount > 0 ? 'success' : 'error');
    if (statusEl) {
      statusEl.textContent = `✅ Concluído com sucesso: ${successCount} produtos migrados para o Supabase Storage.${failCount > 0 ? ` ⚠️ ${failCount} falharam.` : ''}`;
    }

    await renderAdminProducts();
  } catch (err) {
    console.error('migrateOldPhotosToStorage error:', err);
    admToast('Erro na otimização: ' + (err.message || err), 'error');
    if (statusEl) statusEl.textContent = '❌ Erro na otimização: ' + (err.message || err);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Otimizar Fotos no Storage';
    }
  }
}
window.migrateOldPhotosToStorage = migrateOldPhotosToStorage;

// ══════════════════════════════════════════
// HERO CARD CONFIG
// ══════════════════════════════════════════
async function renderHeroConfig() {
  allAdminProducts = await fetchAll('admin_products');
  const heroProducts = allAdminProducts.filter(p => p.hero_card);
  const count = heroProducts.length;
  const badge = document.getElementById('heroCounterBadge');
  if (badge) { badge.textContent = `${count}/5`; badge.className = `hero-card-counter${count >= 5 ? ' full' : ''}`; }

  const listEl = document.getElementById('heroCardProductsList');
  if (listEl) {
    listEl.innerHTML = heroProducts.length === 0
      ? `<div class="empty-state"><i class="fas fa-star"></i><p>Nenhum produto no card principal ainda.</p></div>`
      : heroProducts.map(p => {
        const safeName = escapeHtml(p.name || 'Produto');
        const safeId = escapeHtml(p.id || '');
        const img = escapeHtml(p.image_base64 || p.image_url || '');
        return `
        <div style="display:flex;align-items:center;gap:1rem;padding:.75rem;border-bottom:1px solid var(--adm-border);">
          ${img ? `<img src="${img}" style="width:56px;height:64px;object-fit:cover;border-radius:6px;"/>` : `<div style="width:56px;height:64px;background:#f3f4f6;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#ccc;"><i class="fas fa-image"></i></div>`}
          <div style="flex:1;">
            <div class="fw-700" style="font-size:.88rem;">${safeName}</div>
            <div style="font-size:.8rem;color:var(--adm-green);font-weight:700;">${fmtCurrency(p.price)}</div>
          </div>
          <button class="adm-btn-sm adm-btn-delete" style="width:auto;" onclick="removeFromHero('${safeId}')">
            <i class="fas fa-times"></i> Remover
          </button>
        </div>
      `;
      }).join('');
  }

  const heroTable = document.getElementById('heroTableBody');
  if (heroTable) {
    heroTable.innerHTML = allAdminProducts.map(p => {
      const safeName = escapeHtml(p.name || 'Produto');
      const safeId = escapeHtml(p.id || '');
      const safeCat = escapeHtml(p.category || '');
      const img = escapeHtml(p.image_base64 || p.image_url || '');
      return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:.65rem;">
            ${img ? `<img src="${img}" style="width:40px;height:46px;object-fit:cover;border-radius:4px;"/>` : `<div style="width:40px;height:46px;background:#f3f4f6;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:.8rem;"><i class="fas fa-image"></i></div>`}
            <span class="fw-700" style="font-size:.85rem;">${safeName}</span>
          </div>
        </td>
        <td style="font-size:.8rem;">${safeCat}</td>
        <td class="fw-700 text-green">${fmtCurrency(p.price)}</td>
        <td>
          <label class="adm-toggle-item">
            <input type="checkbox" ${p.hero_card ? 'checked' : ''} onchange="toggleHeroCard('${safeId}',this.checked)"/>
            <span class="adm-toggle-switch"></span>
          </label>
        </td>
      </tr>
    `;
    }).join('');
  }
}

async function toggleHeroCard(id, value) {
  const heroProducts = allAdminProducts.filter(p => p.hero_card && p.id !== id);
  if (value && heroProducts.length >= 5) {
    admToast('Limite de 5 produtos no card principal atingido!', 'error');
    renderHeroConfig(); return;
  }
  await updateRecord('admin_products', id, { hero_card: value });
  allAdminProducts = await fetchAll('admin_products');
  admToast(value ? '⭐ Adicionado ao card principal!' : 'Removido do card principal');
  renderHeroConfig();
}

async function removeFromHero(id) {
  await updateRecord('admin_products', id, { hero_card: false });
  allAdminProducts = await fetchAll('admin_products');
  admToast('Removido do card principal');
  renderHeroConfig();
}

// ══════════════════════════════════════════
// PDV MODULE (BALCÃO / CAIXA PRESENCIAL)
// ══════════════════════════════════════════
let pdvCart = [];
let pdvPaymentMethod = 'PIX';
let pdvSelectedCategory = 'all';
let pdvSearchTerm = '';
let pdvDiscount = 0;

function initPdvModule() {
  const tabs = document.querySelectorAll('#pdvCategoriesTabs .pdv-cat-tab');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      pdvSelectedCategory = tab.dataset.cat;
      renderPdvCatalog();
    };
  });

  const searchInp = document.getElementById('pdvSearchInput');
  const clearBtn = document.getElementById('pdvClearSearchBtn');
  if (searchInp) {
    searchInp.oninput = (e) => {
      pdvSearchTerm = e.target.value.trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = pdvSearchTerm ? 'block' : 'none';
      renderPdvCatalog();
    };
  }
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (searchInp) searchInp.value = '';
      pdvSearchTerm = '';
      clearBtn.style.display = 'none';
      renderPdvCatalog();
    };
  }

  const clearCartBtn = document.getElementById('pdvClearCartBtn');
  if (clearCartBtn) {
    clearCartBtn.onclick = () => {
      pdvCart = [];
      renderPdvCart();
    };
  }

  const discInp = document.getElementById('pdvDiscountInput');
  if (discInp) {
    discInp.oninput = (e) => {
      pdvDiscount = Math.max(0, parseFloat(e.target.value) || 0);
      renderPdvCart();
    };
  }

  const payBtns = document.querySelectorAll('.pdv-pay-btn');
  payBtns.forEach(btn => {
    btn.onclick = () => {
      payBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      pdvPaymentMethod = btn.dataset.method;
      const cashBox = document.getElementById('pdvCashChangeBox');
      if (cashBox) cashBox.style.display = pdvPaymentMethod === 'Dinheiro' ? 'block' : 'none';
      renderPdvCart();
    };
  });

  const cashRecInp = document.getElementById('pdvCashReceived');
  if (cashRecInp) {
    cashRecInp.oninput = () => renderPdvCart();
  }

  const finishBtn = document.getElementById('pdvFinishSaleBtn');
  if (finishBtn) {
    finishBtn.onclick = finalizarVendaPDV;
  }
}

async function renderPdvCatalog() {
  const grid = document.getElementById('pdvProductsGrid');
  if (!grid) return;

  if (allAdminProducts.length === 0) {
    allAdminProducts = await fetchAll('admin_products');
  }

  let products = allAdminProducts.filter(p => p.active !== false);

  if (pdvSelectedCategory && pdvSelectedCategory !== 'all') {
    products = products.filter(p => p.category === pdvSelectedCategory);
  }

  if (pdvSearchTerm) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(pdvSearchTerm) ||
      (p.sizes && p.sizes.some && p.sizes.some(s => s.toLowerCase().includes(pdvSearchTerm))) ||
      p.id.toLowerCase().includes(pdvSearchTerm)
    );
  }

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;padding:2rem;">
        <i class="fas fa-search" style="font-size:2rem;color:var(--adm-muted);"></i>
        <p style="font-size:.9rem;color:var(--adm-muted);margin-top:.5rem;">Nenhum produto encontrado no catálogo</p>
      </div>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    const vStock = p.variant_stock || {};
    const sizes = p.sizes && p.sizes.length > 0 ? (Array.isArray(p.sizes) ? p.sizes : p.sizes.split(',').map(s => s.trim())) : ['Único'];

    const safeProdId = escapeHtml(p.id || '');
    const safeProdName = escapeHtml(p.name || 'Produto');

    const sizesHtml = sizes.map(size => {
      let qty = vStock[size] !== undefined ? parseInt(vStock[size]) : (p.stock || 0);
      const isOutOfStock = qty <= 0;
      const safeSize = escapeHtml(size);
      return `
        <button type="button" class="pdv-size-btn" ${isOutOfStock ? 'disabled' : ''} onclick="addPdvCartItem('${safeProdId}', '${safeSize}')" title="${isOutOfStock ? 'Sem estoque' : 'Adicionar ao caixa'}">
          ${safeSize} <span class="pdv-size-qty">(${qty})</span>
        </button>
      `;
    }).join('');

    const img = escapeHtml(p.image_base64 || p.image_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80');

    return `
      <div class="pdv-prod-card">
        <img src="${img}" class="pdv-prod-img" alt="${safeProdName}" loading="lazy"/>
        <div class="pdv-prod-info">
          <div class="pdv-prod-name">${safeProdName}</div>
          <div class="pdv-prod-price">${fmtCurrency(p.price)}</div>
        </div>
        <div class="pdv-sizes-wrap">
          ${sizesHtml}
        </div>
      </div>
    `;
  }).join('');
}

function addPdvCartItem(prodId, size) {
  const p = allAdminProducts.find(x => x.id === prodId);
  if (!p) return;

  const vStock = p.variant_stock || {};
  const availableStock = vStock[size] !== undefined ? parseInt(vStock[size]) : (p.stock || 0);

  const existing = pdvCart.find(i => i.id === prodId && i.size === size);
  const currentInCart = existing ? existing.qty : 0;

  if (currentInCart + 1 > availableStock) {
    admToast(`Estoque esgotado para o tamanho ${size} (${p.name})`, 'error');
    return;
  }

  if (existing) {
    existing.qty += 1;
  } else {
    pdvCart.push({
      id: p.id,
      name: p.name,
      price: p.price,
      size: size,
      qty: 1,
      image: p.image_base64 || p.image_url || ''
    });
  }

  admToast(`+1 ${p.name} (${size}) no caixa`, 'info');
  renderPdvCart();
}

function updatePdvItemQty(index, delta) {
  if (!pdvCart[index]) return;
  const item = pdvCart[index];
  const p = allAdminProducts.find(x => x.id === item.id);
  const vStock = p ? (p.variant_stock || {}) : {};
  const availableStock = p ? (vStock[item.size] !== undefined ? parseInt(vStock[item.size]) : (p.stock || 0)) : 999;

  if (delta > 0 && item.qty + delta > availableStock) {
    admToast(`Estoque máximo atingido para ${item.size} (${availableStock} un)`, 'error');
    return;
  }

  item.qty += delta;
  if (item.qty <= 0) {
    pdvCart.splice(index, 1);
  }
  renderPdvCart();
}

function removePdvItem(index) {
  pdvCart.splice(index, 1);
  renderPdvCart();
}

function renderPdvCart() {
  const container = document.getElementById('pdvCartItems');
  const subtotalEl = document.getElementById('pdvSubtotalVal');
  const totalEl = document.getElementById('pdvTotalVal');
  const finishBtn = document.getElementById('pdvFinishSaleBtn');
  const trocoValEl = document.getElementById('pdvTrocoVal');
  const cashRecInp = document.getElementById('pdvCashReceived');

  if (!container) return;

  if (pdvCart.length === 0) {
    container.innerHTML = `
      <div class="pdv-cart-empty">
        <i class="fas fa-shopping-basket"></i>
        <p>Caixa vazio</p>
        <small>Clique em um tamanho do produto para adicionar ao carrinho</small>
      </div>`;
    if (subtotalEl) subtotalEl.textContent = fmtCurrency(0);
    if (totalEl) totalEl.textContent = fmtCurrency(0);
    if (finishBtn) finishBtn.disabled = true;
    return;
  }

  const subtotal = pdvCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const total = Math.max(0, subtotal - pdvDiscount);

  container.innerHTML = pdvCart.map((item, idx) => {
    const safeItemName = escapeHtml(item.name || 'Produto');
    const safeItemSize = escapeHtml(item.size || 'Único');
    return `
    <div class="pdv-cart-item">
      <div class="pdv-item-details">
        <div class="pdv-item-title">${safeItemName}</div>
        <div class="pdv-item-sub">Tamanho: <strong>${safeItemSize}</strong> · ${fmtCurrency(item.price)} un</div>
      </div>
      <div class="pdv-item-qty-controls">
        <button type="button" class="pdv-qty-btn" onclick="updatePdvItemQty(${idx}, -1)">-</button>
        <span class="pdv-qty-val">${parseInt(item.qty) || 1}</span>
        <button type="button" class="pdv-qty-btn" onclick="updatePdvItemQty(${idx}, 1)">+</button>
      </div>
      <div class="pdv-item-price">${fmtCurrency(item.price * item.qty)}</div>
      <button type="button" class="pdv-item-remove" onclick="removePdvItem(${idx})" title="Remover"><i class="fas fa-times"></i></button>
    </div>
  `;
  }).join('');

  if (subtotalEl) subtotalEl.textContent = fmtCurrency(subtotal);
  if (totalEl) totalEl.textContent = fmtCurrency(total);

  if (pdvPaymentMethod === 'Dinheiro' && cashRecInp && trocoValEl) {
    const cashRec = parseFloat(cashRecInp.value) || 0;
    const troco = Math.max(0, cashRec - total);
    trocoValEl.textContent = fmtCurrency(troco);
  }

  if (finishBtn) finishBtn.disabled = false;
}

async function finalizarVendaPDV() {
  if (pdvCart.length === 0) return;

  const custName = (document.getElementById('pdvCustomerName')?.value || '').trim() || 'Cliente Balcão';
  const custPhone = (document.getElementById('pdvCustomerPhone')?.value || '').trim();

  const subtotal = pdvCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const total = Math.max(0, subtotal - pdvDiscount);

  const finishBtn = document.getElementById('pdvFinishSaleBtn');
  if (finishBtn) {
    finishBtn.disabled = true;
    finishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando Venda...';
  }

  try {
    const orderId = 'pdv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const orderData = {
      id: orderId,
      customer_name: custName,
      customer_phone: custPhone,
      customer_email: '',
      city: 'Madalena',
      state: 'CE',
      address: 'Loja Física - Balcão',
      cep: '63860-000',
      subtotal: subtotal,
      shipping: 0,
      total: total,
      status: 'entregue',
      payment_method: pdvPaymentMethod,
      items_json: JSON.stringify(pdvCart.map(i => ({ id: i.id, name: i.name, size: i.size, qty: i.qty, price: i.price }))),
      notes: pdvDiscount > 0 ? `Venda PDV - Desconto presencial: R$ ${pdvDiscount.toFixed(2)}` : 'Venda Presencial PDV',
      channel: 'pdv',
      created_at: new Date().toISOString()
    };

    // 1. Criar pedido no Supabase
    await DB.createOrder(orderData);

    // 2. Dar baixa no estoque por variação
    await DB.decrementStockForOrder(pdvCart);

    // 3. Atualizar estados locais
    allOrders.push(orderData);
    allAdminProducts = await fetchAll('admin_products');
    consolidateStats();
    renderKPIs();
    renderRecentOrders();
    renderOrdersTable();
    renderPdvCatalog();

    // 4. Gerar Recibo
    mostrarReciboPDV(orderData, pdvCart, subtotal, pdvDiscount, total);

    // 5. Reset do Carrinho PDV
    pdvCart = [];
    pdvDiscount = 0;
    const discInp = document.getElementById('pdvDiscountInput');
    if (discInp) discInp.value = '0';
    renderPdvCart();

    admToast('🎉 Venda presencial concluída com sucesso!');
  } catch (err) {
    console.error('Erro ao finalizar venda PDV:', err);
    admToast('Erro ao finalizar venda: ' + (err.message || err), 'error');
  } finally {
    if (finishBtn) {
      finishBtn.disabled = false;
      finishBtn.innerHTML = '<i class="fas fa-check-circle"></i> Finalizar Venda Presencial';
    }
  }
}

function mostrarReciboPDV(order, items, subtotal, discount, total) {
  const content = document.getElementById('pdvReceiptContent');
  if (!content) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  let cashRecInfo = '';
  if (order.payment_method === 'Dinheiro') {
    const cashRec = parseFloat(document.getElementById('pdvCashReceived')?.value) || total;
    const troco = Math.max(0, cashRec - total);
    cashRecInfo = `
Valor Recebido: ${fmtCurrency(cashRec)}
Troco:          ${fmtCurrency(troco)}`;
  }

  const safeOrderId = escapeHtml(order.id || '');
  const safeCustName = escapeHtml(order.customer_name || 'Cliente Balcão');
  const safePhone = escapeHtml(order.customer_phone || '');
  const safePayMethod = escapeHtml(order.payment_method || 'Dinheiro');

  content.innerHTML = `
    <div style="text-align:center;margin-bottom:1rem;">
      <h3 style="font-size:1.1rem;font-weight:900;margin-bottom:2px;letter-spacing:.05em;">OUTLET 365</h3>
      <p style="font-size:0.75rem;color:#555;">Madalena - CE · (88) 99275-7076</p>
      <p style="font-size:0.7rem;color:#777;margin-top:2px;text-transform:uppercase;">Comprovante de Venda Presencial</p>
    </div>
    <div style="border-top:1px dashed #aaa;border-bottom:1px dashed #aaa;padding:0.5rem 0;margin-bottom:0.75rem;font-size:0.78rem;line-height:1.4;">
      <div><strong>PEDIDO:</strong> #${safeOrderId.slice(-6).toUpperCase()}</div>
      <div><strong>DATA:</strong> ${dateStr}</div>
      <div><strong>CLIENTE:</strong> ${safeCustName}</div>
      ${safePhone ? `<div><strong>FONE:</strong> ${safePhone}</div>` : ''}
      <div><strong>PAGAMENTO:</strong> ${safePayMethod}</div>
    </div>
    <table style="width:100%;font-size:0.78rem;border-collapse:collapse;margin-bottom:0.75rem;">
      <thead>
        <tr style="border-bottom:1px solid #ddd;text-align:left;">
          <th style="padding-bottom:4px;">QTD ITEM</th>
          <th style="padding-bottom:4px;text-align:right;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(i => `
          <tr>
            <td style="padding:3px 0;">${parseInt(i.qty) || 1}x ${escapeHtml(i.name || 'Item')} (${escapeHtml(i.size || 'Único')})</td>
            <td style="padding:3px 0;text-align:right;">${fmtCurrency(i.price * i.qty)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div style="border-top:1px dashed #aaa;padding-top:0.5rem;font-size:0.8rem;line-height:1.4;">
      <div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><span>${fmtCurrency(subtotal)}</span></div>
      ${discount > 0 ? `<div style="display:flex;justify-content:space-between;color:#dc2626;"><span>Desconto:</span><span>-${fmtCurrency(discount)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:0.95rem;margin-top:4px;"><span>TOTAL:</span><span>${fmtCurrency(total)}</span></div>
      ${cashRecInfo ? `<pre style="font-family:inherit;font-size:0.75rem;margin-top:4px;color:#555;">${escapeHtml(cashRecInfo)}</pre>` : ''}
    </div>
    <div style="text-align:center;margin-top:1rem;font-size:0.7rem;color:#777;">
      *** Obrigado pela preferência! ***<br/>@outlet365__
    </div>
  `;

  const printBtn = document.getElementById('pdvPrintReceiptBtn');
  if (printBtn) {
    printBtn.onclick = () => {
      const win = window.open('', '', 'width=400,height=600');
      win.document.write(`<html><head><title>Recibo - Outlet 365</title><style>body{font-family:monospace;font-size:12px;padding:15px;}</style></head><body>${content.innerHTML}</body></html>`);
      win.document.close();
      win.focus();
      win.print();
      win.close();
    };
  }

  const wappBtn = document.getElementById('pdvShareWappBtn');
  if (wappBtn) {
    wappBtn.onclick = () => {
      const phoneClean = (order.customer_phone || '').replace(/\D/g, '');
      const text = encodeURIComponent(`*OUTLET 365 — Comprovante de Compra*\n\nOlá ${order.customer_name}!\nObrigado por comprar conosco.\n\n*Pedido:* #${order.id.slice(-6).toUpperCase()}\n*Total:* ${fmtCurrency(total)}\n*Pagamento:* ${order.payment_method}\n\nVolte sempre!`);
      const link = phoneClean ? `https://wa.me/55${phoneClean}?text=${text}` : `https://wa.me/?text=${text}`;
      window.open(link, '_blank');
    };
  }

  document.getElementById('pdvReceiptModal')?.classList.add('active');
}

// ── LOGOUT ──
document.getElementById('btnLogout')?.addEventListener('click', async () => {
  await DB.signOut();
  window.location.href = 'admin-login.html';
});

// ── BOOT ──
init();
