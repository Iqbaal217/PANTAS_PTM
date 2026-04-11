/**
 * Kalori_Detector — Deteksi Kalori Makanan Berbasis AI (Mock)
 *
 * FoodAnalysisResult shape:
 * { id, userId, foodName, calories, carbohydrates, protein, fat, imageUrl, timestamp, confidence }
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Mock Food Database ────────────────────────────────────────────────────────

const FOOD_DATABASE = [
  { foodName: 'Nasi Goreng',   calories: 350, carbohydrates: 45, protein: 12, fat: 14 },
  { foodName: 'Gado-gado',     calories: 280, carbohydrates: 30, protein: 10, fat: 15 },
  { foodName: 'Soto Ayam',     calories: 220, carbohydrates: 20, protein: 18, fat: 8  },
  { foodName: 'Rendang',       calories: 450, carbohydrates: 5,  protein: 35, fat: 30 },
  { foodName: 'Mie Goreng',    calories: 380, carbohydrates: 55, protein: 10, fat: 16 },
  { foodName: 'Tempe Goreng',  calories: 190, carbohydrates: 12, protein: 14, fat: 10 },
];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Buka kamera menggunakan Web Camera API.
 * Mengembalikan Blob gambar dari kamera.
 * Jika getUserMedia tidak tersedia, melempar Error.
 *
 * @returns {Promise<Blob>}
 */
export async function openCamera() {
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== 'function'
  ) {
    throw new Error('Kamera tidak tersedia');
  }

  // Request camera access
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });

  // Stop all tracks immediately after obtaining permission (mock capture)
  stream.getTracks().forEach((track) => track.stop());

  // Return a mock Blob representing the captured image
  return new Blob(['mock-image'], { type: 'image/jpeg' });
}

/**
 * Analisis gambar makanan menggunakan mock AI.
 * Memilih secara acak dari database makanan Indonesia.
 * Ada 15% kemungkinan gagal mengidentifikasi makanan.
 *
 * @param {Blob} imageBlob
 * @returns {Promise<FoodAnalysisResult>}
 */
export async function analyzeFood(imageBlob) {
  // Simulate async AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 15% chance of failure
  if (Math.random() < 0.15) {
    throw new Error(
      'Tidak dapat mengidentifikasi makanan. Coba foto ulang dengan pencahayaan lebih baik.'
    );
  }

  // Pick a random food from the database
  const food = FOOD_DATABASE[Math.floor(Math.random() * FOOD_DATABASE.length)];

  /** @type {FoodAnalysisResult} */
  const result = {
    id: generateId(),
    userId: 'user-001',
    foodName: food.foodName,
    calories: food.calories,
    carbohydrates: food.carbohydrates,
    protein: food.protein,
    fat: food.fat,
    imageUrl: imageBlob instanceof Blob ? URL.createObjectURL(imageBlob) : '',
    timestamp: new Date(),
    confidence: parseFloat((0.75 + Math.random() * 0.24).toFixed(2)), // 0.75 – 0.99
  };

  return result;
}

/**
 * Simpan hasil deteksi ke localStorage di bawah key 'pantas_calorie_history'.
 *
 * @param {FoodAnalysisResult} result
 * @returns {Promise<void>}
 */
export async function saveDetectionResult(result) {
  const existing = getDetectionHistory();
  existing.push(result);
  localStorage.setItem('pantas_calorie_history', JSON.stringify(existing));
}

/**
 * Ambil riwayat deteksi dari localStorage.
 *
 * @returns {FoodAnalysisResult[]}
 */
export function getDetectionHistory() {
  try {
    const raw = localStorage.getItem('pantas_calorie_history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
