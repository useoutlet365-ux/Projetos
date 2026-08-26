// =====================================================
// OUTLET 365 — PWA Registration & Install Handler
// =====================================================

(function () {
  'use strict';

  // ── REGISTRO DO SERVICE WORKER ──
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Ajusta o caminho do service worker conforme a profundidade da URL
      const swPath = './sw.js';
      navigator.serviceWorker
        .register(swPath)
        .then((registration) => {
          console.log('✓ Outlet365 PWA: Service Worker registrado com sucesso! Escopo:', registration.scope);

          // Verifica se há novas versões disponíveis
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('ℹ Nova versão do Outlet 365 disponível! Atualizando em background.');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.warn('⚠️ Falha ao registrar Service Worker:', error);
        });
    });
  }

  // ── GESTÃO DO PROMPT DE INSTALAÇÃO ──
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Previne o infobar padrão em navegadores que suportam
    e.preventDefault();
    deferredPrompt = e;
    window.pwaDeferredPrompt = e;

    // Dispara evento customizado para permitir que botões na UI reajam
    window.dispatchEvent(new CustomEvent('pwaInstallAvailable'));

    // Exibe botão ou banner de instalação caso exista na página
    const installBtns = document.querySelectorAll('.btn-install-pwa, #pwaInstallBtn');
    installBtns.forEach((btn) => {
      btn.style.display = 'inline-flex';
      btn.onclick = (event) => {
        event.preventDefault();
        window.promptPWAInstall();
      };
    });
  });

  window.promptPWAInstall = async function () {
    if (!deferredPrompt) {
      console.log('App PWA já instalado ou não disponível para instalação imediata.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Resposta do usuário para instalação: ${outcome}`);
    deferredPrompt = null;
    window.pwaDeferredPrompt = null;
  };

  window.addEventListener('appinstalled', () => {
    console.log('🎉 Outlet 365 PWA instalado com sucesso!');
    deferredPrompt = null;
    window.pwaDeferredPrompt = null;
  });
})();
