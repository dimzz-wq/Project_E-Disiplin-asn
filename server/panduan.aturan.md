# E-Disiplin ASN — Backend API

Backend API (Express) untuk sistem disiplin ASN (Laporan, Kasus, Pemeriksaan, Surat Keputusan).
Menggunakan **PostgreSQL**, JWT + refresh cookie, dan multer untuk upload dokumen.

---

## Prasyarat

- Node.js ≥ 18 (lihat `package.json` + `node_modules` untuk versi yang dipakai)
- Database **PostgreSQL 11+**
- (Dev) `nodemon` sudah ada di `devDependencies`

---

## Setup

### 1. Install deps

```sh
npm install
```

### 2. Siapkan database PostgreSQL

Buat database dulu sebelum menjalankan seed:

```sql
CREATE DATABASE edisiplin_asn;
```

> **Catatan migrasi:** proyek ini dahulu pakai MySQL/MariaDB. Setelah migrasi, driver sudah diganti ke `pg`, skema di `src/database/schema.sql` sudah dalam bentuk SQL PostgreSQL. Skrip `init-portable-db.ps1` (proksi MariaDB) sudah tidak dipakai dan bisa dihapus.

### 3. Atur konfigurasi

Salin template dan sesuaikan nilai yang perlu.

```sh
cp .env.example .env
```

Entri yang wajib diisi di `.env`:

| Kunci | Keterangan | Contoh |
|---|---|---|
| `DB_HOST` | Host PostgreSQL | `localhost` |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `DB_USER` | User PostgreSQL | `postgres` |
| `DB_PASSWORD` | Password PostgreSQL | *(isi sesuai server)* |
| `DB_NAME` | Nama database | `edisiplin_asn` |
| `JWT_SECRET` | Rahasia JWT akses | ganti di produksi |
| `JWT_REFRESH_SECRET` | Rahasia refresh token | ganti di produksi |
| `JWT_ACCESS_EXPIRES` | Masa aktif access token | `15m` |
| `JWT_REFRESH_EXPIRES` | Masa aktif refresh token | `7d` |
| `CLIENT_URL` | URL frontend (untuk CORS) | `http://localhost:5173` |
| `UPLOAD_DIR` | Folder upload file | `uploads` |
| `PORT` | Port server | `5000` |

Setelah migrasi PostgreSQL, nilai `DB_PORT`/`DB_USER` di inisialisasi sudah disesuaikan;
pastikan `DB_PASSWORD` sudah diisi sesuai kredensial lokal.

### 4. Jalankan migrasi & seed

Schema dan data demo ditanam sekali (idempoten, bisa diulang):

```sh
npm run seed:all
```

> Demonstrasi login berikut yang pakai password `password123` sudah ditanam oleh seed.
> Plain-text password yang disimpan saat ini (`abcd`) sengaja simpel untuk demo hanya.

### 5. Jalankan server

```sh
# development (nodemon)
npm run dev

# production
npm run start:prod
```

> Folder u
pload harus ada sebelum upload dokumen; `src/routes/documents.routes.js` membuatkan otomatis.

---

## Autentikasi

- Login / refresh / logout di `/api/auth` (Bearer token dalam header `Authorization`, refresh melalui cookie `refresh_token` atau body).
- Role yang dikenal: `admin`, `atasan`, `pemeriksa`, `bkpsdm`, `pegawai`, `inspektorat`.
- Middleware yang digunakan: `authenticate` (wajib token) dan `authorize(...roles)` (pemeriksaan role di beberapa endpoint).

---

## Test accounts (setelah seed)

Semua NIP berikut login dengan password sama (`password123`).

| NIP | Role | Unit |
|---|---|---|
| `198503152008011001` | admin | Dinas Kepegawaian |
| `197812222005022003` | atasan | Bidang Pembinaan |
| `198807152015011002` | pemeriksa | Inspektorat |
| `199102102019032001` | bkpsdm | BKPSDM |
| `199506082020121003` | pegawai | Sekretariat |
| `197611102002121004` | inspektorat | Inspektorat |

> Catatan: kedua file seed saat ini menyimpan plain-text `abcd` sebagai placeholder
> `password_hash`. Jika ingin pakai password `password123` yang di-hash ulang, sisihkan
> perilaku ini ke seed yang lebih eksplisit (mis. `hash('password123')` pakai bcryptjs),
> karena file seed yang ada **tidak** memanggil bcryptjs saat run — deskripsi README seed
> hanya menunjuk ke baru ini.

---

## API (ringkasan endpoint)

- `GET /api/health` — cek status service.
- `POST /api/auth/login`, `/refresh`, `/logout` dan `GET /api/auth/me`.
- `GET /api/dashboard/stats`, `GET /api/dashboard/charts`.
- `GET /api/employees` (pagination), `GET /api/employees/:id`.
- `GET /api/attendance` (pagination + filter), `GET /api/attendance/summary`.
- `GET /api/reports` (pagination + filter), `POST /api/reports`, `GET /api/reports/:id`.
- `GET /api/cases` (pagination + filter), `GET /api/cases/:id`, `PATCH /api/cases/:id/status`.
- `GET /api/examinations` (pagination + filter), `POST /api/examinations`.
- `GET /api/decisions` (pagination + filter).
- `POST /api/documents/upload`, `GET /api/documents/:id`.
- `GET /api/audit-logs` (pagination + filter) — dibatasi role tertentu.

> Kebanyakan endpoint dengan daftar data mengembalikan pagination (`page`, `limit`, `total`, `total_pages`).

---

## Catatan kritis dari migrasi ke PostgreSQL

1. **Placeholder**: query masih ditulis dengan tanda `?`. Di layer `src/config/db.js`,
   `?` otomatis diterjemahkan ke placeholder `$1, $2, …` sebelum dikirim ke PostgreSQL.
   Jadi kode di routes **tidak perlu diubah lagi** jika hanya mengganti driver.

2. **Error kode**: handler error di `src/middleware/errorHandler.js` sudah memetakan
   error kode PostgreSQL (`23505`, `23503`, `23514`) ke 400/409 yang setara dengan
   perilaku MySQL (`ER_DUP_ENTRY`).

3. **Type data**: `COUNT(*)` dan hasil `EXTRACT` sudah disamakan menjadi number
   (bukan string) agar format JSON tetap sama seperti MySQL.

4. **Case-insensitive**: filter pencarian wajib pakai `ILIKE` (sudah diterapkan di
   semua endpoint pencarian).

5. **Unique / INSERT IGNORE**: di route attendance (`extra-seed`) dan pakai `ON CONFLICT`
   untuk mensimulasikan `INSERT IGNORE` MySQL.

6. **Kolom `updated_at`**: di PostgreSQL dipakai trigger `set_updated_at()` sebagai ganti
   `ON UPDATE CURRENT_TIMESTAMP`.

---

## Kemungkinan lebih jauh (opsional)

- Pasang adapter bcryptjs di seed/sistem supaya password disimpan di-hash (bukan plain `abcd`).
- Rapikan seed demo: tekankan satu sumber kebenaran untuk kata sandi demo.
- API dokumentasi lanjutan / OpenAPI schema.
- Latihan migrasi data keluar-masuk jika hari nanti memang ingin memindahkan data lama MySQL.
