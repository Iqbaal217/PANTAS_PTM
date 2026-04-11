/**
 * Consultation_Module — Manajemen jadwal konsultasi dokter
 * Menyimpan data di localStorage dengan key 'pantas_consultations'
 */

const STORAGE_KEY = 'pantas_consultations';

// Internal map: consultationId → timeoutId
export const _consultationTimeouts = {};

// ─── Internal store helpers ─────────────────────────────────────────────────

/**
 * Ambil array konsultasi dari localStorage
 * @returns {Array} array of ConsultationSchedule
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
 * Simpan array konsultasi ke localStorage
 * @param {Array} data array of ConsultationSchedule
 */
export function _setStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Reminder helpers ────────────────────────────────────────────────────────

/**
 * Hitung waktu pengingat: scheduledDate + scheduledTime - 1 jam
 * @param {Object} consultation ConsultationSchedule
 * @returns {Date} waktu pengingat (1 jam sebelum konsultasi)
 */
export function _getScheduledReminderTime(consultation) {
  const [hours, minutes] = consultation.scheduledTime.split(':').map(Number);
  const base = new Date(consultation.scheduledDate);
  base.setHours(hours, minutes, 0, 0);
  return new Date(base.getTime() - 60 * 60 * 1000);
}

/**
 * Jadwalkan pengingat otomatis 1 jam sebelum konsultasi
 * @param {Object} consultation ConsultationSchedule
 */
export function _scheduleConsultationReminder(consultation) {
  const reminderTime = _getScheduledReminderTime(consultation);
  const msUntil = reminderTime.getTime() - Date.now();

  if (msUntil <= 0) return; // Waktu sudah lewat, tidak perlu dijadwalkan

  const timeoutId = setTimeout(() => {
    const message = `Pengingat: Konsultasi dengan ${consultation.doctorName} (${consultation.specialization}) dalam 1 jam.`;
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Pengingat Konsultasi PANTAS', { body: message });
    } else {
      console.log(`[PANTAS Consultation] ${message}`);
    }
  }, msUntil);

  _consultationTimeouts[consultation.id] = timeoutId;
}

/**
 * Batalkan pengingat konsultasi berdasarkan id
 * @param {string} id consultation id
 */
export function _cancelConsultationReminder(id) {
  if (_consultationTimeouts[id] !== undefined) {
    clearTimeout(_consultationTimeouts[id]);
    delete _consultationTimeouts[id];
  }
}

// ─── CRUD Functions ──────────────────────────────────────────────────────────

/**
 * Buat jadwal konsultasi baru dengan status 'upcoming'
 * @param {Object} consultation ConsultationSchedule
 */
export async function createConsultation(consultation) {
  const store = _getStore();
  const newConsultation = {
    ...consultation,
    status: 'upcoming',
    reminderSet: true,
  };
  store.push(newConsultation);
  _setStore(store);
  _scheduleConsultationReminder(newConsultation);
}

/**
 * Update field-field dari konsultasi yang ada
 * @param {string} id consultation id
 * @param {Object} updates partial ConsultationSchedule
 */
export async function updateConsultation(id, updates) {
  const store = _getStore();
  const idx = store.findIndex((c) => c.id === id);
  if (idx !== -1) {
    store[idx] = { ...store[idx], ...updates };
    _setStore(store);
  }
}

/**
 * Batalkan jadwal konsultasi: set status 'cancelled' dan hapus pengingat
 * @param {string} id consultation id
 */
export async function cancelConsultation(id) {
  const store = _getStore();
  const idx = store.findIndex((c) => c.id === id);
  if (idx !== -1) {
    store[idx] = { ...store[idx], status: 'cancelled', reminderSet: false };
    _setStore(store);
  }
  _cancelConsultationReminder(id);
}

/**
 * Ambil semua jadwal konsultasi mendatang (status === 'upcoming')
 * @returns {Array} array of upcoming ConsultationSchedule
 */
export function getUpcomingConsultations() {
  return _getStore().filter((c) => c.status === 'upcoming');
}

/**
 * Ambil riwayat konsultasi (status === 'completed' atau 'cancelled')
 * @returns {Array} array of completed/cancelled ConsultationSchedule
 */
export function getConsultationHistory() {
  return _getStore().filter((c) => c.status === 'completed' || c.status === 'cancelled');
}

/**
 * Ekspor jadwal konsultasi ke format iCal dan trigger download
 * @param {Object} consultation ConsultationSchedule
 * @returns {string} iCal format string
 */
export function exportToCalendar(consultation) {
  const [hours, minutes] = consultation.scheduledTime.split(':').map(Number);
  const start = new Date(consultation.scheduledDate);
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 jam

  const formatDt = (date) =>
    date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PANTAS PTM Monitoring//ID',
    'BEGIN:VEVENT',
    `DTSTART:${formatDt(start)}`,
    `DTEND:${formatDt(end)}`,
    `SUMMARY:Konsultasi dengan ${consultation.doctorName}`,
    `DESCRIPTION:Spesialisasi: ${consultation.specialization}\\nMetode: ${consultation.method}${consultation.notes ? '\\nCatatan: ' + consultation.notes : ''}`,
    `STATUS:CONFIRMED`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  // Trigger download jika di browser
  if (typeof document !== 'undefined') {
    const blob = new Blob([ical], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `konsultasi-${consultation.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return ical;
}

// ─── SPA render function ─────────────────────────────────────────────────────

/**
 * Render halaman jadwal konsultasi ke dalam container.
 * @param {HTMLElement} container
 */
export function render(container) {
  const isDesktop = window.innerWidth >= 900;
  if (isDesktop) {
    container.innerHTML = `
      <div class="placeholder-page">
        <div class="placeholder-icon">🩺</div>
        <div class="placeholder-title">Jadwal Konsultasi Dokter</div>
        <div class="placeholder-desc">Buat dan kelola jadwal konsultasi dengan dokter spesialis. Dapatkan pengingat otomatis 1 jam sebelum jadwal konsultasi Anda.</div>
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
      <div class="placeholder-icon">🩺</div>
      <div class="placeholder-title">Jadwal Konsultasi Dokter</div>
      <div class="placeholder-desc">Buat dan kelola jadwal konsultasi dengan dokter spesialis. Dapatkan pengingat otomatis 1 jam sebelum jadwal konsultasi Anda.</div>
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
    <a href="#/reminders" class="bottom-nav-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
      Pengingat
    </a>
    <a href="#/consultation" class="bottom-nav-item active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      Konsultasi
    </a>
  </nav>
</div>`;
}
