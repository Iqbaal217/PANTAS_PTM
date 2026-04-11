/**
 * Health_Repository — Penyimpanan data kesehatan dengan enkripsi dan offline-first
 * Menggunakan localStorage sebagai penyimpanan persisten dengan enkripsi XOR + Base64
 */

// Storage keys
const KEYS = {
  HEART_RATE: 'pantas_heart_rate',
  BLOOD_PRESSURE: 'pantas_blood_pressure',
  CALORIE: 'pantas_calorie',
  RISK_NOTIFICATION: 'pantas_risk_notification',
  OFFLINE_QUEUE: 'pantas_offline_queue',
};

// Encryption key
const ENCRYPTION_KEY = 'PANTAS2024';

// ─── Enkripsi / Dekripsi ────────────────────────────────────────────────────

/**
 * Enkripsi data: JSON.stringify → XOR tiap karakter dengan key → btoa
 * @param {*} data
 * @returns {string} encrypted Base64 string
 */
function encrypt(data) {
  const json = JSON.stringify(data);
  let result = '';
  for (let i = 0; i < json.length; i++) {
    const charCode = json.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result);
}

/**
 * Dekripsi data: atob → XOR tiap karakter dengan key → JSON.parse
 * @param {string} data encrypted Base64 string
 * @returns {*} parsed data
 */
function decrypt(data) {
  const decoded = atob(data);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return JSON.parse(result);
}

// ─── Internal store helpers ─────────────────────────────────────────────────

/**
 * Ambil dan dekripsi data dari localStorage
 * @param {string} key storage key
 * @returns {Array} array of records
 */
export function _getStore(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return decrypt(raw);
  } catch {
    return [];
  }
}

/**
 * Enkripsi dan simpan data ke localStorage
 * @param {string} key storage key
 * @param {Array} data array of records
 */
export function _setStore(key, data) {
  localStorage.setItem(key, encrypt(data));
}

// ─── Mapping dataType ke storage key ───────────────────────────────────────

const DATA_TYPE_KEY_MAP = {
  heart_rate: KEYS.HEART_RATE,
  blood_pressure: KEYS.BLOOD_PRESSURE,
  calorie: KEYS.CALORIE,
  risk_notification: KEYS.RISK_NOTIFICATION,
};

// ─── CRUD Functions ─────────────────────────────────────────────────────────

/**
 * Simpan pembacaan detak jantung
 * @param {Object} reading HeartRateReading
 */
export async function saveHeartRate(reading) {
  if (!navigator.onLine) {
    const queue = _getStore(KEYS.OFFLINE_QUEUE);
    queue.push({ dataType: 'heart_rate', data: reading });
    _setStore(KEYS.OFFLINE_QUEUE, queue);
    return;
  }
  const store = _getStore(KEYS.HEART_RATE);
  store.push(reading);
  _setStore(KEYS.HEART_RATE, store);
}

/**
 * Simpan pembacaan tekanan darah
 * @param {Object} reading BloodPressureReading
 */
export async function saveBloodPressure(reading) {
  if (!navigator.onLine) {
    const queue = _getStore(KEYS.OFFLINE_QUEUE);
    queue.push({ dataType: 'blood_pressure', data: reading });
    _setStore(KEYS.OFFLINE_QUEUE, queue);
    return;
  }
  const store = _getStore(KEYS.BLOOD_PRESSURE);
  store.push(reading);
  _setStore(KEYS.BLOOD_PRESSURE, store);
}

/**
 * Simpan asupan kalori
 * @param {Object} entry CalorieEntry
 */
export async function saveCalorieIntake(entry) {
  if (!navigator.onLine) {
    const queue = _getStore(KEYS.OFFLINE_QUEUE);
    queue.push({ dataType: 'calorie', data: entry });
    _setStore(KEYS.OFFLINE_QUEUE, queue);
    return;
  }
  const store = _getStore(KEYS.CALORIE);
  store.push(entry);
  _setStore(KEYS.CALORIE, store);
}

/**
 * Simpan notifikasi risiko
 * @param {Object} notification RiskNotification
 */
export async function saveRiskNotification(notification) {
  if (!navigator.onLine) {
    const queue = _getStore(KEYS.OFFLINE_QUEUE);
    queue.push({ dataType: 'risk_notification', data: notification });
    _setStore(KEYS.OFFLINE_QUEUE, queue);
    return;
  }
  const store = _getStore(KEYS.RISK_NOTIFICATION);
  store.push(notification);
  _setStore(KEYS.RISK_NOTIFICATION, store);
}

// ─── getHistory ─────────────────────────────────────────────────────────────

/**
 * Ambil riwayat data kesehatan berdasarkan filter
 * @param {{ dataType: string, startDate?: Date|string, endDate?: Date|string, userId?: string }} filter
 * @returns {Promise<Array>} filtered records
 */
export async function getHistory(filter = {}) {
  const { dataType = 'all', startDate, endDate, userId } = filter;

  // Kumpulkan records sesuai dataType
  let records = [];
  if (dataType === 'all') {
    records = [
      ..._getStore(KEYS.HEART_RATE),
      ..._getStore(KEYS.BLOOD_PRESSURE),
      ..._getStore(KEYS.CALORIE),
      ..._getStore(KEYS.RISK_NOTIFICATION),
    ];
  } else {
    const key = DATA_TYPE_KEY_MAP[dataType];
    if (key) {
      records = _getStore(key);
    }
  }

  // Filter berdasarkan rentang tanggal
  if (startDate !== undefined && startDate !== null) {
    const start = new Date(startDate).getTime();
    records = records.filter((r) => new Date(r.timestamp).getTime() >= start);
  }
  if (endDate !== undefined && endDate !== null) {
    const end = new Date(endDate).getTime();
    records = records.filter((r) => new Date(r.timestamp).getTime() <= end);
  }

  // Filter berdasarkan userId jika diberikan
  if (userId !== undefined && userId !== null) {
    records = records.filter((r) => r.userId === userId);
  }

  return records;
}

// ─── Offline Sync ────────────────────────────────────────────────────────────

/**
 * Sinkronisasi data offline queue ke penyimpanan utama
 */
export async function syncOfflineData() {
  const queue = _getStore(KEYS.OFFLINE_QUEUE);
  if (queue.length === 0) return;

  for (const item of queue) {
    const key = DATA_TYPE_KEY_MAP[item.dataType];
    if (key) {
      const store = _getStore(key);
      store.push(item.data);
      _setStore(key, store);
    }
  }

  // Kosongkan queue setelah sinkronisasi
  _setStore(KEYS.OFFLINE_QUEUE, []);
}
