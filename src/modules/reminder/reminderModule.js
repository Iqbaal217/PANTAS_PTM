/**
 * Reminder_Module — Pengingat minum obat dengan notifikasi push
 * Menyimpan data di localStorage dengan key 'pantas_reminders'
 */

const STORAGE_KEY = 'pantas_reminders';

// Internal map: reminderId → array of timeoutIds
const _scheduledTimeouts = {};

// ─── Internal store helpers ─────────────────────────────────────────────────

/**
 * Ambil array pengingat dari localStorage
 * @returns {Array} array of MedicationReminder
 */
export function _getStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Simpan array pengingat ke localStorage
 * @param {Array} data array of MedicationReminder
 */
export function _setStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Notification helper ────────────────────────────────────────────────────

/**
 * Kirim notifikasi (Notification API atau console.log sebagai fallback)
 * @param {string} title
 * @param {string} body
 */
function sendNotification(title, body) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body });
  } else {
    console.log(`[PANTAS Reminder] ${title}: ${body}`);
  }
}

// ─── scheduleNotification ───────────────────────────────────────────────────

/**
 * Jadwalkan notifikasi untuk setiap scheduledTime dalam reminder.
 * Setelah notifikasi dikirim, set re-notification 30 menit kemudian
 * jika lastStatus masih 'pending'.
 * @param {Object} reminder MedicationReminder
 */
export function scheduleNotification(reminder) {
  if (!reminder || !Array.isArray(reminder.scheduledTimes)) return;

  if (!_scheduledTimeouts[reminder.id]) {
    _scheduledTimeouts[reminder.id] = [];
  }

  for (const timeStr of reminder.scheduledTimes) {
    const msUntil = _msUntilNextOccurrence(timeStr);

    const mainTimeoutId = setTimeout(() => {
      // Ambil status terkini dari store
      const store = _getStore();
      const current = store.find((r) => r.id === reminder.id);
      if (!current || !current.isActive) return;

      sendNotification(
        `Waktunya minum obat: ${reminder.medicationName}`,
        `Dosis: ${reminder.dosage}`
      );

      // Re-notification setelah 30 menit jika masih 'pending'
      const reNotifyId = setTimeout(() => {
        const storeNow = _getStore();
        const latest = storeNow.find((r) => r.id === reminder.id);
        if (latest && latest.isActive && (!latest.lastStatus || latest.lastStatus === 'pending')) {
          sendNotification(
            `Pengingat ulang: ${reminder.medicationName}`,
            `Anda belum menandai obat ini. Dosis: ${reminder.dosage}`
          );
        }
      }, 30 * 60 * 1000);

      _scheduledTimeouts[reminder.id].push(reNotifyId);
    }, msUntil);

    _scheduledTimeouts[reminder.id].push(mainTimeoutId);
  }
}

/**
 * Hitung milidetik hingga kemunculan berikutnya dari waktu "HH:MM"
 * @param {string} timeStr format "HH:MM"
 * @returns {number} ms until next occurrence
 */
export function _msUntilNextOccurrence(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);

  if (target <= now) {
    // Sudah lewat hari ini, jadwalkan untuk besok
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

// ─── cancelNotification ─────────────────────────────────────────────────────

/**
 * Batalkan semua timeout yang dijadwalkan untuk reminderId
 * @param {string} reminderId
 */
export function cancelNotification(reminderId) {
  const timeouts = _scheduledTimeouts[reminderId];
  if (timeouts) {
    for (const id of timeouts) {
      clearTimeout(id);
    }
    delete _scheduledTimeouts[reminderId];
  }
}

// ─── CRUD Functions ─────────────────────────────────────────────────────────

/**
 * Tambah pengingat baru ke store dan jadwalkan notifikasi
 * @param {Object} reminder MedicationReminder
 */
export async function addReminder(reminder) {
  const store = _getStore();
  const newReminder = {
    ...reminder,
    isActive: reminder.isActive !== undefined ? reminder.isActive : true,
    lastStatus: reminder.lastStatus || 'pending',
  };
  store.push(newReminder);
  _setStore(store);
  scheduleNotification(newReminder);
}

/**
 * Nonaktifkan pengingat (set isActive: false) dan batalkan notifikasi.
 * Data tetap tersimpan untuk riwayat.
 * @param {string} reminderId
 */
export async function removeReminder(reminderId) {
  const store = _getStore();
  const idx = store.findIndex((r) => r.id === reminderId);
  if (idx !== -1) {
    store[idx] = { ...store[idx], isActive: false };
    _setStore(store);
  }
  cancelNotification(reminderId);
}

/**
 * Tandai pengingat dengan status 'taken' atau 'skipped'
 * @param {string} reminderId
 * @param {'taken'|'skipped'} status
 */
export async function markReminder(reminderId, status) {
  const store = _getStore();
  const idx = store.findIndex((r) => r.id === reminderId);
  if (idx !== -1) {
    store[idx] = { ...store[idx], lastStatus: status };
    _setStore(store);
  }
}

/**
 * Ambil semua pengingat yang aktif (isActive === true)
 * @returns {Array} array of active MedicationReminder
 */
export function getActiveReminders() {
  return _getStore().filter((r) => r.isActive === true);
}

// ─── SPA render function ─────────────────────────────────────────────────────

/**
 * Render halaman pengingat obat ke dalam container.
 * @param {HTMLElement} container
 */
export function render(container) {
  const isDesktop = window.innerWidth >= 900;
  if (isDesktop) {
    container.innerHTML = `
      <div class="placeholder-page">
        <div class="placeholder-icon">💊</div>
        <div class="placeholder-title">Pengingat Obat</div>
        <div class="placeholder-desc">Fitur pengingat jadwal minum obat akan tersedia di sini. Tambahkan, kelola, dan terima notifikasi pengingat obat Anda.</div>
      </div>`;
    return;
  }
  container.innerHTML = `
<div class="app-shell">
  <header class="app-header">
    <div class="app-header-brand">
      <div class="app-header-logo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      </div>
      <span class="app-header-title">PANTAS</span>
    </div>
  </header>
  <div class="app-content">
    <div class="placeholder-page">
      <div class="placeholder-icon">💊</div>
      <div class="placeholder-title">Pengingat Obat</div>
      <div class="placeholder-desc">Fitur pengingat jadwal minum obat akan tersedia di sini. Tambahkan, kelola, dan terima notifikasi pengingat obat Anda.</div>
    </div>
  </div>
  <nav class="bottom-nav">
    <a href="#/dashboard" class="bottom-nav-item">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22" fill="none" stroke="currentColor" stroke-width="2"/></svg>
      Beranda
    </a>
    <a href="#/history" class="bottom-nav-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      Riwayat
    </a>
    <a href="#/reminders" class="bottom-nav-item active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
      Pengingat
    </a>
    <a href="#/consultation" class="bottom-nav-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      Konsultasi
    </a>
  </nav>
</div>`;
}
