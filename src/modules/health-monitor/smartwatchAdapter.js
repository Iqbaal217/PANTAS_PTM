/**
 * Smartwatch Adapter — Web Bluetooth API dengan fallback ke mock data.
 *
 * Mendukung standar GATT BLE:
 *   - Heart Rate Service (0x180D) → Heart Rate Measurement (0x2A37)
 *   - Blood Pressure Service (0x1810) → Blood Pressure Measurement (0x2A35)
 *
 * Fallback otomatis ke mock data jika:
 *   - Web Bluetooth tidak tersedia (non-Chrome/Edge, atau HTTP)
 *   - User menolak permission
 *   - Device tidak ditemukan
 */

// ── State ────────────────────────────────────────────────────
let _device = null;
let _server = null;
let _connected = false;
let _useMock = false;

// Callbacks yang dipasang dari luar
let _onHeartRate = null;
let _onBloodPressure = null;
let _onConnectionChange = null;

// ── BLE Service / Characteristic UUIDs ──────────────────────
const HEART_RATE_SERVICE        = 0x180D;
const HEART_RATE_MEASUREMENT    = 0x2A37;
const BLOOD_PRESSURE_SERVICE    = 0x1810;
const BLOOD_PRESSURE_MEASUREMENT = 0x2A35;

// ── Cek ketersediaan Web Bluetooth ──────────────────────────
export function isBluetoothAvailable() {
  return typeof navigator !== 'undefined' &&
    typeof navigator.bluetooth !== 'undefined' &&
    typeof navigator.bluetooth.requestDevice === 'function';
}

// ── Parse Heart Rate Measurement (GATT spec) ─────────────────
function parseHeartRate(dataView) {
  const flags = dataView.getUint8(0);
  const is16bit = flags & 0x01;
  const bpm = is16bit
    ? dataView.getUint16(1, true)
    : dataView.getUint8(1);
  return bpm;
}

// ── Parse Blood Pressure Measurement (GATT spec) ─────────────
function parseBloodPressure(dataView) {
  const flags = dataView.getUint8(0);
  const isKpa = flags & 0x01; // 0 = mmHg, 1 = kPa
  // Bytes 1-2: systolic (SFLOAT), 3-4: diastolic, 5-6: MAP
  const systolic  = dataView.getInt16(1, true) / 100;
  const diastolic = dataView.getInt16(3, true) / 100;
  return {
    systolic:  isKpa ? Math.round(systolic  * 7.50062) : Math.round(systolic),
    diastolic: isKpa ? Math.round(diastolic * 7.50062) : Math.round(diastolic),
  };
}

// ── Connect via Web Bluetooth ────────────────────────────────
export async function connect() {
  if (!isBluetoothAvailable()) {
    console.warn('[SmartWatch] Web Bluetooth tidak tersedia. Menggunakan mock data.');
    _useMock = true;
    _connected = true;
    _onConnectionChange?.('connected', 'mock');
    return { success: true, mode: 'mock' };
  }

  try {
    _device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: [HEART_RATE_SERVICE] },
        { services: [BLOOD_PRESSURE_SERVICE] },
        { namePrefix: 'Mi' },
        { namePrefix: 'Polar' },
        { namePrefix: 'Garmin' },
        { namePrefix: 'Fitbit' },
      ],
      optionalServices: [HEART_RATE_SERVICE, BLOOD_PRESSURE_SERVICE],
    });

    _device.addEventListener('gattserverdisconnected', _onDisconnected);

    _server = await _device.gatt.connect();
    _connected = true;
    _useMock = false;

    // Subscribe Heart Rate
    try {
      const hrService = await _server.getPrimaryService(HEART_RATE_SERVICE);
      const hrChar    = await hrService.getCharacteristic(HEART_RATE_MEASUREMENT);
      await hrChar.startNotifications();
      hrChar.addEventListener('characteristicvaluechanged', (e) => {
        const bpm = parseHeartRate(e.target.value);
        _onHeartRate?.({ bpm, timestamp: new Date() });
      });
    } catch {
      console.warn('[SmartWatch] Heart Rate Service tidak tersedia di device ini.');
    }

    // Subscribe Blood Pressure
    try {
      const bpService = await _server.getPrimaryService(BLOOD_PRESSURE_SERVICE);
      const bpChar    = await bpService.getCharacteristic(BLOOD_PRESSURE_MEASUREMENT);
      await bpChar.startNotifications();
      bpChar.addEventListener('characteristicvaluechanged', (e) => {
        const { systolic, diastolic } = parseBloodPressure(e.target.value);
        _onBloodPressure?.({ systolic, diastolic, timestamp: new Date() });
      });
    } catch {
      console.warn('[SmartWatch] Blood Pressure Service tidak tersedia di device ini.');
    }

    _onConnectionChange?.('connected', 'bluetooth', _device.name);
    return { success: true, mode: 'bluetooth', deviceName: _device.name };

  } catch (err) {
    if (err.name === 'NotFoundError') {
      // User cancel — tidak fallback ke mock, biarkan user coba lagi
      return { success: false, error: 'Tidak ada perangkat dipilih.' };
    }
    // Error lain — fallback ke mock
    console.warn('[SmartWatch] Bluetooth gagal, fallback ke mock:', err.message);
    _useMock = true;
    _connected = true;
    _onConnectionChange?.('connected', 'mock');
    return { success: true, mode: 'mock', fallback: true };
  }
}

// ── Disconnect ───────────────────────────────────────────────
export function disconnect() {
  if (_device?.gatt?.connected) {
    _device.gatt.disconnect();
  }
  _connected = false;
  _useMock = false;
  _device = null;
  _server = null;
  _onConnectionChange?.('disconnected');
}

function _onDisconnected() {
  _connected = false;
  _onConnectionChange?.('disconnected');
}

// ── Register callbacks ───────────────────────────────────────
export function onHeartRate(cb)        { _onHeartRate = cb; }
export function onBloodPressure(cb)    { _onBloodPressure = cb; }
export function onConnectionChange(cb) { _onConnectionChange = cb; }

// ── Status ───────────────────────────────────────────────────
export function isConnected() { return _connected; }
export function isMockMode()  { return _useMock; }
export function getDeviceName() {
  return _device?.name ?? (_useMock ? 'Simulasi' : null);
}

// ── Mock data generator (fallback / testing) ─────────────────
let _mockInterval = null;

export function startMock(intervalMs = 5000) {
  _useMock = true;
  _connected = true;
  _onConnectionChange?.('connected', 'mock');

  _mockInterval = setInterval(() => {
    // Simulasi variasi realistis
    const bpm      = Math.floor(62 + Math.random() * 36);   // 62–97
    const systolic = Math.floor(108 + Math.random() * 38);  // 108–145
    const diastolic = Math.floor(68 + Math.random() * 24);  // 68–91
    const ts = new Date();

    _onHeartRate?.({ bpm, timestamp: ts });
    _onBloodPressure?.({ systolic, diastolic, timestamp: ts });
  }, intervalMs);
}

export function stopMock() {
  if (_mockInterval) {
    clearInterval(_mockInterval);
    _mockInterval = null;
  }
}

// ── Legacy: generateReading() untuk kompatibilitas tests ─────
export function generateReading() {
  if (!_connected) return null;
  const bpm      = Math.floor(62 + Math.random() * 36);
  const systolic = Math.floor(108 + Math.random() * 38);
  const diastolic = Math.floor(68 + Math.random() * 24);
  return { bpm, systolic, diastolic, timestamp: new Date() };
}
