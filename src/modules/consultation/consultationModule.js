/**
 * Consultation_Module — Jadwal konsultasi dokter + rekomendasi spesialis
 */

import { getProfile } from '../user-profile/userProfile.js';

const STORAGE_KEY = 'pantas_consultations';
export const _consultationTimeouts = {};

// ── Rekomendasi spesialis berdasarkan penyakit ───────────────
const SPECIALIST_RECOMMENDATIONS = {
  hypertension: { specialist: 'Kardiolog', reason: 'Penanganan tekanan darah tinggi', icon: '❤️' },
  diabetes:     { specialist: 'Endokrinolog', reason: 'Pengelolaan kadar gula darah', icon: '🩸' },
  heartDisease: { specialist: 'Kardiolog', reason: 'Pemantauan kesehatan jantung', icon: '💓' },
  stroke:       { specialist: 'Neurolog', reason: 'Pemantauan kondisi neurologis', icon: '🧠' },
  kidneyDisease:{ specialist: 'Nefrolog', reason: 'Pemantauan fungsi ginjal', icon: '🫘' },
  obesity:      { specialist: 'Dokter Gizi', reason: 'Program penurunan berat badan', icon: '⚖️' },
};

const DISEASE_LABELS = {
  hypertension: 'Hipertensi', diabetes: 'Diabetes', heartDisease: 'Penyakit Jantung',
  stroke: 'Stroke', kidneyDisease: 'Penyakit Ginjal', obesity: 'Obesitas',
};

// ── Store helpers ────────────────────────────────────────────
export function _getStore() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
export function _setStore(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

// ── Reminder ─────────────────────────────────────────────────
export function _getScheduledReminderTime(c) {
  const [h, m] = c.scheduledTime.split(':').map(Number);
  const base = new Date(c.scheduledDate);
  base.setHours(h, m, 0, 0);
  return new Date(base.getTime() - 60 * 60 * 1000);
}

export function _scheduleConsultationReminder(c) {
  const ms = _getScheduledReminderTime(c).getTime() - Date.now();
  if (ms <= 0) return;
  _consultationTimeouts[c.id] = setTimeout(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Pengingat Konsultasi', { body: `Konsultasi dengan ${c.doctorName} dalam 1 jam` });
    }
  }, ms);
}

export function _cancelConsultationReminder(id) {
  if (_consultationTimeouts[id]) { clearTimeout(_consultationTimeouts[id]); delete _consultationTimeouts[id]; }
}

// ── CRUD ─────────────────────────────────────────────────────
export async function createConsultation(c) {
  const store = _getStore();
  const item = { ...c, status: 'upcoming', reminderSet: true };
  store.push(item);
  _setStore(store);
  _scheduleConsultationReminder(item);
}

export async function updateConsultation(id, updates) {
  const store = _getStore();
  const idx = store.findIndex(c => c.id === id);
  if (idx !== -1) { store[idx] = { ...store[idx], ...updates }; _setStore(store); }
}

export async function cancelConsultation(id) {
  const store = _getStore();
  const idx = store.findIndex(c => c.id === id);
  if (idx !== -1) { store[idx].status = 'cancelled'; _setStore(store); }
  _cancelConsultationReminder(id);
}

export function getUpcomingConsultations() {
  return _getStore().filter(c => c.status === 'upcoming');
}

export function getConsultationHistory() {
  return _getStore().filter(c => c.status === 'completed' || c.status === 'cancelled');
}

// ── Render ───────────────────────────────────────────────────
const BOTTOM_NAV = `
  <nav class="bottom-nav">
    <a href="#/dashboard" class="bottom-nav-item">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22" fill="none" stroke="currentColor" stroke-width="2"/></svg>
      Beranda
    </a>
    <a href="#/history" class="bottom-nav-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      Rekam
    </a>
    <a href="#/reminders" class="bottom-nav-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
      Pengingat
    </a>
    <a href="#/consultation" class="bottom-nav-item active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      Konsultasi
    </a>
  </nav>`;

export function render(container) {
  const isDesktop = window.innerWidth >= 900;
  const profile = getProfile();
  const ph = profile.personalHistory || {};

  // Rekomendasi spesialis
  const recos = [];
  Object.entries(SPECIALIST_RECOMMENDATIONS).forEach(([key, val]) => {
    if (ph[key]) recos.push({ ...val, disease: DISEASE_LABELS[key] });
  });
  // Hapus duplikat spesialis
  const seen = new Set();
  const uniqueRecos = recos.filter(r => { if (seen.has(r.specialist)) return false; seen.add(r.specialist); return true; });

  const recoHTML = uniqueRecos.length ? `
    <div style="font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:6px;">🩺 Rekomendasi Spesialis</div>
    <div style="font-size:0.75rem;color:var(--text-3);margin-bottom:12px;">Berdasarkan riwayat penyakit Anda</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
      ${uniqueRecos.map(r => `
        <div style="background:var(--surface-2);border:1px solid var(--border);border-left:3px solid var(--blue);border-radius:var(--radius);padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.4rem;">${r.icon}</span>
            <div>
              <div style="font-size:0.82rem;font-weight:600;color:var(--text);">${r.specialist}</div>
              <div style="font-size:0.72rem;color:var(--text-3);margin-top:2px;">${r.reason}</div>
              <span style="font-size:0.65rem;background:var(--blue-soft);color:var(--blue);padding:2px 7px;border-radius:var(--radius-full);margin-top:4px;display:inline-block;">${r.disease}</span>
            </div>
          </div>
          <button class="use-specialist-btn btn btn-sm" data-name="${r.specialist}" style="flex-shrink:0;background:var(--blue);color:white;border-radius:9px;font-size:0.7rem;padding:6px 10px;">Pilih</button>
        </div>`).join('')}
    </div>` : '';

  const upcoming = getUpcomingConsultations();
  const scheduleHTML = upcoming.length ? `
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
      ${upcoming.map(c => `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <div style="font-size:0.85rem;font-weight:600;color:var(--text);">Dr. ${c.doctorName}</div>
            <button class="cancel-btn btn btn-sm" data-id="${c.id}" style="background:var(--red-soft);color:var(--red);border-radius:8px;font-size:0.68rem;padding:4px 8px;">Batalkan</button>
          </div>
          <div style="font-size:0.75rem;color:var(--text-3);">${c.specialization}</div>
          <div style="font-size:0.75rem;color:var(--text-2);margin-top:4px;">📅 ${c.scheduledDate} · ⏰ ${c.scheduledTime}</div>
          <div style="font-size:0.72rem;color:var(--text-3);margin-top:2px;">📍 ${c.method === 'online' ? 'Online / Telemedicine' : 'Tatap Muka'}</div>
        </div>`).join('')}
    </div>` : `<div style="text-align:center;padding:20px 0;font-size:0.82rem;color:var(--text-3);">Belum ada jadwal konsultasi</div>`;

  const today = new Date().toISOString().split('T')[0];

  const innerHTML = `
    ${recoHTML}
    <div style="font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:12px;">📅 Jadwal Mendatang</div>
    ${scheduleHTML}
    <div style="font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:12px;">+ Buat Jadwal Baru</div>
    <div class="form-group">
      <label>Nama Dokter</label>
      <input type="text" id="con-doctor" placeholder="Contoh: dr. Budi Santoso" />
    </div>
    <div class="form-group">
      <label>Spesialisasi</label>
      <input type="text" id="con-spec" placeholder="Contoh: Kardiolog" />
    </div>
    <div class="form-group">
      <label>Tanggal</label>
      <input type="date" id="con-date" min="${today}" />
    </div>
    <div class="form-group">
      <label>Jam</label>
      <input type="time" id="con-time" value="09:00" />
    </div>
    <div class="form-group">
      <label>Metode</label>
      <select id="con-method">
        <option value="offline">Tatap Muka</option>
        <option value="online">Online / Telemedicine</option>
      </select>
    </div>
    <div id="con-msg" style="font-size:0.78rem;margin-bottom:8px;"></div>
    <button id="con-add-btn" class="btn btn-primary" style="width:100%;">Simpan Jadwal</button>`;

  if (isDesktop) {
    container.innerHTML = `<div style="max-width:600px;margin:0 auto;">${innerHTML}</div>`;
  } else {
    container.innerHTML = `
<div class="app-shell">
  <header class="app-header">
    <div class="app-header-brand">
      <div class="app-header-logo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
      <span class="app-header-title">Konsultasi Dokter</span>
    </div>
  </header>
  <div class="app-content">${innerHTML}</div>
  ${BOTTOM_NAV}
</div>`;
  }

  // Pilih spesialis dari rekomendasi
  container.querySelectorAll('.use-specialist-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelector('#con-spec').value = btn.dataset.name;
      container.querySelector('#con-spec').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Batalkan jadwal
  container.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await cancelConsultation(btn.dataset.id);
      render(container);
    });
  });

  // Tambah jadwal baru
  container.querySelector('#con-add-btn')?.addEventListener('click', async () => {
    const doctor = container.querySelector('#con-doctor')?.value?.trim();
    const spec   = container.querySelector('#con-spec')?.value?.trim();
    const date   = container.querySelector('#con-date')?.value;
    const time   = container.querySelector('#con-time')?.value;
    const method = container.querySelector('#con-method')?.value;
    const msgEl  = container.querySelector('#con-msg');

    if (!doctor || !spec || !date || !time) {
      msgEl.style.color = 'var(--red)'; msgEl.textContent = 'Harap lengkapi semua field.'; return;
    }
    await createConsultation({
      id: `con-${Date.now()}`,
      doctorName: doctor,
      specialization: spec,
      scheduledDate: date,
      scheduledTime: time,
      method,
    });
    render(container);
  });
}
