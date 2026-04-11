// RiskAssessment shape:
// { id, userId, riskLevel, riskColor, triggerData, description, recommendations, timestamp, notificationSent }

// Simple ID generator (crypto.randomUUID when available, otherwise manual)
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Determine risk level string from health data.
 * @param {{ heartRate?: import('../health-monitor/healthMonitor.js').HeartRateReading, bloodPressure?: import('../health-monitor/healthMonitor.js').BloodPressureReading, calorieIntake?: object }} data
 * @returns {'low'|'medium'|'high'}
 */
function _determineRiskLevel(data) {
  const { heartRate, bloodPressure } = data || {};

  // HIGH: heartRate.isAbnormal === true OR bloodPressure.riskLevel === 'hypertension'
  if (heartRate?.isAbnormal === true || bloodPressure?.riskLevel === 'hypertension') {
    return 'high';
  }

  // MEDIUM: bloodPressure.riskLevel === 'elevated' OR (bpm exists and (bpm < 60 || bpm > 90))
  if (
    bloodPressure?.riskLevel === 'elevated' ||
    (heartRate?.bpm !== undefined && (heartRate.bpm < 60 || heartRate.bpm > 90))
  ) {
    return 'medium';
  }

  // LOW: everything else
  return 'low';
}

const COLOR_MAP = {
  low: 'green',
  medium: 'yellow',
  high: 'red',
};

const DESCRIPTION_MAP = {
  low: 'Kondisi kesehatan Anda dalam batas normal. Pertahankan gaya hidup sehat.',
  medium: 'Terdeteksi indikasi risiko PTM sedang. Perhatikan pola hidup Anda.',
  high: 'Terdeteksi kondisi risiko PTM tinggi. Segera ambil tindakan.',
};

/**
 * Analyze health data and produce a RiskAssessment.
 * @param {{ heartRate?: object, bloodPressure?: object, calorieIntake?: object }} data
 * @returns {object} RiskAssessment
 */
export function analyzeRisk(data) {
  const riskLevel = _determineRiskLevel(data);
  const riskColor = COLOR_MAP[riskLevel];
  const recommendations = getRecommendations(riskLevel);

  return {
    id: generateId(),
    userId: data?.heartRate?.userId || data?.bloodPressure?.userId || 'unknown',
    riskLevel,
    riskColor,
    triggerData: {
      heartRate: data?.heartRate || null,
      bloodPressure: data?.bloodPressure || null,
      calorieIntake: data?.calorieIntake || null,
    },
    description: DESCRIPTION_MAP[riskLevel],
    recommendations,
    timestamp: new Date(),
    notificationSent: false,
  };
}

/**
 * Classify risk level from an existing RiskAssessment.
 * @param {object} assessment
 * @returns {'low'|'medium'|'high'}
 */
export function classifyRisk(assessment) {
  const level = assessment?.riskLevel;
  if (level === 'low' || level === 'medium' || level === 'high') {
    return level;
  }
  // Re-derive from triggerData if riskLevel is missing/invalid
  return _determineRiskLevel(assessment?.triggerData || {});
}

/**
 * Trigger a browser Notification for the given assessment.
 * Falls back to console.log if Notification API is unavailable or permission not granted.
 * @param {object} assessment
 */
export function triggerNotification(assessment) {
  const title = `PANTAS — Risiko PTM: ${assessment.riskLevel.toUpperCase()}`;
  const body = assessment.description;

  if (typeof Notification === 'undefined') {
    console.log(`[PANTAS Notification] ${title}: ${body}`);
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, { body });
      } else {
        console.log(`[PANTAS Notification] ${title}: ${body}`);
      }
    });
  } else {
    console.log(`[PANTAS Notification] ${title}: ${body}`);
  }
}

/**
 * Get recommendations for a given risk level.
 * For 'high', MUST include at least one recommendation mentioning 'dokter'.
 * @param {'low'|'medium'|'high'} riskLevel
 * @returns {string[]}
 */
export function getRecommendations(riskLevel) {
  switch (riskLevel) {
    case 'high':
      return [
        'Segera konsultasikan kondisi Anda dengan dokter',
        'Hindari aktivitas fisik berat',
        'Pantau tanda-tanda vital secara ketat',
        'Hubungi layanan darurat jika kondisi memburuk',
      ];
    case 'medium':
      return [
        'Kurangi konsumsi garam dan lemak',
        'Tingkatkan aktivitas fisik',
        'Pantau tekanan darah secara rutin',
        'Pertimbangkan konsultasi dengan dokter',
      ];
    case 'low':
    default:
      return [
        'Pertahankan gaya hidup sehat',
        'Olahraga rutin 30 menit per hari',
        'Konsumsi makanan bergizi seimbang',
      ];
  }
}
