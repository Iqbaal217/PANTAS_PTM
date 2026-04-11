/**
 * Longitudinal Analysis Engine — Analisis tren data kesehatan selama 7 hari.
 *
 * Berbeda dari analisis sesaat, modul ini mendeteksi POLA yang konsisten:
 * - Peningkatan tekanan darah sistolik selama 7 hari berturut-turut
 * - Detak jantung yang terus-menerus di luar batas normal
 * - Tren BMI meningkat
 *
 * Hasil analisis dikombinasikan dengan skor risiko genetik dari profil pengguna
 * untuk menghasilkan rekomendasi yang personal dan presisi.
 */

import { getProfile, calculateGeneticRiskScore, getSatuSehatRecord } from '../user-profile/userProfile.js';

const TREND_KEY = 'pantas_trend_data';
const MAX_HISTORY = 7; // hari

// ── Simpan reading ke trend buffer ──────────────────────────
export function recordReading(heartRate, bloodPressure) {
  const history = getTrendHistory();
  const today = new Date().toDateString();

  // Satu entry per hari (ambil rata-rata jika ada beberapa)
  const existingIdx = history.findIndex(e => e.date === today);
  const entry = {
    date: today,
    timestamp: new Date().toISOString(),
    bpm: heartRate?.bpm ?? null,
    systolic: bloodPressure?.systolic ?? null,
    diastolic: bloodPressure?.diastolic ?? null,
  };

  if (existingIdx >= 0) {
    // Update dengan rata-rata
    const existing = history[existingIdx];
    entry.bpm      = _avg(existing.bpm, heartRate?.bpm);
    entry.systolic  = _avg(existing.systolic, bloodPressure?.systolic);
    entry.diastolic = _avg(existing.diastolic, bloodPressure?.diastolic);
    history[existingIdx] = entry;
  } else {
    history.push(entry);
  }

  // Simpan hanya MAX_HISTORY hari terakhir
  const trimmed = history.slice(-MAX_HISTORY);
  localStorage.setItem(TREND_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function getTrendHistory() {
  try {
    const raw = localStorage.getItem(TREND_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function _avg(a, b) {
  if (a == null) return b;
  if (b == null) return a;
  return Math.round((a + b) / 2);
}

// ── Deteksi tren konsisten ───────────────────────────────────
/**
 * Cek apakah nilai dalam array terus meningkat (monoton naik).
 * Toleransi: boleh ada 1 hari yang tidak naik.
 */
function _isConsistentlyRising(values, minDays = 3) {
  const valid = values.filter(v => v != null);
  if (valid.length < minDays) return false;

  let risingCount = 0;
  for (let i = 1; i < valid.length; i++) {
    if (valid[i] > valid[i - 1]) risingCount++;
  }
  return risingCount >= minDays - 1;
}

/**
 * Hitung rata-rata array (abaikan null).
 */
function _mean(values) {
  const valid = values.filter(v => v != null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

// ── Analisis longitudinal utama ──────────────────────────────
/**
 * Lakukan analisis tren 7 hari dan hasilkan PTM risk assessment yang komprehensif.
 *
 * @param {{ heartRate?: object, bloodPressure?: object }} currentReading
 * @returns {LongitudinalAssessment}
 */
export function analyzeLongitudinal(currentReading = {}) {
  const history = getTrendHistory();
  const profile = getProfile();
  const satuSehat = getSatuSehatRecord();
  const geneticScore = calculateGeneticRiskScore(profile);

  const systolicValues  = history.map(e => e.systolic);
  const diastolicValues = history.map(e => e.diastolic);
  const bpmValues       = history.map(e => e.bpm);

  const avgSystolic  = _mean(systolicValues);
  const avgDiastolic = _mean(diastolicValues);
  const avgBpm       = _mean(bpmValues);

  // ── Deteksi pola risiko ──────────────────────────────────
  const patterns = [];

  // 1. Hipertensi: sistolik konsisten naik selama ≥3 hari
  if (_isConsistentlyRising(systolicValues, 3)) {
    patterns.push({
      type: 'hypertension_trend',
      severity: avgSystolic > 140 ? 'high' : 'medium',
      message: `Tekanan darah sistolik meningkat konsisten selama ${history.length} hari terakhir (rata-rata ${Math.round(avgSystolic)} mmHg).`,
      ptmType: 'Hipertensi',
    });
  }

  // 2. Hipertensi: rata-rata sistolik > 130 selama 7 hari
  if (avgSystolic > 130 && history.length >= 3) {
    patterns.push({
      type: 'hypertension_sustained',
      severity: avgSystolic > 140 ? 'high' : 'medium',
      message: `Rata-rata tekanan darah sistolik ${Math.round(avgSystolic)} mmHg selama ${history.length} hari — di atas batas normal.`,
      ptmType: 'Hipertensi',
    });
  }

  // 3. Takikardia persisten: BPM > 100 rata-rata
  if (avgBpm > 100 && history.length >= 3) {
    patterns.push({
      type: 'tachycardia_persistent',
      severity: 'medium',
      message: `Detak jantung rata-rata ${Math.round(avgBpm)} BPM selama ${history.length} hari — indikasi takikardia persisten.`,
      ptmType: 'Penyakit Jantung',
    });
  }

  // 4. Bradikardia persisten: BPM < 50 rata-rata
  if (avgBpm < 50 && avgBpm > 0 && history.length >= 3) {
    patterns.push({
      type: 'bradycardia_persistent',
      severity: 'medium',
      message: `Detak jantung rata-rata ${Math.round(avgBpm)} BPM — indikasi bradikardia persisten.`,
      ptmType: 'Penyakit Jantung',
    });
  }

  // 5. Risiko stroke: sistolik > 160 + riwayat keluarga stroke
  if (avgSystolic > 160 && profile.familyHistory?.stroke) {
    patterns.push({
      type: 'stroke_risk',
      severity: 'high',
      message: 'Tekanan darah sangat tinggi dikombinasikan dengan riwayat keluarga stroke — risiko stroke meningkat signifikan.',
      ptmType: 'Stroke',
    });
  }

  // 6. Risiko ginjal: hipertensi persisten + riwayat keluarga ginjal
  if (avgSystolic > 140 && profile.familyHistory?.kidneyDisease) {
    patterns.push({
      type: 'kidney_risk',
      severity: 'medium',
      message: 'Hipertensi persisten dengan riwayat keluarga penyakit ginjal — pantau fungsi ginjal secara berkala.',
      ptmType: 'Penyakit Ginjal Kronis',
    });
  }

  // 7. Risiko diabetes: obesitas + gaya hidup sedentary + riwayat keluarga
  if (profile.bmi >= 27 && profile.lifestyle?.physicalActivity === 'sedentary' && profile.familyHistory?.diabetes) {
    patterns.push({
      type: 'diabetes_risk',
      severity: 'medium',
      message: `BMI ${profile.bmi} dengan aktivitas fisik rendah dan riwayat keluarga diabetes — risiko diabetes mellitus tipe 2 meningkat.`,
      ptmType: 'Diabetes Mellitus',
    });
  }

  // ── Hitung overall risk level ────────────────────────────
  const highPatterns   = patterns.filter(p => p.severity === 'high').length;
  const mediumPatterns = patterns.filter(p => p.severity === 'medium').length;

  let overallRisk;
  if (highPatterns > 0 || geneticScore >= 70) {
    overallRisk = 'high';
  } else if (mediumPatterns > 0 || geneticScore >= 40) {
    overallRisk = 'medium';
  } else {
    overallRisk = 'low';
  }

  // ── Rekomendasi personal ─────────────────────────────────
  const recommendations = _buildPersonalRecommendations(
    overallRisk, patterns, profile, geneticScore, satuSehat
  );

  return {
    overallRisk,
    geneticScore,
    patterns,
    trends: {
      avgSystolic:  avgSystolic  ? Math.round(avgSystolic)  : null,
      avgDiastolic: avgDiastolic ? Math.round(avgDiastolic) : null,
      avgBpm:       avgBpm       ? Math.round(avgBpm)       : null,
      daysAnalyzed: history.length,
      systolicTrend: _isConsistentlyRising(systolicValues, 3) ? 'rising' : 'stable',
    },
    profile: {
      name: profile.name,
      bmi: profile.bmi,
      age: profile.age,
    },
    satuSehatLinked: profile.satuSehatLinked,
    recommendations,
    analyzedAt: new Date().toISOString(),
  };
}

// ── Rekomendasi personal ─────────────────────────────────────
function _buildPersonalRecommendations(risk, patterns, profile, geneticScore, satuSehat) {
  const recs = [];

  // Rekomendasi berdasarkan pola yang terdeteksi
  if (patterns.some(p => p.type === 'hypertension_trend' || p.type === 'hypertension_sustained')) {
    recs.push('Kurangi konsumsi garam hingga < 5g/hari (setara 1 sendok teh)');
    recs.push('Terapkan diet DASH: perbanyak buah, sayur, biji-bijian, dan produk susu rendah lemak');
    recs.push('Hindari makanan olahan, fast food, dan minuman berkafein berlebihan');
    if (profile.lifestyle?.smokingStatus === 'current') {
      recs.push('Berhenti merokok — merokok meningkatkan tekanan darah secara signifikan');
    }
  }

  if (patterns.some(p => p.type === 'tachycardia_persistent')) {
    recs.push('Hindari kafein, minuman energi, dan stimulan lainnya');
    recs.push('Latihan pernapasan dalam (4-7-8 breathing) 10 menit sehari untuk menurunkan denyut jantung');
    recs.push('Pastikan tidur cukup 7–8 jam per malam — kurang tidur meningkatkan detak jantung');
  }

  if (patterns.some(p => p.type === 'diabetes_risk')) {
    recs.push('Tingkatkan aktivitas fisik minimal 150 menit/minggu (jalan cepat, bersepeda, renang)');
    recs.push('Kurangi konsumsi karbohidrat sederhana: nasi putih, roti putih, minuman manis');
    recs.push('Pilih karbohidrat kompleks: nasi merah, oat, ubi, quinoa');
  }

  if (patterns.some(p => p.type === 'stroke_risk' || p.type === 'kidney_risk')) {
    recs.push('Segera jadwalkan pemeriksaan dengan dokter spesialis — kondisi ini memerlukan evaluasi medis');
  }

  if (geneticScore >= 50) {
    recs.push(`Skor risiko genetik ${geneticScore}/100 — pemeriksaan kesehatan rutin setiap 3 bulan sangat dianjurkan`);
  }

  if (satuSehat?.medications?.length > 0) {
    recs.push(`Jangan lewatkan obat rutin: ${satuSehat.medications.map(m => m.name).join(', ')}`);
  }

  if (risk === 'high') {
    recs.push('Segera konsultasikan kondisi Anda dengan dokter — jangan tunda');
    recs.push('Pantau tekanan darah 2x sehari (pagi sebelum aktivitas dan malam sebelum tidur)');
  } else if (risk === 'medium') {
    recs.push('Jadwalkan konsultasi dokter dalam 1–2 minggu ke depan');
    recs.push('Catat tekanan darah harian selama 7 hari untuk dibawa saat konsultasi');
  } else {
    recs.push('Pertahankan gaya hidup sehat dan lanjutkan monitoring rutin');
    recs.push('Olahraga aerobik 30 menit, minimal 5x seminggu');
  }

  return recs.slice(0, 6);
}

// ── Panduan gaya hidup per PTM ───────────────────────────────
/**
 * Kembalikan panduan gaya hidup lengkap berdasarkan profil pengguna.
 * Setiap kategori berisi tips spesifik, makanan dianjurkan/dihindari,
 * dan target aktivitas fisik.
 *
 * @param {object} profile - user profile dari getProfile()
 * @returns {LifestyleGuide[]}
 */
export function getLifestyleGuide(profile) {
  const guides = [];
  const fh = profile?.familyHistory || {};
  const ph = profile?.personalHistory || {};
  const ls = profile?.lifestyle || {};
  const bmi = profile?.bmi;

  // ── Hipertensi ───────────────────────────────────────────
  if (fh.hypertension || ph.hypertension) {
    guides.push({
      ptm: 'Hipertensi',
      icon: '🫀',
      priority: fh.hypertension && ph.hypertension ? 'high' : 'medium',
      summary: 'Tekanan darah tinggi adalah "silent killer" — sering tanpa gejala namun merusak pembuluh darah secara perlahan.',
      categories: [
        {
          title: 'Pola Makan (Diet DASH)',
          icon: '🥗',
          tips: [
            'Batasi garam maksimal 5g/hari (1 sendok teh) — termasuk garam tersembunyi di makanan kemasan',
            'Perbanyak kalium: pisang, alpukat, kentang, bayam, tomat',
            'Konsumsi magnesium: kacang-kacangan, biji labu, cokelat hitam >70%',
            'Pilih protein tanpa lemak: ikan, ayam tanpa kulit, tahu, tempe',
            'Hindari: kecap, saus botolan, makanan kaleng, keripik, fast food',
            'Batasi kafein: maksimal 1 cangkir kopi/hari',
          ],
        },
        {
          title: 'Aktivitas Fisik',
          icon: '🏃',
          tips: [
            'Aerobik intensitas sedang 30 menit/hari, 5 hari/minggu (jalan cepat, bersepeda, berenang)',
            'Hindari olahraga intensitas sangat tinggi tanpa pengawasan dokter',
            'Yoga dan tai chi terbukti menurunkan tekanan darah 5–10 mmHg',
            'Jalan kaki 10.000 langkah/hari sebagai target harian',
          ],
        },
        {
          title: 'Manajemen Stres',
          icon: '🧘',
          tips: [
            'Teknik pernapasan 4-7-8: tarik napas 4 detik, tahan 7 detik, hembuskan 8 detik',
            'Meditasi mindfulness 10–15 menit setiap pagi',
            'Tidur cukup 7–8 jam — kurang tidur meningkatkan tekanan darah',
            'Batasi paparan berita negatif dan media sosial sebelum tidur',
          ],
        },
        {
          title: 'Kebiasaan Harian',
          icon: '📋',
          tips: [
            'Ukur tekanan darah setiap pagi sebelum aktivitas dan malam sebelum tidur',
            'Catat hasil pengukuran untuk dibawa saat kontrol dokter',
            'Berhenti merokok — nikotin menyempitkan pembuluh darah secara langsung',
            'Batasi alkohol: maksimal 1 gelas/hari untuk wanita, 2 gelas/hari untuk pria',
          ],
        },
      ],
    });
  }

  // ── Diabetes Mellitus ────────────────────────────────────
  if (fh.diabetes || ph.diabetes || (bmi >= 27 && ls.physicalActivity === 'sedentary')) {
    guides.push({
      ptm: 'Diabetes Mellitus',
      icon: '🩸',
      priority: ph.diabetes ? 'high' : 'medium',
      summary: 'Diabetes tipe 2 dapat dicegah hingga 58% dengan perubahan gaya hidup. Kontrol gula darah yang baik mencegah komplikasi serius.',
      categories: [
        {
          title: 'Pola Makan',
          icon: '🥗',
          tips: [
            'Pilih karbohidrat indeks glikemik rendah: nasi merah, oat, ubi jalar, quinoa',
            'Porsi karbohidrat maksimal ¼ piring — isi ½ piring dengan sayuran',
            'Makan 3x sehari dengan jadwal teratur — hindari melewatkan sarapan',
            'Perbanyak serat: sayuran hijau, kacang-kacangan, buah beri',
            'Hindari: minuman manis, jus buah kemasan, nasi putih berlebihan, roti putih',
            'Batasi buah manis tinggi: durian, mangga, anggur — pilih apel, pir, jeruk',
          ],
        },
        {
          title: 'Aktivitas Fisik',
          icon: '🏃',
          tips: [
            'Jalan kaki 30 menit setelah makan besar — terbukti menurunkan gula darah post-prandial',
            'Latihan kekuatan (resistance training) 2–3x/minggu meningkatkan sensitivitas insulin',
            'Target: 150 menit aktivitas aerobik sedang per minggu',
            'Hindari duduk > 30 menit berturut-turut — berdiri atau jalan sebentar setiap 30 menit',
          ],
        },
        {
          title: 'Monitoring',
          icon: '📊',
          tips: [
            'Cek gula darah puasa secara rutin (target < 100 mg/dL)',
            'Perhatikan gejala hipoglikemia: gemetar, berkeringat, pusing, lapar tiba-tiba',
            'HbA1c diperiksa setiap 3 bulan (target < 7% untuk penderita diabetes)',
            'Periksa kaki setiap hari untuk luka yang tidak terasa',
          ],
        },
        {
          title: 'Berat Badan',
          icon: '⚖️',
          tips: [
            'Penurunan berat badan 5–10% dari berat awal dapat membalikkan pre-diabetes',
            'Target BMI ideal: 18.5–24.9 kg/m²',
            'Hindari diet ekstrem — penurunan berat badan bertahap 0.5–1 kg/minggu lebih aman',
          ],
        },
      ],
    });
  }

  // ── Penyakit Jantung Koroner ─────────────────────────────
  if (fh.heartDisease || ph.heartDisease) {
    guides.push({
      ptm: 'Penyakit Jantung Koroner',
      icon: '❤️',
      priority: ph.heartDisease ? 'high' : 'medium',
      summary: 'Penyakit jantung koroner terjadi akibat penumpukan plak di arteri. Gaya hidup sehat dapat memperlambat atau bahkan membalikkan proses ini.',
      categories: [
        {
          title: 'Pola Makan Jantung Sehat',
          icon: '🥗',
          tips: [
            'Diet Mediterania: minyak zaitun, ikan, kacang-kacangan, sayuran, buah-buahan',
            'Konsumsi ikan berlemak 2x/minggu: salmon, sarden, makarel (kaya omega-3)',
            'Pilih lemak sehat: alpukat, kacang almond, kenari, biji chia',
            'Hindari lemak trans: margarin, gorengan, makanan kemasan berlabel "partially hydrogenated"',
            'Batasi daging merah: maksimal 2x/minggu, pilih potongan tanpa lemak',
            'Konsumsi oat setiap pagi — beta-glucan menurunkan kolesterol LDL',
          ],
        },
        {
          title: 'Aktivitas Fisik',
          icon: '🏃',
          tips: [
            'Mulai dengan jalan kaki 15–20 menit/hari, tingkatkan bertahap',
            'Cardiac rehabilitation exercise jika sudah ada riwayat serangan jantung',
            'Hindari olahraga berat tiba-tiba tanpa pemanasan',
            'Renang dan bersepeda santai sangat dianjurkan — low impact, high benefit',
          ],
        },
        {
          title: 'Faktor Risiko',
          icon: '⚠️',
          tips: [
            'Berhenti merokok adalah intervensi tunggal paling efektif untuk jantung',
            'Kontrol kolesterol: LDL < 100 mg/dL (< 70 mg/dL jika sudah ada penyakit jantung)',
            'Kontrol tekanan darah: target < 130/80 mmHg',
            'Kelola stres — kortisol tinggi meningkatkan risiko serangan jantung',
          ],
        },
      ],
    });
  }

  // ── Stroke ───────────────────────────────────────────────
  if (fh.stroke || ph.stroke) {
    guides.push({
      ptm: 'Stroke',
      icon: '🧠',
      priority: ph.stroke ? 'high' : 'medium',
      summary: '80% stroke dapat dicegah. Kenali gejala FAST: Face drooping, Arm weakness, Speech difficulty, Time to call emergency.',
      categories: [
        {
          title: 'Pencegahan Utama',
          icon: '🛡️',
          tips: [
            'Kontrol tekanan darah ketat — hipertensi adalah faktor risiko stroke #1',
            'Atasi fibrilasi atrium (detak jantung tidak teratur) dengan dokter',
            'Kontrol kadar kolesterol dan gula darah secara rutin',
            'Berhenti merokok — perokok memiliki risiko stroke 2x lebih tinggi',
          ],
        },
        {
          title: 'Pola Makan',
          icon: '🥗',
          tips: [
            'Perbanyak antioksidan: blueberry, stroberi, bayam, brokoli, tomat',
            'Konsumsi folat: sayuran hijau gelap, kacang-kacangan, jeruk',
            'Kurangi garam dan makanan tinggi kolesterol',
            'Minum air putih cukup: 8 gelas/hari — dehidrasi meningkatkan risiko pembekuan darah',
          ],
        },
        {
          title: 'Kenali Gejala FAST',
          icon: '🚨',
          tips: [
            'Face: Wajah terasa mati rasa atau terkulai di satu sisi',
            'Arms: Lengan lemah atau mati rasa, tidak bisa diangkat',
            'Speech: Bicara pelo, tidak jelas, atau tidak bisa bicara',
            'Time: Segera hubungi 119 — setiap menit sangat berharga',
          ],
        },
      ],
    });
  }

  // ── Obesitas ─────────────────────────────────────────────
  if (fh.obesity || ph.obesity || (bmi && bmi >= 25)) {
    guides.push({
      ptm: 'Obesitas & Berat Badan',
      icon: '⚖️',
      priority: bmi >= 30 ? 'high' : 'medium',
      summary: `BMI Anda saat ini ${bmi || '--'} kg/m². Menjaga berat badan ideal mengurangi risiko semua PTM secara signifikan.`,
      categories: [
        {
          title: 'Strategi Penurunan Berat Badan',
          icon: '📉',
          tips: [
            'Defisit kalori 500 kcal/hari menghasilkan penurunan ~0.5 kg/minggu secara aman',
            'Hitung kebutuhan kalori harian: gunakan rumus Harris-Benedict',
            'Makan perlahan — butuh 20 menit otak menyadari rasa kenyang',
            'Gunakan piring lebih kecil — trik visual yang terbukti mengurangi porsi',
            'Hindari makan sambil menonton TV atau bermain HP',
          ],
        },
        {
          title: 'Pola Makan',
          icon: '🥗',
          tips: [
            'Prioritaskan protein di setiap makan: telur, ayam, ikan, tahu, tempe',
            'Mulai makan dengan sayuran atau sup — mengisi perut dengan kalori rendah',
            'Hindari minuman berkalori: soda, jus kemasan, kopi manis, boba',
            'Intermittent fasting 16:8 dapat membantu — konsultasikan dengan dokter',
          ],
        },
        {
          title: 'Aktivitas Fisik',
          icon: '🏃',
          tips: [
            'Kombinasikan kardio (jalan, lari, sepeda) dengan latihan kekuatan',
            'NEAT (Non-Exercise Activity Thermogenesis): naik tangga, parkir jauh, berdiri saat kerja',
            'Target 300 menit aktivitas sedang per minggu untuk penurunan berat badan',
            'Catat aktivitas harian — akuntabilitas meningkatkan konsistensi',
          ],
        },
      ],
    });
  }

  // ── Penyakit Ginjal Kronis ───────────────────────────────
  if (fh.kidneyDisease || ph.kidneyDisease) {
    guides.push({
      ptm: 'Penyakit Ginjal Kronis',
      icon: '🫘',
      priority: ph.kidneyDisease ? 'high' : 'medium',
      summary: 'Ginjal menyaring 200 liter darah per hari. Hipertensi dan diabetes adalah penyebab utama kerusakan ginjal.',
      categories: [
        {
          title: 'Pola Makan Ramah Ginjal',
          icon: '🥗',
          tips: [
            'Batasi protein hewani — metabolisme protein membebani ginjal',
            'Kurangi kalium jika kadar darah tinggi: hindari pisang, alpukat, kentang',
            'Batasi fosfor: hindari minuman bersoda, produk susu berlebihan, kacang-kacangan',
            'Kontrol asupan garam ketat: < 2g natrium/hari',
            'Minum air sesuai anjuran dokter — tidak selalu "lebih banyak lebih baik"',
          ],
        },
        {
          title: 'Perlindungan Ginjal',
          icon: '🛡️',
          tips: [
            'Kontrol tekanan darah ketat: target < 130/80 mmHg',
            'Kontrol gula darah jika diabetes — gula tinggi merusak pembuluh darah ginjal',
            'Hindari obat anti-nyeri NSAID (ibuprofen, aspirin dosis tinggi) tanpa resep dokter',
            'Hindari suplemen herbal yang tidak terbukti aman untuk ginjal',
            'Periksa kreatinin dan GFR setiap 6 bulan',
          ],
        },
      ],
    });
  }

  // ── Panduan umum jika tidak ada riwayat spesifik ─────────
  if (guides.length === 0) {
    guides.push({
      ptm: 'Gaya Hidup Sehat Umum',
      icon: '💪',
      priority: 'low',
      summary: 'Tidak ada riwayat PTM terdeteksi. Pertahankan gaya hidup sehat untuk mencegah penyakit di masa depan.',
      categories: [
        {
          title: 'Pola Makan Seimbang',
          icon: '🥗',
          tips: [
            'Isi ½ piring dengan sayuran dan buah, ¼ protein, ¼ karbohidrat kompleks',
            'Minum 8 gelas air putih per hari',
            'Batasi gula tambahan: < 25g/hari untuk wanita, < 36g/hari untuk pria',
            'Konsumsi serat 25–38g/hari dari sayuran, buah, dan biji-bijian',
          ],
        },
        {
          title: 'Aktivitas Fisik',
          icon: '🏃',
          tips: [
            '150 menit aktivitas aerobik sedang per minggu (WHO recommendation)',
            'Latihan kekuatan 2x/minggu untuk menjaga massa otot',
            'Kurangi waktu duduk — berdiri atau jalan setiap 30 menit',
            'Pilih aktivitas yang menyenangkan agar konsisten',
          ],
        },
        {
          title: 'Kesehatan Mental',
          icon: '🧘',
          tips: [
            'Tidur 7–9 jam per malam secara konsisten',
            'Kelola stres dengan meditasi, olahraga, atau hobi',
            'Jaga hubungan sosial yang positif',
            'Batasi alkohol dan hindari rokok sepenuhnya',
          ],
        },
      ],
    });
  }

  return guides;
}
