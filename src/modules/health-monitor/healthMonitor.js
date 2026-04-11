/**
 * Health Monitor — mengelola penerimaan dan pemrosesan data biometrik dari smartwatch.
 * Mendukung Web Bluetooth API via smartwatchAdapter, dengan fallback ke mock.
 */

import eventBus from '../../utils/eventBus.js';
import * as smartwatchAdapter from './smartwatchAdapter.js';

// Internal state
let _connectionStatus = 'disconnected';
let _lastReading = { heartRate: null, bloodPressure: null };
let _intervalId = null;

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

const DEFAULT_USER_ID = 'user-001';

export function processHeartRate(bpm, timestamp) {
  return {
    id: generateId(),
    userId: DEFAULT_USER_ID,
    bpm,
    timestamp,
    source: 'smartwatch',
    isAbnormal: bpm < 50 || bpm > 100,
  };
}

export function processBloodPressure(systolic, diastolic, timestamp) {
  let riskLevel;
  if (systolic > 140 || diastolic > 90) {
    riskLevel = 'hypertension';
  } else if (systolic > 120 || diastolic > 80) {
    riskLevel = 'elevated';
  } else {
    riskLevel = 'normal';
  }
  return {
    id: generateId(),
    userId: DEFAULT_USER_ID,
    systolic,
    diastolic,
    timestamp,
    source: 'smartwatch',
    riskLevel,
  };
}

export function getConnectionStatus() { return _connectionStatus; }
export function getLastReading()      { return { ..._lastReading }; }
export function setConnectionStatus(status) { _connectionStatus = status; }

/**
 * Connect ke smartwatch via Web Bluetooth.
 * Jika Bluetooth tidak tersedia, otomatis fallback ke mock.
 * @returns {Promise<{ success: boolean, mode: string, deviceName?: string }>}
 */
export async function connectSmartwatch() {
  // Register callbacks sebelum connect
  smartwatchAdapter.onHeartRate(({ bpm, timestamp }) => {
    const heartRate = processHeartRate(bpm, timestamp);
    _lastReading.heartRate = heartRate;
    eventBus.emit('health:update', {
      connectionStatus: _connectionStatus,
      lastReading: getLastReading(),
    });
  });

  smartwatchAdapter.onBloodPressure(({ systolic, diastolic, timestamp }) => {
    const bloodPressure = processBloodPressure(systolic, diastolic, timestamp);
    _lastReading.bloodPressure = bloodPressure;
    eventBus.emit('health:update', {
      connectionStatus: _connectionStatus,
      lastReading: getLastReading(),
    });
  });

  smartwatchAdapter.onConnectionChange((status, mode, deviceName) => {
    _connectionStatus = status;
    eventBus.emit('health:connection', { status, mode, deviceName });
    eventBus.emit('health:update', {
      connectionStatus: _connectionStatus,
      lastReading: getLastReading(),
    });
  });

  const result = await smartwatchAdapter.connect();

  if (result.success) {
    _connectionStatus = 'connected';
    // Jika mode mock, mulai interval mock
    if (result.mode === 'mock') {
      smartwatchAdapter.startMock(5000);
    }
  }

  return result;
}

/**
 * Disconnect dari smartwatch.
 */
export function disconnectSmartwatch() {
  smartwatchAdapter.stopMock();
  smartwatchAdapter.disconnect();
  _connectionStatus = 'disconnected';
  eventBus.emit('health:connection', { status: 'disconnected' });
}

/**
 * Start polling (legacy / fallback interval-based).
 * Digunakan jika connectSmartwatch() tidak dipanggil.
 */
export function startMonitoring(intervalMs) {
  if (_intervalId !== null) stopMonitoring();

  _intervalId = setInterval(() => {
    const raw = smartwatchAdapter.generateReading();

    if (raw === null) {
      _connectionStatus = 'disconnected';
      eventBus.emit('health:update', {
        connectionStatus: _connectionStatus,
        lastReading: getLastReading(),
      });
      return;
    }

    _connectionStatus = 'connected';
    const heartRate    = processHeartRate(raw.bpm, raw.timestamp);
    const bloodPressure = processBloodPressure(raw.systolic, raw.diastolic, raw.timestamp);
    _lastReading = { heartRate, bloodPressure };

    eventBus.emit('health:update', {
      connectionStatus: _connectionStatus,
      lastReading: getLastReading(),
    });
  }, intervalMs);
}

export function stopMonitoring() {
  if (_intervalId !== null) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}
