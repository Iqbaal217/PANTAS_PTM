const SESSION_KEY = 'pantas_session';
const ACCOUNTS_KEY = 'pantas_accounts';

const LOGIN_TEMPLATE = `
<div class="auth-screen">
  <div class="auth-card">
    <div class="auth-logo-row">
      <div class="auth-logo-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </div>
      <span class="auth-logo-name">PANTAS</span>
    </div>
    <div class="auth-heading">Platform Monitoring PTM Terintegrasi</div>
    <div class="auth-subheading">Masuk untuk memantau kesehatan Anda</div>

    <!-- Banner info belum punya akun -->
    <div id="no-account-banner" style="display:none;background:var(--blue-soft);border:1px solid rgba(37,99,235,0.25);border-radius:var(--radius);padding:12px 14px;margin-bottom:14px;font-size:0.8rem;color:var(--blue);line-height:1.6;">
      <div style="font-weight:600;margin-bottom:4px;">👋 Belum punya akun?</div>
      Klik <strong>"Daftar sekarang"</strong> di bawah untuk membuat akun baru dan mulai memantau kesehatan Anda.
    </div>

    <form id="login-form" novalidate>
      <div class="form-group">
        <label for="login-email">Email</label>
        <input type="email" id="login-email" name="email" placeholder="anda@gmail.com" autocomplete="email" required />
      </div>
      <div class="form-group">
        <label for="login-password">Password</label>
        <input type="password" id="login-password" name="password" placeholder="Masukkan password" autocomplete="current-password" required />
      </div>
      <div id="login-error" class="error-message" role="alert" aria-live="polite"></div>
      <button type="submit" class="btn btn-primary" style="margin-top:6px;">Masuk</button>
    </form>
    <div class="auth-footer-link">
      Belum punya akun? <a href="#/onboarding" id="register-link">Daftar sekarang</a>
    </div>
  </div>
</div>
`;

/**
 * Validates the login form inputs.
 * @param {string} email
 * @param {string} password
 * @returns {{ valid: boolean, errors: { email?: string, password?: string } }}
 */
export function validateLoginForm(email, password) {
  const errors = {};

  if (!email || email.trim() === '') {
    errors.email = 'Email tidak boleh kosong';
  } else {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = 'Format email tidak valid';
    }
  }

  if (!password || password.trim() === '') {
    errors.password = 'Password tidak boleh kosong';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Saves the session token to localStorage.
 * @param {string} token
 */
export function saveSession(token) {
  localStorage.setItem(SESSION_KEY, token);
}

/**
 * Retrieves the session token from localStorage.
 * @returns {string|null}
 */
export function getSession() {
  return localStorage.getItem(SESSION_KEY);
}

/**
 * Removes the session token from localStorage.
 */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Simpan akun baru ke localStorage saat daftar.
 * @param {string} email
 * @param {string} password
 */
export function registerAccount(email, password) {
  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}');
  accounts[email.toLowerCase()] = password;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

/**
 * Cek apakah email sudah terdaftar.
 * @param {string} email
 * @returns {boolean}
 */
export function isEmailRegistered(email) {
  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}');
  return email.toLowerCase() in accounts;
}

/**
 * Attempts to log in with the given credentials.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ success: boolean, token?: string, error?: string, notRegistered?: boolean }>}
 */
export async function login(email, password) {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}');
  const key = email.toLowerCase();

  if (!(key in accounts)) {
    return { success: false, error: 'Email belum terdaftar. Silakan daftar terlebih dahulu.', notRegistered: true };
  }

  if (accounts[key] !== password) {
    return { success: false, error: 'Password salah. Silakan coba lagi.' };
  }

  const token = `token-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  saveSession(token);
  return { success: true, token };
}

/**
 * Logs out the current user by clearing the session and redirecting to login.
 */
export function logout() {
  clearSession();
  window.location.hash = '#/login';
}

/**
 * Renders the login page into the given container and attaches event listeners.
 * @param {HTMLElement} container
 */
export function render(container) {
  container.innerHTML = LOGIN_TEMPLATE;

  const form = container.querySelector('#login-form');
  const errorEl = container.querySelector('#login-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.querySelector('#login-email').value;
    const password = form.querySelector('#login-password').value;

    errorEl.textContent = '';

    const { valid, errors } = validateLoginForm(email, password);

    if (!valid) {
      const messages = Object.values(errors).join(' | ');
      errorEl.textContent = messages;
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memproses...';

    try {
      const result = await login(email, password);

      if (result.success) {
        window.location.hash = '#/dashboard';
      } else {
        errorEl.textContent = result.error;
        // Tampilkan banner reminder daftar akun jika email belum terdaftar
        const banner = form.closest('.auth-card')?.querySelector('#no-account-banner');
        if (banner && result.notRegistered) banner.style.display = 'block';
      }
    } catch (err) {
      errorEl.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Masuk';
    }
  });

  // "Daftar sekarang" — auto-login dengan akun demo lalu ke onboarding
  const registerLink = container.querySelector('#register-link');
  if (registerLink) {
    registerLink.addEventListener('click', async (e) => {
      e.preventDefault();
      // Buat session demo agar bisa akses onboarding
      const demoToken = `demo-token-${Date.now()}`;
      saveSession(demoToken);
      window.location.hash = '#/onboarding';
    });
  }
}
