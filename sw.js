// =====================================================
// OUTLET 365 — Service Worker (PWA)
// =====================================================

const CACHE_NAME = 'outlet365-v1.0.1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './categoria.html',
  './produto.html',
  './checkout.html',
  './sobre.html',
  './contato.html',
  './entrega.html',
  './trocas.html',
  './admin.html',
  './admin-login.html',
  './admin-reset.html',
  './css/style.css',
  './css/admin.css',
  './js/data.js',
  './js/db.js',
  './js/supabase-client.js',
  './js/cart.js',
  './js/catalog.js',
  './js/home-dynamic.js',
  './js/produto.js',
  './js/admin.js',
  './js/pwa.js',
  './manifest.json',
  './favicon.ico',
  './image/favicon-16x16.png',
  './image/favicon-32x32.png',
  './image/icon-192.png',
  './image/icon-512.png',
  './image/icon.svg',
  './image/apple-touch-icon.png'
];

// ── INSTALL ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pré-carregando shell estático');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Aviso ao pré-carregar alguns arquivos:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Limpando cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ── FETCH ──
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignora chamadas não HTTP(S) ou extensões de navegador
  if (!url.protocol.startsWith('http')) return;

  // Ignora chamadas de API do Mercado Pago / Supabase / SuperFrete para garantir dados em tempo real
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('mercadopago.com') ||
    url.pathname.startsWith('/api/')
  ) {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(JSON.stringify({ error: 'Você está offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Para navegações de página (HTML): Network-first com fallback para cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Para recursos estáticos (CSS, JS, Imagens, Fontes): Cache-first com revalidação
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // Busca atualização em background para a próxima visita
        fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkRes));
          }
        }).catch(() => {/* offline */});
        return cached;
      }

      return fetch(req).then((res) => {
        if (!res || res.status !== 200 || res.type === 'opaque') {
          return res;
        }
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      });
    })
  );
});
