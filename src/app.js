// src/app.js — SPA Entry Point dengan Hash-based Router

import { render as renderLogin, getSession } from './modules/auth/auth.js';
import { render as renderDashboard } from './modules/dashboard/dashboard.js';
import { render as renderHistory } from './modules/history/history.js';
import { render as renderReminders } from './modules/reminder/reminderModule.js';
import { render as renderConsultation } from './modules/consultation/consultationModule.js';
import { render as renderOnboarding, isOnboardingComplete, getProfile } from './modules/user-profile/userProfile.js';

const routes = {
  '#/login':        renderLogin,
  '#/onboarding':   renderOnboarding,
  '#/dashboard':    renderDashboard,
  '#/history':      renderHistory,
  '#/reminders':    renderReminders,
  '#/consultation': renderConsultation,
};

// ── Desktop shell ────────────────────────────────────────────
const DESKTOP_NAV_LINKS = [
  { href: '#/dashboard',    icon: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22" fill="none" stroke="currentColor" stroke-width="2"/>',  label: 'Dashboard' },
  { href: '#/history',      icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',                                                                                    label: 'Riwayat' },
  { href: '#/reminders',    icon: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',                                                             label: 'Pengingat Obat' },
  { href: '#/consultation', icon: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',                                                                                   label: 'Konsultasi' },
];

function isDesktop() {
  return window.innerWidth >= 900;
}

function buildDesktopShell(activeHash) {
  const profile = getProfile();
  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : 'P';
  const navItems = DESKTOP_NAV_LINKS.map(link => `
    <a href="${link.href}" class="desktop-nav-link ${activeHash === link.href ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${link.icon}</svg>
      ${link.label}
    </a>
  `).join('');

  return `
<div class="desktop-wrapper">
  <!-- Sidebar -->
  <aside class="desktop-sidebar">
    <div class="desktop-sidebar-header">
      <div class="desktop-sidebar-logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </div>
      <div>
        <div class="desktop-sidebar-name">PANTAS</div>
        <div style="font-size:0.65rem;color:var(--text-3);">Monitoring PTM</div>
      </div>
    </div>
    <nav class="desktop-sidebar-nav">
      <div class="desktop-sidebar-section">
        <div class="desktop-sidebar-label">Monitor</div>
        ${navItems.slice(0, 2)}
      </div>
      <div class="desktop-sidebar-section">
        <div class="desktop-sidebar-label">Manajemen</div>
        ${navItems.slice(2)}
      </div>
    </nav>
    <div class="desktop-sidebar-footer">
      ${profile.name ? `
      <div class="desktop-user-info">
        <div class="desktop-user-avatar">${initial}</div>
        <div>
          <div class="desktop-user-name">${profile.name}</div>
          <div class="desktop-user-role">Pengguna PANTAS</div>
        </div>
      </div>` : ''}
      <button id="desktop-logout-btn" class="desktop-nav-link" style="color:var(--red);width:100%;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:1;">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Keluar
      </button>
    </div>
  </aside>

  <!-- Main -->
  <div class="desktop-main">
    <header class="desktop-topbar">
      <div class="desktop-topbar-left">
        <span class="desktop-topbar-title" id="desktop-page-title">Dashboard</span>
      </div>
      <div class="desktop-topbar-right">
        <span id="desktop-connection-status" class="connection-status disconnected">
          <span class="dot"></span>Terputus
        </span>
        <button id="desktop-connect-btn" class="btn btn-sm" style="background:var(--blue);color:white;border-radius:10px;">
          Hubungkan Smartwatch
        </button>
      </div>
    </header>
    <div class="desktop-content" id="desktop-content"></div>
  </div>
</div>`;
}

const PAGE_TITLES = {
  '#/dashboard':    'Dashboard',
  '#/history':      'Riwayat Kesehatan',
  '#/reminders':    'Pengingat Obat',
  '#/consultation': 'Jadwal Konsultasi',
  '#/onboarding':   'Lengkapi Profil',
};

// ── Container helpers ────────────────────────────────────────
function getContainer() {
  // Onboarding selalu pakai #app (bukan desktop-content)
  const hash = window.location.hash || '';
  const isAuthPage = hash === '#/login' || hash === '#/onboarding' || !hash;
  if (isDesktop() && getSession() && !isAuthPage) {
    return document.getElementById('desktop-content');
  }
  return document.getElementById('app');
}

function ensureDesktopShell(hash) {
  const app = document.getElementById('app');
  if (!app) return;

  // Cek apakah desktop wrapper sudah ada
  let wrapper = document.querySelector('.desktop-wrapper');

  if (!wrapper) {
    // Inject desktop shell sebelum #app
    const div = document.createElement('div');
    div.innerHTML = buildDesktopShell(hash);
    const shell = div.firstElementChild;
    app.parentNode.insertBefore(shell, app);
    wrapper = shell;

    // Logout handler
    wrapper.querySelector('#desktop-logout-btn')?.addEventListener('click', () => {
      import('./modules/auth/auth.js').then(({ logout }) => logout());
    });

    // Connect smartwatch handler — sync dengan dashboard
    const connectBtn = wrapper.querySelector('#desktop-connect-btn');
    if (connectBtn) {
      connectBtn.addEventListener('click', async () => {
        connectBtn.disabled = true;
        connectBtn.textContent = 'Menghubungkan...';
        const { connectSmartwatch } = await import('./modules/health-monitor/healthMonitor.js');
        const result = await connectSmartwatch();
        if (result.success) {
          connectBtn.textContent = result.mode === 'bluetooth'
            ? (result.deviceName || 'Terhubung')
            : 'Simulasi Aktif';
          connectBtn.style.background = 'var(--green)';
        } else {
          connectBtn.textContent = 'Hubungkan Smartwatch';
          connectBtn.disabled = false;
        }
      });
    }
  } else {
    // Update active nav link
    wrapper.querySelectorAll('.desktop-nav-link[href]').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === hash);
    });
  }

  // Update page title
  const titleEl = document.getElementById('desktop-page-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[hash] || 'PANTAS';

  // Sembunyikan #app di desktop (konten dirender ke #desktop-content)
  app.style.display = 'none';
}

function teardownDesktopShell() {
  const wrapper = document.querySelector('.desktop-wrapper');
  if (wrapper) wrapper.remove();
  const app = document.getElementById('app');
  if (app) app.style.display = '';
}

// ── Route handler ────────────────────────────────────────────
function handleRoute() {
  const hash = window.location.hash || '';
  const appEl = document.getElementById('app');
  if (!appEl) return;

  // Halaman auth/onboarding — selalu mobile centered
  const isAuthPage = hash === '#/login' || hash === '#/onboarding' || !hash;

  if (isDesktop() && getSession() && !isAuthPage) {
    ensureDesktopShell(hash);
  } else {
    teardownDesktopShell();
    appEl.style.display = '';
  }

  // Jika tidak ada session → login (termasuk onboarding tanpa session)
  if (hash !== '#/login' && !getSession()) {
    navigate('#/login');
    return;
  }

  // Jika sudah login tapi belum onboarding → onboarding
  if (hash === '#/dashboard' && getSession() && !isOnboardingComplete()) {
    navigate('#/onboarding');
    return;
  }

  const renderFn = routes[hash];
  if (!renderFn) {
    navigate(getSession() ? '#/dashboard' : '#/login');
    return;
  }

  const container = getContainer();
  if (!container) {
    console.error('[PANTAS] Container tidak ditemukan untuk hash:', hash);
    return;
  }

  try {
    renderFn(container);
  } catch (err) {
    console.error('[PANTAS] Error saat render halaman:', hash, err);
    // Fallback: tampilkan pesan error sederhana
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:12px;padding:24px;text-align:center;">
        <div style="font-size:2rem;">⚠️</div>
        <div style="font-weight:600;color:#1e293b;">Terjadi kesalahan</div>
        <div style="font-size:0.85rem;color:#64748b;">${err.message}</div>
        <a href="#/login" style="color:#2563eb;font-weight:600;font-size:0.9rem;">Kembali ke Login</a>
      </div>`;
  }
}

export function navigate(route) {
  window.location.hash = route;
}

document.addEventListener('DOMContentLoaded', handleRoute);
window.addEventListener('hashchange', handleRoute);

// Re-handle on resize (mobile ↔ desktop switch)
let _resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(handleRoute, 150);
});
