import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Force mobile mode in tests
Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });

// Mock getHistory dari health-repository sebelum import modul history
vi.mock('../../src/modules/health-repository/healthRepository.js', () => ({
  getHistory: vi.fn(async () => []),
}));

import { render, renderHistoryList } from '../../src/modules/history/history.js';
import { getHistory } from '../../src/modules/health-repository/healthRepository.js';

describe('History Page', () => {
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

  // 1. render menyuntikkan HTML halaman riwayat ke dalam container
  it('render menyuntikkan HTML halaman riwayat ke dalam container', () => {
    expect(container.innerHTML).not.toBe('');
    expect(container.querySelector('.app-shell')).not.toBeNull();
  });

  // 2. Halaman riwayat memiliki filter form dengan select #filter-type
  it('halaman riwayat memiliki filter form dengan #filter-type select', () => {
    const select = container.querySelector('#filter-type');
    expect(select).not.toBeNull();
    expect(select.tagName.toLowerCase()).toBe('select');
  });

  // 3. Halaman riwayat memiliki input tanggal #filter-start dan #filter-end
  it('halaman riwayat memiliki #filter-start dan #filter-end date inputs', () => {
    const startInput = container.querySelector('#filter-start');
    const endInput = container.querySelector('#filter-end');
    expect(startInput).not.toBeNull();
    expect(startInput.type).toBe('date');
    expect(endInput).not.toBeNull();
    expect(endInput.type).toBe('date');
  });

  // 4. Halaman riwayat memiliki container #history-list
  it('halaman riwayat memiliki #history-list container', () => {
    const list = container.querySelector('#history-list');
    expect(list).not.toBeNull();
  });

  // 5. renderHistoryList dengan array kosong menampilkan pesan "Tidak ada data"
  it('renderHistoryList dengan array kosong menampilkan "Tidak ada data"', () => {
    const listEl = document.createElement('ul');
    renderHistoryList([], listEl);
    expect(listEl.textContent).toContain('Tidak ada data');
  });

  // 6. renderHistoryList dengan records merender list item
  it('renderHistoryList dengan records merender list items', () => {
    const listEl = document.createElement('ul');
    const records = [
      { bpm: 75, timestamp: new Date().toISOString() },
      { systolic: 120, diastolic: 80, timestamp: new Date().toISOString() },
    ];
    renderHistoryList(records, listEl);
    const items = listEl.querySelectorAll('.history-item');
    expect(items.length).toBe(2);
  });
});
