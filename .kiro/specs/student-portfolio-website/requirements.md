# Requirements Document

## Introduction

Website portofolio pribadi untuk mahasiswa Informatika yang dibangun menggunakan HTML, CSS, dan JavaScript murni (tanpa framework berat). Website ini menampilkan identitas, keahlian, proyek, riwayat pendidikan, dan informasi kontak secara profesional dengan tampilan modern, responsif, dan interaktif.

## Glossary

- **Portfolio_Website**: Aplikasi web statis satu halaman (single-page) yang menampilkan informasi pribadi mahasiswa Informatika.
- **Navbar**: Komponen navigasi tetap di bagian atas halaman yang berisi tautan ke setiap seksi.
- **Hero_Section**: Seksi pertama halaman yang menampilkan nama, foto profil, deskripsi singkat, dan tombol aksi utama.
- **About_Section**: Seksi yang menampilkan latar belakang pendidikan, keahlian, dan minat di bidang IT.
- **Skills_Section**: Seksi yang menampilkan daftar keahlian teknis beserta indikator tingkat kemahiran.
- **Projects_Section**: Seksi yang menampilkan kartu-kartu proyek dengan detail dan tautan.
- **Education_Section**: Seksi yang menampilkan riwayat pendidikan secara kronologis.
- **Contact_Section**: Seksi yang berisi formulir kontak dan informasi kontak tambahan.
- **Dark_Mode**: Tema tampilan gelap yang dapat diaktifkan atau dinonaktifkan oleh pengguna.
- **Scroll_Animation**: Efek animasi yang muncul saat elemen memasuki viewport saat pengguna menggulir halaman.
- **Skill_Card**: Komponen visual yang menampilkan nama keahlian beserta progress bar atau indikator level.
- **Project_Card**: Komponen visual yang menampilkan informasi satu proyek termasuk gambar, deskripsi, teknologi, dan tautan.
- **Contact_Form**: Formulir HTML dengan field nama, email, dan pesan untuk menghubungi pemilik portofolio.
- **Smooth_Scroll**: Perilaku gulir halus saat pengguna mengklik tautan navigasi menuju seksi tertentu.

---

## Requirements

### Requirement 1: Navigasi Halaman

**User Story:** Sebagai pengunjung, saya ingin dapat berpindah antar seksi dengan mudah, sehingga saya dapat menavigasi halaman portofolio secara efisien.

#### Acceptance Criteria

1. THE Navbar SHALL menampilkan tautan navigasi ke seksi Hero, About, Skills, Projects, Education, dan Contact.
2. WHEN pengunjung mengklik tautan navigasi, THE Portfolio_Website SHALL menggulir halaman ke seksi yang dituju menggunakan Smooth_Scroll.
3. WHILE pengunjung menggulir halaman, THE Navbar SHALL tetap terlihat di bagian atas viewport (posisi fixed/sticky).
4. WHEN pengunjung menggulir melewati sebuah seksi, THE Navbar SHALL menandai tautan navigasi yang sesuai sebagai aktif (active state).
5. WHEN lebar viewport kurang dari 768px, THE Navbar SHALL menampilkan tombol hamburger untuk membuka dan menutup menu navigasi.

---

### Requirement 2: Hero Section

**User Story:** Sebagai pengunjung, saya ingin melihat identitas utama pemilik portofolio di bagian pertama halaman, sehingga saya langsung mengetahui siapa pemilik website ini.

#### Acceptance Criteria

1. THE Hero_Section SHALL menampilkan nama lengkap pemilik portofolio.
2. THE Hero_Section SHALL menampilkan foto profil pemilik portofolio.
3. THE Hero_Section SHALL menampilkan deskripsi singkat berupa jabatan atau tagline profesional.
4. THE Hero_Section SHALL menampilkan tombol "Lihat Proyek" yang mengarahkan pengunjung ke Projects_Section menggunakan Smooth_Scroll.
5. THE Hero_Section SHALL menampilkan tombol "Kontak Saya" yang mengarahkan pengunjung ke Contact_Section menggunakan Smooth_Scroll.
6. WHEN pengunjung mengarahkan kursor ke tombol, THE Portfolio_Website SHALL menampilkan hover effect pada tombol tersebut.

---

### Requirement 3: About Me Section

**User Story:** Sebagai pengunjung, saya ingin mengetahui latar belakang pemilik portofolio, sehingga saya dapat memahami profil dan minat profesionalnya.

#### Acceptance Criteria

1. THE About_Section SHALL menampilkan informasi latar belakang pendidikan pemilik portofolio.
2. THE About_Section SHALL menampilkan daftar keahlian utama pemilik portofolio.
3. THE About_Section SHALL menampilkan minat pemilik portofolio di bidang IT.
4. WHEN About_Section memasuki viewport saat pengguna menggulir, THE Portfolio_Website SHALL menampilkan Scroll_Animation berupa efek fade-in atau slide pada elemen di dalam About_Section.

---

### Requirement 4: Skills Section

**User Story:** Sebagai pengunjung, saya ingin melihat keahlian teknis pemilik portofolio beserta tingkat kemahirannya, sehingga saya dapat menilai kompetensi teknisnya.

#### Acceptance Criteria

1. THE Skills_Section SHALL menampilkan Skill_Card untuk setiap keahlian berikut: HTML, CSS, JavaScript, Networking, Linux, dan Database.
2. THE Skill_Card SHALL menampilkan nama keahlian dan indikator tingkat kemahiran berupa progress bar.
3. WHEN Skills_Section memasuki viewport saat pengguna menggulir, THE Portfolio_Website SHALL menganimasikan progress bar dari 0% hingga nilai target yang telah ditentukan.
4. WHEN pengunjung mengarahkan kursor ke Skill_Card, THE Portfolio_Website SHALL menampilkan hover effect pada Skill_Card tersebut.
5. WHEN lebar viewport kurang dari 768px, THE Skills_Section SHALL menampilkan Skill_Card dalam tata letak satu kolom.

---

### Requirement 5: Projects Section

**User Story:** Sebagai pengunjung, saya ingin melihat proyek-proyek yang telah dikerjakan pemilik portofolio, sehingga saya dapat mengevaluasi pengalaman dan kemampuan praktisnya.

#### Acceptance Criteria

1. THE Projects_Section SHALL menampilkan minimal satu Project_Card untuk setiap proyek yang ditampilkan.
2. THE Project_Card SHALL menampilkan nama proyek, deskripsi singkat, daftar teknologi yang digunakan, dan gambar preview proyek.
3. THE Project_Card SHALL menampilkan tautan ke demo proyek dan tautan ke repositori GitHub proyek.
4. WHEN pengunjung mengarahkan kursor ke Project_Card, THE Portfolio_Website SHALL menampilkan hover effect pada Project_Card tersebut.
5. WHEN Projects_Section memasuki viewport saat pengguna menggulir, THE Portfolio_Website SHALL menampilkan Scroll_Animation pada Project_Card.
6. WHEN lebar viewport kurang dari 768px, THE Projects_Section SHALL menampilkan Project_Card dalam tata letak satu kolom.

---

### Requirement 6: Education Section

**User Story:** Sebagai pengunjung, saya ingin melihat riwayat pendidikan pemilik portofolio, sehingga saya dapat memahami latar belakang akademisnya.

#### Acceptance Criteria

1. THE Education_Section SHALL menampilkan riwayat pendidikan pemilik portofolio secara kronologis dari yang terbaru.
2. Setiap entri pendidikan SHALL menampilkan nama institusi, jurusan atau program studi, dan periode tahun.
3. WHEN Education_Section memasuki viewport saat pengguna menggulir, THE Portfolio_Website SHALL menampilkan Scroll_Animation pada setiap entri pendidikan.

---

### Requirement 7: Contact Section

**User Story:** Sebagai pengunjung, saya ingin dapat menghubungi pemilik portofolio, sehingga saya dapat mengirim pesan atau tawaran kerja sama.

#### Acceptance Criteria

1. THE Contact_Section SHALL menampilkan Contact_Form dengan field nama, email, dan pesan.
2. WHEN pengunjung mengklik tombol kirim pada Contact_Form dengan field nama, email, dan pesan yang terisi, THE Portfolio_Website SHALL menampilkan notifikasi bahwa pesan telah terkirim.
3. IF pengunjung mengklik tombol kirim pada Contact_Form dengan satu atau lebih field yang kosong, THEN THE Portfolio_Website SHALL menampilkan pesan validasi yang menunjukkan field mana yang belum diisi.
4. IF pengunjung mengisi field email dengan format yang tidak valid, THEN THE Portfolio_Website SHALL menampilkan pesan validasi bahwa format email tidak valid.
5. THE Contact_Section SHALL menampilkan alamat email pemilik portofolio.
6. THE Contact_Section SHALL menampilkan tautan ke profil media sosial pemilik portofolio.

---

### Requirement 8: Dark Mode

**User Story:** Sebagai pengunjung, saya ingin dapat beralih antara tema terang dan gelap, sehingga saya dapat menyesuaikan tampilan website dengan preferensi atau kondisi pencahayaan saya.

#### Acceptance Criteria

1. THE Navbar SHALL menampilkan tombol toggle untuk mengaktifkan dan menonaktifkan Dark_Mode.
2. WHEN pengunjung mengaktifkan Dark_Mode, THE Portfolio_Website SHALL mengubah skema warna seluruh halaman ke tema gelap dalam waktu kurang dari 300ms menggunakan transisi CSS.
3. WHEN pengunjung menonaktifkan Dark_Mode, THE Portfolio_Website SHALL mengubah skema warna seluruh halaman kembali ke tema terang dalam waktu kurang dari 300ms menggunakan transisi CSS.
4. WHEN pengunjung memuat ulang halaman, THE Portfolio_Website SHALL mempertahankan preferensi Dark_Mode terakhir yang dipilih pengunjung menggunakan localStorage.

---

### Requirement 9: Responsivitas dan Tampilan

**User Story:** Sebagai pengunjung yang mengakses dari perangkat mobile, saya ingin website tetap dapat digunakan dengan nyaman, sehingga saya mendapatkan pengalaman yang baik di semua ukuran layar.

#### Acceptance Criteria

1. THE Portfolio_Website SHALL menampilkan tata letak yang dapat digunakan pada viewport dengan lebar minimal 320px.
2. THE Portfolio_Website SHALL menggunakan palet warna utama biru, abu-abu, dan putih pada tema terang.
3. THE Portfolio_Website SHALL menggunakan tipografi yang terbaca dengan ukuran font minimal 14px untuk teks isi pada semua ukuran viewport.
4. WHEN lebar viewport kurang dari 768px, THE Portfolio_Website SHALL menyesuaikan tata letak semua seksi ke tampilan satu kolom.
5. THE Portfolio_Website SHALL memuat seluruh aset dan menampilkan konten dalam waktu kurang dari 3 detik pada koneksi broadband standar.
