/**
 * Extra data seed — tambahkan data demo yang lebih kaya agar semua halaman terisi.
 * Usage: node src/database/extra-seed.js
 */
import dotenv from 'dotenv';
import pool, { query } from '../config/db.js';

dotenv.config();

async function main() {
  console.log('[extra-seed] Connected to PostgreSQL');

  // ── 1. tambah pegawai ──────────────────────────────────────────────────────
  const units = await query('SELECT id, name FROM org_units');
  const unitMap = {};
  units.forEach(u => { unitMap[u.name] = u.id; });

  const extraEmployees = [
    { nip: '198201012006041005', name: 'Dra. Novi Lestari',       unit: 'Dinas Kepegawaian', position: 'Kasubag Umum',           type: 'PNS',  rank: 'III/d', status: 'active', join: '2006-04-01' },
    { nip: '199009172022211006', name: 'Fajar Nugroho',           unit: 'Sekretariat',       position: 'Pranata Komputer',       type: 'PPPK', rank: '-',     status: 'active', join: '2022-11-01' },
    { nip: '198605212010012007', name: 'Yusuf Maulana, S.IP',     unit: 'Bidang Pembinaan',  position: 'Analis Kebijakan',       type: 'PNS',  rank: 'III/b', status: 'active', join: '2010-01-01' },
    { nip: '199302112018011008', name: 'Anisa Rahayu, S.E',       unit: 'BKPSDM',            position: 'Pengelola Kepegawaian',  type: 'PPPK', rank: '-',     status: 'active', join: '2018-01-01' },
    { nip: '197811052002121009', name: 'Drs. Hendra Gunawan',     unit: 'Bidang Pembinaan',  position: 'Kepala Seksi',           type: 'PNS',  rank: 'IV/a',  status: 'active', join: '2002-12-01' },
    { nip: '199107232020121010', name: 'Rizky Firmansyah, S.H',  unit: 'Inspektorat',       position: 'Auditor',                type: 'PNS',  rank: 'III/a', status: 'active', join: '2020-12-01' },
    { nip: '199511202019012011', name: 'Dian Purnama, A.Md',     unit: 'Sekretariat',       position: 'Pengadministrasi',       type: 'PPPK', rank: '-',     status: 'active', join: '2019-01-01' },
    { nip: '199003152014032012', name: 'Yuni Astuti, S.E',        unit: 'Dinas Kepegawaian', position: 'Analis Keuangan',        type: 'PNS',  rank: 'III/c', status: 'active', join: '2014-03-01' },
    { nip: '198705112009011013', name: 'Sri Wahyuni, S.Pd',       unit: 'Bidang Pembinaan',  position: 'Guru Pembina',           type: 'PNS',  rank: 'III/d', status: 'active', join: '2009-01-01' },
    { nip: '199406082021111014', name: 'Budi Santoso, S.T',      unit: 'Sekretariat',       position: 'Teknisi',                type: 'PPPK', rank: '-',     status: 'active', join: '2021-11-01' },
  ];

  let insertedEmp = 0;
  for (const e of extraEmployees) {
    const ex = await query('SELECT id FROM employees WHERE nip = ?', [e.nip]);
    if (ex.length === 0) {
      await query(
        'INSERT INTO employees (nip, name, unit_id, position, status, type, rank_grade, join_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [e.nip, e.name, unitMap[e.unit] || 1, e.position, e.status, e.type, e.rank, e.join]
      );
      insertedEmp++;
    }
  }
  console.log(`[extra-seed] Employees: +${insertedEmp} inserted.`);

  // Get reporter & PIC user IDs
  const users = await query('SELECT id, role, name FROM users');
  const adminId    = users.find(u => u.role === 'admin')?.id;
  const atasanId   = users.find(u => u.role === 'atasan')?.id;
  const pemeriksaId = users.find(u => u.role === 'pemeriksa')?.id;
  const bkpsdmId   = users.find(u => u.role === 'bkpsdm')?.id;

  // Get all employees
  const allEmps = await query('SELECT id, name FROM employees');
  function randomEmp() { return allEmps[Math.floor(Math.random() * allEmps.length)]; }

  // ── 2. tambah laporan ──────────────────────────────────────────────────────
  const existReports = await query('SELECT COUNT(*) AS c FROM reports');
  let reportIds = [];

  if (existReports[0].c < 5) {
    const reportData = [
      { cat: 'kehadiran',               title: 'Ketidakhadiran tanpa keterangan selama 5 hari',      desc: 'Pegawai tidak hadir 5 hari berturut-turut tanpa memberikan keterangan yang sah.', priority: 'tinggi' },
      { cat: 'kode_etik',               title: 'Dugaan pelecehan terhadap rekan kerja',               desc: 'Terdapat laporan bahwa pegawai mengucapkan kata-kata tidak pantas kepada rekan kerja.', priority: 'sedang' },
      { cat: 'kinerja',                 title: 'Tidak memenuhi target kinerja triwulan',              desc: 'Pegawai tidak mencapai target yang telah ditetapkan dalam SKP triwulan ini.', priority: 'rendah' },
      { cat: 'penyalahgunaan_wewenang', title: 'Dugaan penggunaan aset negara untuk kepentingan pribadi', desc: 'Kendaraan dinas digunakan di luar jam kerja untuk keperluan pribadi.', priority: 'kritis' },
      { cat: 'kehadiran',               title: 'Terlambat masuk kerja berulang kali',                 desc: 'Pegawai terlambat lebih dari 30 menit sebanyak 15 hari dalam satu bulan.', priority: 'sedang' },
    ];

    const year = new Date().getFullYear();
    const existNums = await query('SELECT report_no FROM reports WHERE report_no ILIKE ? ORDER BY id DESC LIMIT 1', [`LAP-${year}-%`]);
    let nextNum = existNums.length > 0 ? (parseInt(existNums[0].report_no.split('-')[2]) + 1) : 1;

    for (const r of reportData) {
      const emp = randomEmp();
      const repNo = `LAP-${year}-${String(nextNum++).padStart(4, '0')}`;
      const res = await query(
        `INSERT INTO reports (report_no, reporter_id, reported_employee_id, category, title, description, incident_date, incident_location, priority, status)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE - make_interval(days => ?), 'Kantor Pusat', ?, 'diajukan')
         RETURNING id`,
        [repNo, atasanId || adminId, emp.id, r.cat, r.title, r.desc, Math.floor(Math.random() * 30), r.priority]
      );
      reportIds.push({ id: res[0].id, no: repNo, empId: emp.id, empName: emp.name });
    }
    console.log(`[extra-seed] Reports: +${reportData.length} inserted.`);
  } else {
    const existingReports = await query('SELECT id, report_no, reported_employee_id FROM reports LIMIT 5');
    reportIds = existingReports.map(r => ({ id: r.id, no: r.report_no, empId: r.reported_employee_id }));
    console.log(`[extra-seed] Reports already exist, skipping.`);
  }

  // ── 3. tambah kasus ───────────────────────────────────────────────────────
  const existCases = await query('SELECT COUNT(*) AS c FROM cases');
  let caseIds = [];

  if (existCases[0].c < 5 && reportIds.length > 0) {
    const caseData = [
      { status: 'baru',             level: 'ringan', priority: 'rendah' },
      { status: 'pemeriksaan',      level: 'sedang', priority: 'sedang' },
      { status: 'putusan',          level: 'berat',  priority: 'tinggi' },
      { status: 'selesai',          level: 'ringan', priority: 'rendah' },
      { status: 'penyelidikan',     level: 'sedang', priority: 'sedang' },
    ];
    const year = new Date().getFullYear();
    const caseNums = await query('SELECT case_no FROM cases WHERE case_no ILIKE ? ORDER BY id DESC LIMIT 1', [`KASUS-${year}-%`]);
    let nextCaseNum = caseNums.length > 0 ? (parseInt(caseNums[0].case_no.split('-')[2]) + 1) : 1;

    for (let i = 0; i < Math.min(caseData.length, reportIds.length); i++) {
      const r = reportIds[i];
      const c = caseData[i];
      const caseNo = `KASUS-${year}-${String(nextCaseNum++).padStart(4, '0')}`;
      const res = await query(
        `INSERT INTO cases (case_no, report_id, subject_employee_id, pic_id, category, title, description, status, priority, level)
         VALUES (?, ?, ?, ?, 'kehadiran', ?, 'Kasus pelanggaran disiplin ASN', ?, ?, ?)
         RETURNING id`,
        [caseNo, r.id, r.empId, pemeriksaId || adminId, `Kasus: ${r.no}`, c.status, c.priority, c.level]
      );
      caseIds.push({ id: res[0].id, no: caseNo, empId: r.empId });
      await query(
        'INSERT INTO case_timeline (case_id, action, actor_id, type) VALUES (?, ?, ?, ?)',
        [res[0].id, `Kasus dibuat dari laporan ${r.no}`, adminId, 'created']
      );
    }
    console.log(`[extra-seed] Cases: +${caseData.length} inserted.`);
  } else {
    const existingCases = await query('SELECT id, case_no, subject_employee_id FROM cases LIMIT 5');
    caseIds = existingCases.map(c => ({ id: c.id, no: c.case_no, empId: c.subject_employee_id }));
    console.log(`[extra-seed] Cases already exist, skipping.`);
  }

  // ── 4. tambah kehadiran hari ini ──────────────────────────────────────────
  const todayAtt = await query('SELECT COUNT(*) AS c FROM attendance WHERE date = CURRENT_DATE');
  if (todayAtt[0].c === 0) {
    const statusPool = ['hadir', 'hadir', 'hadir', 'hadir', 'terlambat', 'terlambat', 'alpa', 'ijin', 'sakit'];
    for (const emp of allEmps.slice(0, 15)) {
      const status = statusPool[Math.floor(Math.random() * statusPool.length)];
      const timeIn  = status === 'alpa' || status === 'ijin' ? null : `0${7 + (status === 'terlambat' ? 1 : 0)}:${Math.floor(Math.random()*60).toString().padStart(2,'0')}:00`;
      const timeOut = status === 'alpa' || status === 'ijin' ? null : '16:30:00';
      await query(
        'INSERT INTO attendance (employee_id, date, time_in, time_out, status) VALUES (?, CURRENT_DATE, ?, ?, ?) ON CONFLICT (employee_id, date) DO NOTHING',
        [emp.id, timeIn, timeOut, status]
      );
    }
    console.log(`[extra-seed] Attendance: seeded today's records.`);
  } else {
    console.log(`[extra-seed] Attendance today already exists, skipping.`);
  }

  // ── 5. tambah audit log ──────────────────────────────────────────────────
  const auditCount = await query('SELECT COUNT(*) AS c FROM audit_logs');
  if (auditCount[0].c === 0 && users.length > 0) {
    const actions = [
      { action: 'LOGIN',  detail: 'Login ke sistem berhasil',          module: 'auth' },
      { action: 'CREATE', detail: 'Membuat laporan pelanggaran baru',   module: 'reports' },
      { action: 'UPDATE_STATUS', detail: 'Memperbarui status kasus',   module: 'cases' },
      { action: 'VIEW',   detail: 'Melihat daftar pegawai',             module: 'employees' },
      { action: 'EXPORT', detail: 'Mengekspor laporan ke Excel',        module: 'reports' },
    ];
    for (const u of users) {
      for (const act of actions) {
        await query(
          'INSERT INTO audit_logs (user_id, user_name, action, detail, module, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
          [u.id, u.name, act.action, act.detail, act.module, '127.0.0.1']
        );
      }
    }
    console.log(`[extra-seed] Audit logs: seeded.`);
  } else {
    console.log(`[extra-seed] Audit logs already exist, skipping.`);
  }

  await pool.end();
  console.log('[extra-seed] ✅ Done!');
}

main().catch(err => {
  console.error('[extra-seed] FAILED:', err.message);
  process.exit(1);
});
