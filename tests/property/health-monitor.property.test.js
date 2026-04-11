import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock smartwatchAdapter before importing healthMonitor
vi.mock('../../src/modules/health-monitor/smartwatchAdapter.js', () => ({
  generateReading: vi.fn(),
  isConnected: vi.fn(),
}));

import {
  processHeartRate,
  processBloodPressure,
  getLastReading,
  setConnectionStatus,
  startMonitoring,
  stopMonitoring,
} from '../../src/modules/health-monitor/healthMonitor.js';

import * as smartwatchAdapter from '../../src/modules/health-monitor/smartwatchAdapter.js';

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

describe('Health_Monitor Property Tests', () => {
  // Feature: pantas-ptm-monitoring, Property 4: Tampilan dashboard selalu mencerminkan data terbaru
  it('Property 4: processHeartRate and processBloodPressure return objects matching input values exactly', () => {
    // **Validates: Requirements 3.1**
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 300 }),
        fc.integer({ min: 60, max: 200 }),
        fc.integer({ min: 40, max: 130 }),
        (bpm, systolic, diastolic) => {
          const ts = new Date();
          const hrResult = processHeartRate(bpm, ts);
          const bpResult = processBloodPressure(systolic, diastolic, ts);

          return (
            hrResult.bpm === bpm &&
            bpResult.systolic === systolic &&
            bpResult.diastolic === diastolic
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pantas-ptm-monitoring, Property 5: Koneksi terputus selalu menampilkan data terakhir
  it('Property 5: getLastReading returns last known reading (not null) when disconnected', () => {
    // **Validates: Requirements 3.4**
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 300 }),
        fc.integer({ min: 60, max: 200 }),
        fc.integer({ min: 40, max: 130 }),
        (bpm, systolic, diastolic) => {
          const ts = new Date();

          // Simulate a connected reading being stored via startMonitoring
          smartwatchAdapter.generateReading.mockReturnValue({
            bpm,
            systolic,
            diastolic,
            timestamp: ts,
          });

          startMonitoring(1000);
          vi.advanceTimersByTime(1000);
          stopMonitoring();

          // Now disconnect
          setConnectionStatus('disconnected');

          const last = getLastReading();
          return last.heartRate !== null && last.bloodPressure !== null;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pantas-ptm-monitoring, Property 8: Pemrosesan data biometrik menghasilkan reading yang valid
  it('Property 8: processHeartRate and processBloodPressure always return objects with all required fields', () => {
    // **Validates: Requirements 3.1**
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 300 }),
        fc.integer({ min: 60, max: 200 }),
        fc.integer({ min: 40, max: 130 }),
        (bpm, systolic, diastolic) => {
          const ts = new Date();
          const hrResult = processHeartRate(bpm, ts);
          const bpResult = processBloodPressure(systolic, diastolic, ts);

          const hrHasFields =
            'id' in hrResult &&
            'userId' in hrResult &&
            'bpm' in hrResult &&
            'timestamp' in hrResult &&
            'source' in hrResult;

          const bpHasFields =
            'id' in bpResult &&
            'userId' in bpResult &&
            'systolic' in bpResult &&
            'timestamp' in bpResult &&
            'source' in bpResult;

          return hrHasFields && bpHasFields;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pantas-ptm-monitoring, Property 9: Deteksi anomali detak jantung selalu akurat
  it('Property 9: processHeartRate correctly detects abnormal BPM (< 50 or > 100)', () => {
    // **Validates: Requirements 3.1**

    // Test abnormal low BPM
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 49 }),
        (bpm) => {
          const result = processHeartRate(bpm, new Date());
          return result.isAbnormal === true;
        }
      ),
      { numRuns: 100 }
    );

    // Test abnormal high BPM
    fc.assert(
      fc.property(
        fc.integer({ min: 101, max: 300 }),
        (bpm) => {
          const result = processHeartRate(bpm, new Date());
          return result.isAbnormal === true;
        }
      ),
      { numRuns: 100 }
    );

    // Test normal BPM
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 100 }),
        (bpm) => {
          const result = processHeartRate(bpm, new Date());
          return result.isAbnormal === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pantas-ptm-monitoring, Property 10: Deteksi hipertensi selalu akurat
  it('Property 10: processBloodPressure correctly detects hypertension', () => {
    // **Validates: Requirements 3.1**

    // Hypertension: systolic > 140 OR diastolic > 90
    fc.assert(
      fc.property(
        fc.oneof(
          // systolic > 140, diastolic any valid
          fc.record({
            systolic: fc.integer({ min: 141, max: 300 }),
            diastolic: fc.integer({ min: 40, max: 130 }),
          }),
          // diastolic > 90, systolic any valid
          fc.record({
            systolic: fc.integer({ min: 60, max: 200 }),
            diastolic: fc.integer({ min: 91, max: 130 }),
          })
        ),
        ({ systolic, diastolic }) => {
          const result = processBloodPressure(systolic, diastolic, new Date());
          return result.riskLevel === 'hypertension';
        }
      ),
      { numRuns: 100 }
    );

    // Not hypertension: systolic <= 140 AND diastolic <= 90
    fc.assert(
      fc.property(
        fc.integer({ min: 60, max: 140 }),
        fc.integer({ min: 40, max: 90 }),
        (systolic, diastolic) => {
          const result = processBloodPressure(systolic, diastolic, new Date());
          return result.riskLevel !== 'hypertension';
        }
      ),
      { numRuns: 100 }
    );
  });
});
