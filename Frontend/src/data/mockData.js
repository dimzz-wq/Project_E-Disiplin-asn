// Mock data for E-Disiplin ASN

export const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'pegawai',
  SUPERVISOR: 'atasan',
  HR_ADMIN: 'admin_kepegawaian',
  EXAMINER: 'pemeriksa',
  AUTHORITY: 'pejabat_berwenang',
  LEADER: 'pimpinan',
  AUDITOR: 'auditor',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'System Administrator',
  [ROLES.EMPLOYEE]: 'ASN/Pegawai',
  [ROLES.SUPERVISOR]: 'Atasan Langsung',
  [ROLES.HR_ADMIN]: 'Admin Kepegawaian',
  [ROLES.EXAMINER]: 'Petugas Pemeriksa',
  [ROLES.AUTHORITY]: 'Pejabat Berwenang',
  [ROLES.LEADER]: 'Pimpinan Instansi',
  [ROLES.AUDITOR]: 'Auditor Internal',
};

export const CASE_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  NEED_CLARIFICATION: 'need_clarification',
  ASSIGNED: 'assigned_examination',
  EXAMINATION: 'examination_in_progress',
  WAITING_REVIEW: 'waiting_review',
  WAITING_DECISION: 'waiting_decision',
  DECISION_ISSUED: 'decision_issued',
  REMEDY: 'administrative_remedy',
  CLOSED: 'closed',
  REJECTED: 'rejected',
};

export const CASE_STATUS_LABELS = {
  [CASE_STATUS.DRAFT]: 'Draft',
  [CASE_STATUS.SUBMITTED]: 'Diajukan',
  [CASE_STATUS.UNDER_REVIEW]: 'Dalam Penelaahan',
  [CASE_STATUS.NEED_CLARIFICATION]: 'Perlu Klarifikasi',
  [CASE_STATUS.ASSIGNED]: 'Ditugaskan Pemeriksaan',
  [CASE_STATUS.EXAMINATION]: 'Pemeriksaan Berlangsung',
  [CASE_STATUS.WAITING_REVIEW]: 'Menunggu Tinjauan',
  [CASE_STATUS.WAITING_DECISION]: 'Menunggu Keputusan',
  [CASE_STATUS.DECISION_ISSUED]: 'Keputusan Diterbitkan',
  [CASE_STATUS.REMEDY]: 'Upaya Administratif',
  [CASE_STATUS.CLOSED]: 'Ditutup',
  [CASE_STATUS.REJECTED]: 'Ditolak',
};

export const CASE_STATUS_BADGE = {
  [CASE_STATUS.DRAFT]: 'badge-draft',
  [CASE_STATUS.SUBMITTED]: 'badge-submitted',
  [CASE_STATUS.UNDER_REVIEW]: 'badge-review',
  [CASE_STATUS.NEED_CLARIFICATION]: 'badge-clarification',
  [CASE_STATUS.ASSIGNED]: 'badge-assigned',
  [CASE_STATUS.EXAMINATION]: 'badge-examination',
  [CASE_STATUS.WAITING_REVIEW]: 'badge-waiting-review',
  [CASE_STATUS.WAITING_DECISION]: 'badge-waiting-decision',
  [CASE_STATUS.DECISION_ISSUED]: 'badge-decision',
  [CASE_STATUS.REMEDY]: 'badge-remedy',
  [CASE_STATUS.CLOSED]: 'badge-closed',
  [CASE_STATUS.REJECTED]: 'badge-rejected',
};

export const REPORT_CATEGORIES = [
  { id: 'attendance', label: 'Pelanggaran Jam Kerja / Ketidakhadiran' },
  { id: 'duty', label: 'Ketidakpatuhan Kewajiban Kedinasan' },
  { id: 'ethics', label: 'Dugaan Pelanggaran Kode Etik' },
  { id: 'conduct', label: 'Dugaan Pelanggaran Kode Perilaku' },
  { id: 'internal', label: 'Pelanggaran Aturan Internal' },
  { id: 'other', label: 'Lainnya' },
];

export const VIOLATION_LEVELS = [
  { id: 'ringan', label: 'Ringan', color: 'warning' },
  { id: 'sedang', label: 'Sedang', color: 'info' },
  { id: 'berat', label: 'Berat', color: 'danger' },
];

// Demo users for role switching
export const DEMO_USERS = [
  {
    id: 'USR-001',
    name: 'Dr. Ahmad Suryadi, M.A.P.',
    nip: '198505152010011001',
    role: ROLES.LEADER,
    unit: 'Badan Kepegawaian Daerah',
    position: 'Kepala Badan',
    avatar: 'AS',
  },
  {
    id: 'USR-002',
    name: 'Ir. Siti Rahmawati, M.M.',
    nip: '197812032005012003',
    role: ROLES.HR_ADMIN,
    unit: 'Bidang Pembinaan & Pengembangan',
    position: 'Kepala Bidang',
    avatar: 'SR',
  },
  {
    id: 'USR-003',
    name: 'Bambang Prakoso, S.H.',
    nip: '198803122012011005',
    role: ROLES.SUPERVISOR,
    unit: 'Sub Bidang Disiplin & Pensiun',
    position: 'Kepala Sub Bidang',
    avatar: 'BP',
  },
  {
    id: 'USR-004',
    name: 'Dewi Anggraeni, S.E.',
    nip: '199201082015032001',
    role: ROLES.EMPLOYEE,
    unit: 'Sub Bidang Mutasi',
    position: 'Analis Kepegawaian',
    avatar: 'DA',
  },
  {
    id: 'USR-005',
    name: 'Rudi Hartono, S.H., M.H.',
    nip: '198607182011011008',
    role: ROLES.EXAMINER,
    unit: 'Inspektorat',
    position: 'Auditor Muda',
    avatar: 'RH',
  },
  {
    id: 'USR-006',
    name: 'Prof. Hasan Basri, M.Si.',
    nip: '197101011998031001',
    role: ROLES.AUTHORITY,
    unit: 'Sekretariat Daerah',
    position: 'Sekretaris Daerah',
    avatar: 'HB',
  },
];

// Organizational Units
export const ORG_UNITS = [
  { id: 'U-001', name: 'Badan Kepegawaian Daerah', head: 'Dr. Ahmad Suryadi, M.A.P.', count: 45 },
  { id: 'U-002', name: 'Dinas Pendidikan', head: 'Drs. Wahyu Hidayat, M.Pd.', count: 120 },
  { id: 'U-003', name: 'Dinas Kesehatan', head: 'dr. Nina Sari, M.Kes.', count: 85 },
  { id: 'U-004', name: 'Dinas Pekerjaan Umum', head: 'Ir. Agus Setiawan, M.T.', count: 62 },
  { id: 'U-005', name: 'Dinas Sosial', head: 'Dra. Lestari Putri, M.Si.', count: 38 },
  { id: 'U-006', name: 'Inspektorat', head: 'Rudi Hartono, S.H., M.H.', count: 25 },
  { id: 'U-007', name: 'Sekretariat Daerah', head: 'Prof. Hasan Basri, M.Si.', count: 55 },
  { id: 'U-008', name: 'Dinas Kependudukan', head: 'Hendra Wijaya, S.IP., M.AP.', count: 42 },
];

// Employees
export const EMPLOYEES = [
  {
    id: 'EMP-001', nip: '199201082015032001', name: 'Dewi Anggraeni, S.E.',
    unit: 'Sub Bidang Mutasi', position: 'Analis Kepegawaian', status: 'Aktif',
    type: 'PNS', rank: 'III/a - Penata Muda', joinDate: '2015-03-01',
  },
  {
    id: 'EMP-002', nip: '199505212019011001', name: 'Andi Pratama, S.Kom.',
    unit: 'Bidang Data & TI', position: 'Pranata Komputer', status: 'Aktif',
    type: 'PNS', rank: 'III/b - Penata Muda Tk.I', joinDate: '2019-01-01',
  },
  {
    id: 'EMP-003', nip: '198712152010012004', name: 'Sri Wahyuni, S.Pd.',
    unit: 'Dinas Pendidikan', position: 'Guru', status: 'Aktif',
    type: 'PNS', rank: 'III/c - Penata', joinDate: '2010-01-01',
  },
  {
    id: 'EMP-004', nip: '199108232017012001', name: 'Ratna Sari, A.Md.Kep.',
    unit: 'Dinas Kesehatan', position: 'Perawat', status: 'Aktif',
    type: 'PNS', rank: 'II/d - Pengatur Tk.I', joinDate: '2017-01-01',
  },
  {
    id: 'EMP-005', nip: '198903172014021003', name: 'Budi Santoso, S.T.',
    unit: 'Dinas Pekerjaan Umum', position: 'Teknik Jalan & Jembatan', status: 'Aktif',
    type: 'PNS', rank: 'III/b - Penata Muda Tk.I', joinDate: '2014-02-01',
  },
  {
    id: 'EMP-006', nip: '199402122020012001', name: 'Fitri Handayani, S.Sos.',
    unit: 'Dinas Sosial', position: 'Penyuluh Sosial', status: 'Aktif',
    type: 'PPPK', rank: '-', joinDate: '2020-01-01',
  },
  {
    id: 'EMP-007', nip: '199606302021011001', name: 'Rizky Firmansyah, S.H.',
    unit: 'Bagian Hukum', position: 'Analis Hukum', status: 'Aktif',
    type: 'PNS', rank: 'III/a - Penata Muda', joinDate: '2021-01-01',
  },
  {
    id: 'EMP-008', nip: '198801052012012003', name: 'Mega Puspita, S.AP.',
    unit: 'Kecamatan Utara', position: 'Kasi Pemerintahan', status: 'Cuti',
    type: 'PNS', rank: 'III/c - Penata', joinDate: '2012-01-01',
  },
];

// Attendance data
export const ATTENDANCE_SUMMARY = {
  totalEmployees: 430,
  present: 398,
  late: 18,
  absent: 8,
  leave: 6,
  officialDuty: 4,
};

export const ATTENDANCE_RECORDS = [
  { id: 'ATT-001', employee: 'Dewi Anggraeni, S.E.', nip: '199201082015032001', date: '2026-10-14', timeIn: '07:28', timeOut: '16:05', status: 'Hadir', note: '' },
  { id: 'ATT-002', employee: 'Andi Pratama, S.Kom.', nip: '199505212019011001', date: '2026-10-14', timeIn: '08:15', timeOut: '16:30', status: 'Terlambat', note: 'Terlambat 45 menit' },
  { id: 'ATT-003', employee: 'Sri Wahyuni, S.Pd.', nip: '198712152010012004', date: '2026-10-14', timeIn: '-', timeOut: '-', status: 'Tidak Hadir', note: 'Tanpa keterangan' },
  { id: 'ATT-004', employee: 'Ratna Sari, A.Md.Kep.', nip: '199108232017012001', date: '2026-10-14', timeIn: '07:30', timeOut: '16:00', status: 'Hadir', note: '' },
  { id: 'ATT-005', employee: 'Budi Santoso, S.T.', nip: '198903172014021003', date: '2026-10-14', timeIn: '-', timeOut: '-', status: 'Cuti', note: 'Cuti Tahunan' },
  { id: 'ATT-006', employee: 'Fitri Handayani, S.Sos.', nip: '199402122020012001', date: '2026-10-14', timeIn: '07:25', timeOut: '16:10', status: 'Hadir', note: '' },
  { id: 'ATT-007', employee: 'Rizky Firmansyah, S.H.', nip: '199606302021011001', date: '2026-10-14', timeIn: '08:05', timeOut: '16:30', status: 'Terlambat', note: 'Terlambat 35 menit' },
  { id: 'ATT-008', employee: 'Mega Puspita, S.AP.', nip: '198801052012012003', date: '2026-10-14', timeIn: '-', timeOut: '-', status: 'Dinas Luar', note: 'Perjalanan Dinas ke Jakarta' },
];

// Violation Reports
export const REPORTS = [
  {
    id: 'LP-2026-001', date: '2026-10-01', reporter: 'Bambang Prakoso, S.H.',
    reported: 'Sri Wahyuni, S.Pd.', unit: 'Dinas Pendidikan',
    category: 'attendance', title: 'Ketidakhadiran berulang tanpa keterangan',
    description: 'Pegawai tercatat tidak hadir selama 5 hari kerja berturut-turut tanpa keterangan yang dapat diverifikasi.',
    status: CASE_STATUS.ASSIGNED, priority: 'high',
    attachments: 2, lastUpdate: '2026-10-10',
  },
  {
    id: 'LP-2026-002', date: '2026-10-03', reporter: 'Sistem Monitoring',
    reported: 'Andi Pratama, S.Kom.', unit: 'Bidang Data & TI',
    category: 'attendance', title: 'Keterlambatan berulang melebihi batas toleransi',
    description: 'Data absensi menunjukkan keterlambatan lebih dari 30 menit sebanyak 12 kali dalam periode September 2026.',
    status: CASE_STATUS.SUBMITTED, priority: 'medium',
    attachments: 1, lastUpdate: '2026-10-05',
  },
  {
    id: 'LP-2026-003', date: '2026-10-05', reporter: 'Fitri Handayani, S.Sos.',
    reported: 'Budi Santoso, S.T.', unit: 'Dinas Pekerjaan Umum',
    category: 'ethics', title: 'Dugaan pelanggaran kode etik dalam pelayanan publik',
    description: 'Laporan dari masyarakat mengenai perilaku tidak profesional saat pelayanan di loket.',
    status: CASE_STATUS.UNDER_REVIEW, priority: 'high',
    attachments: 3, lastUpdate: '2026-10-09',
  },
  {
    id: 'LP-2026-004', date: '2026-10-07', reporter: 'Rudi Hartono, S.H., M.H.',
    reported: 'Mega Puspita, S.AP.', unit: 'Kecamatan Utara',
    category: 'duty', title: 'Tidak menyelesaikan tugas kedinasan tepat waktu',
    description: 'Laporan evaluasi menunjukkan beberapa tugas yang diberikan tidak diselesaikan sesuai target waktu yang ditetapkan.',
    status: CASE_STATUS.NEED_CLARIFICATION, priority: 'low',
    attachments: 1, lastUpdate: '2026-10-12',
  },
  {
    id: 'LP-2026-005', date: '2026-10-08', reporter: 'Anonymous',
    reported: 'Rizky Firmansyah, S.H.', unit: 'Bagian Hukum',
    category: 'conduct', title: 'Dugaan penyalahgunaan wewenang',
    description: 'Laporan anonim mengenai penggunaan fasilitas kantor untuk kepentingan pribadi.',
    status: CASE_STATUS.EXAMINATION, priority: 'high',
    attachments: 4, lastUpdate: '2026-10-13',
  },
];

// Cases
export const CASES = [
  {
    id: 'KS-2026-001', reportId: 'LP-2026-001', date: '2026-10-02',
    subject: 'Sri Wahyuni, S.Pd.', nip: '198712152010012004',
    unit: 'Dinas Pendidikan', category: 'attendance',
    title: 'Ketidakhadiran berulang tanpa keterangan',
    status: CASE_STATUS.ASSIGNED, priority: 'high',
    pic: 'Rudi Hartono, S.H., M.H.', deadline: '2026-11-01',
    level: 'sedang',
    timeline: [
      { date: '2026-10-02 09:15', action: 'Kasus dibuat dari laporan LP-2026-001', actor: 'Ir. Siti Rahmawati, M.M.', type: 'info' },
      { date: '2026-10-03 10:30', action: 'Status diubah menjadi "Dalam Penelaahan"', actor: 'Ir. Siti Rahmawati, M.M.', type: 'info' },
      { date: '2026-10-05 14:00', action: 'Data kehadiran diverifikasi dengan unit kerja', actor: 'Bambang Prakoso, S.H.', type: 'success' },
      { date: '2026-10-08 09:45', action: 'Ditugaskan kepada Tim Pemeriksa', actor: 'Ir. Siti Rahmawati, M.M.', type: 'warning' },
      { date: '2026-10-10 11:00', action: 'Surat pemanggilan pemeriksaan dikirim', actor: 'Rudi Hartono, S.H., M.H.', type: 'info' },
    ],
    documents: [
      { name: 'Rekap Absensi September 2026.pdf', type: 'PDF', size: '245 KB', date: '2026-10-02', uploader: 'Sistem' },
      { name: 'Surat Pemanggilan Pemeriksaan.pdf', type: 'PDF', size: '128 KB', date: '2026-10-10', uploader: 'Rudi Hartono' },
      { name: 'Surat Keterangan Atasan Langsung.pdf', type: 'PDF', size: '98 KB', date: '2026-10-05', uploader: 'Bambang Prakoso' },
    ],
  },
  {
    id: 'KS-2026-002', reportId: 'LP-2026-005', date: '2026-10-09',
    subject: 'Rizky Firmansyah, S.H.', nip: '199606302021011001',
    unit: 'Bagian Hukum', category: 'conduct',
    title: 'Dugaan penyalahgunaan wewenang',
    status: CASE_STATUS.EXAMINATION, priority: 'high',
    pic: 'Rudi Hartono, S.H., M.H.', deadline: '2026-11-08',
    level: 'berat',
    timeline: [
      { date: '2026-10-09 08:30', action: 'Kasus dibuat dari laporan LP-2026-005', actor: 'Ir. Siti Rahmawati, M.M.', type: 'info' },
      { date: '2026-10-10 09:00', action: 'Ditelaah dan ditetapkan kategori berat', actor: 'Ir. Siti Rahmawati, M.M.', type: 'danger' },
      { date: '2026-10-11 10:00', action: 'Tim Pemeriksa dibentuk', actor: 'Prof. Hasan Basri, M.Si.', type: 'warning' },
      { date: '2026-10-13 14:00', action: 'Pemeriksaan tahap pertama dilaksanakan', actor: 'Rudi Hartono, S.H., M.H.', type: 'info' },
    ],
    documents: [
      { name: 'Laporan Pengaduan Anonim.pdf', type: 'PDF', size: '156 KB', date: '2026-10-08', uploader: 'Sistem' },
      { name: 'SK Tim Pemeriksa.pdf', type: 'PDF', size: '112 KB', date: '2026-10-11', uploader: 'Sekretariat' },
      { name: 'Bukti Foto Pendukung.zip', type: 'ZIP', size: '2.1 MB', date: '2026-10-08', uploader: 'Pelapor' },
      { name: 'BAP Tahap 1.pdf', type: 'PDF', size: '340 KB', date: '2026-10-13', uploader: 'Rudi Hartono' },
    ],
  },
];

// Notifications
export const NOTIFICATIONS = [
  { id: 'N-001', title: 'Laporan Baru Diterima', text: 'Laporan LP-2026-004 memerlukan penelaahan.', time: '5 menit lalu', read: false, type: 'info' },
  { id: 'N-002', title: 'Tenggat Mendekati', text: 'Kasus KS-2026-001 memiliki tenggat 20 hari lagi.', time: '1 jam lalu', read: false, type: 'warning' },
  { id: 'N-003', title: 'Pemeriksaan Terjadwal', text: 'Pemeriksaan KS-2026-002 tahap 2 dijadwalkan besok.', time: '2 jam lalu', read: false, type: 'info' },
  { id: 'N-004', title: 'Dokumen Menunggu Persetujuan', text: 'BAP tahap 1 KS-2026-002 menunggu persetujuan.', time: '3 jam lalu', read: true, type: 'info' },
  { id: 'N-005', title: 'Status Kasus Diperbarui', text: 'Kasus KS-2026-001 telah ditugaskan untuk pemeriksaan.', time: '1 hari lalu', read: true, type: 'success' },
  { id: 'N-006', title: 'Anomali Kehadiran Terdeteksi', text: '3 pegawai memiliki pola keterlambatan berulang.', time: '1 hari lalu', read: true, type: 'warning' },
];

// Audit Logs
export const AUDIT_LOGS = [
  { id: 'AL-001', timestamp: '2026-10-14 09:15:23', user: 'Ir. Siti Rahmawati, M.M.', action: 'LOGIN', detail: 'Login berhasil dari IP 192.168.1.100', module: 'Autentikasi' },
  { id: 'AL-002', timestamp: '2026-10-14 09:20:45', user: 'Ir. Siti Rahmawati, M.M.', action: 'VIEW', detail: 'Membuka detail kasus KS-2026-002', module: 'Kasus' },
  { id: 'AL-003', timestamp: '2026-10-14 09:35:12', user: 'Rudi Hartono, S.H., M.H.', action: 'UPLOAD', detail: 'Mengunggah BAP Tahap 1 pada kasus KS-2026-002', module: 'Dokumen' },
  { id: 'AL-004', timestamp: '2026-10-14 10:05:33', user: 'Bambang Prakoso, S.H.', action: 'CREATE', detail: 'Membuat laporan dugaan pelanggaran LP-2026-004', module: 'Pelaporan' },
  { id: 'AL-005', timestamp: '2026-10-14 10:30:18', user: 'Ir. Siti Rahmawati, M.M.', action: 'UPDATE', detail: 'Mengubah status kasus KS-2026-001 menjadi "Ditugaskan"', module: 'Kasus' },
  { id: 'AL-006', timestamp: '2026-10-14 11:00:45', user: 'Dr. Ahmad Suryadi, M.A.P.', action: 'EXPORT', detail: 'Mengekspor laporan rekapitulasi kedisiplinan Oktober 2026', module: 'Laporan' },
  { id: 'AL-007', timestamp: '2026-10-13 16:45:22', user: 'System', action: 'SYNC', detail: 'Sinkronisasi data absensi berhasil (430 record)', module: 'Integrasi' },
  { id: 'AL-008', timestamp: '2026-10-13 14:20:10', user: 'Prof. Hasan Basri, M.Si.', action: 'APPROVE', detail: 'Menyetujui pembentukan Tim Pemeriksa KS-2026-002', module: 'Kasus' },
];

// Dashboard chart data
export const MONTHLY_DISCIPLINE_DATA = [
  { month: 'Mei', hadir: 95, terlambat: 3, tidakHadir: 1.5, cuti: 0.5 },
  { month: 'Jun', hadir: 93, terlambat: 4, tidakHadir: 2, cuti: 1 },
  { month: 'Jul', hadir: 94, terlambat: 3.5, tidakHadir: 1.8, cuti: 0.7 },
  { month: 'Agt', hadir: 92, terlambat: 4.5, tidakHadir: 2.5, cuti: 1 },
  { month: 'Sep', hadir: 91, terlambat: 5, tidakHadir: 3, cuti: 1 },
  { month: 'Okt', hadir: 93, terlambat: 4.2, tidakHadir: 1.9, cuti: 0.9 },
];

export const CASE_DISTRIBUTION = [
  { name: 'Pelanggaran Jam Kerja', value: 12, color: '#4EA5D9' },
  { name: 'Kewajiban Kedinasan', value: 5, color: '#D99A17' },
  { name: 'Kode Etik', value: 3, color: '#C0392B' },
  { name: 'Kode Perilaku', value: 4, color: '#7C3AED' },
  { name: 'Aturan Internal', value: 2, color: '#198754' },
];

export const MONTHLY_CASES = [
  { month: 'Mei', baru: 3, selesai: 2, aktif: 5 },
  { month: 'Jun', baru: 4, selesai: 3, aktif: 6 },
  { month: 'Jul', baru: 2, selesai: 4, aktif: 4 },
  { month: 'Agt', baru: 5, selesai: 2, aktif: 7 },
  { month: 'Sep', baru: 3, selesai: 3, aktif: 7 },
  { month: 'Okt', baru: 2, selesai: 1, aktif: 8 },
];
