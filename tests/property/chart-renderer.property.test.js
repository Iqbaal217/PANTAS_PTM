import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import {
  formatChartData,
  getHeartRateChartConfig,
  getBloodPressureChartConfig,
  tooltipFormatter,
} from '../../src/modules/chart-renderer/chartRenderer.js';

// Arbitrary: valid time range
const timeRangeArb = fc.constantFrom('24h', '7d', '30d');

// Arbitrary: HeartRateReading within the last 30 days
const heartRateReadingArb = fc.record({
  id: fc.uuid(),
  userId: fc.string({ minLength: 1, maxLength: 20 }),
  bpm: fc.integer({ min: 1, max: 300 }),
  timestamp: fc.date({
    min: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    max: new Date(),
  }),
  source: fc.constantFrom('smartwatch', 'manual'),
  isAbnormal: fc.boolean(),
});

// Arbitrary: BloodPressureReading within the last 30 days
const bloodPressureReadingArb = fc.record({
  id: fc.uuid(),
  userId: fc.string({ minLength: 1, maxLength: 20 }),
  systolic: fc.integer({ min: 60, max: 250 }),
  diastolic: fc.integer({ min: 40, max: 150 }),
  timestamp: fc.date({
    min: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    max: new Date(),
  }),
  source: fc.constantFrom('smartwatch', 'manual'),
  riskLevel: fc.constantFrom('normal', 'elevated', 'hypertension'),
});

describe('Chart_Renderer Property Tests', () => {
  // Feature: pantas-ptm-monitoring, Property 14: Format data grafik selalu valid untuk Recharts
  it('Property 14: formatChartData always returns valid ChartDataPoints for HeartRateReading', () => {
    // **Validates: Requirements 4.3, 5.3, 8.2, 8.3**
    fc.assert(
      fc.property(
        fc.array(heartRateReadingArb, { minLength: 0, maxLength: 50 }),
        timeRangeArb,
        (readings, timeRange) => {
          const result = formatChartData(readings, timeRange);

          // Must be an array
          if (!Array.isArray(result)) return false;

          // Every point must have timestamp (string) and value (number)
          return result.every(
            (point) =>
              typeof point.timestamp === 'string' &&
              point.timestamp.length > 0 &&
              typeof point.value === 'number' &&
              !isNaN(point.value) &&
              point.timestamp !== null &&
              point.value !== null &&
              point.value !== undefined
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 14: formatChartData always returns valid ChartDataPoints for BloodPressureReading', () => {
    // **Validates: Requirements 4.3, 5.3, 8.2, 8.3**
    fc.assert(
      fc.property(
        fc.array(bloodPressureReadingArb, { minLength: 0, maxLength: 50 }),
        timeRangeArb,
        (readings, timeRange) => {
          const result = formatChartData(readings, timeRange);

          if (!Array.isArray(result)) return false;

          // Every point must have timestamp (string), systolic (number), diastolic (number)
          return result.every(
            (point) =>
              typeof point.timestamp === 'string' &&
              point.timestamp.length > 0 &&
              typeof point.systolic === 'number' &&
              !isNaN(point.systolic) &&
              typeof point.diastolic === 'number' &&
              !isNaN(point.diastolic) &&
              point.systolic !== null &&
              point.diastolic !== null &&
              point.systolic !== undefined &&
              point.diastolic !== undefined
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pantas-ptm-monitoring, Property 15: Konfigurasi grafik selalu menyertakan garis referensi batas normal
  it('Property 15: getHeartRateChartConfig always includes referenceLines with y=50 and y=100', () => {
    // **Validates: Requirements 8.5**
    fc.assert(
      fc.property(
        fc.array(heartRateReadingArb, { minLength: 0, maxLength: 50 }),
        timeRangeArb,
        (readings, timeRange) => {
          const data = formatChartData(readings, timeRange);
          const config = getHeartRateChartConfig(data, timeRange);

          if (!Array.isArray(config.referenceLines)) return false;

          const yValues = config.referenceLines.map((rl) => rl.y);
          return yValues.includes(50) && yValues.includes(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 15: getBloodPressureChartConfig always includes referenceLines with y=90 and y=140', () => {
    // **Validates: Requirements 8.5**
    fc.assert(
      fc.property(
        fc.array(bloodPressureReadingArb, { minLength: 0, maxLength: 50 }),
        timeRangeArb,
        (readings, timeRange) => {
          const data = formatChartData(readings, timeRange);
          const config = getBloodPressureChartConfig(data, timeRange);

          if (!Array.isArray(config.referenceLines)) return false;

          const yValues = config.referenceLines.map((rl) => rl.y);
          return yValues.includes(90) && yValues.includes(140);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pantas-ptm-monitoring, Property 16: Tooltip grafik selalu berisi nilai dan timestamp
  it('Property 16: tooltipFormatter always returns string containing numeric value and human-readable timestamp', () => {
    // **Validates: Requirements 8.6**
    fc.assert(
      fc.property(
        fc.float({ min: -1e6, max: 1e6, noNaN: true }),
        fc.date({
          min: new Date('2000-01-01'),
          max: new Date('2099-12-31'),
        }),
        (value, timestamp) => {
          const result = tooltipFormatter(value, timestamp);

          if (typeof result !== 'string') return false;
          if (result.length === 0) return false;

          // Must contain the numeric value
          const valueStr = String(Math.round(value) === value ? value : value);
          const containsValue = result.includes(String(value)) || result.includes(valueStr);

          // Must contain a human-readable timestamp (year should be present)
          const year = timestamp.getFullYear().toString();
          const containsTimestamp = result.includes(year);

          return containsValue && containsTimestamp;
        }
      ),
      { numRuns: 100 }
    );
  });
});
