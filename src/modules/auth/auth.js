const SESSION_KEY  = 'pantas_session';
const ACCOUNTS_KEY = 'pantas_accounts';
const TOKENS_KEY   = 'pantas_valid_tokens';

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

    <!-- Form Login -->
    <div id="login-view">
      <form id="login-form" novalidate>
        <div class="form-group">
          <label for="login-email">Email</label>
          <input type="email" id="login-email" name="email" placeholder="anda@gmail.com" autocomplete="email" required />
        </div>
        <div class="form-group">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <label for="login-password" style="margin:0;">Password</label>
            <a id="forgot-password-link" href="#" style="font-size:0.75rem;color:var(--blue);text-decoration:none;">Lupa password?</a>
          </div>
          <input type="password" id="login-password" name="password" placeholder="Masukkan password" autocomplete="current-password" required />
        </div>
        <div id="login-error" class="error-message" role="alert" aria-live="polite"></div>
        <button type="submit" class="btn btn-primary" style="margin-top:6px;">Masuk</button>
      </form>
      <div class="auth-footer-link">
        Belum punya akun? <a href="#/onboarding" id="register-link">Daftar sekarang</a>
      </div>
    </div>

    <!-- Form Reset Password -->
    <div id="reset-view" style="display:none;">
      <div style="font-size:1rem;font-weight:700;color:var(--text);margin-bottom:4px;">Reset Password</div>
      <div style="font-size:0.82rem;color:var(--text-3);margin-bottom:18px;">Masukkan email dan nama lengkap yang terdaftar untuk mereset password Anda.</div>
      <div class="form-group">
        <label for="reset-email">Email Terdaftar</label>
        <input type="email" id="reset-email" placeholder="anda@gmail.com" autocomplete="email" />
      </div>
      <div class="form-group">
        <label for="reset-name">Nama Lengkap</label>
        <input type="text" id="reset-name" placeholder="Masukan nama lengkap anda" />
      </div>
      <div id="reset-new-pass-group" style="display:none;">
        <div class="form-group">
          <label for="reset-new-password">Password Baru</label>
          <input type="password" id="reset-new-password" placeholder="Minimal 6 karakter" />
        </div>
        <div class="form-group">
          <label for="reset-confirm-password">Konfirmasi Password Baru</label>
          <input type="password" id="reset-confirm-password" placeholder="Ulangi password baru" />
        </div>
      </div>
      <div id="reset-message" style="font-size:0.8rem;margin-bottom:10px;"></div>
      <button id="reset-verify-btn" class="btn btn-primary" style="width:100%;margin-bottom:8px;">Verifikasi</button>
      <button id="reset-save-btn" class="btn btn-primary" style="width:100%;margin-bottom:8px;display:none;">Simpan Password Baru</button>
      <button id="back-to-login-btn" class="btn" style="width:100%;font-size:0.82rem;">← Kembali ke Login</button>
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
/**
 * Saves the session token to localStorage and registers it as valid.
 * @param {string} token
 */
export function saveSession(token) {
  localStorage.setItem(SESSION_KEY, token);
  const tokens = JSON.parse(localStorage.getItem(TOKENS_KEY) || '[]');
  tokens.push(token);
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

/**
 * Retrieves the session token only if it's a valid issued token.
 * @returns {string|null}
 */
export function getSession() {
  const token  = localStorage.getItem(SESSION_KEY);
  if (!token) return null;
  const tokens = JSON.parse(localStorage.getItem(TOKENS_KEY) || '[]');
  return tokens.includes(token) ? token : null;
}

/**
 * Removes the session token from localStorage.
 */
export function clearSession() {
  const token = localStorage.getItem(SESSION_KEY);
  if (token) {
    const tokens = JSON.parse(localStorage.getItem(TOKENS_KEY) || '[]');
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens.filter(t => t !== token)));
  }
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
 * Reset password jika email dan nama cocok dengan data terdaftar.
 * @param {string} email
 * @param {string} name
 * @param {string} newPassword
 * @returns {{ success: boolean, error?: string }}
 */
export function resetPassword(email, name, newPassword) {
  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}');
  const key = email.toLowerCase();
  if (!(key in accounts)) {
    return { success: false, error: 'Email tidak ditemukan.' };
  }
  // Verifikasi nama dari profil
  try {
    const profile = JSON.parse(localStorage.getItem('pantas_user_profile') || '{}');
    const savedName = (profile.name || '').trim().toLowerCase();
    if (!savedName || savedName !== name.trim().toLowerCase()) {
      return { success: false, error: 'Nama lengkap tidak cocok.' };
    }
  } catch {
    return { success: false, error: 'Gagal memverifikasi data.' };
  }
  accounts[key] = newPassword;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return { success: true };
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

  const form    = container.querySelector('#login-form');
  const errorEl = container.querySelector('#login-error');

  // ── Login form submit ────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = form.querySelector('#login-email').value;
    const password = form.querySelector('#login-password').value;
    errorEl.textContent = '';

    const { valid, errors } = validateLoginForm(email, password);
    if (!valid) {
      errorEl.textContent = Object.values(errors).join(' | ');
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
        const banner = container.querySelector('#no-account-banner');
        if (banner && result.notRegistered) banner.style.display = 'block';
      }
    } catch {
      errorEl.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Masuk';
    }
  });

  // ── Daftar sekarang ──────────────────────────────────────
  container.querySelector('#register-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = '#/onboarding';
  });

  // ── Lupa password → tampilkan reset view ────────────────
  container.querySelector('#forgot-password-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    container.querySelector('#login-view').style.display  = 'none';
    container.querySelector('#reset-view').style.display  = 'block';
  });

  // ── Kembali ke login ─────────────────────────────────────
  container.querySelector('#back-to-login-btn')?.addEventListener('click', () => {
    container.querySelector('#reset-view').style.display  = 'none';
    container.querySelector('#login-view').style.display  = 'block';
    container.querySelector('#reset-message').textContent = '';
    container.querySelector('#reset-new-pass-group').style.display = 'none';
    container.querySelector('#reset-verify-btn').style.display     = 'block';
    container.querySelector('#reset-save-btn').style.display       = 'none';
  });

  // ── Verifikasi email + nama ──────────────────────────────
  container.querySelector('#reset-verify-btn')?.addEventListener('click', () => {
    const email   = container.querySelector('#reset-email').value.trim();
    const name    = container.querySelector('#reset-name').value.trim();
    const msgEl   = container.querySelector('#reset-message');

    if (!email || !name) {
      msgEl.style.color   = 'var(--red)';
      msgEl.textContent   = 'Harap isi email dan nama lengkap.';
      return;
    }

    const result = resetPassword(email, name, '__verify__');
    // Gunakan verifikasi tanpa benar-benar reset — cek manual
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}');
    const profile  = JSON.parse(localStorage.getItem('pantas_user_profile') || '{}');
    const emailOk  = email.toLowerCase() in accounts;
    const nameOk   = (profile.name || '').trim().toLowerCase() === name.toLowerCase();

    if (!emailOk) {
      msgEl.style.color = 'var(--red)';
      msgEl.textContent = 'Email tidak ditemukan.';
      return;
    }
    if (!nameOk) {
      msgEl.style.color = 'var(--red)';
      msgEl.textContent = 'Nama lengkap tidak cocok.';
      return;
    }

    msgEl.style.color = 'var(--green)';
    msgEl.textContent = '✓ Verifikasi berhasil. Masukkan password baru Anda.';
    container.querySelector('#reset-new-pass-group').style.display = 'block';
    container.querySelector('#reset-verify-btn').style.display     = 'none';
    container.querySelector('#reset-save-btn').style.display       = 'block';
  });

  // ── Simpan password baru ─────────────────────────────────
  container.querySelector('#reset-save-btn')?.addEventListener('click', () => {
    const email    = container.querySelector('#reset-email').value.trim();
    const newPass  = container.querySelector('#reset-new-password').value;
    const confPass = container.querySelector('#reset-confirm-password').value;
    const msgEl    = container.querySelector('#reset-message');

    if (!newPass || newPass.length < 6) {
      msgEl.style.color = 'var(--red)';
      msgEl.textContent = 'Password minimal 6 karakter.';
      return;
    }
    if (newPass !== confPass) {
      msgEl.style.color = 'var(--red)';
      msgEl.textContent = 'Konfirmasi password tidak cocok.';
      return;
    }

    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}');
    accounts[email.toLowerCase()] = newPass;
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

    msgEl.style.color = 'var(--green)';
    msgEl.textContent = '✓ Password berhasil direset! Silakan login.';
    container.querySelector('#reset-save-btn').disabled = true;

    setTimeout(() => {
      container.querySelector('#reset-view').style.display  = 'none';
      container.querySelector('#login-view').style.display  = 'block';
      container.querySelector('#reset-message').textContent = '';
      container.querySelector('#reset-new-pass-group').style.display = 'none';
      container.querySelector('#reset-verify-btn').style.display     = 'block';
      container.querySelector('#reset-save-btn').style.display       = 'none';
      container.querySelector('#reset-save-btn').disabled            = false;
    }, 1500);
  });
}
