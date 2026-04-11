import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  analyzeFood,
  saveDetectionResult,
  getDetectionHistory,
} from '../../src/modules/kalori-detector/kaloriDetector.js';

// jsdom does not implement URL.createObjectURL — provide a stub
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  // Re-stub after restoreAllMocks
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Kalori_Detector Property Tests', () => {
  // Feature: pantas-ptm-monitoring, Property 6: Hasil analisis kalori selalu lengkap
  it('Property 6: analyzeFood selalu mengembalikan FoodAnalysisResult dengan semua field yang diperlukan', async () => {
    // **Validates: Requirements 4.3**
    // Mock Math.random to always return 0.5 so no failure (above 0.15 threshold)
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    // Use fake timers to skip the 300ms setTimeout delay in analyzeFood
    vi.useFakeTimers();

    const blob = new Blob(['mock'], { type: 'image/jpeg' });

    await fc.assert(
      fc.asyncProperty(
        fc.constant(blob),
        async (_blob) => {
          const promise = analyzeFood(_blob);
          // Advance timers to resolve the internal setTimeout(300ms)
          await vi.runAllTimersAsync();
          const result = await promise;

          return (
            typeof result.foodName === 'string' &&
            result.foodName.length > 0 &&
            typeof result.calories === 'number' &&
            result.calories >= 0 &&
            typeof result.carbohydrates === 'number' &&
            result.carbohydrates >= 0 &&
            typeof result.protein === 'number' &&
            result.protein >= 0 &&
            typeof result.fat === 'number' &&
            result.fat >= 0 &&
            result.id !== undefined &&
            result.userId !== undefined &&
            result.timestamp !== undefined &&
            typeof result.confidence === 'number'
          );
        }
      ),
      { numRuns: 50 }
    );
  }, 30000);

  // Feature: pantas-ptm-monitoring, Property 7: Penyimpanan data kesehatan adalah round-trip
  it('Property 7: saveDetectionResult + getDetectionHistory adalah round-trip yang konsisten', async () => {
    // **Validates: Requirements 4.1**
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          foodName: fc.string({ minLength: 1 }),
          calories: fc.nat(),
          carbohydrates: fc.nat(),
          protein: fc.nat(),
          fat: fc.nat(),
        }),
        async (food) => {
          localStorage.clear();

          const result = {
            id: 'prop-test-id',
            userId: 'user-001',
            foodName: food.foodName,
            calories: food.calories,
            carbohydrates: food.carbohydrates,
            protein: food.protein,
            fat: food.fat,
            imageUrl: '',
            timestamp: new Date().toISOString(),
            confidence: 0.9,
          };

          await saveDetectionResult(result);
          const history = getDetectionHistory();

          const saved = history.find((h) => h.foodName === food.foodName);
          return (
            saved !== undefined &&
            saved.calories === food.calories &&
            saved.carbohydrates === food.carbohydrates &&
            saved.protein === food.protein &&
            saved.fat === food.fat
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
