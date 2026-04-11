# Implementation Plan: Student Portfolio Website

## Overview

Implementasi website portofolio statis satu halaman menggunakan HTML, CSS, dan JavaScript murni. Tiga file utama (`index.html`, `style.css`, `script.js`) dibangun secara bertahap, dimulai dari struktur markup, lalu styling, kemudian interaktivitas JavaScript, dan diakhiri dengan testing.

## Tasks

- [x] 1. Setup struktur proyek dan file dasar
  - Buat file `index.html` dengan boilerplate HTML5, link ke `style.css`, `script.js`, Google Fonts, dan Font Awesome CDN
  - Buat file `style.css` kosong dengan CSS variables (design tokens) untuk light mode dan dark mode
  - Buat file `script.js` kosong dengan struktur `DOMContentLoaded` listener
  - Buat folder `assets/` untuk menyimpan gambar profil dan preview proyek
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 2. Implementasi HTML markup semua seksi
  - [x] 2.1 Buat markup Navbar
    - Tambahkan `<nav id="navbar">` dengan `.nav-brand`, `.nav-links` (6 tautan: Home, About, Skills, Projects, Education, Contact), tombol `#dark-mode-toggle`, dan tombol `#hamburger`
    - _Requirements: 1.1, 1.3, 1.5, 8.1_

  - [x] 2.2 Buat markup Hero Section
    - Tambahkan `<section id="hero">` dengan `<img class="profile-img">`, `<h1 class="hero-name">`, `<p class="hero-tagline">`, dan dua tombol CTA (`#projects` dan `#contact`)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.3 Buat markup About Section
    - Tambahkan `<section id="about" class="animate-on-scroll">` dengan `.about-text`, paragraf latar belakang, `.about-skills-list`, dan `.about-interests`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.4 Buat markup Skills Section
    - Tambahkan `<section id="skills">` dengan `<div id="skills-container" class="skills-grid">` sebagai container untuk card yang dirender JS
    - _Requirements: 4.1, 4.2_

  - [x] 2.5 Buat markup Projects Section
    - Tambahkan `<section id="projects">` dengan `<div id="projects-container" class="projects-grid">` sebagai container untuk card yang dirender JS
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 2.6 Buat markup Education Section
    - Tambahkan `<section id="education">` dengan `.timeline` berisi minimal satu `.timeline-item.animate-on-scroll` yang memuat nama institusi, program studi, dan periode
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 2.7 Buat markup Contact Section
    - Tambahkan `<section id="contact">` dengan `<form id="contact-form" novalidate>` (field name, email, message, tombol submit, `#form-success`), dan `.contact-info` (mailto link + social links)
    - _Requirements: 7.1, 7.5, 7.6_

- [ ] 3. Implementasi CSS
  - [x] 3.1 Definisikan CSS variables dan base styles
    - Tulis `:root` dengan semua design tokens (warna, font-size, transition-speed) untuk light mode
    - Tulis `[data-theme="dark"]` override untuk dark mode tokens
    - Set `font-size-base: 16px`, `font-size-min: 14px`, dan `box-sizing: border-box` global
    - _Requirements: 9.2, 9.3, 8.2, 8.3_

  - [x] 3.2 Implementasi CSS Navbar
    - Style `#navbar` dengan `position: fixed; top: 0; width: 100%`, flex layout, dan transisi warna
    - Style `.nav-links a` dengan hover effect dan `.active` state
    - Style `#hamburger` sebagai hidden default, visible di mobile
    - _Requirements: 1.3, 1.4, 1.5_

  - [x] 3.3 Implementasi CSS Hero, About, Education, Contact
    - Style `#hero` dengan layout terpusat, `.profile-img` bulat, dan hover effect pada tombol `.btn`
    - Style `#about` dengan flex/grid layout dua kolom
    - Style `.timeline` dan `.timeline-item` untuk Education section
    - Style `#contact` dengan form layout, `.error-msg`, `.success-msg`, dan `.hidden` utility class
    - _Requirements: 2.6, 3.4, 6.3, 7.3, 7.4_

  - [x] 3.4 Implementasi CSS Skills dan Projects
    - Style `.skills-grid` dengan CSS Grid, `.skill-card` dengan hover effect
    - Style `.progress-bar-track` dan `.progress-bar-fill` dengan `transition: width 1s ease-in-out`
    - Style `.projects-grid` dengan CSS Grid, `.project-card` dengan hover effect
    - _Requirements: 4.2, 4.3, 4.4, 5.4_

  - [x] 3.5 Implementasi CSS scroll animation dan dark mode transition
    - Style `.animate-on-scroll` dengan `opacity: 0; transform: translateY(30px)`
    - Style `.animate-on-scroll.visible` dengan `opacity: 1; transform: translateY(0); transition: 0.6s ease`
    - Tambahkan `transition` pada `body` dan elemen utama untuk dark mode switch < 300ms
    - _Requirements: 3.4, 5.5, 6.3, 8.2, 8.3_

  - [x] 3.6 Implementasi media queries responsif
    - Breakpoint `max-width: 768px`: navbar hamburger visible, semua grid menjadi satu kolom, font size minimal 14px
    - Breakpoint `min-width: 320px`: pastikan layout tidak overflow
    - _Requirements: 1.5, 4.5, 5.6, 9.1, 9.4_

- [ ] 4. Implementasi JavaScript
  - [x] 4.1 Implementasi data arrays dan fungsi render skills
    - Definisikan `skillsData` array dengan 6 skill (HTML, CSS, JavaScript, Networking, Linux, Database) beserta `level` dan `icon`
    - Tulis fungsi `renderSkills()` yang menginjeksi skill card HTML ke `#skills-container` dengan `data-target` pada `.progress-bar-fill`
    - Panggil `renderSkills()` saat `DOMContentLoaded`
    - _Requirements: 4.1, 4.2_

  - [x] 4.2 Implementasi fungsi render projects
    - Definisikan `projectsData` array dengan minimal 2 proyek (name, description, technologies, image, demoUrl, githubUrl)
    - Tulis fungsi `renderProjects()` yang menginjeksi project card HTML ke `#projects-container`, termasuk `onerror` placeholder pada `<img>`
    - Panggil `renderProjects()` saat `DOMContentLoaded`
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 4.3 Implementasi dark mode toggle dan localStorage persistence
    - Tulis fungsi `initDarkMode()` yang membaca `localStorage.getItem("darkMode")` dengan `try/catch` dan menerapkan `data-theme="dark"` jika nilainya `"enabled"`
    - Tulis fungsi `toggleDarkMode()` yang toggle atribut `data-theme` pada `<html>` dan menyimpan preferensi ke localStorage
    - Pasang event listener pada `#dark-mode-toggle`
    - Panggil `initDarkMode()` saat `DOMContentLoaded`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 4.4 Implementasi scroll animation dengan IntersectionObserver
    - Tulis `IntersectionObserver` dengan `threshold: 0.15` yang menambahkan class `.visible` ke setiap elemen `.animate-on-scroll` saat `isIntersecting: true`
    - Tambahkan fallback: jika `IntersectionObserver` tidak tersedia, langsung tambahkan `.visible` ke semua elemen
    - _Requirements: 3.4, 5.5, 6.3_

  - [x] 4.5 Implementasi skill bar animation
    - Tulis fungsi `animateSkillBars()` yang mengiterasi `.progress-bar-fill` dan set `style.width = dataset.target + "%"`
    - Buat `IntersectionObserver` terpisah untuk `#skills` section yang memanggil `animateSkillBars()` saat section masuk viewport
    - _Requirements: 4.3_

  - [x] 4.6 Implementasi active nav link dengan IntersectionObserver
    - Tulis fungsi `setActiveNavLink(sectionId)` yang menambahkan class `.active` ke nav link yang sesuai dan menghapus dari semua link lainnya
    - Buat `IntersectionObserver` dengan `threshold: 0.4` pada setiap `<section>` yang memanggil `setActiveNavLink()`
    - _Requirements: 1.4_

  - [x] 4.7 Implementasi hamburger menu
    - Pasang event listener pada `#hamburger` yang toggle class `.nav-open` pada `<nav>` dan update `aria-expanded`
    - Tutup menu saat nav link diklik
    - _Requirements: 1.5_

  - [x] 4.8 Implementasi form validation
    - Tulis fungsi `isValidEmail(email)` menggunakan regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
    - Tulis fungsi `validateForm(name, email, message)` yang mengembalikan objek `errors`
    - Pasang event listener `submit` pada `#contact-form`: jalankan validasi, tampilkan error inline via `.error-msg`, atau tampilkan `#form-success` dan reset form jika valid
    - Pasang event listener `input` pada setiap field untuk menghapus error saat pengguna mengetik
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 5. Checkpoint — Verifikasi fungsionalitas dasar
  - Pastikan semua seksi tampil dengan benar di browser, dark mode toggle berfungsi, scroll animation aktif, skill bar teranimasi, form validation bekerja, dan hamburger menu responsif.
  - Ensure all manual checks pass, ask the user if questions arise.

- [x] 6. Setup testing environment
  - Buat `package.json` dengan `npm init -y` dan install devDependencies: `vitest` dan `fast-check`
  - Buat `vitest.config.js` dengan environment `jsdom`
  - Buat struktur folder `tests/unit/` dan `tests/property/`
  - Ekspor fungsi-fungsi yang perlu ditest dari `script.js` (atau buat modul terpisah `src/utils.js` untuk `validateForm`, `isValidEmail`, `renderSkills`, `renderProjects`, `toggleDarkMode`, `initDarkMode`, `setActiveNavLink`, `animateSkillBars`)
  - _Requirements: semua_

- [ ] 7. Implementasi unit tests
  - [x] 7.1 Tulis unit tests untuk Navbar
    - Verifikasi navbar mengandung 6 tautan navigasi dengan href yang benar (`#hero`, `#about`, `#skills`, `#projects`, `#education`, `#contact`)
    - Verifikasi tombol `#dark-mode-toggle` dan `#hamburger` ada di navbar
    - _Requirements: 1.1, 1.5, 8.1_

  - [ ]* 7.2 Tulis unit tests untuk Hero Section
    - Verifikasi hero section mengandung elemen nama, foto profil, tagline, dan dua tombol CTA
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 7.3 Tulis unit tests untuk Contact Form
    - Verifikasi form mengandung input name, email, textarea message, dan tombol submit
    - Verifikasi contact section mengandung mailto link dan social links
    - _Requirements: 7.1, 7.5, 7.6_

  - [ ]* 7.4 Tulis unit tests untuk Education Section
    - Verifikasi education entries diurutkan dari tahun terbaru
    - _Requirements: 6.1, 6.2_

- [ ] 8. Implementasi property-based tests
  - [ ]* 8.1 Tulis property test P1: Scroll Animation Visibility
    - `// Feature: student-portfolio-website, Property 1: Scroll Animation Visibility`
    - Generate elemen dengan class `.animate-on-scroll`, simulasikan intersection callback dengan `isIntersecting: true`, verifikasi class `.visible` ditambahkan
    - **Property 1: Scroll Animation Visibility**
    - **Validates: Requirements 3.4, 5.5, 6.3**

  - [ ]* 8.2 Tulis property test P2: Active Nav Link Exclusivity
    - `// Feature: student-portfolio-website, Property 2: Active Nav Link Exclusivity`
    - Generate section ID acak dari daftar valid, panggil `setActiveNavLink()`, verifikasi tepat satu link memiliki class `.active`
    - **Property 2: Active Nav Link Exclusivity**
    - **Validates: Requirements 1.4**

  - [ ]* 8.3 Tulis property test P3: Skill Card Rendering Completeness
    - `// Feature: student-portfolio-website, Property 3: Skill Card Rendering Completeness`
    - Generate skill objects dengan `name` acak dan `level` integer 0–100, panggil `renderSkills()`, verifikasi card mengandung nama dan `data-target` yang benar
    - **Property 3: Skill Card Rendering Completeness**
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 8.4 Tulis property test P4: Skill Bar Animation Target
    - `// Feature: student-portfolio-website, Property 4: Skill Bar Animation Target`
    - Generate integer 0–100 sebagai `data-target`, panggil `animateSkillBars()`, verifikasi `style.width === target + "%"`
    - **Property 4: Skill Bar Animation Target**
    - **Validates: Requirements 4.3**

  - [ ]* 8.5 Tulis property test P5: Project Card Rendering Completeness
    - `// Feature: student-portfolio-website, Property 5: Project Card Rendering Completeness`
    - Generate project objects dengan semua field valid, panggil `renderProjects()`, verifikasi nama, deskripsi, semua tech tag, src gambar, href demo, dan href GitHub ada di card
    - **Property 5: Project Card Rendering Completeness**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [ ]* 8.6 Tulis property test P6: Form Validation — Empty Fields Rejected
    - `// Feature: student-portfolio-website, Property 6: Form Validation — Empty Fields Rejected`
    - Generate kombinasi field kosong atau hanya whitespace, panggil `validateForm()`, verifikasi objek errors mengandung key untuk setiap field yang tidak valid
    - **Property 6: Form Validation — Empty Fields Rejected**
    - **Validates: Requirements 7.3**

  - [ ]* 8.7 Tulis property test P7: Form Validation — Invalid Email Rejected
    - `// Feature: student-portfolio-website, Property 7: Form Validation — Invalid Email Rejected`
    - Generate string yang tidak cocok format email (tanpa `@`, tanpa domain, dll.), verifikasi `isValidEmail()` mengembalikan `false`
    - **Property 7: Form Validation — Invalid Email Rejected**
    - **Validates: Requirements 7.4**

  - [ ]* 8.8 Tulis property test P8: Form Validation — Valid Input Accepted
    - `// Feature: student-portfolio-website, Property 8: Form Validation — Valid Input Accepted`
    - Generate (nama non-whitespace, email valid, pesan non-whitespace), panggil `validateForm()`, verifikasi mengembalikan objek errors kosong `{}`
    - **Property 8: Form Validation — Valid Input Accepted**
    - **Validates: Requirements 7.2**

  - [ ]* 8.9 Tulis property test P9: Dark Mode Toggle Round-Trip
    - `// Feature: student-portfolio-website, Property 9: Dark Mode Toggle Round-Trip`
    - Untuk setiap initial state (terang/gelap), panggil `toggleDarkMode()` dua kali, verifikasi `document.documentElement.dataset.theme` kembali ke nilai awal
    - **Property 9: Dark Mode Toggle Round-Trip**
    - **Validates: Requirements 8.2, 8.3**

  - [ ]* 8.10 Tulis property test P10: Dark Mode localStorage Persistence
    - `// Feature: student-portfolio-website, Property 10: Dark Mode localStorage Persistence`
    - Untuk setiap nilai `"enabled"` atau `"disabled"`, set localStorage, panggil `initDarkMode()`, verifikasi tema yang diterapkan sesuai: `"enabled"` → `data-theme="dark"`, `"disabled"` → tidak ada `data-theme`
    - **Property 10: Dark Mode localStorage Persistence**
    - **Validates: Requirements 8.4**

- [x] 9. Final checkpoint — Pastikan semua tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Fungsi-fungsi JS yang ditest harus diekspor (gunakan modul ES atau pola IIFE yang kompatibel dengan jsdom)
- Property tests menggunakan fast-check dengan minimum 100 iterasi (default)
- Jalankan tests dengan: `npx vitest --run`
