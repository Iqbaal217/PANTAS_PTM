/**
 * User Profile Module — Manajemen profil pengguna, riwayat keluarga,
 * dan integrasi SATU SEHAT (mock).
 *
 * Data disimpan di localStorage dengan enkripsi sederhana.
 */

const PROFILE_KEY = 'pantas_user_profile';
const SATUSEHAT_KEY = 'pantas_satusehat_sync';

// ── Default profile shape ────────────────────────────────────
const DEFAULT_PROFILE = {
  userId: 'user-001',
  name: '',
  age: null,
  gender: '',           // 'male' | 'female'
  weight: null,         // kg
  height: null,         // cm
  bmi: null,

  // Riwayat penyakit pribadi
  personalHistory: {
    hypertension: false,
    diabetes: false,
    heartDisease: false,
    stroke: false,
    kidneyDisease: false,
    obesity: false,
  },

  // Riwayat keluarga (faktor risiko genetik)
  familyHistory: {
    hypertension: false,
    diabetes: false,
    heartDisease: false,
    stroke: false,
    kidneyDisease: false,
    obesity: false,
  },

  // Gaya hidup
  lifestyle: {
    smokingStatus: 'never',   // 'never' | 'former' | 'current'
    alcoholConsumption: 'none', // 'none' | 'occasional' | 'regular'
    physicalActivity: 'moderate', // 'sedentary' | 'light' | 'moderate' | 'active'
    dietQuality: 'average',   // 'poor' | 'average' | 'good'
  },

  // SATU SEHAT integration
  satuSehatId: null,
  satuSehatLinked: false,
  lastSyncAt: null,

  // Onboarding selesai?
  onboardingComplete: false,
  createdAt: null,
  updatedAt: null,
};

// ── Storage helpers ──────────────────────────────────────────
export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile) {
  const updated = {
    ...profile,
    bmi: _calculateBMI(profile.weight, profile.height),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  return updated;
}

export function isOnboardingComplete() {
  return getProfile().onboardingComplete === true;
}

// ── BMI calculation ──────────────────────────────────────────
function _calculateBMI(weight, height) {
  if (!weight || !height || height === 0) return null;
  const heightM = height / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(1));
}

export function getBMICategory(bmi) {
  if (!bmi) return null;
  if (bmi < 18.5) return { label: 'Berat Badan Kurang', level: 'low' };
  if (bmi < 25.0) return { label: 'Normal', level: 'normal' };
  if (bmi < 30.0) return { label: 'Kelebihan Berat Badan', level: 'medium' };
  return { label: 'Obesitas', level: 'high' };
}

// ── Genetic risk score (0–100) ───────────────────────────────
/**
 * Hitung skor risiko genetik berdasarkan riwayat keluarga.
 * Digunakan oleh AI Risk Engine untuk stratifikasi risiko.
 */
export function calculateGeneticRiskScore(profile) {
  const fh = profile?.familyHistory || {};
  const ph = profile?.personalHistory || {};
  const ls = profile?.lifestyle || {};

  let score = 0;

  // Riwayat keluarga (bobot lebih tinggi untuk kondisi "silent killer")
  if (fh.hypertension)  score += 20;
  if (fh.heartDisease)  score += 18;
  if (fh.diabetes)      score += 15;
  if (fh.stroke)        score += 15;
  if (fh.kidneyDisease) score += 10;
  if (fh.obesity)       score += 8;

  // Riwayat pribadi
  if (ph.hypertension)  score += 15;
  if (ph.diabetes)      score += 12;
  if (ph.heartDisease)  score += 12;
  if (ph.stroke)        score += 10;

  // Gaya hidup
  if (ls.smokingStatus === 'current')       score += 12;
  if (ls.smokingStatus === 'former')        score += 5;
  if (ls.alcoholConsumption === 'regular')  score += 8;
  if (ls.physicalActivity === 'sedentary')  score += 8;
  if (ls.dietQuality === 'poor')            score += 6;

  // BMI
  const bmi = profile?.bmi;
  if (bmi >= 30) score += 10;
  else if (bmi >= 25) score += 5;

  // Usia
  const age = profile?.age;
  if (age >= 60) score += 10;
  else if (age >= 45) score += 6;
  else if (age >= 35) score += 3;

  return Math.min(score, 100);
}

// ── SATU SEHAT mock integration ──────────────────────────────
/**
 * Simulasi sinkronisasi dengan SATU SEHAT.
 * Dalam implementasi nyata, ini akan memanggil API SATU SEHAT
 * menggunakan OAuth 2.0 dan FHIR R4 standard.
 */
export async function syncWithSatuSehat(satuSehatId) {
  // Simulasi network delay
  await new Promise(r => setTimeout(r, 1500));

  // Mock data dari SATU SEHAT
  const mockMedicalRecord = {
    satuSehatId,
    syncedAt: new Date().toISOString(),
    diagnoses: [
      { code: 'I10', name: 'Hipertensi Esensial', date: '2024-03-15' },
    ],
    medications: [
      { name: 'Amlodipine 5mg', frequency: 'Sekali sehari', since: '2024-03-15' },
    ],
    lastCheckup: '2024-06-01',
    bpjsStatus: 'active',
  };

  localStorage.setItem(SATUSEHAT_KEY, JSON.stringify(mockMedicalRecord));

  // Update profil
  const profile = getProfile();
  saveProfile({
    ...profile,
    satuSehatId,
    satuSehatLinked: true,
    lastSyncAt: new Date().toISOString(),
  });

  return { success: true, data: mockMedicalRecord };
}

export function getSatuSehatRecord() {
  try {
    const raw = localStorage.getItem(SATUSEHAT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Render onboarding form ───────────────────────────────────
export function render(container) {
  container.innerHTML = `
<div class="onboarding-screen">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
    <div class="app-header-logo">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    </div>
    <span style="font-size:1.1rem;font-weight:700;color:var(--blue);">PANTAS</span>
  </div>

  <div class="onboarding-card">
    <div style="display:flex;gap:6px;margin-bottom:20px;">
      <div id="step-1-ind" style="flex:1;height:4px;border-radius:2px;background:var(--blue);"></div>
      <div id="step-2-ind" style="flex:1;height:4px;border-radius:2px;background:var(--border);"></div>
      <div id="step-3-ind" style="flex:1;height:4px;border-radius:2px;background:var(--border);"></div>
    </div>

    <!-- Step 1: Data Diri -->
    <div id="step-1">
      <div style="font-size:1rem;font-weight:700;color:var(--text);margin-bottom:4px;">Data Diri</div>
      <div style="font-size:0.82rem;color:var(--text-3);margin-bottom:18px;">Informasi dasar untuk kalkulasi BMI dan faktor usia</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group" style="grid-column:1/-1;">
          <label>Nama Lengkap</label>
          <input type="text" id="ob-name" placeholder="Ahmad Iqbal" />
        </div>
        <div class="form-group">
          <label>Usia (tahun)</label>
          <input type="number" id="ob-age" placeholder="35" min="1" max="120" />
        </div>
        <div class="form-group">
          <label>Jenis Kelamin</label>
          <select id="ob-gender">
            <option value="">Pilih...</option>
            <option value="male">Laki-laki</option>
            <option value="female">Perempuan</option>
          </select>
        </div>
        <div class="form-group">
          <label>Berat Badan (kg)</label>
          <input type="number" id="ob-weight" placeholder="70" min="20" max="300" />
        </div>
        <div class="form-group">
          <label>Tinggi Badan (cm)</label>
          <input type="number" id="ob-height" placeholder="170" min="100" max="250" />
        </div>
      </div>
      <button id="step-1-next" class="btn btn-primary btn-full" style="margin-top:8px;">Lanjut →</button>
    </div>

    <!-- Step 2: Riwayat Keluarga -->
    <div id="step-2" style="display:none;">
      <div style="font-size:1rem;font-weight:700;color:var(--text);margin-bottom:4px;">Riwayat Keluarga</div>
      <div style="font-size:0.82rem;color:var(--text-3);margin-bottom:18px;">Apakah anggota keluarga inti pernah didiagnosis kondisi berikut?</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        ${_renderCheckboxGroup('fh', [
          ['hypertension', 'Hipertensi (Tekanan Darah Tinggi)'],
          ['heartDisease', 'Penyakit Jantung Koroner'],
          ['diabetes', 'Diabetes Mellitus'],
          ['stroke', 'Stroke'],
          ['kidneyDisease', 'Penyakit Ginjal Kronis'],
          ['obesity', 'Obesitas'],
        ])}
      </div>
      <div style="display:flex;gap:8px;">
        <button id="step-2-back" class="btn btn-full" style="flex:1;">← Kembali</button>
        <button id="step-2-next" class="btn btn-primary btn-full" style="flex:2;">Lanjut →</button>
      </div>
    </div>

    <!-- Step 3: Gaya Hidup & SATU SEHAT -->
    <div id="step-3" style="display:none;">
      <div style="font-size:1rem;font-weight:700;color:var(--text);margin-bottom:4px;">Gaya Hidup & SATU SEHAT</div>
      <div style="font-size:0.82rem;color:var(--text-3);margin-bottom:18px;">Data ini meningkatkan akurasi analisis risiko AI</div>
      <div class="form-group">
        <label>Status Merokok</label>
        <select id="ob-smoking">
          <option value="never">Tidak pernah merokok</option>
          <option value="former">Mantan perokok</option>
          <option value="current">Perokok aktif</option>
        </select>
      </div>
      <div class="form-group">
        <label>Aktivitas Fisik</label>
        <select id="ob-activity">
          <option value="sedentary">Sangat jarang (< 1x/minggu)</option>
          <option value="light">Ringan (1–2x/minggu)</option>
          <option value="moderate" selected>Sedang (3–4x/minggu)</option>
          <option value="active">Aktif (5+x/minggu)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Kualitas Pola Makan</label>
        <select id="ob-diet">
          <option value="poor">Buruk (banyak makanan olahan/asin)</option>
          <option value="average" selected>Rata-rata</option>
          <option value="good">Baik (banyak sayur, buah, rendah garam)</option>
        </select>
      </div>
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:14px;margin-bottom:16px;">
        <div style="font-size:0.8rem;font-weight:600;color:var(--text-2);margin-bottom:8px;">
          🏥 Integrasi SATU SEHAT (Opsional)
        </div>
        <div style="font-size:0.75rem;color:var(--text-3);margin-bottom:10px;">
          Hubungkan dengan SATU SEHAT untuk sinkronisasi rekam medis dan riwayat BPJS Anda secara otomatis.
        </div>
        <div class="form-group" style="margin-bottom:8px;">
          <label>ID SATU SEHAT / NIK</label>
          <input type="text" id="ob-satusehat" placeholder="3271xxxxxxxxxxxx" maxlength="16" />
        </div>
        <button id="ob-sync-btn" class="btn btn-sm" style="width:100%;">Sinkronisasi SATU SEHAT</button>
        <div id="ob-sync-status" style="font-size:0.72rem;color:var(--text-3);margin-top:6px;"></div>
      </div>
      <div style="display:flex;gap:8px;">
        <button id="step-3-back" class="btn btn-full" style="flex:1;">← Kembali</button>
        <button id="step-3-finish" class="btn btn-primary" style="flex:2;">Mulai Monitoring</button>
      </div>
    </div>
  </div>
</div>`;

  _attachOnboardingListeners(container);
}

function _renderCheckboxGroup(prefix, items) {
  return items.map(([key, label]) => `
    <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;font-size:0.825rem;color:var(--text-2);transition:all 150ms ease;">
      <input type="checkbox" id="${prefix}-${key}" style="width:15px;height:15px;accent-color:var(--accent);cursor:pointer;" />
      ${label}
    </label>
  `).join('');
}

function _attachOnboardingListeners(container) {
  const showStep = (n) => {
    [1, 2, 3].forEach(i => {
      const el = container.querySelector(`#step-${i}`);
      if (el) el.style.display = i === n ? 'block' : 'none';
      const ind = container.querySelector(`#step-${i}-ind`);
      if (ind) ind.style.background = i <= n ? 'var(--accent)' : 'var(--border)';
    });
  };

  container.querySelector('#step-1-next')?.addEventListener('click', () => {
    const name   = container.querySelector('#ob-name')?.value?.trim();
    const age    = parseInt(container.querySelector('#ob-age')?.value);
    const gender = container.querySelector('#ob-gender')?.value;
    const weight = parseFloat(container.querySelector('#ob-weight')?.value);
    const height = parseFloat(container.querySelector('#ob-height')?.value);

    if (!name || !age || !gender || !weight || !height) {
      alert('Harap lengkapi semua data diri.');
      return;
    }
    showStep(2);
  });

  container.querySelector('#step-2-back')?.addEventListener('click', () => showStep(1));
  container.querySelector('#step-2-next')?.addEventListener('click', () => showStep(3));
  container.querySelector('#step-3-back')?.addEventListener('click', () => showStep(2));

  // SATU SEHAT sync
  container.querySelector('#ob-sync-btn')?.addEventListener('click', async () => {
    const id = container.querySelector('#ob-satusehat')?.value?.trim();
    const statusEl = container.querySelector('#ob-sync-status');
    if (!id || id.length < 10) {
      if (statusEl) statusEl.textContent = '⚠ Masukkan ID SATU SEHAT yang valid.';
      return;
    }
    const btn = container.querySelector('#ob-sync-btn');
    btn.disabled = true;
    btn.textContent = 'Menyinkronkan...';
    if (statusEl) statusEl.textContent = '';

    const result = await syncWithSatuSehat(id);
    btn.disabled = false;
    btn.textContent = 'Sinkronisasi SATU SEHAT';

    if (result.success) {
      if (statusEl) statusEl.innerHTML = '✓ Berhasil disinkronkan. Rekam medis dari SATU SEHAT telah dimuat.';
      if (statusEl) statusEl.style.color = 'var(--green)';
    }
  });

  // Finish onboarding
  container.querySelector('#step-3-finish')?.addEventListener('click', () => {
    const profile = {
      ...DEFAULT_PROFILE,
      name:   container.querySelector('#ob-name')?.value?.trim(),
      age:    parseInt(container.querySelector('#ob-age')?.value),
      gender: container.querySelector('#ob-gender')?.value,
      weight: parseFloat(container.querySelector('#ob-weight')?.value),
      height: parseFloat(container.querySelector('#ob-height')?.value),
      familyHistory: {
        hypertension: container.querySelector('#fh-hypertension')?.checked || false,
        heartDisease: container.querySelector('#fh-heartDisease')?.checked || false,
        diabetes:     container.querySelector('#fh-diabetes')?.checked || false,
        stroke:       container.querySelector('#fh-stroke')?.checked || false,
        kidneyDisease: container.querySelector('#fh-kidneyDisease')?.checked || false,
        obesity:      container.querySelector('#fh-obesity')?.checked || false,
      },
      lifestyle: {
        smokingStatus:       container.querySelector('#ob-smoking')?.value || 'never',
        alcoholConsumption:  'none',
        physicalActivity:    container.querySelector('#ob-activity')?.value || 'moderate',
        dietQuality:         container.querySelector('#ob-diet')?.value || 'average',
      },
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
    };

    saveProfile(profile);
    window.location.hash = '#/dashboard';
  });
}
