/**
 * Reminder_Module — Pengingat minum obat + rekomendasi berdasarkan PTM
 */

import { getProfile } from '../user-profile/userProfile.js';

const STORAGE_KEY = 'pantas_reminders';
const _scheduledTimeouts = {};

// ── Rekomendasi obat berdasarkan penyakit ────────────────────
const DRUG_RECOMMENDATIONS = {
  hypertension: [
    { name: 'Amlodipine 5mg', dose: '1x sehari', note: 'Diminum pagi hari' },
    { name: 'Lisinopril 10mg', dose: '1x sehari', note: 'Pantau tekanan darah' },
  ],
  diabetes: [
    { name: 'Metformin 500mg', dose: '2x sehari', note: 'Diminum setelah makan' },
    { name: 'Glibenclamide 5mg', dose: '1x sehari', note: 'Diminum sebelum makan pagi' },
  ],
  heartDisease: [
    { name: 'Aspirin 80mg', dose: '1x sehari', note: 'Diminum setelah makan' },
    { name: 'Bisoprolol 5mg', dose: '1x sehari', note: 'Diminum pagi hari' },
  ],
  stroke: [
    { name: 'Clopidogrel 75mg', dose: '1x sehari', note: 'Diminum pagi hari' },
    { name: 'Atorvastatin 20mg', dose: '1x sehari', note: 'Diminum malam hari' },
  ],
  kidneyDisease: [
    { name: 'Furosemide 40mg', dose: '1x sehari', note: 'Diminum pagi hari' },
  ],
  obesity: [
    { name: 'Vitamin D3 1000IU', dose: '1x sehari', note: 'Diminum bersama makanan' },
  ],
};

const DISEASE_LABELS = {
  hypertension: 'Hipertensi',
  diabetes: 'Diabetes',
  heartDisease: 'Penyakit Jantung',
  stroke: 'Stroke',
  kidneyDisease: 'Penyakit Ginjal',
  obesity: 'Obesitas',
};

// ── Store helpers ────────────────────────────────────────────
export function _getStore() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
export function _setStore(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

// ── Notification ─────────────────────────────────────────────
function sendNotification(title, body) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

export function scheduleNotification(reminder) {
  if (!reminder || !Array.isArray(reminder.scheduledTimes)) return;
  if (!_scheduledTimeouts[reminder.id]) _scheduledTimeouts[reminder.id] = [];
  for (const timeStr of reminder.scheduledTimes) {
    const msUntil = _msUntilNextOccurrence(timeStr);
    const id = setTimeout(() => {
      const cur = _getStore().find(r => r.id === reminder.id);
      if (!cur?.isActive) return;
      sendNotification(`Waktunya minum: ${reminder.medicationName}`, `Dosis: ${reminder.dosage}`);
    }, msUntil);
    _scheduledTimeouts[reminder.id].push(id);
  }
}

export function _msUntilNextOccurrence(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date(), target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

export function cancelNotification(reminderId) {
  (_scheduledTimeouts[reminderId] || []).forEach(clearTimeout);
  delete _scheduledTimeouts[reminderId];
}

// ── CRUD ─────────────────────────────────────────────────────
export async function addReminder(reminder) {
  const store = _getStore();
  const r = { ...reminder, isActive: true, lastStatus: 'pending' };
  store.push(r);
  _setStore(store);
  scheduleNotification(r);
}

export async function removeReminder(id) {
  const store = _getStore();
  const idx = store.findIndex(r => r.id === id);
  if (idx !== -1) { store[idx].isActive = false; _setStore(store); }
  cancelNotification(id);
}

export async function markReminder(id, status) {
  const store = _getStore();
  const idx = store.findIndex(r => r.id === id);
  if (idx !== -1) { store[idx].lastStatus = status; _setStore(store); }
}

export function getActiveReminders() {
  return _getStore().filter(r => r.isActive === true);
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
    <a href="#/reminders" class="bottom-nav-item active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
      Pengingat
    </a>
    <a href="#/consultation" class="bottom-nav-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      Konsultasi
    </a>
  </nav>`;

export function render(container) {
  const isDesktop = window.innerWidth >= 900;
  const profile = getProfile();
  const ph = profile.personalHistory || {};

  // Kumpulkan rekomendasi berdasarkan penyakit yang dimiliki
  const recommendations = [];
  Object.entries(DRUG_RECOMMENDATIONS).forEach(([key, drugs]) => {
    if (ph[key]) {
      drugs.forEach(d => recommendations.push({ ...d, disease: DISEASE_LABELS[key] }));
    }
  });

  const recoHTML = recommendations.length ? `
    <div style="font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:6px;">💊 Rekomendasi Obat</div>
    <div style="font-size:0.75rem;color:var(--text-3);margin-bottom:12px;">Berdasarkan riwayat penyakit Anda di rekam medis</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
      ${recommendations.map(r => `
        <div style="background:var(--surface-2);border:1px solid var(--border);border-left:3px solid var(--blue);border-radius:var(--radius);padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <div>
            <div style="font-size:0.82rem;font-weight:600;color:var(--text);">${r.name}</div>
            <div style="font-size:0.72rem;color:var(--text-3);margin-top:2px;">${r.dose} · ${r.note}</div>
            <span style="font-size:0.65rem;background:var(--blue-soft);color:var(--blue);padding:2px 7px;border-radius:var(--radius-full);margin-top:4px;display:inline-block;">${r.disease}</span>
          </div>
          <button class="btn btn-sm add-reco-btn" data-name="${r.name}" data-dose="${r.dose}" style="flex-shrink:0;background:var(--blue);color:white;border-radius:9px;font-size:0.7rem;padding:6px 10px;">+ Tambah</button>
        </div>`).join('')}
    </div>` : '';

  const activeReminders = getActiveReminders();
  const remindersHTML = activeReminders.length ? `
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
      ${activeReminders.map(r => `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div style="font-size:0.85rem;font-weight:600;color:var(--text);">${r.medicationName}</div>
            <button class="remove-btn btn btn-sm" data-id="${r.id}" style="background:var(--red-soft);color:var(--red);border-radius:8px;font-size:0.68rem;padding:4px 8px;">Hapus</button>
          </div>
          <div style="font-size:0.75rem;color:var(--text-3);">${r.dosage} · ${(r.scheduledTimes||[]).join(', ')}</div>
          <div style="display:flex;gap:6px;margin-top:8px;">
            <button class="mark-btn btn btn-sm" data-id="${r.id}" data-status="taken" style="flex:1;background:#f0fdf4;color:var(--green);border-radius:8px;font-size:0.72rem;">✓ Sudah diminum</button>
            <button class="mark-btn btn btn-sm" data-id="${r.id}" data-status="skipped" style="flex:1;background:var(--surface-2);color:var(--text-3);border-radius:8px;font-size:0.72rem;">Lewati</button>
          </div>
        </div>`).join('')}
    </div>` : `<div style="text-align:center;padding:20px 0;font-size:0.82rem;color:var(--text-3);">Belum ada pengingat aktif</div>`;

  const innerHTML = `
    ${recoHTML}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <div style="font-size:0.9rem;font-weight:700;color:var(--text);">⏰ Pengingat Aktif</div>
      <button id="open-add-sheet" style="display:flex;align-items:center;gap:6px;background:var(--blue);color:white;border:none;border-radius:20px;padding:7px 14px;font-size:0.78rem;font-weight:600;cursor:pointer;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah
      </button>
    </div>
    ${remindersHTML}

    <!-- Overlay + Bottom Sheet -->
    <div id="rem-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:300;"></div>
    <div id="rem-sheet" style="display:none;position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:var(--max-w);background:var(--surface);border-radius:20px 20px 0 0;z-index:301;padding:20px 20px 36px;box-shadow:0 -4px 24px rgba(0,0,0,0.12);">
      <div style="width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 18px;"></div>
      <div style="font-size:1rem;font-weight:700;color:var(--text);margin-bottom:16px;">💊 Tambah Pengingat Obat</div>
      <div class="form-group">
        <label>Nama Obat</label>
        <input type="text" id="rem-name" placeholder="Contoh: Amlodipine 5mg" style="font-size:0.9rem;" />
      </div>
      <div class="form-group">
        <label>Dosis</label>
        <input type="text" id="rem-dose" placeholder="Contoh: 1 tablet" style="font-size:0.9rem;" />
      </div>
      <div class="form-group">
        <label>Jam Minum</label>
        <input type="time" id="rem-time" value="08:00" style="font-size:0.9rem;" />
      </div>
      <div id="rem-msg" style="font-size:0.78rem;margin-bottom:10px;"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <button id="rem-cancel-btn" class="btn" style="width:100%;">Batal</button>
        <button id="rem-add-btn" class="btn btn-primary" style="width:100%;">Simpan</button>
      </div>
    </div>`;

  if (isDesktop) {
    container.innerHTML = `<div style="max-width:600px;margin:0 auto;">${innerHTML}</div>`;
  } else {
    container.innerHTML = `
<div class="app-shell">
  <header class="app-header">
    <div class="app-header-brand">
      <div class="app-header-logo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
      <span class="app-header-title">Pengingat Obat</span>
    </div>
  </header>
  <div class="app-content">${innerHTML}</div>
  ${BOTTOM_NAV}
</div>`;
  }

  // Tambah dari rekomendasi
  container.querySelectorAll('.add-reco-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _openSheet(container);
      container.querySelector('#rem-name').value = btn.dataset.name;
      container.querySelector('#rem-dose').value = btn.dataset.dose;
    });
  });

  // Buka/tutup sheet
  function _openSheet(c) {
    c.querySelector('#rem-overlay').style.display = 'block';
    c.querySelector('#rem-sheet').style.display = 'block';
  }
  function _closeSheet(c) {
    c.querySelector('#rem-overlay').style.display = 'none';
    c.querySelector('#rem-sheet').style.display = 'none';
  }

  container.querySelector('#open-add-sheet')?.addEventListener('click', () => _openSheet(container));
  container.querySelector('#rem-overlay')?.addEventListener('click', () => _closeSheet(container));
  container.querySelector('#rem-cancel-btn')?.addEventListener('click', () => _closeSheet(container));

  // Hapus pengingat
  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await removeReminder(btn.dataset.id);
      render(container);
    });
  });

  // Tandai status
  container.querySelectorAll('.mark-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await markReminder(btn.dataset.id, btn.dataset.status);
      render(container);
    });
  });

  // Tambah pengingat baru
  container.querySelector('#rem-add-btn')?.addEventListener('click', async () => {
    const name = container.querySelector('#rem-name')?.value?.trim();
    const dose = container.querySelector('#rem-dose')?.value?.trim();
    const time = container.querySelector('#rem-time')?.value;
    const msgEl = container.querySelector('#rem-msg');
    if (!name || !dose || !time) {
      msgEl.style.color = 'var(--red)'; msgEl.textContent = 'Harap lengkapi semua field.'; return;
    }
    await addReminder({
      id: `rem-${Date.now()}`,
      medicationName: name,
      dosage: dose,
      scheduledTimes: [time],
    });
    render(container);
  });
}
