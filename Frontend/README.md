# E-Disiplin ASN

Platform Terpadu Pengawasan dan Penegakan Aturan Pegawai Pemerintah (ASN).

Full-stack application: **React 19 + Vite** (frontend) dan **Express + MySQL** (backend).

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19, React Router 7, Recharts, Lucide Icons |
| Build | Vite 8, TypeScript (mode check only) |
| Backend | Node.js 20, Express |
| Database | MySQL 8 / MariaDB |
| Auth | JWT (Access Token + Refresh Token via httpOnly cookie) |
| Security | bcryptjs, helmet headers, CORS, rate limiting ready |

---

## Struktur Project

```
e-disiplin-asn/
├── src/                    # Frontend React
│   ├── components/         # AppLayout, LoadingScreen
│   ├── context/            # AuthContext
│   ├── data/               # mockData.js (fallback + UI constants)
│   ├── pages/              # 13 halaman aplikasi
│   └── services/           # API service layer
│
├── server/                 # Backend Express
│   ├── src/
│   │   ├── config/         # Database connection pool
│   │   ├── database/       # schema.sql + seed.js
│   │   ├── middleware/     # auth, errorHandler, audit
│   │   ├── routes/         # 10 API route modules
│   │   ├── app.js          # Express app
│   │   └── server.js       # Entry point
│   └── package.json
│
├── docker-compose.yml      # DB + API + Web (production)
├── Dockerfile              # Frontend (nginx)
└── nginx.conf              # Nginx config + API proxy
```

---

## Quick Start (Development)

### 1. Install dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 2. Setup database

**Opsi A: Pakai MySQL lokal**

```bash
# Buat database
mysql -u root -p -e "CREATE DATABASE edisiplin_asn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema
mysql -u root -p edisiplin_asn < server/src/database/schema.sql

# Seed data demo (opsional tapi disarankan)
cd server
npm run seed
```

**Opsi B: Pakai Docker (database saja)**

```bash
docker run -d --name edisiplin-db \
  -e MYSQL_ROOT_PASSWORD=edisiplin_root_2026 \
  -e MYSQL_DATABASE=edisiplin_asn \
  -p 3306:3306 \
  mysql:8.0
```

### 3. Konfigurasi environment

```bash
# Backend
cd server
cp .env.example .env
# Edit .env sesuai kredensial MySQL Anda

# Frontend (opsional, default sudah localhost:5000)
cp .env.example .env
```

### 4. Jalankan

```bash
# Terminal 1: Backend
cd server
npm run dev
# → http://localhost:5000

# Terminal 2: Frontend
npm run dev
# → http://localhost:5173
```

### 5. Login

Buka `http://localhost:5173` dan login dengan:

| NIP | Nama | Role |
|-----|------|------|
| 198505152010011001 | Dr. Ahmad Suryadi | Pimpinan Instansi |
| 197812032005012003 | Ir. Siti Rahmawati | Admin Kepegawaian |
| 198803122012011005 | Bambang Prakoso | Atasan Langsung |
| 199201082015032001 | Dewi Anggraeni | ASN/Pegawai |
| 198607182011011008 | Rudi Hartono | Petugas Pemeriksa |
| 197101011998031001 | Prof. Hasan Basri | Pejabat Berwenang |

**Password (semua user):** `password123`

---

## API Endpoints

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/auth/login` | ❌ | Login dengan NIP + password |
| POST | `/auth/refresh` | Cookie | Refresh access token |
| POST | `/auth/logout` | ❌ | Revoke session |
| GET | `/auth/me` | ✅ | Get current user profile |
| GET | `/dashboard/stats` | ✅ | Summary statistics |
| GET | `/dashboard/charts` | ✅ | Chart data |
| GET | `/employees` | ✅ | List employees (filter, search) |
| GET | `/employees/:id` | ✅ | Employee detail |
| GET | `/attendance` | ✅ | Attendance records |
| GET | `/attendance/summary` | ✅ | Attendance summary |
| GET | `/reports` | ✅ | List violation reports |
| POST | `/reports` | ✅ | Create new report |
| GET | `/reports/:id` | ✅ | Report detail |
| GET | `/cases` | ✅ | List cases |
| GET | `/cases/:id` | ✅ | Case detail + timeline + docs |
| PATCH | `/cases/:id/status` | ✅ | Update case status |
| GET | `/examinations` | ✅ | List examinations |
| POST | `/examinations` | ✅ | Schedule examination |
| GET | `/decisions` | ✅ | List disciplinary decisions |
| GET | `/audit-logs` | ✅ | Audit trail (admin only) |
| GET | `/health` | ❌ | Health check |

All protected endpoints require: `Authorization: Bearer <accessToken>`

---

## Roles & Permissions

| Role | Akses |
|------|-------|
| `pimpinan` | Semua fitur, termasuk audit log |
| `admin_kepegawaian` | Kelola laporan, kasus, pemeriksaan, keputusan |
| `atasan` | Lihat laporan kasus sendiri, beri klarifikasi |
| `pemeriksa` | Jalankan pemeriksaan, unggah BAP |
| `pejabat_berwenang` | Terbitkan keputusan 最终 |
| `pegawai` | Lihat status disiplin sendiri |
| `auditor` | Audit log, laporan analytics |

---

## Production Deployment

### Opsi 1: Docker Compose (Recommended)

```bash
# 1. Setup environment
cp server/.env.example server/.env
# Edit JWT secrets, database password

# 2. Build & run
docker-compose up -d --build

# 3. Seed database (sekali saja)
docker-compose exec api node src/database/seed.js

# 4. Akses
# Web: http://localhost:3000
# API: http://localhost:5000/api
# DB: localhost:3306
```

### Opsi 2: VPS Manual (Ubuntu/Debian)

#### Install dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL/MariaDB
sudo apt install -y mysql-server

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

#### Setup MySQL

```bash
sudo mysql_secure_installation

# Buat database & user
sudo mysql << 'SQL'
CREATE DATABASE edisiplin_asn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'edisiplin'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON edisiplin_asn.* TO 'edisiplin'@'localhost';
FLUSH PRIVILEGES;
SQL

# Import schema
mysql -u edisiplin -p edisiplin_asn < server/src/database/schema.sql
```

#### Deploy backend

```bash
cd /var/www/edisiplin-asn/server
npm ci --omit=dev
cp .env.example .env
# Edit .env dengan production credentials

# Seed database
node src/database/seed.js

# Start dengan PM2
pm2 start src/server.js --name "edisiplin-api"
pm2 save
pm2 startup
```

#### Deploy frontend

```bash
cd /var/www/edisiplin-asn
npm ci
npm run build

# Copy ke web root
sudo mkdir -p /var/www/edisiplin-web
sudo cp -r dist/* /var/www/edisiplin-web/
```

#### Nginx configuration

```nginx
server {
    listen 80;
    server_nameOMAIN.com;
    
    root /var/www/edisiplin-web;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 10M;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable SSL dengan Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d edisiplin.domain.go.id
```

---

## Environment Variables

### Backend (`server/.env`)

```env
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=edisiplin
DB_PASSWORD=your_secure_password
DB_NAME=edisiplin_asn
JWT_SECRET=very_long_random_secret_change_this
JWT_REFRESH_SECRET=another_very_long_random_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=https://your-domain.com
UPLOAD_DIR=./uploads
```

### Frontend (`.env`)

```env
VITE_API_URL=https://your-domain.com/api
```

---

## Security Checklist

- [x] Password hashing dengan bcrypt (12 rounds)
- [x] JWT access token expire 15 menit
- [x] Refresh token di httpOnly cookie (tidak bisa diakses JS)
- [x] Refresh token rotation (setiap refresh = token baru)
- [x] CORS whitelist via CLIENT_URL
- [x] Helmet security headers
- [x] Role-based access control (RBAC)
- [x] Audit log untuk semua aksi sensitif
- [x] Input validation di backend
- [x] File upload size limit (10MB)
- [ ] Rate limiting (implementasikan sebelum production)
- [ ] HTTPS enforcement (setup via certbot/nginx)
- [ ] Database encryption at rest
- [ ] Regular security audit & penetration testing

---

## Backup

### Database

```bash
# Manual backup
mysqldump -u root -p edisiplin_asn > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated (cron daily)
0 2 * * * mysqldump -u root -pYOUR_PASS edisiplin_asn | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

### File uploads

```bash
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz server/uploads/
```

---

## Troubleshooting

### Database connection failed

```bash
# Cek MySQL running
sudo systemctl status mysql

# Test koneksi
mysql -u edisiplin -p -h localhost edisiplin_asn

# Lihat error detail di backend
cd server && npm run dev
```

### CORS error di browser

Pastikan `CLIENT_URL` di `.env` backend sesuai dengan URL frontend Anda:

```env
CLIENT_URL=http://localhost:5173  # development
CLIENT_URL=https://your-domain.com  # production
```

### Token expired loop

Clear cookies browser atau implementasikan refresh token rotation yang lebih baik.

### Build frontend gagal

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/nama-fitur`
3. Commit: `git commit -m "feat: Tambah fitur X"`
4. Push: `git push origin feature/nama-fitur`
5. Create Pull Request

---

## License

Internal use only -bbing-[tidak untuk distribusi publik]

---

## Support

Untuk pertanyaan teknis atau bantuan deployment, hubungi tim IT instansi.

**Document Version:** 1.0  
**Last Updated:** October 2026