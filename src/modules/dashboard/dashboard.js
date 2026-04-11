/**
 * Home_Dashboard — mengintegrasikan semua modul untuk halaman utama PANTAS.
 */

import { connectSmartwatch, disconnectSmartwatch, startMonitoring } from '../health-monitor/healthMonitor.js';
import { analyzeRisk } from '../risk-engine/riskEngine.js';
import { analyzeLongitudinal, recordReading, getLifestyleGuide } from '../risk-engine/longitudinalAnalysis.js';
import { getProfile, calculateGeneticRiskScore, getSatuSehatRecord } from '../user-profile/userProfile.js';
import { renderHeartRateChart, renderBloodPressureChart } from '../chart-renderer/chartRenderer.js';
import { openCamera } from '../kalori-detector/kaloriDetector.js';
import eventBus from '../../utils/eventBus.js';

// HTML template dashboard
// HTML template dashboard — hanya konten dalam (tanpa app-shell wrapper)
// Dirender ke #app (mobile) atau #desktop-content (desktop)
const DASHBOARD_INNER_HTML = `
  <!-- Greeting -->
  <div style="margin-bottom:14px;">
    <div id="greeting-name" style="font-size:1.1rem;font-weight:700;color:var(--text);">Selamat datang 👋</div>
    <div style="font-size:0.8rem;color:var(--text-3);margin-top:2px;">Pantau kesehatan Anda hari ini</div>
  </div>

  <!-- Metric Cards -->
  <div class="health-cards" style="margin-bottom:14px;">
    <div class="card" style="border-top:3px solid #ef4444;">
      <div class="card-label">❤️ Detak Jantung</div>
      <div>
        <span id="bpm-value" class="metric-value">--</span>
        <span class="metric-unit">BPM</span>
      </div>
      <div class="card-footer">Real-time</div>
    </div>

    <div class="card" style="border-top:3px solid var(--blue);">
      <div class="card-label">🩺 Tekanan Darah</div>
      <div>
        <span id="bp-value" class="metric-value" style="font-size:1.4rem;">--/--</span>
        <span class="metric-unit">mmHg</span>
      </div>
      <div class="card-footer">Sistolik/Diastolik</div>
    </div>

    <div class="card" style="border-top:3px solid #16a34a;">
      <div class="card-label">⚠️ Risiko PTM</div>
      <div style="margin-top:6px;">
        <span id="risk-level" class="risk-badge risk-low" style="cursor:pointer;">Rendah</span>
      </div>
      <div class="card-footer">Klik detail</div>
    </div>

    <div class="card" style="border-top:3px solid #d97706;">
      <div class="card-label">📷 Kalori</div>
      <div style="margin-top:6px;">
        <button id="camera-btn" class="btn btn-sm" style="background:var(--blue-soft);color:var(--blue);border-radius:9px;padding:6px 10px;font-size:0.72rem;width:100%;">Scan Makanan</button>
      </div>
      <div class="card-footer">Deteksi AI</div>
    </div>
  </div>

  <!-- Risk Detail Panel -->
  <div id="risk-detail-panel" class="risk-detail-panel" style="display:none;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <div class="panel-title">Detail Analisis Risiko</div>
      <button id="close-risk-detail" style="background:none;border:none;cursor:pointer;font-size:1rem;color:var(--text-3);">✕</button>
    </div>
    <p id="risk-description" class="risk-description"></p>
    <ul id="risk-recommendations" class="risk-recommendations"></ul>
  </div>

  <!-- AI Analysis -->
  <div class="section-title">Analisis AI — 7 Hari</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
    <div class="card" style="border-top:3px solid var(--blue);">
      <div class="card-label">Skor Genetik</div>
      <div style="display:flex;align-items:flex-end;gap:4px;margin-bottom:6px;">
        <span id="genetic-score" class="metric-value" style="font-size:1.6rem;">--</span>
        <span class="metric-unit">/100</span>
      </div>
      <div style="height:4px;border-radius:2px;background:var(--border);margin-bottom:6px;">
        <div id="genetic-bar-fill" style="height:100%;border-radius:2px;background:var(--blue);width:0%;transition:width 0.8s ease;"></div>
      </div>
      <div id="genetic-desc" class="card-footer">Riwayat keluarga</div>
    </div>

    <div class="card">
      <div class="card-label">Rata-rata</div>
      <div style="display:flex;flex-direction:column;gap:5px;margin-top:4px;">
        <div style="display:flex;justify-content:space-between;font-size:0.75rem;">
          <span style="color:var(--text-3);">Sistolik</span>
          <span id="avg-systolic" style="color:var(--text);font-weight:600;">--</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.75rem;">
          <span style="color:var(--text-3);">Diastolik</span>
          <span id="avg-diastolic" style="color:var(--text);font-weight:600;">--</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.75rem;">
          <span style="color:var(--text-3);">BPM</span>
          <span id="avg-bpm" style="color:var(--text);font-weight:600;">--</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.75rem;">
          <span style="color:var(--text-3);">Tren</span>
          <span id="systolic-trend" style="font-weight:600;">--</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Detected Patterns -->
  <div id="patterns-section" style="display:none;margin-bottom:14px;">
    <div class="section-title">Pola Risiko Terdeteksi</div>
    <div id="patterns-list" style="display:flex;flex-direction:column;gap:8px;"></div>
  </div>

  <!-- SATU SEHAT -->
  <div id="satusehat-panel" style="display:none;margin-bottom:14px;">
    <div class="card" style="border-left:4px solid var(--green);">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="font-size:0.82rem;font-weight:700;color:var(--text);">🏥 SATU SEHAT</span>
        <span class="badge badge-green">Tersinkronisasi</span>
      </div>
      <div id="satusehat-info" style="font-size:0.78rem;color:var(--text-3);line-height:1.6;"></div>
    </div>
  </div>

  <!-- Charts -->
  <div class="section-title">Grafik Tren</div>
  <div class="charts-section">
    <div class="chart-container">
      <div class="chart-header">
        <span class="chart-title">❤️ Detak Jantung — 24 Jam</span>
      </div>
      <div id="hr-chart-container" class="chart"></div>
    </div>
    <div class="chart-container">
      <div class="chart-header">
        <span class="chart-title">🩺 Tekanan Darah — 7 Hari</span>
      </div>
      <div id="bp-chart-container" class="chart"></div>
    </div>
  </div>

  <!-- Lifestyle Guide -->
  <div id="lifestyle-section" style="margin-bottom:14px;">
    <div class="section-title">Panduan Gaya Hidup Sehat</div>
    <div id="lifestyle-tabs" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;overflow-x:auto;padding-bottom:4px;"></div>
    <div id="lifestyle-content"></div>
  </div>
`;

// Mobile wrapper (app-shell + bottom nav)
const DASHBOARD_HTML = `
<div class="app-shell">
  <header class="app-header">
    <div class="app-header-brand">
      <div class="app-header-logo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </div>
      <span class="app-header-title">PANTAS</span>
    </div>
    <div class="app-header-right">
      <span id="connection-status" class="connection-status disconnected">
        <span class="dot"></span>Terputus
      </span>
      <button id="connect-btn" class="btn btn-sm" style="background:var(--blue);color:white;border-radius:10px;padding:7px 12px;font-size:0.75rem;">
        Hubungkan
      </button>
    </div>
  </header>
  <div class="app-content">${DASHBOARD_INNER_HTML}</div>
  <nav class="bottom-nav">
    <a href="#/dashboard" class="bottom-nav-item active">
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
    <a href="#/consultation" class="bottom-nav-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      Konsultasi
    </a>
    <button id="logout-btn" class="bottom-nav-item" style="background:none;border:none;cursor:pointer;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      Keluar
    </button>
  </nav>
</div>
`;

/**
 * Render dashboard HTML ke dalam container dan inisialisasi semua modul.
 * @param {HTMLElement} container
 */
export function render(container) {
  // Desktop: inject hanya inner content (tanpa app-shell wrapper)
  // Mobile: inject full DASHBOARD_HTML dengan app-shell + bottom nav
  const isDesktop = window.innerWidth >= 900;
  container.innerHTML = isDesktop ? DASHBOARD_INNER_HTML : DASHBOARD_HTML;

  // Subscribe ke event health:connection untuk update status badge
  eventBus.on('health:connection', ({ status, mode, deviceName }) => {
    const statusEl = document.getElementById('connection-status');
    const connectBtn = document.getElementById('connect-btn');
    if (statusEl) {
      if (status === 'connected') {
        const label = mode === 'bluetooth' ? (deviceName || 'Smartwatch') : 'Simulasi';
        statusEl.innerHTML = `<span class="dot"></span>${label}`;
        statusEl.className = 'connection-status connected';
      } else {
        statusEl.innerHTML = `<span class="dot"></span>Terputus`;
        statusEl.className = 'connection-status disconnected';
      }
    }
    if (connectBtn && status === 'disconnected') {
      connectBtn.textContent = 'Hubungkan Smartwatch';
      connectBtn.classList.add('btn-primary');
      connectBtn.classList.remove('btn-ghost');
      connectBtn.disabled = false;
    }
  });

  // Subscribe ke event health:update
  eventBus.on('health:update', (data) => {
    const { connectionStatus, lastReading } = data;

    updateHealthDisplay({
      connectionStatus,
      heartRate: lastReading?.heartRate,
      bloodPressure: lastReading?.bloodPressure,
    });

    // Analisis risiko jika ada data
    if (lastReading?.heartRate || lastReading?.bloodPressure) {
      const assessment = analyzeRisk({
        heartRate: lastReading.heartRate,
        bloodPressure: lastReading.bloodPressure,
      });
      updateRiskDisplay(assessment);

      // Rekam ke trend buffer dan jalankan analisis longitudinal
      recordReading(lastReading.heartRate, lastReading.bloodPressure);
      const longitudinal = analyzeLongitudinal({
        heartRate: lastReading.heartRate,
        bloodPressure: lastReading.bloodPressure,
      });
      updateLongitudinalPanel(longitudinal);
    }
  });

  // Tombol connect smartwatch
  const connectBtn = container.querySelector('#connect-btn');
  if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
      connectBtn.disabled = true;
      connectBtn.textContent = 'Menghubungkan...';

      const result = await connectSmartwatch();

      if (result.success) {
        const label = result.mode === 'bluetooth'
          ? `${result.deviceName || 'Smartwatch'}`
          : 'Simulasi Aktif';
        connectBtn.textContent = label;
        connectBtn.classList.remove('btn-primary');
        connectBtn.classList.add('btn-ghost');
        connectBtn.disabled = false;

        // Klik lagi = disconnect
        connectBtn.addEventListener('click', () => {
          disconnectSmartwatch();
        }, { once: true });
      } else {
        connectBtn.textContent = 'Hubungkan Smartwatch';
        connectBtn.disabled = false;
      }
    });
  }

  // Tombol logout
  const logoutBtn = container.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      import('../auth/auth.js').then(({ logout }) => logout());
    });
  }

  // Tombol kamera
  const cameraBtn = container.querySelector('#camera-btn');
  if (cameraBtn) {
    cameraBtn.addEventListener('click', async () => {
      try {
        await openCamera();
      } catch (err) {
        console.error('[Dashboard] Kamera gagal dibuka:', err);
      }
    });
  }

  // Inisialisasi panel longitudinal dengan data yang sudah ada
  const initialLongitudinal = analyzeLongitudinal();
  updateLongitudinalPanel(initialLongitudinal);

  // Render lifestyle guide
  const profile = getProfile();
  renderLifestyleGuide(profile);

  // Update greeting dengan nama pengguna
  const greetingEl = container.querySelector('#greeting-name');
  if (greetingEl && profile.name) {
    const hour = new Date().getHours();
    const salam = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';
    greetingEl.textContent = `${salam}, ${profile.name} 👋`;
  }

  // Toggle panel detail risiko
  const riskBadge = container.querySelector('#risk-level');
  if (riskBadge) {
    riskBadge.addEventListener('click', () => {
      const panel = container.querySelector('#risk-detail-panel');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      }
    });
  }

  // Tombol tutup panel risiko
  const closeBtn = container.querySelector('#close-risk-detail');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const panel = container.querySelector('#risk-detail-panel');
      if (panel) panel.style.display = 'none';
    });
  }
}

/**
 * Update tampilan data kesehatan di DOM.
 * @param {{ heartRate?: object, bloodPressure?: object, connectionStatus?: string }} data
 */
export function updateHealthDisplay(data) {
  const { heartRate, bloodPressure, connectionStatus } = data || {};

  // Update BPM
  const bpmEl = document.getElementById('bpm-value');
  if (bpmEl && heartRate?.bpm !== undefined) {
    bpmEl.textContent = heartRate.bpm;
  }

  // Update tekanan darah
  const bpEl = document.getElementById('bp-value');
  if (bpEl && bloodPressure?.systolic !== undefined && bloodPressure?.diastolic !== undefined) {
    bpEl.textContent = `${bloodPressure.systolic}/${bloodPressure.diastolic}`;
  }

  // Update status koneksi
  const statusEl = document.getElementById('connection-status');
  if (statusEl && connectionStatus !== undefined) {
    const label = connectionStatus === 'connected' ? 'Terhubung' : 'Terputus';
    statusEl.innerHTML = `<span class="dot"></span>${label}`;
    statusEl.className = `connection-status ${connectionStatus}`;
  }
}

/**
 * Update tampilan badge risiko di DOM.
 * @param {object} assessment - RiskAssessment
 */
function updateRiskDisplay(assessment) {
  const riskEl = document.getElementById('risk-level');
  if (!riskEl || !assessment) return;

  const labelMap = { low: 'Rendah', medium: 'Sedang', high: 'Tinggi' };
  riskEl.textContent = labelMap[assessment.riskLevel] || assessment.riskLevel;
  riskEl.className = `risk-badge risk-${assessment.riskLevel}`;
}

/**
 * Tampilkan panel detail risiko dengan deskripsi dan rekomendasi.
 * @param {object} assessment - RiskAssessment
 */
export function showRiskDetail(assessment) {
  const panel = document.getElementById('risk-detail-panel');
  const descEl = document.getElementById('risk-description');
  const recEl = document.getElementById('risk-recommendations');

  if (!panel || !assessment) return;

  if (descEl) {
    descEl.textContent = assessment.description || '';
  }

  if (recEl) {
    recEl.innerHTML = '';
    const recommendations = assessment.recommendations || [];
    recommendations.forEach((rec) => {
      const li = document.createElement('li');
      li.textContent = rec;
      recEl.appendChild(li);
    });
  }

  panel.style.display = 'block';
}

/**
 * Inisialisasi grafik tren menggunakan Chart_Renderer.
 * @param {Array} heartRateData - HeartRateReading[]
 * @param {Array} bloodPressureData - BloodPressureReading[]
 */
export function initCharts(heartRateData, bloodPressureData) {
  renderHeartRateChart('hr-chart-container', heartRateData || [], '24h');
  renderBloodPressureChart('bp-chart-container', bloodPressureData || [], '7d');
}

/**
 * Render panduan gaya hidup sehat berdasarkan profil pengguna.
 * Menampilkan tab per PTM dengan tips spesifik per kategori.
 * @param {object} profile
 */
export function renderLifestyleGuide(profile) {
  const tabsEl   = document.getElementById('lifestyle-tabs');
  const contentEl = document.getElementById('lifestyle-content');
  if (!tabsEl || !contentEl) return;

  const guides = getLifestyleGuide(profile);
  if (!guides.length) return;

  let activeIdx = 0;

  const priorityColor = {
    high:   'var(--red)',
    medium: 'var(--yellow)',
    low:    'var(--green)',
  };

  const renderTab = (idx) => {
    activeIdx = idx;
    const guide = guides[idx];

    // Update tab styles
    tabsEl.querySelectorAll('.lifestyle-tab').forEach((t, i) => {
      t.style.background    = i === idx ? 'var(--accent-soft)' : 'var(--surface-2)';
      t.style.borderColor   = i === idx ? 'rgba(37,99,235,0.3)' : 'var(--border)';
      t.style.color         = i === idx ? 'var(--accent)' : 'var(--text-2)';
    });

    // Render content
    contentEl.innerHTML = `
      <div class="card" style="border-left:3px solid ${priorityColor[guide.priority]};">
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:14px;">
          <span style="font-size:1.4rem;">${guide.icon}</span>
          <div>
            <div style="font-size:0.875rem;font-weight:600;color:var(--text);margin-bottom:3px;">${guide.ptm}</div>
            <div style="font-size:0.78rem;color:var(--text-3);line-height:1.5;">${guide.summary}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">
          ${guide.categories.map(cat => `
            <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
              <div style="font-size:0.75rem;font-weight:600;color:var(--text-2);margin-bottom:8px;display:flex;align-items:center;gap:5px;">
                <span>${cat.icon}</span> ${cat.title}
              </div>
              <ul style="display:flex;flex-direction:column;gap:5px;">
                ${cat.tips.map(tip => `
                  <li style="font-size:0.775rem;color:var(--text-3);line-height:1.5;padding-left:10px;position:relative;">
                    <span style="position:absolute;left:0;color:var(--accent);">·</span>
                    ${tip}
                  </li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  // Render tabs
  tabsEl.innerHTML = guides.map((g, i) => `
    <button class="lifestyle-tab btn btn-sm" data-idx="${i}" style="
      gap:5px;
      background:${i === 0 ? 'var(--accent-soft)' : 'var(--surface-2)'};
      border:1px solid ${i === 0 ? 'rgba(37,99,235,0.3)' : 'var(--border)'};
      color:${i === 0 ? 'var(--accent)' : 'var(--text-2)'};
    ">
      <span>${g.icon}</span> ${g.ptm}
    </button>
  `).join('');

  tabsEl.querySelectorAll('.lifestyle-tab').forEach(btn => {
    btn.addEventListener('click', () => renderTab(parseInt(btn.dataset.idx)));
  });

  renderTab(0);
}

/**
 * Update panel analisis longitudinal AI.
 * @param {object} longitudinal - hasil analyzeLongitudinal()
 */
export function updateLongitudinalPanel(longitudinal) {
  if (!longitudinal) return;

  // Genetic score
  const scoreEl = document.getElementById('genetic-score');
  const barFill  = document.getElementById('genetic-bar-fill');
  const descEl   = document.getElementById('genetic-desc');
  if (scoreEl) scoreEl.textContent = longitudinal.geneticScore;
  if (barFill) {
    barFill.style.width = `${longitudinal.geneticScore}%`;
    barFill.style.background = longitudinal.geneticScore >= 70
      ? 'var(--red)' : longitudinal.geneticScore >= 40
      ? 'var(--yellow)' : 'var(--green)';
  }
  if (descEl) {
    const label = longitudinal.geneticScore >= 70 ? 'Risiko Tinggi'
      : longitudinal.geneticScore >= 40 ? 'Risiko Sedang' : 'Risiko Rendah';
    descEl.textContent = `${label} — ${longitudinal.trends.daysAnalyzed} hari dianalisis`;
  }

  // Trend averages
  const t = longitudinal.trends;
  const set = (id, val, unit = '') => {
    const el = document.getElementById(id);
    if (el) el.textContent = val != null ? `${val}${unit}` : '--';
  };
  set('avg-systolic',  t.avgSystolic,  ' mmHg');
  set('avg-diastolic', t.avgDiastolic, ' mmHg');
  set('avg-bpm',       t.avgBpm,       ' BPM');

  const trendEl = document.getElementById('systolic-trend');
  if (trendEl) {
    trendEl.textContent = t.systolicTrend === 'rising' ? '↑ Meningkat' : '→ Stabil';
    trendEl.style.color = t.systolicTrend === 'rising' ? 'var(--red)' : 'var(--green)';
  }

  // Detected patterns
  const patternsSection = document.getElementById('patterns-section');
  const patternsList    = document.getElementById('patterns-list');
  if (longitudinal.patterns.length > 0 && patternsSection && patternsList) {
    patternsSection.style.display = 'block';
    patternsList.innerHTML = longitudinal.patterns.map(p => `
      <div style="padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-left:3px solid ${p.severity === 'high' ? 'var(--red)' : 'var(--yellow)'};border-radius:var(--radius);display:flex;align-items:flex-start;gap:10px;">
        <span style="font-size:0.7rem;font-weight:600;padding:2px 7px;border-radius:var(--radius-full);background:${p.severity === 'high' ? 'var(--red-soft)' : 'var(--yellow-soft)'};color:${p.severity === 'high' ? 'var(--red)' : 'var(--yellow)'};flex-shrink:0;">${p.ptmType}</span>
        <span style="font-size:0.8rem;color:var(--text-2);line-height:1.5;">${p.message}</span>
      </div>
    `).join('');
  }

  // SATU SEHAT panel
  const satuSehat = getSatuSehatRecord();
  const ssPanel   = document.getElementById('satusehat-panel');
  const ssInfo    = document.getElementById('satusehat-info');
  if (satuSehat && ssPanel && ssInfo) {
    ssPanel.style.display = 'block';
    const meds = satuSehat.medications?.map(m => `${m.name} (${m.frequency})`).join(', ') || '-';
    const diag = satuSehat.diagnoses?.map(d => d.name).join(', ') || '-';
    ssInfo.innerHTML = `
      <div>Diagnosa: <strong style="color:var(--text-2);">${diag}</strong></div>
      <div>Obat rutin: <strong style="color:var(--text-2);">${meds}</strong></div>
      <div>Terakhir sinkron: ${new Date(satuSehat.syncedAt).toLocaleDateString('id-ID')}</div>
    `;
  }
}
