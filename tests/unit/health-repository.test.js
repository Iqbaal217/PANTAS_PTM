import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveHeartRate,
  saveBloodPressure,
  saveCalorieIntake,
  saveRiskNotification,
  getHistory,
  syncOfflineData,
  _getStore,
  _setStore,
} from '../../src/modules/health-repository/healthRepository.js';

// Pastikan navigator.onLine = true agar tidak masuk offline queue
Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });

beforeEach(() => {
  localStorage.clear();
  navigator.onLine = true;
});

describe('Health_Repository Unit Tests', () => {
  // 1. saveHeartRate + getHistory({ dataType: 'heart_rate' })
  it('saveHeartRate kemudian getHistory mengembalikan record yang disimpan', async () => {
    const reading = {
      id: 'hr-001',
      userId: 'user-1',
      bpm: 75,
      timestamp: new Date('2024-06-01T10:00:00Z').toISOString(),
      source: 'smartwatch',
      isAbnormal: false,
    };

    await saveHeartRate(reading);
    const history = await getHistory({ dataType: 'heart_rate' });

    expect(history).toHaveLength(1);
    expect(history[0]).toEqual(reading);
  });

  // 2. saveBloodPressure + getHistory({ dataType: 'blood_pressure' })
  it('saveBloodPressure kemudian getHistory mengembalikan record yang disimpan', async () => {
    const reading = {
      id: 'bp-001',
      userId: 'user-1',
      systolic: 120,
      diastolic: 80,
      timestamp: new Date('2024-06-01T10:00:00Z').toISOString(),
      source: 'smartwatch',
      riskLevel: 'normal',
    };

    await saveBloodPressure(reading);
    const history = await getHistory({ dataType: 'blood_pressure' });

    expect(history).toHaveLength(1);
    expect(history[0]).toEqual(reading);
  });

  // 3. getHistory({ dataType: 'all' }) mengembalikan records dari semua tipe
  it('getHistory dengan dataType=all mengembalikan records dari semua tipe', async () => {
    const hrReading = {
      id: 'hr-002',
      userId: 'user-1',
      bpm: 80,
      timestamp: new Date('2024-06-01T10:00:00Z').toISOString(),
      source: 'smartwatch',
      isAbnormal: false,
    };
    const bpReading = {
      id: 'bp-002',
      userId: 'user-1',
      systolic: 130,
      diastolic: 85,
      timestamp: new Date('2024-06-01T11:00:00Z').toISOString(),
      source: 'smartwatch',
      riskLevel: 'elevated',
    };
    const calorieEntry = {
      id: 'cal-001',
      userId: 'user-1',
      foodName: 'Nasi Goreng',
      calories: 450,
      timestamp: new Date('2024-06-01T12:00:00Z').toISOString(),
    };

    await saveHeartRate(hrReading);
    await saveBloodPressure(bpReading);
    await saveCalorieIntake(calorieEntry);

    const history = await getHistory({ dataType: 'all' });

    expect(history).toHaveLength(3);
    expect(history).toContainEqual(hrReading);
    expect(history).toContainEqual(bpReading);
    expect(history).toContainEqual(calorieEntry);
  });

  // 4. getHistory dengan filter rentang tanggal
  it('getHistory dengan startDate dan endDate hanya mengembalikan records dalam rentang', async () => {
    const old = {
      id: 'hr-old',
      userId: 'user-1',
      bpm: 70,
      timestamp: new Date('2024-01-01T10:00:00Z').toISOString(),
      source: 'smartwatch',
      isAbnormal: false,
    };
    const inRange = {
      id: 'hr-inrange',
      userId: 'user-1',
      bpm: 72,
      timestamp: new Date('2024-06-15T10:00:00Z').toISOString(),
      source: 'smartwatch',
      isAbnormal: false,
    };
    const future = {
      id: 'hr-future',
      userId: 'user-1',
      bpm: 74,
      timestamp: new Date('2024-12-31T10:00:00Z').toISOString(),
      source: 'smartwatch',
      isAbnormal: false,
    };

    await saveHeartRate(old);
    await saveHeartRate(inRange);
    await saveHeartRate(future);

    const history = await getHistory({
      dataType: 'heart_rate',
      startDate: new Date('2024-06-01T00:00:00Z'),
      endDate: new Date('2024-06-30T23:59:59Z'),
    });

    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('hr-inrange');
  });

  // 5. Data dienkripsi di localStorage (raw value bukan plain JSON)
  it('data tersimpan terenkripsi di localStorage (bukan plain JSON)', async () => {
    const reading = {
      id: 'hr-enc',
      userId: 'user-1',
      bpm: 65,
      timestamp: new Date('2024-06-01T10:00:00Z').toISOString(),
      source: 'smartwatch',
      isAbnormal: false,
    };

    await saveHeartRate(reading);

    const raw = localStorage.getItem('pantas_heart_rate');
    expect(raw).not.toBeNull();

    // Raw value tidak boleh berupa plain JSON array
    expect(() => JSON.parse(raw)).toThrow();

    // Tapi setelah getHistory, data bisa diambil kembali dengan benar
    const history = await getHistory({ dataType: 'heart_rate' });
    expect(history[0]).toEqual(reading);
  });

  // 6. syncOfflineData memindahkan offline queue ke penyimpanan utama
  it('syncOfflineData memindahkan item dari offline queue ke store utama', async () => {
    // Simulasikan kondisi offline
    navigator.onLine = false;

    const reading = {
      id: 'hr-offline',
      userId: 'user-1',
      bpm: 88,
      timestamp: new Date('2024-06-01T10:00:00Z').toISOString(),
      source: 'smartwatch',
      isAbnormal: false,
    };

    await saveHeartRate(reading);

    // Saat offline, data masuk ke queue, bukan ke store utama
    const queueBefore = _getStore('pantas_offline_queue');
    expect(queueBefore).toHaveLength(1);
    expect(queueBefore[0].dataType).toBe('heart_rate');

    const storeBefore = _getStore('pantas_heart_rate');
    expect(storeBefore).toHaveLength(0);

    // Kembali online dan sync
    navigator.onLine = true;
    await syncOfflineData();

    // Queue harus kosong
    const queueAfter = _getStore('pantas_offline_queue');
    expect(queueAfter).toHaveLength(0);

    // Data harus ada di store utama
    const storeAfter = _getStore('pantas_heart_rate');
    expect(storeAfter).toHaveLength(1);
    expect(storeAfter[0]).toEqual(reading);
  });
});
