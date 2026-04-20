/**
 * Reminder_Module — Pengingat minum obat + rekomendasi berdasarkan PTM
 */

import { getProfile } from '../user-profile/userProfile.js';

const STORAGE_KEY = 'pantas_reminders';
const _scheduledTimeouts = {};

// ── Rekomendasi obat berdasarkan penyakit ────────────────────
const DRUG_RECOMMENDATIONS = {
  hypertension: [
    { name: 'Amlodipine 5mg',   dose: '1x sehari', note: 'Diminum setelah makan pagi' },
    { name: 'Lisinopril 10mg',  dose: '1x sehari', note: 'Diminum setelah makan pagi' },
  ],
  diabetes: [
    { name: 'Metformin 500mg',    dose: '2x sehari', note: 'Diminum setelah makan pagi dan malam' },
    { name: 'Glibenclamide 5mg',  dose: '1x sehari', note: 'Diminum 30 menit sebelum makan pagi' },
  ],
  heartDisease: [
    { name: 'Aspirin 80mg',    dose: '1x sehari', note: 'Diminum setelah makan' },
    { name: 'Bisoprolol 5mg',  dose: '1x sehari', note: 'Diminum setelah makan pagi' },
  ],
  stroke: [
    { name: 'Clopidogrel 75mg',   dose: '1x sehari', note: 'Diminum setelah makan pagi' },
    { name: 'Atorvastatin 20mg',  dose: '1x sehari', note: 'Diminum setelah makan malam' },
  ],
  kidneyDisease: [
    { name: 'Furosemide 40mg', dose: '1x sehari', note: 'Diminum setelah makan pagi' },
  ],
  obesity: [
    { name: 'Vitamin D3 1000IU', dose: '1x sehari', note: 'Diminum setelah makan' },
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

  const DISEASE_COLORS = {
    hypertension: { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', icon: '❤️' },
    diabetes:     { bg: '#fff7ed', border: '#fdba74', text: '#ea580c', icon: '🩸' },
    heartDisease: { bg: '#fdf2f8', border: '#f0abfc', text: '#a21caf', icon: '💓' },
    stroke:       { bg: '#f0fdf4', border: '#86efac', text: '#16a34a', icon: '🧠' },
    kidneyDisease:{ bg: '#eff6ff', border: '#93c5fd', text: '#2563eb', icon: '🫘' },
    obesity:      { bg: '#fefce8', border: '#fde047', text: '#ca8a04', icon: '⚖️' },
  };

  const recoHTML = recommendations.length ? `
    <div style="margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <span style="font-size:1.3rem;">💊</span>
        <div>
          <div style="font-size:0.92rem;font-weight:700;color:var(--text);">Daftar Obat yang Perlu Diminum</div>
          <div style="font-size:0.72rem;color:var(--text-3);">Sesuai penyakit PTM Anda</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${recommendations.map(r => {
          const c = DISEASE_COLORS[Object.keys(DISEASE_LABELS).find(k => DISEASE_LABELS[k] === r.disease)] || { bg:'var(--surface-2)', border:'var(--border)', text:'var(--blue)', icon:'💊' };
          return `
          <div style="background:${c.bg};border:1.5px solid ${c.border};border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;background:white;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.08);">${c.icon}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:0.85rem;font-weight:700;color:#1e293b;margin-bottom:2px;">${r.name}</div>
              <div style="font-size:0.72rem;color:#64748b;margin-bottom:5px;font-weight:600;">${r.dose}</div>
              <div style="font-size:0.72rem;color:#475569;line-height:1.5;margin-bottom:6px;">${r.note}</div>
              <span style="font-size:0.65rem;font-weight:600;background:white;color:${c.text};padding:3px 9px;border-radius:20px;border:1px solid ${c.border};">${r.disease}</span>
            </div>
            <button class="add-reco-btn" data-name="${r.name}" data-dose="${r.dose}" style="flex-shrink:0;background:${c.text};color:white;border:none;border-radius:10px;padding:8px 12px;font-size:0.72rem;font-weight:600;cursor:pointer;white-space:nowrap;">Set<br>Pengingat</button>
          </div>`;
        }).join('')}
      </div>
    </div>` : `
    <div style="background:var(--surface-2);border:1px dashed var(--border);border-radius:14px;padding:20px 16px;margin-bottom:20px;text-align:center;">
      <div style="font-size:2rem;margin-bottom:8px;">💊</div>
      <div style="font-size:0.85rem;font-weight:600;color:var(--text-2);margin-bottom:4px;">Belum ada rekomendasi obat</div>
      <div style="font-size:0.75rem;color:var(--text-3);">Lengkapi rekam medis untuk mendapatkan rekomendasi obat sesuai penyakit PTM Anda</div>
    </div>`;

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
    <div style="font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:12px;">⏰ Pengingat Aktif</div>
    ${remindersHTML}

    <!-- Form tambah langsung di halaman -->
    <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;margin-top:8px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <div style="width:32px;height:32px;background:var(--blue-soft);border-radius:50%;display:flex;align-items:center;justify-content:center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <div style="font-size:0.88rem;font-weight:700;color:var(--text);">Tambah Pengingat Obat</div>
      </div>
      <div class="form-group">
        <label>Nama Obat</label>
        <input type="text" id="rem-name" placeholder="Contoh: Amlodipine 5mg" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="form-group">
          <label>Dosis</label>
          <input type="text" id="rem-dose" placeholder="1 tablet" />
        </div>
        <div class="form-group">
          <label>Jam Minum</label>
          <input type="time" id="rem-time" value="08:00" />
        </div>
      </div>
      <div id="rem-msg" style="font-size:0.78rem;margin-bottom:8px;"></div>
      <button id="rem-add-btn" class="btn btn-primary" style="width:100%;">💾 Simpan Pengingat</button>
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
      container.querySelector('#rem-name').value = btn.dataset.name;
      container.querySelector('#rem-dose').value = btn.dataset.dose;
      container.querySelector('#rem-name').scrollIntoView({ behavior: 'smooth' });
    });
  });

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
