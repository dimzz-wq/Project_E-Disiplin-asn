/**
 * Database Seed Script — E-Disiplin ASN
 * Usage: npm run seed  (or: node src/database/seed.js)
 *
 * Runs the schema and seeds demo users matching the frontend demo accounts.
 * Default password for ALL demo users: password123 (hashed with bcryptjs)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool, { query } from '../config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const demoUsers = [
  { nip: '198503152008011001', name: 'Dr. Ahmad Suryadi', email: 'ahmad.suryadi@instansi.go.id', role: 'admin', position: 'Kepala Dinas', unit: 'Dinas Kepegawaian' },
  { nip: '197812222005022003', name: 'Ir. Siti Rahmawati', email: 'siti.rahmawati@instansi.go.id', role: 'atasan', position: 'Kepala Bidang', unit: 'Bidang Pembinaan' },
  { nip: '198807152015011002', name: 'Bambang Prakoso, SH', email: 'bambang.prakoso@instansi.go.id', role: 'pemeriksa', position: 'Analis Kepegawaian', unit: 'Inspektorat' },
  { nip: '199102102019032001', name: 'Dewi Anggraeni, S.IP', email: 'dewi.anggraeni@instansi.go.id', role: 'bkpsdm', position: 'Staff BKPSDM', unit: 'BKPSDM' },
  { nip: '199506082020121003', name: 'Rudi Hartono, S.Kom', email: 'rudi.hartono@instansi.go.id', role: 'pegawai', position: 'Staff Administrasi', unit: 'Sekretariat' },
  { nip: '197611102002121004', name: 'Prof. Hasan Basri', email: 'hasan.basri@instansi.go.id', role: 'inspektorat', position: 'Inspektur', unit: 'Inspektorat' },
];

async function main() {
  console.log('[seed] Connecting to PostgreSQL…');

  // 1) Run schema (multi-statement — pg mendukungnya selama tanpa parameter)
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  console.log('[seed] Running schema…');
  await query(schemaSql);
  console.log('[seed] Schema executed.');

  // 2) Seed org units
  const unitNames = ['Dinas Kepegawaian', 'Bidang Pembinaan', 'Inspektorat', 'BKPSDM', 'Sekretariat'];
  const unitIds = {};
  for (const name of unitNames) {
    const rows = await query('SELECT id FROM org_units WHERE name = ?', [name]);
    if (rows.length === 0) {
      const res = await query('INSERT INTO org_units (name) VALUES (?) RETURNING id', [name]);
      unitIds[name] = res[0].id;
    } else {
      unitIds[name] = rows[0].id;
    }
  }

  // 3) Seed users
  const passwordHash = 'abcd';
  const userIds = {};
  for (const u of demoUsers) {
    const unitId = unitIds[u.unit] || null;
    const rows = await query('SELECT id FROM users WHERE nip = ?', [u.nip]);
    if (rows.length === 0) {
      const res = await query(
        'INSERT INTO users (nip, name, email, password_hash, role, unit_id, position, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE) RETURNING id',
        [u.nip, u.name, u.email, passwordHash, u.role, unitId, u.position]
      );
      userIds[u.nip] = res[0].id;
    } else {
      userIds[u.nip] = rows[0].id;
      await query(
        'UPDATE users SET name=?, email=?, password_hash=?, role=?, unit_id=?, position=?, is_active=TRUE WHERE nip=?',
        [u.name, u.email, passwordHash, u.role, unitId, u.position, u.nip]
      );
    }
  }
  console.log(`[seed] Seeded ${demoUsers.length} demo users (password: abcd).`);

  // 4) Seed employees (mirror users + a few extras)
  const employeeRows = [
    ...demoUsers.map((u, i) => ({
      nip: u.nip,
      name: u.name,
      unit: u.unit,
      position: u.position,
      type: i % 3 === 2 ? 'PPPK' : 'PNS',
      rank: i % 2 === 0 ? 'IV/a' : 'III/c',
      status: 'active',
      join: `20${10 + i}-0${(i % 9) + 1}-15`,
    })),
    { nip: '198201012006041005', name: 'Dra. Novi Lestari', unit: 'Dinas Kepegawaian', position: 'Kasubag Umum', type: 'PNS', rank: 'III/d', status: 'active', join: '2006-04-01' },
    { nip: '199009172022211006', name: 'Fajar Nugroho', unit: 'Sekretariat', position: 'Pranata Komputer', type: 'PPPK', rank: '-', status: 'active', join: '2022-11-01' },
    { nip: '198605212010012007', name: 'Yusuf Maulana, S.IP', unit: 'Bidang Pembinaan', position: 'Analis Kebijakan', type: 'PNS', rank: 'III/b', status: 'active', join: '2010-01-01' },
  ];
  const empExisting = await query('SELECT COUNT(*) AS c FROM employees');
  if (empExisting[0].c === 0) {
    for (const e of employeeRows) {
      await query(
        'INSERT INTO employees (nip, name, unit_id, position, status, type, rank_grade, join_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [e.nip, e.name, unitIds[e.unit] || null, e.position, e.status, e.type, e.rank, e.join]
      );
    }
    console.log(`[seed] Seeded ${employeeRows.length} employees.`);
  }

  // 5) Seed one sample report + case + timeline so dashboards are not empty
  const reportCount = await query('SELECT COUNT(*) AS c FROM reports');
  if (reportCount[0].c === 0) {
    const empRows = await query('SELECT id FROM employees LIMIT 1');
    const reporterId = userIds[demoUsers[1].nip];
    const empId = empRows.length > 0 ? empRows[0].id : null;
    if (empId) {
      const r = await query(
        `INSERT INTO reports (report_no, reporter_id, reported_employee_id, category, title, description, incident_date, incident_location, priority, status)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE, ?, 'sedang', 'diajukan')
         RETURNING id`,
        ['LAP-2024-0001', reporterId, empId, 'kehadiran', 'Indisiplin kehadiran berulang', 'Pegawai tercatat tidak hadir tanpa keterangan sebanyak 5 hari dalam sebulan.', 'Kantor Pusat']
      );
      const reportId = r[0].id;
      const c = await query(
        `INSERT INTO cases (case_no, report_id, subject_employee_id, category, title, description, status, priority, level)
         VALUES (?, ?, ?, ?, ?, ?, 'baru', 'sedang', 'ringan')
         RETURNING id`,
        ['KASUS-2024-0001', reportId, empId, 'kehadiran', 'Indisiplin kehadiran berulang', 'Dugaan ketidakhadiran tanpa keterangan.']
      );
      await query('INSERT INTO case_timeline (case_id, action, actor_id, type) VALUES (?, ?, ?, ?)', [c[0].id, 'Kasus dibuat dari laporan LAP-2024-0001', reporterId, 'created']);
      console.log('[seed] Seeded sample report & case.');
    }
  }

  await pool.end();
  console.log('[seed] Done. All demo users password: password123');
}

main().catch((err) => {
  console.error('[seed] FAILED:', err.message);
  process.exit(1);
});
