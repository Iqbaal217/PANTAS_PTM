/**
 * History — Halaman Rekam Medis pengguna.
 * Data pribadi, integrasi BPJS Kesehatan, dan riwayat penyakit diri sendiri.
 */

import { getProfile, saveProfile } from '../user-profile/userProfile.js';

const BPJS_KEY = 'pantas_bpjs_data';

function _renderCheckbox(id, label, checked) {
  return `
    <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;font-size:0.825rem;color:var(--text-2);">
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} style="width:15px;height:15px;accent-color:var(--accent);cursor:pointer;" />
      ${label}
    </label>`;
}

function _getBpjsData() {
  try { return JSON.parse(localStorage.getItem(BPJS_KEY) || 'null'); } catch { return null; }
}

function _saveBpjsData(data) {
  localStorage.setItem(BPJS_KEY, JSON.stringify(data));
}

// Mock BPJS lookup
async function _fetchBpjsData(noBpjs) {
  await new Promise(r => setTimeout(r, 1200));
  if (!/^\d{13}$/.test(noBpjs)) throw new Error('Nomor BPJS tidak valid (harus 13 digit).');
  return {
    noBpjs,
    nama: getProfile().name || 'Peserta BPJS',
    statusPeserta: 'Aktif',
    jenisKepesertaan: 'Pekerja Bukan Penerima Upah (PBPU)',
    faskesTingkat1: 'Puskesmas Kecamatan Setempat',
    berlakuHingga: '31 Desember 2026',
    syncedAt: new Date().toISOString(),
  };
}

const HISTORY_INNER_HTML = `
  <!-- Banner BPJS -->
  <div style="background:var(--blue-soft);border:1px solid rgba(37,99,235,0.2);border-radius:var(--radius);padding:12px 14px;margin-bottom:18px;display:flex;gap:10px;align-items:flex-start;">
    <span style="font-size:1rem;flex-shrink:0;">ℹ️</span>
    <div style="font-size:0.78rem;color:var(--blue);line-height:1.6;">
      Aplikasi ini terintegrasi dengan <strong>BPJS Kesehatan</strong>. Data rekam medis kamu akan diambil otomatis dari sistem BPJS.
    </div>
  </div>

  <!-- Data Pribadi -->
  <div style="font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:12px;">Data Pribadi</div>

  <!-- Nomor BPJS -->
  <div class="form-group">
    <label>Nomor BPJS</label>
    <input type="text" id="rm-bpjs-no" placeholder="Contoh: 0001234567890" maxlength="13" inputmode="numeric" />
  </div>
  <button id="rm-bpjs-sync-btn" class="btn btn-primary" style="width:100%;margin-bottom:6px;">
    🔗 Ambil Data dari BPJS
  </button>
  <div id="rm-bpjs-status" style="font-size:0.75rem;margin-bottom:14px;"></div>

  <!-- Info BPJS (muncul setelah sync) -->
  <div id="rm-bpjs-info" style="display:none;background:var(--surface-2);border:1px solid var(--border);border-left:4px solid var(--blue);border-radius:var(--radius);padding:12px 14px;margin-bottom:18px;">
    <div style="font-size:0.78rem;font-weight:600;color:var(--blue);margin-bottom:8px;">✓ Tersinkronisasi dengan BPJS Kesehatan</div>
    <div id="rm-bpjs-detail" style="font-size:0.78rem;color:var(--text-2);line-height:1.8;"></div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
    <div class="form-group" style="grid-column:1/-1;">
      <label>Nama Lengkap</label>
      <input type="text" id="rm-name" placeholder="Masukan nama lengkap anda" />
    </div>
    <div class="form-group">
      <label>Usia (tahun)</label>
      <input type="number" id="rm-age" placeholder="35" min="1" max="120" />
    </div>
    <div class="form-group">
      <label>Jenis Kelamin</label>
      <select id="rm-gender">
        <option value="">Pilih...</option>
        <option value="male">Laki-laki</option>
        <option value="female">Perempuan</option>
      </select>
    </div>
    <div class="form-group">
      <label>Berat Badan (kg)</label>
      <input type="number" id="rm-weight" placeholder="70" min="20" max="300" />
    </div>
    <div class="form-group">
      <label>Tinggi Badan (cm)</label>
      <input type="number" id="rm-height" placeholder="170" min="100" max="250" />
    </div>
    <div class="form-group" style="grid-column:1/-1;">
      <label>BMI</label>
      <div id="rm-bmi-display" style="padding:10px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);font-size:0.85rem;color:var(--text-2);">-- (belum dihitung)</div>
    </div>
  </div>

  <!-- Riwayat Penyakit Diri Sendiri -->
  <div style="font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:6px;">Riwayat Penyakit</div>
  <div style="font-size:0.78rem;color:var(--text-3);margin-bottom:12px;">Pilih penyakit yang pernah/sedang kamu alami</div>
  <div id="rm-personal-history" style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;"></div>

  <div id="rm-save-msg" style="font-size:0.8rem;margin-bottom:8px;text-align:center;"></div>
  <button id="rm-save-btn" class="btn btn-primary" style="width:100%;padding:13px;">
    💾 Simpan Data Rekam Medis
  </button>
`;

const HISTORY_HTML = `
<div class="app-shell">
  <header class="app-header">
    <div class="app-header-brand">
      <div class="app-header-logo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      </div>
      <span class="app-header-title">Rekam Medis</span>
    </div>
  </header>
  <div class="app-content">${HISTORY_INNER_HTML}</div>
  <nav class="bottom-nav">
    <a href="#/dashboard" class="bottom-nav-item">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22" fill="none" stroke="currentColor" stroke-width="2"/></svg>
      Beranda
    </a>
    <a href="#/history" class="bottom-nav-item active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      Rekam
    </a>
    <a href="#/reminders" class="bottom-nav-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
      Pengingat
    </a>
    <a href="#/consultation" class="bottom-nav-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      Konsultasi
    </a>
  </nav>
</div>
`;

export function render(container) {
  const isDesktop = window.innerWidth >= 900;
  container.innerHTML = isDesktop ? HISTORY_INNER_HTML : HISTORY_HTML;

  const profile = getProfile();

  // Isi data pribadi
  const set = (id, val) => { const el = container.querySelector(id); if (el) el.value = val || ''; };
  set('#rm-name',   profile.name);
  set('#rm-age',    profile.age);
  set('#rm-weight', profile.weight);
  set('#rm-height', profile.height);
  set('#rm-gender', profile.gender);

  // Tampilkan BMI
  _updateBMIDisplay(container, profile.bmi);

  // Tampilkan data BPJS jika sudah pernah sync
  const bpjsData = _getBpjsData();
  if (bpjsData) {
    set('#rm-bpjs-no', bpjsData.noBpjs);
    _showBpjsInfo(container, bpjsData);
  }

  // Render riwayat penyakit DIRI SENDIRI
  const phEl = container.querySelector('#rm-personal-history');
  if (phEl) {
    const ph = profile.personalHistory || {};
    phEl.innerHTML = [
      ['hypertension', 'Hipertensi'],
      ['diabetes',     'Diabetes Tipe 2'],
      ['heartDisease', 'Penyakit Jantung'],
      ['stroke',       'Stroke'],
      ['kidneyDisease','Penyakit Ginjal Kronis'],
      ['obesity',      'Obesitas'],
    ].map(([key, label]) => _renderCheckbox(`rm-ph-${key}`, label, ph[key])).join('');
  }

  // Update BMI live
  ['#rm-weight', '#rm-height'].forEach(id => {
    container.querySelector(id)?.addEventListener('input', () => {
      const w = parseFloat(container.querySelector('#rm-weight')?.value);
      const h = parseFloat(container.querySelector('#rm-height')?.value);
      if (w && h) _updateBMIDisplay(container, parseFloat((w / ((h / 100) ** 2)).toFixed(1)));
    });
  });

  // Tombol sync BPJS
  container.querySelector('#rm-bpjs-sync-btn')?.addEventListener('click', async () => {
    const noBpjs  = container.querySelector('#rm-bpjs-no')?.value?.trim();
    const statusEl = container.querySelector('#rm-bpjs-status');
    const btn      = container.querySelector('#rm-bpjs-sync-btn');

    if (!noBpjs) {
      statusEl.style.color = 'var(--red)';
      statusEl.textContent = '⚠ Masukkan nomor BPJS terlebih dahulu.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Mengambil data...';
    statusEl.textContent = '';

    try {
      const data = await _fetchBpjsData(noBpjs);
      _saveBpjsData(data);
      _showBpjsInfo(container, data);
      statusEl.style.color = 'var(--green)';
      statusEl.textContent = '✓ Data BPJS berhasil diambil.';
    } catch (err) {
      statusEl.style.color = 'var(--red)';
      statusEl.textContent = `⚠ ${err.message}`;
    } finally {
      btn.disabled = false;
      btn.textContent = '🔗 Ambil Data dari BPJS';
    }
  });

  // Simpan rekam medis
  container.querySelector('#rm-save-btn')?.addEventListener('click', () => {
    const msgEl = container.querySelector('#rm-save-msg');
    const updated = {
      ...profile,
      name:   container.querySelector('#rm-name')?.value?.trim() || profile.name,
      age:    parseInt(container.querySelector('#rm-age')?.value) || profile.age,
      gender: container.querySelector('#rm-gender')?.value || profile.gender,
      weight: parseFloat(container.querySelector('#rm-weight')?.value) || profile.weight,
      height: parseFloat(container.querySelector('#rm-height')?.value) || profile.height,
      personalHistory: {
        hypertension:  container.querySelector('#rm-ph-hypertension')?.checked  || false,
        diabetes:      container.querySelector('#rm-ph-diabetes')?.checked      || false,
        heartDisease:  container.querySelector('#rm-ph-heartDisease')?.checked  || false,
        stroke:        container.querySelector('#rm-ph-stroke')?.checked        || false,
        kidneyDisease: container.querySelector('#rm-ph-kidneyDisease')?.checked || false,
        obesity:       container.querySelector('#rm-ph-obesity')?.checked       || false,
      },
    };
    saveProfile(updated);
    if (msgEl) {
      msgEl.style.color = 'var(--green)';
      msgEl.textContent = '✓ Data rekam medis berhasil disimpan';
      setTimeout(() => { msgEl.textContent = ''; }, 3000);
    }
  });
}

function _showBpjsInfo(container, data) {
  const infoEl   = container.querySelector('#rm-bpjs-info');
  const detailEl = container.querySelector('#rm-bpjs-detail');
  if (!infoEl || !detailEl) return;
  infoEl.style.display = 'block';
  detailEl.innerHTML = `
    <div>Nama: <strong>${data.nama}</strong></div>
    <div>No. BPJS: <strong>${data.noBpjs}</strong></div>
    <div>Status: <strong style="color:var(--green);">${data.statusPeserta}</strong></div>
    <div>Kepesertaan: <strong>${data.jenisKepesertaan}</strong></div>
    <div>Faskes Tk. 1: <strong>${data.faskesTingkat1}</strong></div>
    <div>Berlaku hingga: <strong>${data.berlakuHingga}</strong></div>
  `;
}

function _updateBMIDisplay(container, bmi) {
  const el = container.querySelector('#rm-bmi-display');
  if (!el) return;
  if (!bmi) { el.textContent = '-- (belum dihitung)'; return; }
  const cat   = bmi < 18.5 ? 'Kurang' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Berlebih' : 'Obesitas';
  const color = bmi < 18.5 ? 'var(--blue)' : bmi < 25 ? 'var(--green)' : bmi < 30 ? 'var(--yellow)' : 'var(--red)';
  el.innerHTML = `<span style="font-weight:700;color:${color};">${bmi}</span> <span style="color:var(--text-3);">— ${cat}</span>`;
}

export async function loadHistory() {}
export function renderHistoryList() {}
export function applyFilter() {}
