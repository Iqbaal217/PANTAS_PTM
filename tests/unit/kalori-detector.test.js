import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  analyzeFood,
  saveDetectionResult,
  getDetectionHistory,
  openCamera,
} from '../../src/modules/kalori-detector/kaloriDetector.js';

// jsdom does not implement URL.createObjectURL — provide a stub
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

describe('Kalori_Detector', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    // Re-stub after restoreAllMocks
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  });

  // --- analyzeFood: success path ---

  describe('analyzeFood — sukses (Math.random tidak gagal)', () => {
    it('mengembalikan FoodAnalysisResult dengan semua field yang diperlukan', async () => {
      // Mock Math.random to always return 0.5 (above 0.15 failure threshold)
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const blob = new Blob(['mock'], { type: 'image/jpeg' });
      const result = await analyzeFood(blob);

      expect(result).toMatchObject({
        id: expect.any(String),
        userId: expect.any(String),
        foodName: expect.any(String),
        calories: expect.any(Number),
        carbohydrates: expect.any(Number),
        protein: expect.any(Number),
        fat: expect.any(Number),
        confidence: expect.any(Number),
      });
      expect(result.timestamp).toBeDefined();
      expect(result.foodName.length).toBeGreaterThan(0);
      expect(result.calories).toBeGreaterThanOrEqual(0);
    });
  });

  // --- analyzeFood: failure path ---

  describe('analyzeFood — gagal (Math.random < 0.15)', () => {
    it('melempar error dengan pesan bahasa Indonesia', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1);

      const blob = new Blob(['mock'], { type: 'image/jpeg' });
      await expect(analyzeFood(blob)).rejects.toThrow(
        'Tidak dapat mengidentifikasi makanan'
      );
    });
  });

  // --- saveDetectionResult + getDetectionHistory round-trip ---

  describe('saveDetectionResult + getDetectionHistory', () => {
    it('riwayat mengandung hasil yang disimpan', async () => {
      const result = {
        id: 'test-id-1',
        userId: 'user-001',
        foodName: 'Nasi Goreng',
        calories: 350,
        carbohydrates: 45,
        protein: 12,
        fat: 14,
        imageUrl: '',
        timestamp: new Date().toISOString(),
        confidence: 0.9,
      };

      await saveDetectionResult(result);
      const history = getDetectionHistory();

      expect(history).toHaveLength(1);
      expect(history[0].foodName).toBe('Nasi Goreng');
      expect(history[0].calories).toBe(350);
    });
  });

  // --- getDetectionHistory: empty localStorage ---

  describe('getDetectionHistory — localStorage kosong', () => {
    it('mengembalikan array kosong', () => {
      const history = getDetectionHistory();
      expect(history).toEqual([]);
    });
  });

  // --- openCamera: navigator.mediaDevices tidak tersedia ---

  describe('openCamera — kamera tidak tersedia', () => {
    it('melempar error "Kamera tidak tersedia"', async () => {
      // Remove mediaDevices from navigator
      const originalMediaDevices = navigator.mediaDevices;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        configurable: true,
      });

      await expect(openCamera()).rejects.toThrow('Kamera tidak tersedia');

      // Restore
      Object.defineProperty(navigator, 'mediaDevices', {
        value: originalMediaDevices,
        configurable: true,
      });
    });
  });
});
