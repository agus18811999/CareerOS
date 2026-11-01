# CareerOS — Setup Guide (VS Code + Firebase + Google Apps Script + Google Sheets + Vercel)

**File utama:**

- `index.html` — login, registrasi, reset password, email verification, Google Sign-In.
- `main.html` — career dashboard / 20+ menu, CRUD, responsive UI, charts, kanban, calendar.
- `Code.gs` — satu file backend Google Apps Script; pengelolaan data + autentikasi server.
- `api/rpc.mjs` — *tambahan teknis wajib* untuk hosting Vercel. Proxy same-origin ke Google Apps Script supaya frontend browser tidak terganggu CORS dan redirects.

Tidak memakai React, Vue, framework server atau build dependency proyek untuk memulai. Frontend HTML, CSS, Tailwind browser runtime, Vanilla JS; hanya tambahan CDN Firebase, Chart.js on-demand, dan font. Semua file frontend diedit **di Visual Studio Code**, bukan di Apps Script.

## 1) Persiapkan Google Sheets

1. Buat spreadsheet Google Sheets baru, misalnya `CareerOS Database`.
2. Buka URL spreadsheet: `https://docs.google.com/spreadsheets/d/CONTOH_SPREADSHEET_ID/edit`.
3. Salin bagian `CONTOH_SPREADSHEET_ID` (jangan seluruh URL). Tidak perlu membuat tab secara manual.

## 2) Buat backend Google Apps Script

1. Kunjungi [script.google.com](https://script.google.com) lalu buat project baru (Standalone).
2. Hapus seluruh isi default `Code.gs`, lalu paste seluruh isi file `Code.gs` dari paket ini.
3. Pada **Project Settings → Script Properties**, tambahkan:

   | Key | Value | Keterangan |
   |---|---|---|
   | `DATABASE_ID` | `1ContohIdSheet...` | ID spreadsheet yang kamu buat |
   | `FIREBASE_WEB_API_KEY` | `AIzaContohPublicWebApiKey...` | Firebase Project Settings → Your apps → Web API key; bukan service-account key |

4. Klik **Save**.
5. Pilih fungsi `careerSetup`, klik **Run**, lalu otorisasi akses Google Sheets.
6. Fungsi membuat 27 tab database dan header. **Jangan mengubah urutan kolom setelah ada data.**
7. Pilih `careerInstallReminderTrigger` → **Run** untuk mengaktifkan reminder harian pukul sekitar 07.00 zona waktu project (atur timezone project ke Asia/Jakarta). Untuk notifikasi email opt-in, otorisasi MailApp jika diminta. Email hanya dikirim bila pengguna mengaktifkan pengaturan emailReminders.
8. Klik **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
9. Klik **Deploy**, otorisasi jika diminta, salin **Web App URL berakhiran `/exec`**.
10. Setiap memperbarui `Code.gs`, gunakan **Manage deployments → Edit → New version → Deploy**. Menyimpan kode saja tidak memperbarui URL `/exec` yang aktif.

Mengapa Web App harus Anyone? Backend memakai identitas Firebase yang **diverifikasi per request** oleh Apps Script; pengguna tidak memerlukan akses langsung ke spreadsheet. Jangan mengganti verifikasi server-side ini dengan client-provided UID.

## 3) Buat Firebase Authentication

1. Buka Firebase Console; buat project baru.
2. **Project Settings → General → Your apps → Add Web App**.
3. Salin `apiKey`, `authDomain`, `projectId`, `appId` dari Firebase Web Config.
4. Di **Authentication → Sign-in method**, aktifkan **Email/Password** dan **Google**.
5. Di **Authentication → Settings → Authorized domains**, tambahkan domain final Vercel (misalnya `career-os-abc.vercel.app`) dan localhost untuk local development bila diperlukan.
6. Di `index.html` **dan** `main.html`, ganti objek yang sama:

```js
const firebaseConfig = {
  apiKey: 'FIREBASE_WEB_API_KEY_ASLI',
  authDomain: 'PROJECT_ID.firebaseapp.com',
  projectId: 'PROJECT_ID',
  appId: 'FIREBASE_WEB_APP_ID'
};
```

Konfigurasi browser Firebase ini boleh diketahui client; **jangan** menyimpan Firebase service-account private key di HTML.

## 4) Struktur direktori di VS Code

```text
CareerOS/
├── index.html
├── main.html
└── api/
    └── rpc.mjs
```

`Code.gs` **tidak perlu** dideploy ke Vercel. Simpan salinan lokal dalam project untuk backup saja; paste isinya ke Google Apps Script.

## 5) Deploy frontend dan API proxy ke Vercel

1. Buka folder `CareerOS` di Visual Studio Code.
2. Upload/commit directory ke repository GitHub, lalu **Import Project** dari Vercel, pilih Framework Preset **Other** atau static.
3. Di Vercel **Project Settings → Environment Variables**, set:
   - **Name:** `GAS_WEB_APP_URL`
   - **Value:** `https://script.google.com/macros/s/AKfycbxxxxxx/exec` (URL asli backend kamu)
   - Environment: Production + Preview sesuai kebutuhan.
4. Deploy ulang setelah mengatur environment variable.
5. Kunjungi `https://domain-vercel-mu.vercel.app/api/rpc` untuk tes proxy health check (harus muncul JSON `ok:true`).
6. Buka `https://domain-vercel-mu.vercel.app/` untuk halaman login.
7. Daftar menggunakan email; verifikasi lewat tautan yang dikirim Firebase. Setelah verifikasi, kembali ke halaman auth dan klik **I've verified my email**.
8. Setelah login, URL `main.html` terbuka otomatis dan memerlukan autentikasi. Backend juga menolak seluruh data request tanpa token Firebase valid.

**Untuk menjalankan dari VS Code secara lokal:** gunakan Vercel CLI `vercel dev` agar route `/api/rpc` ikut aktif, bukan hanya VS Code Live Server. Install CLI via `npm i -g vercel`, login `vercel login`, tautkan proyek via `vercel link`, dan jalankan `vercel dev`. URL lokal biasanya `http://localhost:3000/`. Firebase Authorized Domains harus sesuai.

## 6) Cara penggunaan

- Lowongan pekerjaan → Add Opportunity → simpan → klik tombol Apply (akan membuat Job Application terkait saat pengguna menekan Save).
- Job Applications → Table / Cards / Kanban → drag card ke stage baru; pada perangkat sentuh gunakan dropdown status pada kartu.
- Jika status lamaran **Accepted**, klik detail → **Create employment**.
- Jika aplikasi internship atau volunteer **Accepted**, klik detail → convert ke aktivitas aktif.
- Setelah internship/volunteer selesai → **Mark completed**; data akan direferensikan di Experience History.
- Agenda manual → Calendar → Add event; deadline tugas, peluang, dan follow-up tampil sebagai acara turunan dari data modul tersebut.
- Reminder → Notifications → Check reminders, atau aktifkan trigger harian.
- Dokumen karier: input **tautan privat** dan metadata dokumen. Belum ada unggah binary Google Drive. Jangan masukkan tautan publik pada berkas rahasia.
- Analytics menghitung angka dari tabel aplikasi sesungguhnya; Print/PDF menggunakan dialog browser Print → Save as PDF. CSV export tersedia per modul.

## 7) Verifikasi sebelum dipakai

- [ ] `careerSetup()` berhasil dan 27 sheet dibuat.
- [ ] `/api/rpc` menunjukkan status online dan environment `GAS_WEB_APP_URL` benar.
- [ ] Email/password + Google login berfungsi dari domain Vercel asli.
- [ ] Akun belum diverifikasi tidak bisa mengakses data.
- [ ] Akun baru menampilkan empty state, bukan data dummy.
- [ ] Pembuatan, edit, pencarian, filter, pagination, duplikasi, archive dan CSV export semua berfungsi.
- [ ] Update status Kanban tercatat dalam `ApplicationStages`.
- [ ] Opportunity -> Application -> Employment tidak hilang relasinya.
- [ ] Internship / Volunteer -> History berjalan.
- [ ] Jadwal, deadline, dan pengingat sesuai tanggal.
- [ ] User A tidak bisa melihat atau mengubah ID milik User B.
- [ ] Error internet / backend down menampilkan peringatan, bukan pesan sukses.
- [ ] Sidebar mobile bisa di-scroll; menu terbawah dapat dicapai.
- [ ] Keyboard dan modal berjalan pada 320px, 375px, 430px, tablet, desktop.
- [ ] Pengukuran performance di Chrome DevTools: LCP, INP, API latency, dan network waterfalls.

## 8) Batasan jujur yang perlu dipahami

1. **Belum diaudit production security / load / accessibility secara menyeluruh.** Sintaks dan skenario backend dasar dapat diperiksa secara lokal; Firebase, Vercel, dan Apps Script produksi tetap perlu integration test langsung.
2. **Google Sheets bukan database dengan index native.** Daftar per modul memakai batch read satu sheet dan pemfilteran server, sedangkan lookup ID menggunakan TextFinder. Ini masuk akal untuk database personal kecil–menengah; ribuan baris serta request paralel perlu index/sharding/basis data baru.
3. **Target tampilan sekitar 1 detik bukan SLA.** Cold start Apps Script, Firebase Auth, Vercel Function, latency jaringan, dan Tailwind browser CDN bisa memperpanjang waktu. Dashboard shell dirender tanpa memuat semua tabel, tetapi data API tidak selalu < 1s.
4. Tailwind CDN di kedua HTML mempercepat setup copy-paste tetapi **bukan bentuk deployment Tailwind yang disarankan untuk produksi skala besar**. Setelah prototipe valid, compile Tailwind CSS dan inline hasilnya atau host CSS teroptimasi.
5. **Document manager sekarang metadata + link HTTPS**, bukan upload file biner ke Google Drive. Tambahkan endpoint upload dan izin Drive secara terpisah bila dibutuhkan.
6. **Delete records memakai soft-delete**, agar relasi dan audit tidak rusak. Record yang dihapus tidak muncul pada daftar aktif tetapi barisnya masih ada di Sheets. Tidak ada UI restore pada versi ini.
7. Analytics funnel memakai current stage; interview history parsial karena wawancara manual dapat dicatat di CalendarEvents. Statistik belum menjadi alat audit HR.
8. Bulk status update tersedia melalui tabel; pemilihan dibatasi record yang sudah dimuat. Jika butuh jutaan records, pindahkan database.
9. Daily reminder berjalan **hanya setelah** `careerInstallReminderTrigger` dipasang dan dapat bergantung pada kuota Google Apps Script/MailApp.
10. Token Firebase diverifikasi server-side melalui `accounts:lookup` dengan cache identitas singkat 45 detik. Token disimpan dalam memori browser yang dikelola Firebase, bukan ditulis ke Google Sheets.

## 9) Troubleshooting cepat

**`API belum aktif`** → akses melalui Vercel / `vercel dev`; Live Server tidak memiliki fungsi `/api/rpc`.

**`CONFIG_ERROR`** → cek `DATABASE_ID`, `FIREBASE_WEB_API_KEY`, atau `GAS_WEB_APP_URL`, serta run `careerSetup`.

**`Unauthorized`** → cek konfigurasi Firebase `index.html` dan `main.html` sama, token valid, alamat auth benar.

**`EMAIL_UNVERIFIED`** → buka email verifikasi dan klik link Firebase, lalu login ulang/klik check verified.

**`UPSTREAM_ERROR`** → deploy Web App Apps Script sebagai Anyone, Execute as Me, URL `/exec` benar; cek Executions di Apps Script.

**`UPSTREAM_FORMAT`** → backend mengembalikan halaman HTML (bukan JSON), biasanya deployment gagal, URL salah, akses tidak Anyone, atau Apps Script belum mengembalikan ContentService JSON.

**Gambar, chart, atau CSS lambat** → cek CDN, jaringan, dan browser devtools; chart baru dimuat ketika halaman Analytics dibuka.
