/**
 * History — Halaman riwayat data kesehatan dengan filter jenis data dan rentang tanggal.
 */

import { getHistory } from '../health-repository/healthRepository.js';

// HTML template halaman riwayat
const HISTORY_INNER_HTML = `
  <div class="filter-section">
    <form id="filter-form" class="filter-form">
      <div class="filter-group" style="width:100%;">
        <label for="filter-type">Jenis Data</label>
        <select id="filter-type" name="filter-type" style="width:100%;">
          <option value="all">Semua Data</option>
          <option value="heart_rate">Detak Jantung</option>
          <option value="blood_pressure">Tekanan Darah</option>
          <option value="calorie">Kalori</option>
          <option value="risk_notification">Notifikasi Risiko</option>
        </select>
      </div>
      <div class="filter-date-row" style="display:grid;grid-template-columns:1fr;gap:10px;">
        <div class="filter-group">
          <label for="filter-start">Dari</label>
          <input type="date" id="filter-start" name="filter-start" style="width:100%;" />
        </div>
        <div class="filter-group">
          <label for="filter-end">Sampai</label>
          <input type="date" id="filter-end" name="filter-end" style="width:100%;" />
        </div>
      </div>
      <button type="submit" id="filter-btn" class="btn btn-primary" style="width:100%;margin-top:10px;">Terapkan Filter</button>
    </form>
  </div>
  <div class="history-section">
    <ul id="history-list" class="history-list"></ul>
  </div>
`;

const HISTORY_HTML = `
<div class="app-shell">
  <header class="app-header">
    <div class="app-header-brand">
      <div class="app-header-logo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      </div>
      <span class="app-header-title">Riwayat Kesehatan</span>
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
      Riwayat
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

/**
 * Render halaman riwayat ke dalam container dan pasang event listener.
 * @param {HTMLElement} container
 */
export function render(container) {
  const isDesktop = window.innerWidth >= 900;
  container.innerHTML = isDesktop ? HISTORY_INNER_HTML : HISTORY_HTML;

  const form = container.querySelector('#filter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      applyFilter();
    });
  }

  // Muat data awal (semua data)
  loadHistory({});
}

/**
 * Ambil riwayat dari health-repository dan render hasilnya.
 * @param {{ dataType?: string, startDate?: string, endDate?: string }} filter
 */
export async function loadHistory(filter) {
  const listEl = document.getElementById('history-list');
  const records = await getHistory(filter);
  renderHistoryList(records, listEl);
}

/**
 * Render array record kesehatan sebagai list item di dalam container.
 * @param {Array} records - array of health records
 * @param {HTMLElement} container - elemen target (#history-list)
 */
export function renderHistoryList(records, container) {
  if (!container) return;

  container.innerHTML = '';

  if (!records || records.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'history-empty';
    empty.textContent = 'Tidak ada data';
    container.appendChild(empty);
    return;
  }

  records.forEach((record) => {
    const li = document.createElement('li');
    li.className = 'history-item';

    const dataType = record.dataType || _inferDataType(record);
    const timestamp = record.timestamp
      ? new Date(record.timestamp).toLocaleString('id-ID')
      : '-';

    const keyValues = _formatKeyValues(record, dataType);

    li.innerHTML = `
      <span class="history-type">${_labelForType(dataType)}</span>
      <span class="history-values">${keyValues}</span>
      <span class="history-timestamp">${timestamp}</span>
    `;

    container.appendChild(li);
  });
}

/**
 * Baca nilai filter dari form dan panggil loadHistory.
 */
export function applyFilter() {
  const typeEl = document.getElementById('filter-type');
  const startEl = document.getElementById('filter-start');
  const endEl = document.getElementById('filter-end');

  const filter = {
    dataType: typeEl ? typeEl.value : 'all',
    startDate: startEl && startEl.value ? startEl.value : undefined,
    endDate: endEl && endEl.value ? endEl.value : undefined,
  };

  loadHistory(filter);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function _inferDataType(record) {
  if (record.bpm !== undefined) return 'heart_rate';
  if (record.systolic !== undefined) return 'blood_pressure';
  if (record.calories !== undefined) return 'calorie';
  if (record.riskLevel !== undefined) return 'risk_notification';
  return 'unknown';
}

function _labelForType(dataType) {
  const labels = {
    heart_rate: 'Detak Jantung',
    blood_pressure: 'Tekanan Darah',
    calorie: 'Kalori',
    risk_notification: 'Notifikasi Risiko',
  };
  return labels[dataType] || dataType;
}

function _formatKeyValues(record, dataType) {
  switch (dataType) {
    case 'heart_rate':
      return `${record.bpm} BPM`;
    case 'blood_pressure':
      return `${record.systolic}/${record.diastolic} mmHg`;
    case 'calorie':
      return `${record.calories} kkal — ${record.foodName || ''}`;
    case 'risk_notification':
      return `Risiko: ${record.riskLevel || '-'}`;
    default:
      return JSON.stringify(record);
  }
}
