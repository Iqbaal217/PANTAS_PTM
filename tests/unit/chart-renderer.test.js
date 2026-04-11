import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatChartData,
  getHeartRateChartConfig,
  getBloodPressureChartConfig,
  tooltipFormatter,
  renderHeartRateChart,
  renderBloodPressureChart,
  updateTimeRange,
} from '../../src/modules/chart-renderer/chartRenderer.js';

// Helper: create a timestamp within the last 24 hours
function recentDate(offsetMs = 0) {
  return new Date(Date.now() - offsetMs);
}

// Helper: create a timestamp older than 24 hours
function oldDate() {
  return new Date(Date.now() - 25 * 60 * 60 * 1000);
}

describe('Chart_Renderer Unit Tests', () => {
  // --- formatChartData ---

  describe('formatChartData — heart rate readings', () => {
    it('returns ChartDataPoints with timestamp (string) and value (number)', () => {
      const readings = [
        { id: '1', bpm: 72, timestamp: recentDate(1000) },
        { id: '2', bpm: 85, timestamp: recentDate(2000) },
      ];

      const result = formatChartData(readings, '24h');

      expect(result).toHaveLength(2);
      result.forEach((point) => {
        expect(typeof point.timestamp).toBe('string');
        expect(typeof point.value).toBe('number');
      });
      expect(result[0].value).toBe(72);
      expect(result[1].value).toBe(85);
    });
  });

  describe('formatChartData — blood pressure readings', () => {
    it('returns ChartDataPoints with timestamp, systolic, and diastolic', () => {
      const readings = [
        { id: '1', systolic: 120, diastolic: 80, timestamp: recentDate(1000) },
        { id: '2', systolic: 135, diastolic: 88, timestamp: recentDate(2000) },
      ];

      const result = formatChartData(readings, '24h');

      expect(result).toHaveLength(2);
      result.forEach((point) => {
        expect(typeof point.timestamp).toBe('string');
        expect(typeof point.systolic).toBe('number');
        expect(typeof point.diastolic).toBe('number');
      });
      expect(result[0].systolic).toBe(120);
      expect(result[0].diastolic).toBe(80);
    });
  });

  describe('formatChartData — time range filter', () => {
    it("'24h' filter only returns readings from the last 24 hours", () => {
      const readings = [
        { id: '1', bpm: 72, timestamp: recentDate(1000) },       // within 24h
        { id: '2', bpm: 80, timestamp: recentDate(10000) },      // within 24h
        { id: '3', bpm: 90, timestamp: oldDate() },              // older than 24h
      ];

      const result = formatChartData(readings, '24h');

      expect(result).toHaveLength(2);
      result.forEach((point) => expect(point.value).not.toBe(90));
    });

    it("'7d' filter returns readings from the last 7 days", () => {
      const within7d = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const older = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      const readings = [
        { id: '1', bpm: 72, timestamp: within7d },
        { id: '2', bpm: 90, timestamp: older },
      ];

      const result = formatChartData(readings, '7d');
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(72);
    });
  });

  // --- getHeartRateChartConfig ---

  describe('getHeartRateChartConfig', () => {
    it('config includes referenceLines with y=50 and y=100', () => {
      const data = [{ timestamp: new Date().toISOString(), value: 75 }];
      const config = getHeartRateChartConfig(data, '24h');

      expect(config.referenceLines).toBeDefined();
      const yValues = config.referenceLines.map((rl) => rl.y);
      expect(yValues).toContain(50);
      expect(yValues).toContain(100);
    });

    it('config has correct type, xKey, and yKey', () => {
      const config = getHeartRateChartConfig([], '24h');
      expect(config.type).toBe('line');
      expect(config.xKey).toBe('timestamp');
      expect(config.yKey).toBe('value');
    });
  });

  // --- getBloodPressureChartConfig ---

  describe('getBloodPressureChartConfig', () => {
    it('config includes referenceLines with y=90 and y=140', () => {
      const data = [{ timestamp: new Date().toISOString(), systolic: 120, diastolic: 80 }];
      const config = getBloodPressureChartConfig(data, '7d');

      expect(config.referenceLines).toBeDefined();
      const yValues = config.referenceLines.map((rl) => rl.y);
      expect(yValues).toContain(90);
      expect(yValues).toContain(140);
    });

    it('config includes referenceLines with y=60 for diastolic min', () => {
      const config = getBloodPressureChartConfig([], '7d');
      const yValues = config.referenceLines.map((rl) => rl.y);
      expect(yValues).toContain(60);
    });

    it('config has lines array with systolic and diastolic', () => {
      const config = getBloodPressureChartConfig([], '7d');
      expect(config.lines).toContain('systolic');
      expect(config.lines).toContain('diastolic');
    });
  });

  // --- tooltipFormatter ---

  describe('tooltipFormatter', () => {
    it('returns string containing the numeric value', () => {
      const result = tooltipFormatter(75, new Date('2024-01-15T10:30:00Z'));
      expect(result).toContain('75');
    });

    it('returns string containing a human-readable timestamp', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = tooltipFormatter(75, date);
      // Should contain year or time info
      expect(result).toContain('2024');
    });

    it('returns string with "Nilai:" and "Waktu:" labels', () => {
      const result = tooltipFormatter(120, new Date());
      expect(result).toContain('Nilai:');
      expect(result).toContain('Waktu:');
    });

    it('works with ISO string timestamp', () => {
      const result = tooltipFormatter(80, '2024-06-01T08:00:00.000Z');
      expect(result).toContain('80');
      expect(result).toContain('2024');
    });
  });

  // --- renderHeartRateChart ---

  describe('renderHeartRateChart', () => {
    it('renders into DOM container without throwing', () => {
      // Create a DOM element
      const container = document.createElement('div');
      container.id = 'test-hr-chart';
      document.body.appendChild(container);

      const readings = [
        { id: '1', bpm: 72, timestamp: recentDate(1000) },
        { id: '2', bpm: 85, timestamp: recentDate(2000) },
      ];

      expect(() => renderHeartRateChart('test-hr-chart', readings, '24h')).not.toThrow();

      // Config should be stored in dataset
      const stored = JSON.parse(container.dataset.chartConfig);
      expect(stored).toBeDefined();
      expect(stored.type).toBe('line');

      document.body.removeChild(container);
    });
  });

  // --- renderBloodPressureChart ---

  describe('renderBloodPressureChart', () => {
    it('renders into DOM container without throwing', () => {
      const container = document.createElement('div');
      container.id = 'test-bp-chart';
      document.body.appendChild(container);

      const readings = [
        { id: '1', systolic: 120, diastolic: 80, timestamp: recentDate(1000) },
      ];

      expect(() => renderBloodPressureChart('test-bp-chart', readings, '7d')).not.toThrow();

      const stored = JSON.parse(container.dataset.chartConfig);
      expect(stored.lines).toContain('systolic');
      expect(stored.lines).toContain('diastolic');

      document.body.removeChild(container);
    });
  });

  // --- updateTimeRange ---

  describe('updateTimeRange', () => {
    it('re-renders chart with new time range', () => {
      const container = document.createElement('div');
      container.id = 'test-update-chart';
      document.body.appendChild(container);

      const readings = [
        { id: '1', bpm: 72, timestamp: recentDate(1000) },
        { id: '2', bpm: 90, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      ];

      renderHeartRateChart('test-update-chart', readings, '24h');
      const configBefore = JSON.parse(container.dataset.chartConfig);
      expect(configBefore.timeRange).toBe('24h');

      updateTimeRange('test-update-chart', '7d');
      const configAfter = JSON.parse(container.dataset.chartConfig);
      expect(configAfter.timeRange).toBe('7d');

      document.body.removeChild(container);
    });
  });
});
