# Dokumen Kebutuhan (Requirements)

## Pendahuluan

PANTAS (Platform Monitoring PTM Terintegrasi) adalah aplikasi digital berbasis AI yang terintegrasi dengan smartwatch untuk deteksi dini risiko Penyakit Tidak Menular (PTM). Aplikasi ini memungkinkan pengguna memantau tekanan darah, detak jantung, dan gaya hidup secara real-time, serta mendapatkan notifikasi risiko PTM, pengingat minum obat, dan jadwal konsultasi dokter.

---

## Glosarium

- **PANTAS**: Platform Monitoring PTM Terintegrasi — nama sistem utama aplikasi ini.
- **PTM**: Penyakit Tidak Menular, seperti hipertensi, diabetes, dan penyakit jantung.
- **Auth_Module**: Modul autentikasi yang menangani proses login dan manajemen sesi pengguna.
- **Home_Dashboard**: Halaman utama yang menampilkan ringkasan data kesehatan pengguna.
- **Kalori_Detector**: Komponen berbasis AI yang menganalisis gambar makanan untuk mengestimasi kandungan kalori.
- **Health_Monitor**: Komponen yang mengelola dan menampilkan data detak jantung dan tekanan darah dari smartwatch.
- **Risk_Engine**: Komponen AI yang menganalisis data kesehatan dan menentukan tingkat risiko PTM.
- **Health_Repository**: Komponen penyimpanan yang mengelola riwayat data kesehatan pengguna.
- **Chart_Renderer**: Komponen visualisasi yang merender grafik tren data kesehatan menggunakan Recharts.
- **Reminder_Module**: Komponen yang mengelola pengingat minum obat pengguna.
- **Consultation_Module**: Komponen yang mengelola jadwal konsultasi dokter pengguna.
- **Smartwatch**: Perangkat wearable yang terhubung ke aplikasi PANTAS untuk mengirimkan data biometrik.
- **Pengguna**: Individu yang menggunakan aplikasi PANTAS untuk memantau kesehatannya.
- **Dokter**: Tenaga medis yang dijadwalkan untuk konsultasi oleh pengguna.

---

## Kebutuhan

### Kebutuhan 1: Autentikasi Pengguna (Halaman Login)

**User Story:** Sebagai pengguna, saya ingin masuk ke aplikasi menggunakan kredensial yang valid, agar data kesehatan saya terlindungi dan hanya dapat diakses oleh saya.

#### Kriteria Penerimaan

1. THE Auth_Module SHALL menampilkan formulir login dengan kolom email dan kata sandi sebagai halaman pertama yang ditampilkan saat aplikasi dibuka.
2. WHEN pengguna mengirimkan formulir login dengan email dan kata sandi yang valid, THE Auth_Module SHALL mengautentikasi pengguna dan mengarahkan pengguna ke Home_Dashboard dalam waktu kurang dari 3 detik.
3. IF pengguna mengirimkan formulir login dengan email atau kata sandi yang tidak valid, THEN THE Auth_Module SHALL menampilkan pesan kesalahan yang deskriptif tanpa mengungkapkan detail keamanan sistem.
4. IF pengguna mengirimkan formulir login dengan kolom email atau kata sandi yang kosong, THEN THE Auth_Module SHALL menampilkan pesan validasi pada kolom yang kosong sebelum mengirimkan permintaan ke server.
5. WHEN pengguna berhasil login, THE Auth_Module SHALL menyimpan token sesi pengguna secara aman di penyimpanan lokal perangkat.
6. WHEN pengguna memilih opsi keluar (logout), THE Auth_Module SHALL menghapus token sesi dan mengarahkan pengguna kembali ke halaman login.

---

### Kebutuhan 2: Dasbor Utama (Home Dashboard)

**User Story:** Sebagai pengguna, saya ingin melihat ringkasan data kesehatan saya di satu halaman, agar saya dapat memantau kondisi kesehatan saya secara cepat dan menyeluruh.

#### Kriteria Penerimaan

1. WHEN pengguna berhasil login, THE Home_Dashboard SHALL menampilkan ringkasan data kesehatan terkini pengguna termasuk nama, usia, dan status risiko PTM.
2. THE Home_Dashboard SHALL menampilkan nilai detak jantung terkini yang diterima dari Smartwatch dalam satuan BPM (beats per minute).
3. THE Home_Dashboard SHALL menampilkan nilai tekanan darah terkini yang diterima dari Smartwatch dalam format sistolik/diastolik (mmHg).
4. WHILE pengguna berada di Home_Dashboard, THE Health_Monitor SHALL memperbarui data detak jantung dan tekanan darah secara otomatis setiap 30 detik.
5. THE Home_Dashboard SHALL menampilkan status koneksi Smartwatch kepada pengguna.
6. IF koneksi ke Smartwatch terputus, THEN THE Health_Monitor SHALL menampilkan indikator peringatan koneksi dan data terakhir yang berhasil diterima beserta waktu pengambilan data tersebut.

---

### Kebutuhan 3: Deteksi Kalori Makanan Berbasis AI

**User Story:** Sebagai pengguna, saya ingin memotret makanan saya untuk mengetahui estimasi kalorinya, agar saya dapat memantau asupan kalori harian sebagai bagian dari manajemen gaya hidup sehat.

#### Kriteria Penerimaan

1. THE Home_Dashboard SHALL menyediakan tombol akses kamera untuk memulai proses deteksi kalori makanan.
2. WHEN pengguna mengaktifkan kamera dan mengambil foto makanan, THE Kalori_Detector SHALL menganalisis gambar dan menampilkan estimasi kalori dalam satuan kkal dalam waktu kurang dari 5 detik.
3. THE Kalori_Detector SHALL menampilkan nama makanan yang terdeteksi beserta rincian estimasi kandungan nutrisi utama (kalori, karbohidrat, protein, lemak).
4. IF Kalori_Detector tidak dapat mengidentifikasi makanan dari gambar yang diberikan, THEN THE Kalori_Detector SHALL menampilkan pesan yang meminta pengguna untuk mengambil ulang foto dengan pencahayaan atau sudut yang lebih baik.
5. WHEN pengguna menyimpan hasil deteksi kalori, THE Health_Repository SHALL menyimpan data asupan kalori beserta waktu pencatatan ke riwayat kesehatan pengguna.

---

### Kebutuhan 4: Monitoring Detak Jantung

**User Story:** Sebagai pengguna, saya ingin memantau detak jantung saya secara real-time melalui smartwatch, agar saya dapat mendeteksi kondisi detak jantung yang tidak normal lebih awal.

#### Kriteria Penerimaan

1. THE Health_Monitor SHALL menerima dan memproses data detak jantung dari Smartwatch yang terhubung.
2. WHEN data detak jantung baru diterima dari Smartwatch, THE Health_Monitor SHALL memperbarui tampilan nilai BPM pada Home_Dashboard.
3. THE Chart_Renderer SHALL menampilkan grafik tren detak jantung pengguna dalam rentang waktu 24 jam terakhir menggunakan komponen Recharts.
4. WHEN nilai detak jantung pengguna melebihi 100 BPM atau berada di bawah 50 BPM, THE Risk_Engine SHALL memicu notifikasi peringatan kepada pengguna.
5. THE Health_Repository SHALL menyimpan setiap pembacaan data detak jantung beserta cap waktu (timestamp) ke riwayat kesehatan pengguna.

---

### Kebutuhan 5: Monitoring Tekanan Darah

**User Story:** Sebagai pengguna, saya ingin memantau tekanan darah saya secara berkala melalui smartwatch, agar saya dapat mendeteksi risiko hipertensi sejak dini.

#### Kriteria Penerimaan

1. THE Health_Monitor SHALL menerima dan memproses data tekanan darah (sistolik dan diastolik) dari Smartwatch yang terhubung.
2. WHEN data tekanan darah baru diterima dari Smartwatch, THE Health_Monitor SHALL memperbarui tampilan nilai tekanan darah pada Home_Dashboard.
3. THE Chart_Renderer SHALL menampilkan grafik tren tekanan darah pengguna dalam rentang waktu 7 hari terakhir menggunakan komponen Recharts, dengan garis terpisah untuk nilai sistolik dan diastolik.
4. WHEN nilai tekanan darah sistolik pengguna melebihi 140 mmHg atau nilai diastolik melebihi 90 mmHg, THE Risk_Engine SHALL mengklasifikasikan kondisi sebagai risiko hipertensi dan memicu notifikasi peringatan.
5. THE Health_Repository SHALL menyimpan setiap pembacaan data tekanan darah beserta cap waktu ke riwayat kesehatan pengguna.

---

### Kebutuhan 6: Notifikasi Alert Risiko PTM

**User Story:** Sebagai pengguna, saya ingin menerima notifikasi peringatan ketika data kesehatan saya menunjukkan indikasi risiko PTM, agar saya dapat segera mengambil tindakan yang diperlukan.

#### Kriteria Penerimaan

1. THE Risk_Engine SHALL menganalisis data detak jantung, tekanan darah, dan asupan kalori pengguna untuk menentukan tingkat risiko PTM.
2. WHEN Risk_Engine mendeteksi kondisi risiko PTM, THE PANTAS SHALL mengirimkan notifikasi push kepada pengguna yang berisi deskripsi kondisi yang terdeteksi dan saran tindakan awal.
3. THE PANTAS SHALL mengklasifikasikan tingkat risiko PTM ke dalam tiga kategori: Rendah (hijau), Sedang (kuning), dan Tinggi (merah).
4. WHEN pengguna membuka notifikasi risiko PTM, THE Home_Dashboard SHALL menampilkan detail analisis risiko beserta rekomendasi gaya hidup yang relevan.
5. THE Health_Repository SHALL menyimpan setiap notifikasi risiko PTM yang dikirimkan beserta data kesehatan yang memicunya ke riwayat pengguna.
6. IF Risk_Engine mendeteksi kondisi risiko tinggi (merah), THEN THE PANTAS SHALL menampilkan saran untuk segera berkonsultasi dengan dokter beserta tautan langsung ke fitur jadwal konsultasi.

---

### Kebutuhan 7: Penyimpanan Riwayat Data Kesehatan

**User Story:** Sebagai pengguna, saya ingin riwayat data kesehatan saya tersimpan secara persisten, agar saya dapat melihat perkembangan kondisi kesehatan saya dari waktu ke waktu.

#### Kriteria Penerimaan

1. THE Health_Repository SHALL menyimpan seluruh data kesehatan pengguna (detak jantung, tekanan darah, asupan kalori, dan notifikasi risiko) secara persisten di penyimpanan server.
2. WHEN pengguna mengakses halaman riwayat kesehatan, THE Health_Repository SHALL menampilkan data riwayat yang dapat difilter berdasarkan jenis data dan rentang tanggal.
3. THE Health_Repository SHALL mempertahankan integritas data riwayat pengguna sehingga data yang tersimpan tidak berubah tanpa tindakan eksplisit dari pengguna.
4. IF terjadi kegagalan koneksi jaringan saat menyimpan data, THEN THE Health_Repository SHALL menyimpan data sementara di penyimpanan lokal perangkat dan melakukan sinkronisasi ulang ke server ketika koneksi pulih.
5. THE Health_Repository SHALL memastikan seluruh data kesehatan pengguna dienkripsi saat disimpan (at rest) dan saat dikirimkan (in transit).

---

### Kebutuhan 8: Grafik Tren Data Kesehatan

**User Story:** Sebagai pengguna, saya ingin melihat grafik tren tekanan darah dan detak jantung saya, agar saya dapat memahami pola kesehatan saya secara visual.

#### Kriteria Penerimaan

1. THE Chart_Renderer SHALL merender grafik tren detak jantung dan tekanan darah menggunakan library Recharts.
2. THE Chart_Renderer SHALL menampilkan grafik detak jantung dengan sumbu-X berupa waktu dan sumbu-Y berupa nilai BPM.
3. THE Chart_Renderer SHALL menampilkan grafik tekanan darah dengan sumbu-X berupa tanggal dan sumbu-Y berupa nilai mmHg, dengan dua garis data terpisah untuk sistolik dan diastolik.
4. WHEN pengguna memilih rentang waktu yang berbeda (24 jam, 7 hari, 30 hari), THE Chart_Renderer SHALL memperbarui grafik sesuai rentang waktu yang dipilih dalam waktu kurang dari 2 detik.
5. THE Chart_Renderer SHALL menampilkan garis referensi batas normal pada grafik (detak jantung: 50–100 BPM; tekanan darah sistolik: 90–140 mmHg, diastolik: 60–90 mmHg).
6. WHEN pengguna mengarahkan kursor atau menyentuh titik data pada grafik, THE Chart_Renderer SHALL menampilkan tooltip yang berisi nilai data dan cap waktu yang tepat.

---

### Kebutuhan 9: Pengingat Minum Obat

**User Story:** Sebagai pengguna, saya ingin mengatur pengingat minum obat, agar saya tidak melewatkan jadwal konsumsi obat yang telah ditentukan dokter.

#### Kriteria Penerimaan

1. THE Reminder_Module SHALL memungkinkan pengguna menambahkan pengingat obat dengan informasi: nama obat, dosis, frekuensi, dan waktu konsumsi.
2. WHEN waktu pengingat obat yang telah dijadwalkan tiba, THE Reminder_Module SHALL mengirimkan notifikasi push kepada pengguna yang berisi nama obat dan dosis yang harus dikonsumsi.
3. THE Reminder_Module SHALL memungkinkan pengguna menandai pengingat obat sebagai "sudah diminum" atau "dilewati" untuk setiap jadwal yang muncul.
4. THE Reminder_Module SHALL menampilkan daftar seluruh pengingat obat aktif milik pengguna beserta jadwal berikutnya.
5. WHEN pengguna menonaktifkan atau menghapus pengingat obat, THE Reminder_Module SHALL menghentikan pengiriman notifikasi untuk pengingat tersebut secara langsung.
6. IF pengguna tidak menandai pengingat obat dalam waktu 30 menit setelah notifikasi dikirimkan, THEN THE Reminder_Module SHALL mengirimkan satu notifikasi pengingat ulang kepada pengguna.

---

### Kebutuhan 10: Jadwal Konsultasi Dokter

**User Story:** Sebagai pengguna, saya ingin membuat dan mengelola jadwal konsultasi dengan dokter, agar saya dapat memastikan pemantauan kesehatan saya ditindaklanjuti oleh tenaga medis profesional.

#### Kriteria Penerimaan

1. THE Consultation_Module SHALL memungkinkan pengguna membuat jadwal konsultasi dokter dengan informasi: nama dokter, spesialisasi, tanggal, waktu, dan metode konsultasi (tatap muka atau daring).
2. WHEN pengguna berhasil membuat jadwal konsultasi, THE Consultation_Module SHALL menampilkan konfirmasi jadwal dan menambahkan pengingat otomatis 1 jam sebelum waktu konsultasi.
3. THE Consultation_Module SHALL menampilkan daftar jadwal konsultasi mendatang dan riwayat konsultasi yang telah selesai milik pengguna.
4. WHEN pengguna memilih untuk mengubah jadwal konsultasi yang ada, THE Consultation_Module SHALL memungkinkan pengguna memperbarui tanggal, waktu, atau metode konsultasi.
5. WHEN pengguna membatalkan jadwal konsultasi, THE Consultation_Module SHALL menghapus jadwal tersebut dari daftar dan membatalkan pengingat yang terkait.
6. WHERE fitur ekspor jadwal tersedia, THE Consultation_Module SHALL memungkinkan pengguna mengekspor jadwal konsultasi ke kalender perangkat pengguna.
