/**
 * Chart_Renderer — Visualisasi Grafik Recharts
 * Vanilla JS module; Recharts available via window.Recharts (CDN) or as npm package.
 */

// Internal store: maps containerId → { data, timeRange }
const chartStore = {};

/**
 * Task 7.1 / 7.6 — Time range filtering helper
 * Returns a Date representing the start of the given time range.
 * @param {'24h'|'7d'|'30d'} timeRange
 * @returns {Date}
 */
function getStartDate(timeRange) {
  const now = new Date();
  switch (timeRange) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}

/**
 * Task 7.1 — Format raw readings into ChartDataPoint array.
 * Filters readings to the specified time range.
 *
 * For HeartRateReading: { timestamp: string (ISO), value: number (bpm) }
 * For BloodPressureReading: { timestamp: string (ISO), systolic: number, diastolic: number }
 *
 * @param {Array} readings - Array of HeartRateReading or BloodPressureReading
 * @param {'24h'|'7d'|'30d'} timeRange
 * @returns {Array<ChartDataPoint>}
 */
export function formatChartData(readings, timeRange) {
  if (!Array.isArray(readings)) return [];

  const startDate = getStartDate(timeRange);

  return readings
    .filter((r) => {
      const ts = r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp);
      return ts >= startDate;
    })
    .map((r) => {
      const ts = r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp);
      const isoTimestamp = ts.toISOString();

      // BloodPressureReading has systolic/diastolic
      if (r.systolic !== undefined && r.diastolic !== undefined) {
        return {
          timestamp: isoTimestamp,
          systolic: Number(r.systolic),
          diastolic: Number(r.diastolic),
        };
      }

      // HeartRateReading has bpm
      return {
        timestamp: isoTimestamp,
        value: Number(r.bpm !== undefined ? r.bpm : r.value),
      };
    });
}

/**
 * Task 7.2 / 7.4 — Get heart rate chart configuration object.
 * Includes reference lines for normal BPM range (50–100).
 *
 * @param {Array<ChartDataPoint>} data
 * @param {'24h'|'7d'|'30d'} timeRange
 * @returns {object}
 */
export function getHeartRateChartConfig(data, timeRange) {
  return {
    type: 'line',
    data,
    xKey: 'timestamp',
    yKey: 'value',
    referenceLines: [
      { y: 50, label: 'Min Normal' },
      { y: 100, label: 'Max Normal' },
    ],
    timeRange,
  };
}

/**
 * Task 7.3 / 7.4 — Get blood pressure chart configuration object.
 * Includes two lines (systolic, diastolic) and reference lines for normal ranges.
 *
 * @param {Array<ChartDataPoint>} data
 * @param {'24h'|'7d'|'30d'} timeRange
 * @returns {object}
 */
export function getBloodPressureChartConfig(data, timeRange) {
  return {
    type: 'line',
    data,
    xKey: 'timestamp',
    lines: ['systolic', 'diastolic'],
    referenceLines: [
      { y: 90, label: 'Sistolik Min' },
      { y: 140, label: 'Sistolik Max' },
      { y: 60, label: 'Diastolik Min' },
      { y: 90, label: 'Diastolik Max' },
    ],
    timeRange,
  };
}

/**
 * Task 7.5 — Tooltip formatter.
 * Returns a human-readable string with value and timestamp.
 *
 * @param {number} value
 * @param {string|Date} timestamp
 * @returns {string}
 */
export function tooltipFormatter(value, timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const formatted = date.toLocaleString();
  return `Nilai: ${value} | Waktu: ${formatted}`;
}

/**
 * Internal helper — render chart into a DOM container.
 * Uses Recharts UMD API if available; otherwise stores config in dataset for testing.
 *
 * @param {string} containerId
 * @param {object} config
 */
function _renderChart(containerId, config) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Store config for re-render and testing
  container.dataset.chartConfig = JSON.stringify(config);

  // Use Recharts if available (browser environment)
  if (typeof window !== 'undefined' && window.Recharts) {
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } =
      window.Recharts;

    const { data, xKey, referenceLines } = config;

    // Build lines array
    const lines = config.lines
      ? config.lines
      : config.yKey
      ? [config.yKey]
      : [];

    const lineColors = {
      value: '#8884d8',
      systolic: '#ff4444',
      diastolic: '#4444ff',
    };

    // Recharts requires React — use createElement pattern via window.React if available
    if (typeof window.React !== 'undefined' && typeof window.ReactDOM !== 'undefined') {
      const { createElement: h } = window.React;

      const chartElement = h(
        ResponsiveContainer,
        { width: '100%', height: 300 },
        h(
          LineChart,
          { data },
          h(CartesianGrid, { strokeDasharray: '3 3' }),
          h(XAxis, { dataKey: xKey }),
          h(YAxis, null),
          h(Tooltip, {
            formatter: (val, _name, props) =>
              tooltipFormatter(val, props?.payload?.timestamp || ''),
          }),
          h(Legend, null),
          ...lines.map((key) =>
            h(Line, {
              key,
              type: 'monotone',
              dataKey: key,
              stroke: lineColors[key] || '#8884d8',
              dot: false,
            })
          ),
          ...(referenceLines || []).map((rl) =>
            h(ReferenceLine, {
              key: `${rl.y}-${rl.label}`,
              y: rl.y,
              label: rl.label,
              stroke: 'red',
              strokeDasharray: '3 3',
            })
          )
        )
      );

      window.ReactDOM.render(chartElement, container);
    }
  }
}

/**
 * Task 7.2 — Render heart rate chart into DOM container.
 *
 * @param {string} containerId
 * @param {Array} data - HeartRateReading[]
 * @param {'24h'|'7d'|'30d'} timeRange
 */
export function renderHeartRateChart(containerId, data, timeRange) {
  const formatted = formatChartData(data, timeRange);
  const config = getHeartRateChartConfig(formatted, timeRange);

  // Store for updateTimeRange
  chartStore[containerId] = { rawData: data, timeRange, type: 'heartRate' };

  _renderChart(containerId, config);
}

/**
 * Task 7.3 — Render blood pressure chart into DOM container.
 *
 * @param {string} containerId
 * @param {Array} data - BloodPressureReading[]
 * @param {'24h'|'7d'|'30d'} timeRange
 */
export function renderBloodPressureChart(containerId, data, timeRange) {
  const formatted = formatChartData(data, timeRange);
  const config = getBloodPressureChartConfig(formatted, timeRange);

  // Store for updateTimeRange
  chartStore[containerId] = { rawData: data, timeRange, type: 'bloodPressure' };

  _renderChart(containerId, config);
}

/**
 * Task 7.6 — Update chart time range and re-render.
 *
 * @param {string} chartId - DOM container id
 * @param {'24h'|'7d'|'30d'} timeRange
 */
export function updateTimeRange(chartId, timeRange) {
  const stored = chartStore[chartId];
  if (!stored) return;

  stored.timeRange = timeRange;

  if (stored.type === 'heartRate') {
    renderHeartRateChart(chartId, stored.rawData, timeRange);
  } else if (stored.type === 'bloodPressure') {
    renderBloodPressureChart(chartId, stored.rawData, timeRange);
  }
}
