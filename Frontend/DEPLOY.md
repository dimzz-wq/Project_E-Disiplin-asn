# E-Disiplin ASN — Panduan Deploy Production

## Arsitektur Deployment

```
Internet → Nginx/Server (port 80/443) → Express App (port 5000)
                                              ├── Serve React (dist/)  [GET /]
                                              └── API Handler          [GET /api/...]
                                                        │
                                                       MySQL (port 3306)
```

---

## Opsi A — Deploy dengan Docker (Direkomendasikan)

### Prasyarat
- Docker Engine 24+
- Docker Compose v2

### Langkah

**1. Clone/salin project ke server**
```bash
git clone <repo> e-disiplin-asn
cd e-disiplin-asn
```

**2. Buat file `.env` dari template**
```bash
cp .env.example .env
nano .env
```

Isi minimal:
```env
DB_ROOT_PASSWORD=password_root_anda
DB_USER=edisiplin
DB_PASSWORD=password_db_anda
DB_NAME=edisiplin_asn
JWT_SECRET=isi_dengan_64_karakter_acak
JWT_REFRESH_SECRET=isi_dengan_64_karakter_acak_berbeda
```

Generate JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**3. Build & jalankan**
```bash
docker compose up -d --build
```

**4. Import skema database**

Skema otomatis dijalankan dari `server/src/database/schema.sql` saat container pertama kali start.

Untuk seed data awal (opsional):
```bash
docker compose exec app node server/src/database/seed.js
```

**5. Cek status**
```bash
docker compose logs -f app
curl http://localhost:5000/api/health
```

Aplikasi berjalan di: **http://localhost:5000**

---

## Opsi B — Deploy Manual (Tanpa Docker)

### Prasyarat
- Node.js 20+
- MySQL 8 / MariaDB 10.5+
- PM2 (process manager)

### Langkah

**1. Install PM2**
```bash
npm install -g pm2
```

**2. Setup database**
```bash
mysql -u root -p < server/src/database/schema.sql
```

**3. Konfigurasi environment**
```bash
cp server/.env.production.example server/.env
nano server/.env
```

**4. Install dependencies backend**
```bash
cd server
npm install --omit=dev
```

**5. Build frontend**
```bash
cd ..   # kembali ke root project
npm install
npm run build
```

**6. Jalankan dengan PM2**
```bash
cd server
NODE_ENV=production pm2 start src/server.js --name edisiplin-asn
pm2 save
pm2 startup   # agar otomatis start saat reboot
```

**7. Cek status**
```bash
pm2 status
pm2 logs edisiplin-asn
curl http://localhost:5000/api/health
```

---

## Konfigurasi Nginx (Opsional — jika pakai domain + HTTPS)

Jika Anda punya domain dan ingin HTTPS, tambahkan Nginx sebagai reverse proxy:

```nginx
server {
    listen 80;
    server_name edisiplin.instansi.go.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name edisiplin.instansi.go.id;

    ssl_certificate     /etc/letsencrypt/live/edisiplin.instansi.go.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/edisiplin.instansi.go.id/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Manajemen (setelah deploy)

| Perintah | Keterangan |
|---|---|
| `docker compose up -d` | Start semua container |
| `docker compose down` | Stop semua container |
| `docker compose logs -f` | Lihat log realtime |
| `docker compose down -v && docker compose up -d` | Reset total (hapus data DB!) |
| `pm2 restart edisiplin-asn` | Restart server (manual deploy) |
| `pm2 logs edisiplin-asn` | Lihat log aplikasi |

---

## Seed Data Awal (Opsional)

```bash
# Docker
docker compose exec app node server/src/database/seed.js

# Manual
cd server && node src/database/seed.js
```

---

## Endpoint Penting

| URL | Keterangan |
|---|---|
| `http://SERVER:5000/` | Aplikasi E-Disiplin ASN |
| `http://SERVER:5000/api/health` | Cek status API |
| `http://SERVER:5000/api/auth/login` | Login endpoint |

---

> **PENTING:** Jangan pernah commit file `.env` ke Git. File tersebut berisi password dan secret key.
