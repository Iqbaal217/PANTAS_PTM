import { describe, it, expect, beforeEach, vi } from 'vitest';

// Force mobile mode in tests (jsdom window.innerWidth defaults to 0)
Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });

// Mock semua dependensi modul sebelum import dashboard
vi.mock('../../src/modules/health-monitor/healthMonitor.js', () => ({
  startMonitoring: vi.fn(),
  stopMonitoring: vi.fn(),
}));

vi.mock('../../src/modules/risk-engine/riskEngine.js', () => ({
  analyzeRisk: vi.fn(() => ({
    riskLevel: 'low',
    riskColor: 'green',
    description: 'Kondisi normal.',
    recommendations: ['Pertahankan gaya hidup sehat'],
  })),
}));

vi.mock('../../src/modules/chart-renderer/chartRenderer.js', () => ({
  renderHeartRateChart: vi.fn(),
  renderBloodPressureChart: vi.fn(),
}));

vi.mock('../../src/modules/kalori-detector/kaloriDetector.js', () => ({
  openCamera: vi.fn(),
}));

vi.mock('../../src/utils/eventBus.js', () => ({
  default: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}));

import { render, updateHealthDisplay, showRiskDetail, initCharts } from '../../src/modules/dashboard/dashboard.js';

describe('Dashboard', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    render(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  // 1. render menyuntikkan HTML dashboard ke dalam container
  it('render menyuntikkan HTML dashboard ke dalam container', () => {
    expect(container.innerHTML).not.toBe('');
    expect(container.querySelector('.app-shell')).not.toBeNull();
  });

  // 2. Dashboard memiliki tombol kamera (#camera-btn)
  it('dashboard memiliki tombol kamera (#camera-btn)', () => {
    const cameraBtn = container.querySelector('#camera-btn');
    expect(cameraBtn).not.toBeNull();
  });

  // 3. Dashboard memiliki elemen status koneksi (#connection-status)
  it('dashboard memiliki elemen status koneksi (#connection-status)', () => {
    const statusEl = container.querySelector('#connection-status');
    expect(statusEl).not.toBeNull();
  });

  // 4. Dashboard memiliki tampilan BPM (#bpm-value)
  it('dashboard memiliki tampilan BPM (#bpm-value)', () => {
    const bpmEl = container.querySelector('#bpm-value');
    expect(bpmEl).not.toBeNull();
  });

  // 5. Dashboard memiliki tampilan tekanan darah (#bp-value)
  it('dashboard memiliki tampilan tekanan darah (#bp-value)', () => {
    const bpEl = container.querySelector('#bp-value');
    expect(bpEl).not.toBeNull();
  });

  // 6. Dashboard memiliki tampilan level risiko (#risk-level)
  it('dashboard memiliki tampilan level risiko (#risk-level)', () => {
    const riskEl = container.querySelector('#risk-level');
    expect(riskEl).not.toBeNull();
  });

  // 7. updateHealthDisplay memperbarui nilai BPM di DOM
  it('updateHealthDisplay memperbarui nilai BPM di DOM', () => {
    updateHealthDisplay({
      heartRate: { bpm: 78 },
      bloodPressure: { systolic: 120, diastolic: 80 },
      connectionStatus: 'connected',
    });

    const bpmEl = document.getElementById('bpm-value');
    expect(bpmEl.textContent).toBe('78');
  });

  // 8. showRiskDetail menampilkan panel detail risiko dengan deskripsi
  it('showRiskDetail menampilkan panel detail risiko dengan deskripsi', () => {
    const assessment = {
      description: 'Terdeteksi risiko tinggi.',
      recommendations: ['Segera konsultasikan dengan dokter', 'Hindari aktivitas berat'],
    };

    showRiskDetail(assessment);

    const panel = document.getElementById('risk-detail-panel');
    const descEl = document.getElementById('risk-description');

    expect(panel.style.display).toBe('block');
    expect(descEl.textContent).toBe('Terdeteksi risiko tinggi.');
  });
});
