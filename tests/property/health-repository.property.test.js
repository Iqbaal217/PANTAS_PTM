import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  saveHeartRate,
  getHistory,
  saveBloodPressure,
  saveCalorieIntake,
  saveRiskNotification,
} from '../../src/modules/health-repository/healthRepository.js';

// Pastikan navigator.onLine = true agar tidak masuk offline queue
Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });

beforeEach(() => {
  localStorage.clear();
  navigator.onLine = true;
});

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const isoTimestamp = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
  .map((d) => d.toISOString());

const heartRateArb = fc.record({
  id: fc.uuid(),
  userId: fc.string({ minLength: 1, maxLength: 20 }),
  bpm: fc.integer({ min: 1, max: 300 }),
  timestamp: isoTimestamp,
  source: fc.constantFrom('smartwatch', 'manual'),
  isAbnormal: fc.boolean(),
});

const bloodPressureArb = fc.record({
  id: fc.uuid(),
  userId: fc.string({ minLength: 1, maxLength: 20 }),
  systolic: fc.integer({ min: 60, max: 250 }),
  diastolic: fc.integer({ min: 40, max: 150 }),
  timestamp: isoTimestamp,
  source: fc.constantFrom('smartwatch', 'manual'),
  riskLevel: fc.constantFrom('normal', 'elevated', 'hypertension'),
});

const calorieArb = fc.record({
  id: fc.uuid(),
  userId: fc.string({ minLength: 1, maxLength: 20 }),
  foodName: fc.string({ minLength: 1, maxLength: 50 }),
  calories: fc.integer({ min: 0, max: 5000 }),
  timestamp: isoTimestamp,
});

const riskNotificationArb = fc.record({
  id: fc.uuid(),
  userId: fc.string({ minLength: 1, maxLength: 20 }),
  riskLevel: fc.constantFrom('low', 'medium', 'high'),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  timestamp: isoTimestamp,
});

// ─── Property 7: Penyimpanan data kesehatan adalah round-trip ────────────────

describe('Health_Repository Property Tests', () => {
  // Feature: pantas-ptm-monitoring, Property 7: Penyimpanan data kesehatan adalah round-trip
  it('Property 7: saveHeartRate kemudian getHistory mengembalikan record yang identik', async () => {
    // **Validates: Requirements 3.5, 4.5, 5.5, 6.5, 7.1, 7.3**
    await fc.assert(
      fc.asyncProperty(heartRateArb, async (reading) => {
        localStorage.clear();

        await saveHeartRate(reading);
        const history = await getHistory({ dataType: 'heart_rate' });

        // Harus ada tepat satu record dan identik dengan yang disimpan
        if (history.length !== 1) return false;
        const saved = history[0];
        return (
          saved.id === reading.id &&
          saved.userId === reading.userId &&
          saved.bpm === reading.bpm &&
          saved.timestamp === reading.timestamp &&
          saved.source === reading.source &&
          saved.isAbnormal === reading.isAbnormal
        );
      }),
      { numRuns: 50 }
    );
  });

  // ─── Property 13: Filter riwayat kesehatan selalu konsisten ─────────────────

  // Feature: pantas-ptm-monitoring, Property 13: Filter riwayat kesehatan selalu konsisten
  it('Property 13: getHistory hanya mengembalikan records yang memenuhi filter dataType', async () => {
    // **Validates: Requirements 7.2**
    await fc.assert(
      fc.asyncProperty(
        fc.array(heartRateArb, { minLength: 1, maxLength: 10 }),
        fc.array(bloodPressureArb, { minLength: 1, maxLength: 10 }),
        async (hrRecords, bpRecords) => {
          localStorage.clear();

          for (const r of hrRecords) await saveHeartRate(r);
          for (const r of bpRecords) await saveBloodPressure(r);

          // Filter heart_rate: tidak boleh ada record blood_pressure
          const hrHistory = await getHistory({ dataType: 'heart_rate' });
          const hrIds = new Set(hrRecords.map((r) => r.id));
          const bpIds = new Set(bpRecords.map((r) => r.id));

          // Semua record yang dikembalikan harus berasal dari hrRecords
          const noLeakedBP = hrHistory.every((r) => !bpIds.has(r.id));
          // Semua hrRecords harus ada di hasil
          const allHRPresent = hrRecords.every((r) => hrHistory.some((h) => h.id === r.id));

          return noLeakedBP && allHRPresent;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 13: getHistory dengan filter rentang tanggal tidak mengembalikan records di luar rentang', async () => {
    // **Validates: Requirements 7.2**
    await fc.assert(
      fc.asyncProperty(
        // Buat dua tanggal: start dan end (start <= end)
        fc.tuple(
          fc.date({ min: new Date('2022-01-01'), max: new Date('2023-12-31') }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-30') }),
          fc.date({ min: new Date('2025-01-01'), max: new Date('2026-12-31') })
        ),
        async ([beforeDate, inRangeDate, afterDate]) => {
          localStorage.clear();

          const startDate = new Date('2024-01-01T00:00:00Z');
          const endDate = new Date('2024-12-31T23:59:59Z');

          const recordBefore = {
            id: 'before-' + beforeDate.getTime(),
            userId: 'user-1',
            bpm: 70,
            timestamp: beforeDate.toISOString(),
            source: 'smartwatch',
            isAbnormal: false,
          };
          const recordInRange = {
            id: 'inrange-' + inRangeDate.getTime(),
            userId: 'user-1',
            bpm: 72,
            timestamp: inRangeDate.toISOString(),
            source: 'smartwatch',
            isAbnormal: false,
          };
          const recordAfter = {
            id: 'after-' + afterDate.getTime(),
            userId: 'user-1',
            bpm: 74,
            timestamp: afterDate.toISOString(),
            source: 'smartwatch',
            isAbnormal: false,
          };

          await saveHeartRate(recordBefore);
          await saveHeartRate(recordInRange);
          await saveHeartRate(recordAfter);

          const history = await getHistory({
            dataType: 'heart_rate',
            startDate,
            endDate,
          });

          // Tidak boleh ada record di luar rentang
          const noOutOfRange = history.every((r) => {
            const ts = new Date(r.timestamp).getTime();
            return ts >= startDate.getTime() && ts <= endDate.getTime();
          });

          // Record dalam rentang harus ada
          const inRangePresent = history.some((r) => r.id === recordInRange.id);

          return noOutOfRange && inRangePresent;
        }
      ),
      { numRuns: 50 }
    );
  });
});
