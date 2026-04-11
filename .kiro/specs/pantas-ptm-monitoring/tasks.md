# Tasks: PANTAS (Platform Monitoring PTM Terintegrasi)

## Task List

- [x] 1. Setup Struktur Proyek dan Konfigurasi
  - [x] 1.1 Buat struktur folder modul (`src/modules/`, `src/utils/`, `src/components/`)
  - [x] 1.2 Tambahkan Recharts ke project (via CDN di index.html atau install sebagai dependency)
  - [x] 1.3 Buat file entry point SPA (`src/app.js`) dengan router sederhana berbasis hash
  - [x] 1.4 Buat event bus terpusat (`src/utils/eventBus.js`) untuk komunikasi antar modul
  - [x] 1.5 Update `vitest.config.js` untuk mencakup folder `src/` dan `tests/`

- [x] 2. Auth_Module — Autentikasi Pengguna
  - [x] 2.1 Buat `src/modules/auth/auth.js` dengan fungsi `validateLoginForm`, `saveSession`, `getSession`, `clearSession`
  - [x] 2.2 Buat `src/modules/auth/auth.html` — template halaman login dengan form email dan password
  - [x] 2.3 Implementasi fungsi `login(email, password)` dengan mock API call dan penanganan error
  - [x] 2.4 Implementasi fungsi `logout()` yang menghapus sesi dan redirect ke halaman login
  - [x] 2.5 Tulis unit tests untuk Auth_Module (`tests/unit/auth.test.js`)
  - [x] 2.6 Tulis property tests untuk Auth_Module (`tests/property/auth.property.test.js`) — Properties 1, 2, 3

- [x] 3. Health_Monitor — Monitoring Biometrik
  - [x] 3.1 Buat `src/modules/health-monitor/healthMonitor.js` dengan fungsi `processHeartRate`, `processBloodPressure`, `getConnectionStatus`, `getLastReading`
  - [x] 3.2 Implementasi Smartwatch Adapter (`src/modules/health-monitor/smartwatchAdapter.js`) dengan mock data generator untuk simulasi data smartwatch
  - [x] 3.3 Implementasi `startMonitoring(intervalMs)` dan `stopMonitoring()` dengan setInterval
  - [x] 3.4 Implementasi logika deteksi koneksi terputus dan tampilan data terakhir beserta timestamp
  - [x] 3.5 Tulis unit tests untuk Health_Monitor (`tests/unit/health-monitor.test.js`)
  - [x] 3.6 Tulis property tests untuk Health_Monitor (`tests/property/health-monitor.property.test.js`) — Properties 4, 5, 8, 9, 10

- [x] 4. Kalori_Detector — Deteksi Kalori Berbasis AI
  - [x] 4.1 Buat `src/modules/kalori-detector/kaloriDetector.js` dengan fungsi `analyzeFood(imageBlob)` dan `saveDetectionResult`
  - [x] 4.2 Implementasi `openCamera()` menggunakan Web Camera API (`navigator.mediaDevices.getUserMedia`)
  - [x] 4.3 Implementasi mock AI analysis yang mengembalikan `FoodAnalysisResult` lengkap (foodName, calories, carbohydrates, protein, fat)
  - [x] 4.4 Implementasi penanganan error saat AI gagal mengidentifikasi makanan
  - [x] 4.5 Tulis unit tests untuk Kalori_Detector (`tests/unit/kalori-detector.test.js`)
  - [x] 4.6 Tulis property tests untuk Kalori_Detector (`tests/property/kalori-detector.property.test.js`) — Properties 6, 7

- [x] 5. Risk_Engine — Analisis Risiko PTM
  - [x] 5.1 Buat `src/modules/risk-engine/riskEngine.js` dengan fungsi `analyzeRisk`, `classifyRisk`, `getRecommendations`
  - [x] 5.2 Implementasi logika klasifikasi risiko tiga tingkat (low/medium/high) berdasarkan threshold BPM dan tekanan darah
  - [x] 5.3 Implementasi `triggerNotification(assessment)` menggunakan Notification API browser
  - [x] 5.4 Implementasi `getRecommendations(riskLevel)` yang menyertakan saran konsultasi dokter untuk risiko tinggi
  - [x] 5.5 Tulis unit tests untuk Risk_Engine (`tests/unit/risk-engine.test.js`)
  - [x] 5.6 Tulis property tests untuk Risk_Engine (`tests/property/risk-engine.property.test.js`) — Properties 11, 12

- [x] 6. Health_Repository — Penyimpanan Data Kesehatan
  - [x] 6.1 Buat `src/modules/health-repository/healthRepository.js` dengan fungsi CRUD untuk semua tipe data kesehatan
  - [x] 6.2 Implementasi `getHistory(filter)` dengan logika filter berdasarkan dataType dan rentang tanggal
  - [x] 6.3 Implementasi mekanisme offline-first: simpan ke localStorage saat offline, sinkronisasi saat online
  - [x] 6.4 Implementasi enkripsi data sederhana (Base64 + XOR atau Web Crypto API) untuk data di localStorage
  - [x] 6.5 Tulis unit tests untuk Health_Repository (`tests/unit/health-repository.test.js`)
  - [x] 6.6 Tulis property tests untuk Health_Repository (`tests/property/health-repository.property.test.js`) — Properties 7, 13

- [x] 7. Chart_Renderer — Visualisasi Grafik Recharts
  - [x] 7.1 Buat `src/modules/chart-renderer/chartRenderer.js` dengan fungsi `formatChartData`, `renderHeartRateChart`, `renderBloodPressureChart`
  - [x] 7.2 Implementasi `renderHeartRateChart` menggunakan Recharts LineChart dengan sumbu-X waktu dan sumbu-Y BPM
  - [x] 7.3 Implementasi `renderBloodPressureChart` dengan dua garis terpisah (sistolik dan diastolik)
  - [x] 7.4 Tambahkan ReferenceLine untuk batas normal pada kedua grafik (BPM: 50-100, Sistolik: 90-140, Diastolik: 60-90)
  - [x] 7.5 Implementasi tooltip formatter yang menampilkan nilai dan timestamp
  - [x] 7.6 Implementasi `updateTimeRange(chartId, timeRange)` untuk filter 24 jam, 7 hari, 30 hari
  - [x] 7.7 Tulis unit tests untuk Chart_Renderer (`tests/unit/chart-renderer.test.js`)
  - [x] 7.8 Tulis property tests untuk Chart_Renderer (`tests/property/chart-renderer.property.test.js`) — Properties 14, 15, 16

- [x] 8. Reminder_Module — Pengingat Minum Obat
  - [x] 8.1 Buat `src/modules/reminder/reminderModule.js` dengan fungsi `addReminder`, `removeReminder`, `markReminder`, `getActiveReminders`
  - [x] 8.2 Implementasi `scheduleNotification(reminder)` menggunakan Notification API dan setTimeout
  - [x] 8.3 Implementasi `cancelNotification(reminderId)` yang membatalkan scheduled notification
  - [x] 8.4 Implementasi logika notifikasi ulang setelah 30 menit jika pengingat tidak ditandai
  - [x] 8.5 Tulis unit tests untuk Reminder_Module (`tests/unit/reminder-module.test.js`)
  - [x] 8.6 Tulis property tests untuk Reminder_Module (`tests/property/reminder-module.property.test.js`) — Properties 17, 18, 19

- [x] 9. Consultation_Module — Jadwal Konsultasi Dokter
  - [x] 9.1 Buat `src/modules/consultation/consultationModule.js` dengan fungsi `createConsultation`, `updateConsultation`, `cancelConsultation`, `getUpcomingConsultations`, `getConsultationHistory`
  - [x] 9.2 Implementasi pengingat otomatis 1 jam sebelum konsultasi saat jadwal dibuat
  - [x] 9.3 Implementasi `exportToCalendar(consultation)` menggunakan format iCal atau Web Share API
  - [x] 9.4 Tulis unit tests untuk Consultation_Module (`tests/unit/consultation-module.test.js`)
  - [x] 9.5 Tulis property tests untuk Consultation_Module (`tests/property/consultation-module.property.test.js`) — Properties 20, 21, 22, 23

- [x] 10. Home_Dashboard — Halaman Utama
  - [x] 10.1 Buat `src/modules/dashboard/dashboard.js` yang mengintegrasikan semua modul
  - [x] 10.2 Buat `src/modules/dashboard/dashboard.html` — template dashboard dengan kartu ringkasan kesehatan
  - [x] 10.3 Implementasi tampilan detak jantung dan tekanan darah real-time dengan indikator status koneksi smartwatch
  - [x] 10.4 Implementasi tombol akses kamera untuk Kalori_Detector
  - [x] 10.5 Implementasi tampilan status risiko PTM dengan warna klasifikasi (hijau/kuning/merah)
  - [x] 10.6 Implementasi tampilan detail analisis risiko dan rekomendasi saat notifikasi dibuka
  - [x] 10.7 Integrasi Chart_Renderer untuk grafik tren di halaman dashboard
  - [x] 10.8 Tulis unit tests untuk Dashboard (`tests/unit/dashboard.test.js`)

- [x] 11. Halaman Riwayat Kesehatan
  - [x] 11.1 Buat `src/modules/history/history.js` dengan UI filter berdasarkan jenis data dan rentang tanggal
  - [x] 11.2 Implementasi tampilan tabel/list riwayat data kesehatan yang dapat difilter
  - [x] 11.3 Tulis unit tests untuk halaman riwayat (`tests/unit/history.test.js`)

- [x] 12. Integrasi dan Polish
  - [x] 12.1 Integrasikan semua modul ke SPA router di `src/app.js`
  - [x] 12.2 Tambahkan navigasi antar halaman (Login → Dashboard → Riwayat → Pengingat → Konsultasi)
  - [x] 12.3 Terapkan styling CSS untuk semua halaman baru (konsisten dengan `style.css` yang ada)
  - [x] 12.4 Pastikan semua halaman responsif untuk mobile
  - [x] 12.5 Jalankan seluruh test suite dan pastikan semua test lulus (`npm test`)
