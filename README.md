<p align="center">
  <img src="assets/logo-icon.png" width="96" alt="Logo LayakDiskon">
</p>

<h1 align="center">LayakDiskon</h1>

<p align="center">
  <em>Diskon yang Tepat, Bukan Asal Potong Harga</em><br>
  Asisten keputusan diskon untuk UMKM — 100% berjalan di browser.
</p>

<p align="center">
  <img alt="Versi" src="https://img.shields.io/badge/versi-1.4.1-025CE2">
  <img alt="Lisensi" src="https://img.shields.io/badge/lisensi-ISC-10B981">
  <img alt="Tanpa server" src="https://img.shields.io/badge/100%25-client--side-F59E0B">
</p>

---

## Ringkasan

**LayakDiskon** membantu pemilik UMKM menghitung kelayakan diskon, mengetahui batas aman laba, menyusun paket bundling, dan melihat kalender momen promosi — semuanya **tanpa login, tanpa server, tanpa database**.

Semua data tersimpan di **localStorage** browser pengguna dan tidak pernah dikirim ke mana pun.

---

## Fitur Utama

### 1. Kalkulator Diskon
- Input: nama produk, modal/unit, harga normal, target laba, stok, laju jual, dan batas kesegaran (expired)
- Slider skenario diskon **0–80%** dengan proteksi harga aman
- Status kelayakan otomatis: **Aman**, **Laba Tipis**, atau **Rugi (boncos)**
- Metrik: harga setelah diskon, laba/unit, batas diskon maksimum, harga minimum aman
- Estimasi penyelamatan modal dan potensi laba batch
- Rekomendasi waktu eksekusi promo
- **Download PDF** ringkasan perhitungan (rapi, tanpa slider/input)

### 2. Kalender Rekomendasi Diskon
- Murni **acuan/pustaka momen promosi** — tidak melibatkan data produk
- Layout 2 kolom: sidebar kategori + kalender
- Kalender **42 sel (6 baris)** dengan tanggal bulan sebelum/sesudah dan tanda **HARI INI**
- Penanda:
  - 🛍️ **Promo tanggal kembar** (1.1, 2.2, … 12.12)
  - 💳 **Payday Sale** (tanggal 25–28)
  - 🗓 **Promo Weekend** (Jumat–Minggu)
  - 🎉 **Hari besar** (libur nasional & keagamaan)
- Panel **detail tanggal** berisi event + **saran eksekusi**
- Panel **Catatan acuan** di samping detail

### 3. Kalkulator Bundling (manual)
- Input multi-produk: nama, modal per unit, harga normal per unit
- Jumlah paket direncanakan + biaya tambahan/paket (kemasan/perakitan)
- Slider diskon, target margin minimum (%), target laba minimum/paket (Rp)
- Hasil otomatis:
  - Harga bundling & hemat pelanggan
  - Total modal/paket, laba/paket, margin laba
  - **Diskon maksimum aman**
  - Harga minimum target & estimasi laba total
- Status kelayakan berwarna + feedback target **terpenuhi/belum**
- **Rumus perhitungan** ditampilkan terbuka
- **Download PDF** ringkasan paket (tabel produk, parameter, hasil, status)

---

## Istilah Penting

| Istilah | Arti |
|---------|------|
| **Target margin minimum (%)** | Laba minimal dalam persen dari harga paket (`laba ÷ harga paket × 100`). Menentukan **diskon maksimum aman** dan status target. |
| **Target laba minimum/paket (Rp)** | Laba bersih minimal per paket dalam rupiah. Menentukan status "sesuai target". |
| **Margin kotor** | Laba setelah dikurangi modal/HPP + biaya langsung paket, **belum** termasuk biaya operasional, pajak, fee platform, dan retur. |
| **Diskon maksimum aman** | Batas diskon terdalam agar margin tetap memenuhi target. |

> Kedua target **tidak mengubah** harga atau laba — hanya menentukan batas aman dan kelayakan.

---

## Alur Pakai

1. **Kalkulator Diskon** — isi data produk → lihat status & batas aman → unduh PDF bila perlu.
2. **Kalender Rekomendasi Diskon** — pilih tanggal untuk melihat momen promosi dan saran.
3. **Kalkulator Bundling** — susun paket → atur diskon & target → lihat hasil → unduh PDF.

Form dimulai **kosong** (tanpa data contoh).

---

## Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Markup | HTML5 |
| Styling | Tailwind CSS v3.4.17 |
| Logika | Vanilla JavaScript |
| Penyimpanan | localStorage |
| PDF | Generator internal `js/pdf.js` (tanpa library/CDN) |
| Testing | Node.js (`scripts/check.js`) |
| Font | Plus Jakarta Sans |
| Ikon | Material Symbols |

---

## Struktur Folder

```
layakDiskon/
├── index.html          # UI utama (3 tab)
├── tailwind.config.js  # Token warna & font
├── package.json
├── css/
│   ├── tailwind.css    # Hasil build (minified)
│   ├── input.css       # Sumber Tailwind
│   └── custom.css      # Slider, tab, print
├── js/
│   ├── core.js         # Navigasi tab, toast, init
│   ├── calculation.js  # Kalkulasi diskon & status
│   ├── actions.js      # Aksi kalkulator, salin & PDF
│   ├── preferences.js  # localStorage, kalender, kalkulator bundling
│   └── pdf.js          # Generator PDF A4
├── assets/
│   ├── logo-icon.png   # Logo aplikasi
│   └── favicon.svg
├── scripts/
│   └── check.js        # Validasi sintaks & handler
└── README.md
```

---

## Menjalankan Lokal

Tidak perlu server. Cukup buka `index.html` di browser.

```powershell
# install dependensi (sekali saja)
npm install

# build ulang CSS Tailwind setelah mengubah class
npm run build:css

# validasi sintaks JS + handler onclick
npm test
```

> Jika CSS tidak berubah, lakukan hard refresh (`Ctrl + F5`).

---

## Penyimpanan Data (localStorage)

| Key | Status | Isi |
|-----|--------|-----|
| `layak_pref` | Aktif | Preferensi internal (floor price, margin default, ambang alert) |
| `layak_jadwal` | Legacy | Data produk terjadwal (UI kalender tidak lagi memakainya) |
| `layak_bundles` | Legacy | Daftar paket bundling (UI paket tersimpan sudah dihapus) |

Semua data privat di perangkat pengguna. Menghapus data situs/cache browser akan menghapus data aplikasi.

---

## Download PDF

- Tombol **Download PDF** tersedia di Kalkulator Diskon dan Kalkulator Bundling.
- PDF dibuat langsung di browser via `js/pdf.js` (A4, header, tabel, status berwarna, footer + nomor halaman).
- **Tidak** mengambil slider, input, atau tombol — hanya informasi hasil perhitungan.

---

## Design System

- **Primary:** `#025CE2`
- **Semantic:** Emerald (aman), Amber (waspada), Rose (rugi)
- **Surface:** `#F8FAFC` (kanvas), `#FFFFFF` (kartu)
- **Border:** `#E2E8F0`
- **Typography:** Plus Jakarta Sans, tabular numerals untuk angka uang

---

## Catatan & Limitasi

- Perhitungan memakai aturan sederhana; **bukan** jaminan permintaan pasar.
- Margin yang dihitung adalah **margin kotor** (belum termasuk biaya operasional, pajak, fee platform).
- Tidak ada backend, login, atau sinkronisasi cloud.
- Data hilang jika pengguna membersihkan data browser.
- Aplikasi berfokus pada UMKM; kategori kalender mengikuti pola promosi umum.

---

## Lisensi

Dirilis di bawah lisensi **ISC**. Lihat [LICENSE](LICENSE).

<p align="center">Dibuat untuk membantu UMKM mengambil keputusan diskon dengan lebih tenang.</p>
