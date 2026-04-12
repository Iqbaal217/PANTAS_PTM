/**
 * History — Halaman Rekam Medis pengguna.
 * Menampilkan dan memungkinkan edit data kesehatan yang tersimpan.
 */

import { getProfile, saveProfile } from '../user-profile/userProfile.js';

function _renderCheckbox(id, label, checked) {
  return `
    <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;font-size:0.825rem;color:var(--text-2);">
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} style="width:15px;height:15px;accent-color:var(--accent);cursor:pointer;" />
      ${label}
    </label>`;
}

const HISTORY_INNER_HTML = `
  <!-- Banner info -->
  <div style="background:var(--blue-soft);border:1px solid rgba(37,99,235,0.2);border-radius:var(--radius);padding:12px 14px;margin-bottom:18px;display:flex;gap:10px;align-items:flex-start;">
    <span style="font-size:1rem;flex-shrink:0;">ℹ️</span>
    <div style="font-size:0.78rem;color:var(--blue);line-height:1.6;">
      Data rekam medis Anda tersimpan secara lokal dan digunakan untuk analisis risiko kesehatan.
    </div>
  </div>

  <!-- Data Pribadi -->
  <div style="font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:12px;">Data Pribadi</div>
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

  <!-- Riwayat Penyakit Orang Tua -->
  <div style="font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:6px;">Riwayat Penyakit Orang Tua</div>
  <div style="font-size:0.78rem;color:var(--text-3);margin-bottom:12px;">Pilih penyakit yang pernah/sedang dialami orang tua Anda</div>
  <div id="rm-family-history" style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;"></div>

  <!-- Gaya Hidup -->
  <div style="font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:12px;">Gaya Hidup</div>
  <div class="form-group">
    <label>Status Merokok</label>
    <select id="rm-smoking">
      <option value="never">Tidak pernah merokok</option>
      <option value="former">Mantan perokok</option>
      <option value="current">Perokok aktif</option>
    </select>
  </div>
  <div class="form-group">
    <label>Aktivitas Fisik</label>
    <select id="rm-activity">
      <option value="sedentary">Sangat jarang (&lt; 1x/minggu)</option>
      <option value="light">Ringan (1–2x/minggu)</option>
      <option value="moderate">Sedang (3–4x/minggu)</option>
      <option value="active">Aktif (5+x/minggu)</option>
    </select>
  </div>
  <div class="form-group" style="margin-bottom:20px;">
    <label>Kualitas Pola Makan</label>
    <select id="rm-diet">
      <option value="poor">Buruk (banyak makanan olahan/asin)</option>
      <option value="average">Rata-rata</option>
      <option value="good">Baik (banyak sayur, buah, rendah garam)</option>
    </select>
  </div>

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
  set('#rm-smoking',  profile.lifestyle?.smokingStatus || 'never');
  set('#rm-activity', profile.lifestyle?.physicalActivity || 'moderate');
  set('#rm-diet',     profile.lifestyle?.dietQuality || 'average');

  // Tampilkan BMI
  _updateBMIDisplay(container, profile.bmi);

  // Render riwayat penyakit orang tua
  const fhEl = container.querySelector('#rm-family-history');
  if (fhEl) {
    const fh = profile.familyHistory || {};
    fhEl.innerHTML = [
      ['hypertension', 'Hipertensi'],
      ['diabetes',     'Diabetes Tipe 2'],
      ['heartDisease', 'Penyakit Jantung'],
      ['stroke',       'Stroke'],
      ['obesity',      'Obesitas'],
    ].map(([key, label]) => _renderCheckbox(`rm-fh-${key}`, label, fh[key])).join('');
  }

  // Update BMI live saat berat/tinggi berubah
  ['#rm-weight', '#rm-height'].forEach(id => {
    container.querySelector(id)?.addEventListener('input', () => {
      const w = parseFloat(container.querySelector('#rm-weight')?.value);
      const h = parseFloat(container.querySelector('#rm-height')?.value);
      if (w && h) {
        const bmi = parseFloat((w / ((h / 100) ** 2)).toFixed(1));
        _updateBMIDisplay(container, bmi);
      }
    });
  });

  // Simpan
  container.querySelector('#rm-save-btn')?.addEventListener('click', () => {
    const msgEl = container.querySelector('#rm-save-msg');
    const updated = {
      ...profile,
      name:   container.querySelector('#rm-name')?.value?.trim() || profile.name,
      age:    parseInt(container.querySelector('#rm-age')?.value) || profile.age,
      gender: container.querySelector('#rm-gender')?.value || profile.gender,
      weight: parseFloat(container.querySelector('#rm-weight')?.value) || profile.weight,
      height: parseFloat(container.querySelector('#rm-height')?.value) || profile.height,
      familyHistory: {
        hypertension: container.querySelector('#rm-fh-hypertension')?.checked || false,
        diabetes:     container.querySelector('#rm-fh-diabetes')?.checked || false,
        heartDisease: container.querySelector('#rm-fh-heartDisease')?.checked || false,
        stroke:       container.querySelector('#rm-fh-stroke')?.checked || false,
        kidneyDisease: false,
        obesity:      container.querySelector('#rm-fh-obesity')?.checked || false,
      },
      lifestyle: {
        smokingStatus:      container.querySelector('#rm-smoking')?.value || 'never',
        alcoholConsumption: profile.lifestyle?.alcoholConsumption || 'none',
        physicalActivity:   container.querySelector('#rm-activity')?.value || 'moderate',
        dietQuality:        container.querySelector('#rm-diet')?.value || 'average',
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

function _updateBMIDisplay(container, bmi) {
  const el = container.querySelector('#rm-bmi-display');
  if (!el) return;
  if (!bmi) { el.textContent = '-- (belum dihitung)'; return; }
  const cat = bmi < 18.5 ? 'Kurang' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Berlebih' : 'Obesitas';
  const color = bmi < 18.5 ? 'var(--blue)' : bmi < 25 ? 'var(--green)' : bmi < 30 ? 'var(--yellow)' : 'var(--red)';
  el.innerHTML = `<span style="font-weight:700;color:${color};">${bmi}</span> <span style="color:var(--text-3);">— ${cat}</span>`;
}

// Tetap export loadHistory dan renderHistoryList agar tidak break import lain
export async function loadHistory() {}
export function renderHistoryList() {}
export function applyFilter() {}
