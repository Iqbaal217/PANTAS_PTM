import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock smartwatchAdapter before importing healthMonitor
vi.mock('../../src/modules/health-monitor/smartwatchAdapter.js', () => ({
  generateReading: vi.fn(),
  isConnected: vi.fn(),
}));

import {
  processHeartRate,
  processBloodPressure,
  getConnectionStatus,
  getLastReading,
  setConnectionStatus,
  startMonitoring,
  stopMonitoring,
} from '../../src/modules/health-monitor/healthMonitor.js';

import * as smartwatchAdapter from '../../src/modules/health-monitor/smartwatchAdapter.js';

describe('Health_Monitor', () => {
  const date = new Date('2024-01-01T10:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    stopMonitoring();
    setConnectionStatus('disconnected');
  });

  afterEach(() => {
    stopMonitoring();
    vi.useRealTimers();
  });

  // --- processHeartRate ---

  describe('processHeartRate', () => {
    it('bpm=75 → isAbnormal=false, source=smartwatch', () => {
      const result = processHeartRate(75, date);
      expect(result.bpm).toBe(75);
      expect(result.isAbnormal).toBe(false);
      expect(result.source).toBe('smartwatch');
      expect(result.timestamp).toBe(date);
    });

    it('bpm=45 → isAbnormal=true (di bawah 50)', () => {
      const result = processHeartRate(45, date);
      expect(result.isAbnormal).toBe(true);
    });

    it('bpm=105 → isAbnormal=true (di atas 100)', () => {
      const result = processHeartRate(105, date);
      expect(result.isAbnormal).toBe(true);
    });
  });

  // --- processBloodPressure ---

  describe('processBloodPressure', () => {
    it('systolic=120, diastolic=80 → riskLevel=normal', () => {
      const result = processBloodPressure(120, 80, date);
      expect(result.riskLevel).toBe('normal');
    });

    it('systolic=145, diastolic=85 → riskLevel=hypertension (systolic > 140)', () => {
      const result = processBloodPressure(145, 85, date);
      expect(result.riskLevel).toBe('hypertension');
    });

    it('systolic=130, diastolic=95 → riskLevel=hypertension (diastolic > 90)', () => {
      const result = processBloodPressure(130, 95, date);
      expect(result.riskLevel).toBe('hypertension');
    });

    it('systolic=125, diastolic=82 → riskLevel=elevated', () => {
      const result = processBloodPressure(125, 82, date);
      expect(result.riskLevel).toBe('elevated');
    });
  });

  // --- getConnectionStatus / setConnectionStatus ---

  describe('getConnectionStatus', () => {
    it('mengembalikan string status yang valid', () => {
      const status = getConnectionStatus();
      expect(['connected', 'disconnected', 'error']).toContain(status);
    });

    it('setConnectionStatus("connected") → getConnectionStatus() mengembalikan "connected"', () => {
      setConnectionStatus('connected');
      expect(getConnectionStatus()).toBe('connected');
    });
  });

  // --- startMonitoring / stopMonitoring ---

  describe('startMonitoring + stopMonitoring', () => {
    it('interval terpicu setelah intervalMs berlalu', () => {
      smartwatchAdapter.generateReading.mockReturnValue({
        bpm: 72,
        systolic: 118,
        diastolic: 78,
        timestamp: date,
      });

      startMonitoring(1000);
      expect(smartwatchAdapter.generateReading).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(smartwatchAdapter.generateReading).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(smartwatchAdapter.generateReading).toHaveBeenCalledTimes(2);
    });

    it('stopMonitoring menghentikan interval', () => {
      smartwatchAdapter.generateReading.mockReturnValue({
        bpm: 72,
        systolic: 118,
        diastolic: 78,
        timestamp: date,
      });

      startMonitoring(1000);
      vi.advanceTimersByTime(1000);
      expect(smartwatchAdapter.generateReading).toHaveBeenCalledTimes(1);

      stopMonitoring();
      vi.advanceTimersByTime(3000);
      // Tidak ada panggilan tambahan setelah stop
      expect(smartwatchAdapter.generateReading).toHaveBeenCalledTimes(1);
    });
  });
});
