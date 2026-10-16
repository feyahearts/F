# Pixel Quest: Misteri Buku Kas — Expanded Village Edition

Versi ini langsung bisa dibuka di VS Code. Map utama digambar lewat `game.js`, jadi tidak perlu menyusun tile di Tiled untuk menjalankan game.

## Cara menjalankan
1. Ekstrak ZIP.
2. Buka VS Code → **File → Open Folder...** → pilih folder `PixelQuest_Starter`.
3. Pasang ekstensi **Live Server** jika belum ada.
4. Klik kanan `index.html` → **Open with Live Server**.
5. Internet perlu aktif karena Phaser 3 dimuat dari CDN.

## Kontrol
- **W A S D** atau tombol panah: bergerak.
- **E** atau **Spasi**: bicara, mulai level, masuk/keluar bangunan.
- **Esc**: menutup dialog.

## Cerita
Festival Panen Desa Lumina hampir dimulai, tetapi Buku Kas Desa yang mencatat dana festival menghilang. Pemain berperan sebagai auditor muda yang harus menjelajahi desa, memeriksa transaksi, mengumpulkan petunjuk warga, dan menyelesaikan lima level untuk menemukan kode rahasia **3527**.

## NPC dan level
Ada **10 NPC**:
- **5 penjaga level**: Bu Rani (Level 1), Pak Danu (Level 2), Lani (Level 3), Mira (Level 4), dan Bimo (Level 5). Dekati NPC lalu tekan **E** untuk menjawab **5 soal** di levelnya.
- **5 pemberi petunjuk**: Alya, Sari, Jalu, Nenek Wati, dan Timo. Alya adalah pemandu desa berambut cokelat panjang yang menyambut pemain di awal permainan. Bicara dengan mereka untuk mendapatkan petunjuk lokasi dan tips audit.

Total ada **25 soal akuntansi** (5 soal per level). Kunci jawaban dan pembahasan untuk sebuah level ditampilkan setelah semua soal pada level tersebut selesai.

## Misi utama dan dunia
Di kiri atas layar ada panel misi **Bantu Bimo** yang menampilkan progres 0/5 level dan daftar lima misi. Setiap level yang selesai akan ditandai. Setelah lima level selesai, temui Bimo lagi untuk menutup cerita dan mengungkap kode 3527.

Di awal permainan, Alya menyambut pemain dengan dialog: “Hai, selamat datang di Desa Lumina, Detektif!” Ia menjelaskan hilangnya Buku Kas Desa dan mengarahkan pemain untuk mulai membantu Bu Rani di dekat Arsip Desa.

Lingkungan sekarang memiliki kanopi pohon pixel bertingkat, rumpun semak, batu, bunga, jalur bercabang, kolam, pagar, lampu, dan bangunan yang lebih mudah dibedakan. Hewan seperti ayam, sapi, kucing, bebek, dan domba berada di area rumput dan bergerak pendek supaya tidak berantakan di jalur utama. Beberapa bangunan memiliki interior sederhana.

`maps/village.tmj` adalah file eksperimen Tiled terpisah; versi game yang langsung dimainkan ini menggambar map dari `game.js` dan belum memuat file TMJ tersebut.

## Jika layar kosong
- Pastikan internet aktif.
- Jalankan dengan Live Server, bukan membuka file HTML langsung.
- Jika masih kosong, buka Developer Tools → Console di browser untuk melihat error.

## Aturan kuis akuntansi (versi terbaru)
- Setiap level terdiri dari 5 soal, dengan nilai maksimal 100 poin (20 poin per soal).
- Batas waktu keseluruhan satu level adalah 6 menit 50 detik.
- Setiap soal memiliki batas waktu 1 menit 30 detik.
- Jawaban benar pada percobaan pertama mendapat 20 poin. Jika soal sempat dijawab salah, soal tersebut tidak menghasilkan poin meskipun jawaban berikutnya benar.
- Setiap jawaban salah mengurangi 15 detik dari waktu level dan waktu soal. Dua jawaban salah berarti penalti total 30 detik.
- Maksimal 3 percobaan per soal. Setelah 3 kali salah, pemain harus melanjutkan ke soal berikutnya.
- Jika waktu soal habis, soal dilewati tanpa poin. Jika waktu level habis, level otomatis ditutup; soal yang belum dikerjakan tidak mendapat poin.
- Saat pertama kali mulai, Alya menyambut pemain dengan ilustrasi PNG, lalu menjelaskan aturan ini sebelum eksplorasi dimulai.

## Penyimpanan progres sementara (sesi browser)
- Game menyimpan progres sementara menggunakan `sessionStorage`, bukan `localStorage`.
- Progres tetap ada jika halaman di-refresh dalam tab yang sama.
- Saat tab/jendela game ditutup, sesi biasanya berakhir dan progres akan mulai dari nol saat game dibuka lagi.
- Progres tidak dirancang untuk disimpan permanen setelah sesi browser berakhir.
- Jika ingin menghapus progres saat tab masih terbuka, buka F12 → Console, jalankan `sessionStorage.removeItem('pixelQuestMisteriBukuKas_save_v2')`, lalu refresh halaman.

## Dialog pengantar NPC penjaga level
Setiap penjaga level kini memiliki dua dialog sebelum kuis dimulai: perkenalan diri dan penjelasan bantuan yang dibutuhkan. Tekan **Lanjutkan** setelah dialog pertama untuk membaca masalah yang perlu diselesaikan, lalu tekan **Lanjutkan** lagi untuk masuk ke soal.

- Bu Rani — Level 1: Cari Kesalahan / salah pencatatan
- Pak Danu — Level 2: Hitung Selisih / shortage dan overage
- Lani — Level 3: Periksa Bukti / nota dan kuitansi
- Mira — Level 4: Cari Pola / mengidentifikasi jenis kesalahan
- Bimo — Level 5: Pecahkan Kode / menyusun kode rahasia

## Update terbaru: urutan misi, poin percobaan, potret dan penutup
- Semua NPC penjaga level memperkenalkan diri dan memiliki potret PNG di kotak dialog.
- Nama NPC dan nomor level ditampilkan di atas kepala penjaga level di map.
- Level harus dikerjakan berurutan. Jika pemain mencoba berbicara dengan penjaga level lebih tinggi, NPC tetap memperkenalkan diri, lalu meminta pemain menyelesaikan level sebelumnya. Kuis tidak akan dibuka sebelum level sebelumnya selesai.
- Jawaban benar pada percobaan pertama = 20 poin; percobaan kedua = 15 poin; percobaan ketiga = 10 poin; tiga kali salah = 0 poin. Setiap jawaban salah tetap mengurangi waktu sesuai aturan.
- Setelah lima level selesai, Alya memberi sambutan penutup dan menampilkan total skor pemain.
- Potret NPC berada di `assets/characters/`.


## NPC portrait dan ending update
- Dialog Alya, Bu Rani, Pak Danu, Lani, Mira, Bimo, Sari, Jalu, Nenek Wati, dan Timo memakai file PNG portrait yang berbeda di `assets/characters/`. Setiap portrait memiliki warna rambut, pakaian, aksesori, dan tampilan yang berbeda sesuai karakter.
- Setelah semua misi selesai, Alya menampilkan tiga dialog berurutan: ucapan selamat; rekap total poin dari kelima level beserta poin per level; lalu ucapan terima kasih dan izin menjelajah bebas. Klik **Lanjutkan** untuk berpindah antar dialog. Setelah dialog ketiga ditutup, pemain bisa kembali mengeksplorasi desa.
- Poin level dijumlahkan terpisah dari bonus berbicara dengan NPC, sehingga total akhir menunjukkan poin dari kuis Level 1–5 (maksimal 500).
