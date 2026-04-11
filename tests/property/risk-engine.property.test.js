import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { analyzeRisk, classifyRisk, getRecommendations } from '../../src/modules/risk-engine/riskEngine.js';

// Arbitrary for optional HeartRateReading
const heartRateArb = fc.option(
  fc.record({
    bpm: fc.integer({ min: 1, max: 300 }),
    isAbnormal: fc.boolean(),
    userId: fc.constant('user-001'),
  }),
  { nil: undefined }
);

// Arbitrary for optional BloodPressureReading
const bloodPressureArb = fc.option(
  fc.record({
    systolic: fc.integer({ min: 60, max: 250 }),
    diastolic: fc.integer({ min: 40, max: 150 }),
    riskLevel: fc.oneof(
      fc.constant('normal'),
      fc.constant('elevated'),
      fc.constant('hypertension')
    ),
  }),
  { nil: undefined }
);

// Arbitrary for HealthData
const healthDataArb = fc.record({
  heartRate: heartRateArb,
  bloodPressure: bloodPressureArb,
});

describe('Risk_Engine Property Tests', () => {
  // Feature: pantas-ptm-monitoring, Property 11: Klasifikasi risiko PTM selalu menghasilkan kategori valid
  it('Property 11: classifyRisk selalu mengembalikan low, medium, atau high dengan warna yang sesuai', () => {
    // **Validates: Requirements 6.1, 6.3**
    const validLevels = ['low', 'medium', 'high'];
    const colorMap = { low: 'green', medium: 'yellow', high: 'red' };

    fc.assert(
      fc.property(healthDataArb, (data) => {
        const assessment = analyzeRisk(data);
        const level = classifyRisk(assessment);

        // Must be exactly one of the three valid levels
        if (!validLevels.includes(level)) return false;

        // Color must match the level
        if (assessment.riskColor !== colorMap[level]) return false;

        return true;
      }),
      { numRuns: 100 }
    );
  });

  // Feature: pantas-ptm-monitoring, Property 12: Risiko tinggi selalu menyertakan saran konsultasi dokter
  it('Property 12: getRecommendations("high") selalu mengandung saran konsultasi dokter', () => {
    // **Validates: Requirements 6.6**
    fc.assert(
      fc.property(
        // Generate any RiskAssessment-like object with riskLevel === 'high'
        fc.record({
          id: fc.string(),
          userId: fc.string(),
          riskLevel: fc.constant('high'),
        }),
        (_assessment) => {
          const recs = getRecommendations('high');

          // Must be a non-empty array
          if (!Array.isArray(recs) || recs.length === 0) return false;

          // At least one recommendation must mention 'dokter'
          return recs.some((r) => r.toLowerCase().includes('dokter'));
        }
      ),
      { numRuns: 100 }
    );
  });
});
