import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  analyzeRisk,
  classifyRisk,
  getRecommendations,
  triggerNotification,
} from '../../src/modules/risk-engine/riskEngine.js';

describe('Risk_Engine', () => {
  // 1. analyzeRisk with abnormal heart rate → riskLevel 'high', riskColor 'red'
  it('analyzeRisk: detak jantung abnormal → riskLevel high, riskColor red', () => {
    const data = {
      heartRate: { bpm: 110, isAbnormal: true, userId: 'user-001' },
    };
    const result = analyzeRisk(data);
    expect(result.riskLevel).toBe('high');
    expect(result.riskColor).toBe('red');
  });

  // 2. analyzeRisk with hypertension blood pressure → riskLevel 'high'
  it('analyzeRisk: tekanan darah hipertensi → riskLevel high', () => {
    const data = {
      bloodPressure: { systolic: 150, diastolic: 95, riskLevel: 'hypertension' },
    };
    const result = analyzeRisk(data);
    expect(result.riskLevel).toBe('high');
  });

  // 3. analyzeRisk with elevated blood pressure → riskLevel 'medium'
  it('analyzeRisk: tekanan darah elevated → riskLevel medium', () => {
    const data = {
      bloodPressure: { systolic: 130, diastolic: 85, riskLevel: 'elevated' },
    };
    const result = analyzeRisk(data);
    expect(result.riskLevel).toBe('medium');
  });

  // 4. analyzeRisk with normal data → riskLevel 'low', riskColor 'green'
  it('analyzeRisk: data normal → riskLevel low, riskColor green', () => {
    const data = {
      heartRate: { bpm: 75, isAbnormal: false },
      bloodPressure: { systolic: 120, diastolic: 80, riskLevel: 'normal' },
    };
    const result = analyzeRisk(data);
    expect(result.riskLevel).toBe('low');
    expect(result.riskColor).toBe('green');
  });

  // 5. classifyRisk returns one of 'low'|'medium'|'high'
  it('classifyRisk: selalu mengembalikan low, medium, atau high', () => {
    const validLevels = ['low', 'medium', 'high'];
    const assessments = [
      { riskLevel: 'low' },
      { riskLevel: 'medium' },
      { riskLevel: 'high' },
    ];
    for (const a of assessments) {
      expect(validLevels).toContain(classifyRisk(a));
    }
  });

  // 6. getRecommendations('high') includes 'dokter'
  it("getRecommendations('high'): mengandung saran konsultasi dokter", () => {
    const recs = getRecommendations('high');
    const hasDokter = recs.some((r) => r.toLowerCase().includes('dokter'));
    expect(hasDokter).toBe(true);
  });

  // 7. getRecommendations('low') returns non-empty array
  it("getRecommendations('low'): mengembalikan array tidak kosong", () => {
    const recs = getRecommendations('low');
    expect(Array.isArray(recs)).toBe(true);
    expect(recs.length).toBeGreaterThan(0);
  });

  // 8. triggerNotification doesn't throw when Notification API unavailable
  it('triggerNotification: tidak melempar error saat Notification API tidak tersedia', () => {
    // Ensure Notification is undefined in this environment
    const originalNotification = globalThis.Notification;
    delete globalThis.Notification;

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const assessment = {
      riskLevel: 'high',
      description: 'Test description',
    };

    expect(() => triggerNotification(assessment)).not.toThrow();

    consoleSpy.mockRestore();
    if (originalNotification !== undefined) {
      globalThis.Notification = originalNotification;
    }
  });
});
