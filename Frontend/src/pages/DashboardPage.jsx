import { useState, useEffect } from 'react';
import {
  Users, Clock, AlertTriangle, FileText, FolderOpen, TrendingUp,
  CheckCircle, BarChart3, Calendar, ChevronRight, Shield,
  Scale, BookOpen, Eye, Activity, ArrowUpRight, ArrowDownRight,
  Bell, Star, Target, Briefcase, UserCheck, ClipboardList,
  AlertCircle, Info, Award, Search, Building2, PieChart as PieIcon
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services';
import {
  ATTENDANCE_SUMMARY, MONTHLY_DISCIPLINE_DATA,
  CASE_DISTRIBUTION, MONTHLY_CASES, REPORTS, CASES,
  CASE_STATUS_LABELS, CASE_STATUS_BADGE
} from '../data/mockData';

/* ─────────────────────────────── helpers ────────────────────────────────── */
const FALLBACK_STATS = {
  totalEmployees: ATTENDANCE_SUMMARY?.totalEmployees ?? 0,
  present: ATTENDANCE_SUMMARY?.present ?? 0,
  activeCases: 0,
  newReports: 0,
};

function StatCard({ label, value, icon: Icon, color = 'blue', change, changeType = 'positive', changeText, subtitle }) {
  return (
    <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className={`stat-icon ${color}`}>
        <Icon size={22} />
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value ?? '—'}</div>
        {change !== undefined && (
          <div className={`stat-change ${changeType}`}>
            {changeType === 'positive' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change} <span style={{ color: 'var(--text-muted)' }}>{changeText}</span>
          </div>
        )}
        {subtitle && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function WelcomeBanner({ user, subtitle, badges = [] }) {
  const roleColors = {
    admin: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
    atasan: 'linear-gradient(135deg, #1a4731, #16a34a)',
    pemeriksa: 'linear-gradient(135deg, #3b1d6e, #7c3aed)',
    bkpsdm: 'linear-gradient(135deg, #7c2d12, #ea580c)',
    pegawai: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
    inspektorat: 'linear-gradient(135deg, #4a1942, #db2777)',
  };
  const bg = roleColors[user?.role] || roleColors.admin;

  return (
    <div style={{
      background: bg,
      borderRadius: 'var(--border-radius-lg)',
      padding: 'var(--space-6) var(--space-8)',
      color: 'white',
      marginBottom: 'var(--space-6)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-40%', right: '-5%', width: 280, height: 280, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '-50%', right: '15%', width: 200, height: 200, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-1)' }}>
          Selamat Datang, {user?.name?.split(',')[0]} 👋
        </h2>
        <p style={{ opacity: 0.82, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
          {subtitle || 'Berikut ringkasan informasi untuk Anda hari ini.'}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 11 }}>
            <Calendar size={11} /> {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {badges.map((b, i) => (
            <span key={i} className="badge" style={{ background: b.bg || 'rgba(255,255,255,0.15)', color: b.color || 'white', fontSize: 11 }}>
              {b.icon && <b.icon size={11} />} {b.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, iconColor, children, action, style }) {
  return (
    <div className="card" style={style}>
      <div className="card-header">
        <div className="card-title">
          {Icon && <Icon size={16} style={{ color: iconColor || 'var(--primary)' }} />}
          {title}
        </div>
        {action}
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, badge, badgeClass }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{label}</span>
      {badge
        ? <span className={`badge ${badgeClass || ''}`}>{value}</span>
        : <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{value}</span>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD PER ROLE
═══════════════════════════════════════════════════════════════════════════ */

/* ── 1. ADMIN ────────────────────────────────────────────────────────────── */
function DashboardAdmin({ stats, monthlyDiscipline, caseDistribution, monthlyCases }) {
  const { user } = useAuth();
  const adminStats = [
    { label: 'Total Pegawai', value: stats.totalEmployees, icon: Users, color: 'blue', change: '+12', changeText: 'dari bulan lalu' },
    { label: 'Hadir Hari Ini', value: stats.present, icon: CheckCircle, color: 'green', change: `${((stats.present / stats.totalEmployees) * 100).toFixed(0)}%`, changeType: 'positive', changeText: 'tingkat kehadiran' },
    { label: 'Kasus Aktif', value: stats.activeCases, icon: FolderOpen, color: 'yellow', change: '+2', changeType: 'negative', changeText: 'dari bulan lalu' },
    { label: 'Laporan Baru', value: stats.newReports, icon: FileText, color: 'red', change: '3', changeType: 'negative', changeText: 'perlu tindak lanjut' },
    { label: 'Pengguna Aktif', value: 6, icon: Shield, color: 'purple', change: 'Semua role aktif', changeType: 'positive', changeText: '' },
    { label: 'Audit Log Hari Ini', value: 24, icon: Activity, color: 'blue', change: '+8', changeType: 'positive', changeText: 'dari kemarin' },
  ];

  const systemHealth = [
    { label: 'Status Database', value: 'Online', badge: true, badgeClass: 'badge-success' },
    { label: 'Status API Server', value: 'Online', badge: true, badgeClass: 'badge-success' },
    { label: 'Backup Terakhir', value: 'Hari ini, 03:00', badge: false },
    { label: 'Versi Aplikasi', value: 'v1.0.0', badge: false },
    { label: 'Total Pengguna Sistem', value: '6 pengguna', badge: false },
  ];

  return (
    <>
      <WelcomeBanner user={user}
        subtitle="Panel kontrol sistem E-Disiplin ASN. Pantau semua aktivitas dan kelola sistem secara menyeluruh."
        badges={[
          { label: 'System Administrator', bg: 'rgba(37,99,235,0.35)', color: '#bfdbfe', icon: Shield },
          { label: 'Akses Penuh', bg: 'rgba(22,163,74,0.3)', color: '#86efac', icon: CheckCircle },
        ]}
      />

      {/* Stats */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {adminStats.map((s, i) => <StatCard key={i} {...s} changeType={s.changeType || 'positive'} />)}
      </div>

      {/* Charts Row 1 */}
      <div className="grid-main" style={{ marginBottom: 'var(--space-5)' }}>
        <SectionCard title="Tren Kehadiran (%)" icon={TrendingUp} iconColor="var(--secondary)">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyDiscipline}>
                <defs>
                  <linearGradient id="gHadir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#198754" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#198754" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" domain={[80, 100]} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', fontSize: 12 }} />
                <Area type="monotone" dataKey="hadir" name="Hadir" stroke="#198754" fill="url(#gHadir)" strokeWidth={2} />
                <Area type="monotone" dataKey="terlambat" name="Terlambat" stroke="#D99A17" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="tidakHadir" name="Tidak Hadir" stroke="#C0392B" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Distribusi Kasus" icon={PieIcon} iconColor="var(--accent)">
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={caseDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {caseDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 8 }}>
            {caseDistribution.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                  {item.name}
                </div>
                <strong style={{ color: 'var(--text-primary)' }}>{item.value}</strong>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-main">
        <SectionCard title="Perkembangan Kasus Bulanan" icon={BarChart3} iconColor="var(--warning)">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCases}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="baru" name="Baru" fill="#4EA5D9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="selesai" name="Selesai" fill="#198754" radius={[4, 4, 0, 0]} />
                <Bar dataKey="aktif" name="Aktif" fill="#D99A17" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Status Sistem" icon={Shield} iconColor="var(--success)">
          {systemHealth.map((item, i) => (
            <InfoRow key={i} {...item} />
          ))}
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 8 }}>Pengguna Per Role</div>
            {[
              { role: 'Admin', count: 1, color: '#2563eb' },
              { role: 'Atasan', count: 1, color: '#16a34a' },
              { role: 'Pemeriksa', count: 1, color: '#7c3aed' },
              { role: 'BKPSDM', count: 1, color: '#ea580c' },
              { role: 'Pegawai', count: 1, color: '#0ea5e9' },
              { role: 'Inspektorat', count: 1, color: '#db2777' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--text-xs)', flex: 1, color: 'var(--text-secondary)' }}>{r.role}</span>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{r.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}

/* ── 2. ATASAN (Supervisor) ──────────────────────────────────────────────── */
function DashboardAtasan({ stats }) {
  const { user } = useAuth();

  const myTeamStats = [
    { label: 'Anggota Tim', value: 18, icon: Users, color: 'blue', change: 'Unit saya', changeType: 'positive', changeText: '' },
    { label: 'Hadir Hari Ini', value: 15, icon: CheckCircle, color: 'green', change: '83%', changeType: 'positive', changeText: 'kehadiran tim' },
    { label: 'Terlambat', value: 2, icon: Clock, color: 'yellow', change: 'perlu perhatian', changeType: 'negative', changeText: '' },
    { label: 'Laporan Perlu Acc', value: 3, icon: FileText, color: 'red', change: 'menunggu Anda', changeType: 'negative', changeText: '' },
  ];

  const pendingApprovals = [
    { id: 'LAP-2026-009', pegawai: 'Budi Santoso', jenis: 'Ketidakhadiran', prioritas: 'Sedang', tanggal: '28 Okt 2026' },
    { id: 'LAP-2026-010', pegawai: 'Sari Dewi', jenis: 'Keterlambatan Berulang', prioritas: 'Tinggi', tanggal: '27 Okt 2026' },
    { id: 'LAP-2026-011', pegawai: 'Agus Pranoto', jenis: 'Pelanggaran SOP', prioritas: 'Rendah', tanggal: '26 Okt 2026' },
  ];

  const teamAbsence = [
    { name: 'Budi Santoso', alpa: 5, terlambat: 3, status: 'warning' },
    { name: 'Sari Dewi', alpa: 2, terlambat: 8, status: 'warning' },
    { name: 'Ahmad Fauzi', alpa: 0, terlambat: 1, status: 'good' },
    { name: 'Lina Kartika', alpa: 1, terlambat: 2, status: 'ok' },
  ];

  const attendanceData = [
    { hari: 'Sen', hadir: 16, alpa: 2 },
    { hari: 'Sel', hadir: 17, alpa: 1 },
    { hari: 'Rab', hadir: 15, alpa: 3 },
    { hari: 'Kam', hadir: 18, alpa: 0 },
    { hari: 'Jum', hadir: 14, alpa: 4 },
  ];

  return (
    <>
      <WelcomeBanner user={user}
        subtitle="Pantau kehadiran dan disiplin tim Anda. Setujui atau tindak lanjuti laporan yang menunggu."
        badges={[
          { label: 'Atasan Langsung', bg: 'rgba(22,163,74,0.35)', color: '#bbf7d0', icon: UserCheck },
          { label: `3 Laporan Menunggu`, bg: 'rgba(239,68,68,0.3)', color: '#fca5a5', icon: Bell },
        ]}
      />

      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {myTeamStats.map((s, i) => <StatCard key={i} {...s} changeType={s.changeType || 'positive'} />)}
      </div>

      <div className="grid-main" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Pending Approvals */}
        <SectionCard title="Laporan Menunggu Persetujuan" icon={FileText} iconColor="var(--danger)"
          action={<button className="btn btn-sm btn-ghost">Lihat Semua <ChevronRight size={13} /></button>}>
          <div style={{ padding: 0 }}>
            {pendingApprovals.map((item, i) => (
              <div key={i} style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--border-radius)',
                background: 'var(--surface-hover)',
                marginBottom: i < pendingApprovals.length - 1 ? 'var(--space-2)' : 0,
                border: '1px solid var(--border-light)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)' }}>{item.id}</span>
                  <span className={`badge ${item.prioritas === 'Tinggi' ? 'badge-danger' : item.prioritas === 'Sedang' ? 'badge-warning' : 'badge-info'}`}>
                    {item.prioritas}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{item.pegawai}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{item.jenis} · {item.tanggal}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-sm btn-success" style={{ fontSize: 11, padding: '3px 10px' }}>Setujui</button>
                  <button className="btn btn-sm btn-danger" style={{ fontSize: 11, padding: '3px 10px' }}>Tolak</button>
                  <button className="btn btn-sm btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }}>Detail</button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Team Attendance Chart */}
        <SectionCard title="Kehadiran Tim Minggu Ini" icon={BarChart3} iconColor="var(--success)">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="hari" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12 }} />
                <Bar dataKey="hadir" name="Hadir" fill="#16a34a" radius={[3, 3, 0, 0]} />
                <Bar dataKey="alpa" name="Tidak Hadir" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Perhatian khusus */}
          <div style={{ marginTop: 'var(--space-3)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>⚠ Perlu Perhatian</div>
            {teamAbsence.filter(t => t.status !== 'good').map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: 'var(--text-xs)', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontWeight: 500 }}>{t.name}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="badge badge-danger">{t.alpa} alpa</span>
                  <span className="badge badge-warning">{t.terlambat} terlambat</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}

/* ── 3. PEMERIKSA ────────────────────────────────────────────────────────── */
function DashboardPemeriksa({ stats }) {
  const { user } = useAuth();

  const examStats = [
    { label: 'Kasus Ditugaskan', value: 4, icon: FolderOpen, color: 'purple', change: 'aktif', changeType: 'negative', changeText: '' },
    { label: 'Pemeriksaan Bulan Ini', value: 6, icon: Scale, color: 'blue', change: '+2', changeType: 'positive', changeText: 'dari bulan lalu' },
    { label: 'Jadwal Hari Ini', value: 1, icon: Calendar, color: 'yellow', change: '13:00 WIB', changeType: 'positive', changeText: '' },
    { label: 'BAP Selesai', value: 9, icon: CheckCircle, color: 'green', change: 'total bulan ini', changeType: 'positive', changeText: '' },
  ];

  const activeCases = [
    { id: 'KS-2026-001', pegawai: 'Hendra Wijaya', jenis: 'Ketidakhadiran Berulang', level: 'Ringan', deadline: '01 Nov 2026', progress: 65, status: 'Pemeriksaan' },
    { id: 'KS-2026-003', pegawai: 'Dian Permata', jenis: 'Penyalahgunaan Aset', level: 'Berat', deadline: '15 Nov 2026', progress: 30, status: 'Penyelidikan' },
    { id: 'KS-2026-005', pegawai: 'Roni Setiawan', jenis: 'Pelanggaran Etik', level: 'Sedang', deadline: '20 Nov 2026', progress: 10, status: 'Baru' },
  ];

  const schedule = [
    { time: '09:00', kegiatan: 'BAP Lanjutan KS-2026-001', lokasi: 'Ruang Pemeriksaan A', status: 'selesai' },
    { time: '13:00', kegiatan: 'BAP Tahap 1 KS-2026-003', lokasi: 'Ruang Pemeriksaan B', status: 'menunggu' },
    { time: '15:30', kegiatan: 'Konsultasi Hukum KS-2026-005', lokasi: 'Online / Zoom', status: 'terjadwal' },
  ];

  return (
    <>
      <WelcomeBanner user={user}
        subtitle="Kelola kasus yang ditugaskan kepada Anda. Laksanakan pemeriksaan sesuai prosedur dan tenggat waktu."
        badges={[
          { label: 'Pemeriksa', bg: 'rgba(124,58,237,0.35)', color: '#ddd6fe', icon: Scale },
          { label: '4 Kasus Aktif', bg: 'rgba(239,68,68,0.3)', color: '#fca5a5', icon: AlertCircle },
        ]}
      />

      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {examStats.map((s, i) => <StatCard key={i} {...s} changeType={s.changeType || 'positive'} />)}
      </div>

      <div className="grid-main" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Active Cases */}
        <SectionCard title="Kasus Yang Ditugaskan" icon={FolderOpen} iconColor="var(--accent)">
          {activeCases.map((c, i) => (
            <div key={i} style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-light)',
              marginBottom: 'var(--space-2)',
              background: 'var(--surface-hover)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)' }}>{c.id}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className={`badge ${c.level === 'Berat' ? 'badge-danger' : c.level === 'Sedang' ? 'badge-warning' : 'badge-info'}`}>{c.level}</span>
                  <span className="badge badge-review">{c.status}</span>
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{c.pegawai}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 8 }}>{c.jenis} · Batas: {c.deadline}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div className="progress-fill" style={{ width: `${c.progress}%`, background: c.progress >= 60 ? 'var(--success)' : c.progress >= 30 ? 'var(--warning)' : 'var(--primary)' }} />
                </div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, minWidth: 30 }}>{c.progress}%</span>
              </div>
            </div>
          ))}
        </SectionCard>

        {/* Today's Schedule */}
        <SectionCard title="Jadwal Hari Ini" icon={Calendar} iconColor="var(--info)">
          {schedule.map((s, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) 0',
              borderBottom: i < schedule.length - 1 ? '1px solid var(--border-light)' : 'none',
            }}>
              <div style={{ minWidth: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--primary)' }}>{s.time}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 2 }}>{s.kegiatan}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{s.lokasi}</div>
              </div>
              <span className={`badge ${s.status === 'selesai' ? 'badge-success' : s.status === 'menunggu' ? 'badge-warning' : 'badge-info'}`}>
                {s.status}
              </span>
            </div>
          ))}
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--warning-bg)', borderRadius: 'var(--border-radius)', fontSize: 'var(--text-xs)' }}>
            <strong>⏰ Pengingat:</strong> Pemeriksaan BAP Tahap 1 KS-2026-003 dimulai pukul 13:00 WIB. Pastikan dokumen sudah siap.
          </div>
        </SectionCard>
      </div>
    </>
  );
}

/* ── 4. BKPSDM ───────────────────────────────────────────────────────────── */
function DashboardBKPSDM({ stats, caseDistribution }) {
  const { user } = useAuth();

  const bkpsdmStats = [
    { label: 'Total ASN Terdaftar', value: stats.totalEmployees, icon: Users, color: 'blue', change: '2 unit kerja', changeType: 'positive', changeText: '' },
    { label: 'Kasus Selesai Bulan Ini', value: 12, icon: CheckCircle, color: 'green', change: '+4', changeType: 'positive', changeText: 'dari bulan lalu' },
    { label: 'SK Terbit Bulan Ini', value: 7, icon: BookOpen, color: 'purple', change: 'keputusan aktif', changeType: 'positive', changeText: '' },
    { label: 'Kasus Banding', value: 2, icon: AlertTriangle, color: 'yellow', change: 'perlu kajian', changeType: 'negative', changeText: '' },
  ];

  const recentDecisions = [
    { sk: 'SK/125/BKPSDM/2026', pegawai: 'Budi Santoso', jenis: 'Teguran Lisan', tgl: '25 Okt 2026', status: 'Berlaku' },
    { sk: 'SK/122/BKPSDM/2026', pegawai: 'Wati Rahayu', jenis: 'Penundaan Kenaikan Gaji', tgl: '20 Okt 2026', status: 'Berlaku' },
    { sk: 'SK/118/BKPSDM/2026', pegawai: 'Dedi Kurniawan', jenis: 'Teguran Tertulis', tgl: '15 Okt 2026', status: 'Banding' },
    { sk: 'SK/115/BKPSDM/2026', pegawai: 'Rina Sari', jenis: 'Penurunan Jabatan', tgl: '10 Okt 2026', status: 'Berlaku' },
  ];

  const penaltyDistrib = [
    { jenis: 'Teguran Lisan', count: 18, color: '#0ea5e9' },
    { jenis: 'Teguran Tertulis', count: 12, color: '#f59e0b' },
    { jenis: 'Penundaan Kenaikan Gaji', count: 7, color: '#f97316' },
    { jenis: 'Penurunan Jabatan', count: 3, color: '#ef4444' },
    { jenis: 'Pemberhentian', count: 1, color: '#7f1d1d' },
  ];

  return (
    <>
      <WelcomeBanner user={user}
        subtitle="Kelola administrasi kepegawaian dan pantau implementasi keputusan disiplin ASN di lingkungan instansi."
        badges={[
          { label: 'BKPSDM', bg: 'rgba(234,88,12,0.35)', color: '#fed7aa', icon: Briefcase },
          { label: '7 SK Aktif Bulan Ini', bg: 'rgba(124,58,237,0.3)', color: '#ddd6fe', icon: BookOpen },
        ]}
      />

      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {bkpsdmStats.map((s, i) => <StatCard key={i} {...s} changeType={s.changeType || 'positive'} />)}
      </div>

      <div className="grid-main" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Recent Decisions */}
        <SectionCard title="Surat Keputusan Terbaru" icon={BookOpen} iconColor="var(--accent)"
          action={<button className="btn btn-sm btn-ghost">Semua SK <ChevronRight size={13} /></button>}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['No. SK', 'Pegawai', 'Jenis Hukuman', 'Tanggal', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentDecisions.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px', fontWeight: 600, color: 'var(--primary)' }}>{d.sk}</td>
                    <td style={{ padding: '8px' }}>{d.pegawai}</td>
                    <td style={{ padding: '8px' }}>{d.jenis}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{d.tgl}</td>
                    <td style={{ padding: '8px' }}>
                      <span className={`badge ${d.status === 'Berlaku' ? 'badge-success' : 'badge-warning'}`}>{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Penalty Distribution */}
        <SectionCard title="Distribusi Jenis Hukuman" icon={BarChart3} iconColor="var(--danger)">
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={penaltyDistrib} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="jenis" tick={{ fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12 }} />
                <Bar dataKey="count" name="Jumlah" radius={[0, 4, 4, 0]}>
                  {penaltyDistrib.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

/* ── 5. PEGAWAI (Employee Self-Service) ─────────────────────────────────── */
function DashboardPegawai() {
  const { user } = useAuth();

  const myStatus = [
    { label: 'Status Kehadiran Bulan Ini', value: '22 hari', icon: CheckCircle, color: 'green', subtitle: 'dari 23 hari kerja' },
    { label: 'Keterlambatan', value: '3x', icon: Clock, color: 'yellow', subtitle: 'dalam bulan ini' },
    { label: 'Cuti Tersisa', value: '9 hari', icon: Calendar, color: 'blue', subtitle: 'dari kuota 12 hari' },
    { label: 'Status Disiplin', value: 'Baik', icon: Award, color: 'green', subtitle: 'tidak ada kasus aktif' },
  ];

  const myAttendance = [
    { hari: 'Sen', in: '07:45', out: '16:02', status: 'Hadir', ok: true },
    { hari: 'Sel', in: '08:15', out: '16:10', status: 'Terlambat', ok: false },
    { hari: 'Rab', in: '07:50', out: '16:00', status: 'Hadir', ok: true },
    { hari: 'Kam', in: '07:48', out: '16:05', status: 'Hadir', ok: true },
    { hari: 'Jum', in: '—', out: '—', status: 'Izin', ok: null },
  ];

  const obligations = [
    { label: 'Pengisian e-Kinerja', deadline: '31 Okt 2026', status: 'Belum', urgent: true },
    { label: 'Laporan Bulanan', deadline: '31 Okt 2026', status: 'Sudah', urgent: false },
    { label: 'Pelatihan Wajib BerAKHLAK', deadline: '15 Nov 2026', status: 'Belum', urgent: false },
    { label: 'Perbarui Data SKP', deadline: '30 Nov 2026', status: 'Belum', urgent: false },
  ];

  const announcements = [
    { title: 'Pelaksanaan Apel Gabungan', desc: 'Apel gabungan dilaksanakan Senin 4 Nov 2026 pukul 07.30 WIB di lapangan kantor.', time: '1 hari lalu', type: 'info' },
    { title: 'Batas Pengisian e-Kinerja', desc: 'Segera lengkapi e-kinerja Oktober 2026 sebelum 31 Oktober 2026.', time: '2 hari lalu', type: 'warning' },
    { title: 'Cuti Akhir Tahun 2026', desc: 'Pengajuan cuti akhir tahun dibuka mulai 1 November 2026.', time: '3 hari lalu', type: 'success' },
  ];

  return (
    <>
      <WelcomeBanner user={user}
        subtitle={`Pantau kehadiran, cuti, dan status disiplin Anda. Pastikan semua kewajiban ASN terpenuhi.`}
        badges={[
          { label: user?.position || 'ASN/Pegawai', bg: 'rgba(14,165,233,0.35)', color: '#bae6fd', icon: Users },
          { label: 'Status: Aktif', bg: 'rgba(22,163,74,0.3)', color: '#86efac', icon: CheckCircle },
        ]}
      />

      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {myStatus.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div className="grid-main" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Kehadiran Minggu Ini */}
        <SectionCard title="Kehadiran Minggu Ini" icon={Clock} iconColor="var(--primary)">
          {myAttendance.map((a, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) 0',
              borderBottom: i < myAttendance.length - 1 ? '1px solid var(--border-light)' : 'none',
            }}>
              <div style={{ width: 36, textAlign: 'center', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>{a.hari}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-xs)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Masuk: </span>
                  <strong>{a.in}</strong>
                  <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>|</span>
                  <span style={{ color: 'var(--text-muted)' }}>Keluar: </span>
                  <strong>{a.out}</strong>
                </div>
              </div>
              <span className={`badge ${a.ok === true ? 'badge-success' : a.ok === false ? 'badge-warning' : 'badge-info'}`}>
                {a.status}
              </span>
            </div>
          ))}

          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--info-bg)', borderRadius: 'var(--border-radius)', fontSize: 'var(--text-xs)' }}>
            <strong>ℹ Info:</strong> Keterlambatan {'>'} 3x dalam sebulan akan dicatat dalam rekam jejak disiplin Anda.
          </div>
        </SectionCard>

        {/* Kewajiban & Pengumuman */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <SectionCard title="Kewajiban yang Belum Selesai" icon={ClipboardList} iconColor="var(--warning)">
            {obligations.map((o, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{o.label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Batas: {o.deadline}</div>
                </div>
                <span className={`badge ${o.status === 'Sudah' ? 'badge-success' : o.urgent ? 'badge-danger' : 'badge-warning'}`}>
                  {o.status}
                </span>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Pengumuman" icon={Bell} iconColor="var(--info)">
            {announcements.map((a, i) => (
              <div key={i} style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--border-radius)',
                background: a.type === 'warning' ? 'var(--warning-bg)' : a.type === 'success' ? 'var(--success-bg)' : 'var(--info-bg)',
                marginBottom: i < announcements.length - 1 ? 'var(--space-2)' : 0,
              }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: 2 }}>{a.title}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{a.desc}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{a.time}</div>
              </div>
            ))}
          </SectionCard>
        </div>
      </div>
    </>
  );
}

/* ── 6. INSPEKTORAT ──────────────────────────────────────────────────────── */
function DashboardInspektorat({ stats, monthlyDiscipline }) {
  const { user } = useAuth();

  const auditStats = [
    { label: 'Total Kasus Dipantau', value: stats.activeCases + 14, icon: Eye, color: 'purple', change: 'semester ini', changeType: 'positive', changeText: '' },
    { label: 'Laporan Ditindaklanjuti', value: 32, icon: FileText, color: 'blue', change: '94%', changeType: 'positive', changeText: 'tindak lanjut' },
    { label: 'Temuan Audit', value: 8, icon: AlertTriangle, color: 'yellow', change: '3 kritis', changeType: 'negative', changeText: '' },
    { label: 'Kepatuhan Instansi', value: '87%', icon: Target, color: 'green', change: '+3%', changeType: 'positive', changeText: 'dari kuartal lalu' },
  ];

  const findings = [
    { id: 'TP-2026-012', unit: 'Bidang Keuangan', kategori: 'Administrasi', risiko: 'Sedang', status: 'Proses Perbaikan' },
    { id: 'TP-2026-013', unit: 'Sub Bagian Umum', kategori: 'Kedisiplinan', risiko: 'Tinggi', status: 'Belum Ditindak' },
    { id: 'TP-2026-014', unit: 'Bidang Perencanaan', kategori: 'Pelaporan', risiko: 'Rendah', status: 'Selesai' },
    { id: 'TP-2026-015', unit: 'Sekretariat', kategori: 'SOP', risiko: 'Sedang', status: 'Proses Perbaikan' },
  ];

  const complianceData = [
    { bulan: 'Mei', kepatuhan: 81 },
    { bulan: 'Jun', kepatuhan: 83 },
    { bulan: 'Jul', kepatuhan: 80 },
    { bulan: 'Agt', kepatuhan: 85 },
    { bulan: 'Sep', kepatuhan: 84 },
    { bulan: 'Okt', kepatuhan: 87 },
  ];

  return (
    <>
      <WelcomeBanner user={user}
        subtitle="Dashboard pengawasan dan audit internal. Pantau kepatuhan, temuan, dan tindak lanjut di seluruh unit kerja."
        badges={[
          { label: 'Inspektorat', bg: 'rgba(219,39,119,0.35)', color: '#fbcfe8', icon: Shield },
          { label: '8 Temuan Aktif', bg: 'rgba(239,68,68,0.3)', color: '#fca5a5', icon: AlertTriangle },
        ]}
      />

      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {auditStats.map((s, i) => <StatCard key={i} {...s} changeType={s.changeType || 'positive'} />)}
      </div>

      <div className="grid-main" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Findings Table */}
        <SectionCard title="Temuan Audit Terkini" icon={Search} iconColor="var(--danger)"
          action={<button className="btn btn-sm btn-ghost">Semua Temuan <ChevronRight size={13} /></button>}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['ID Temuan', 'Unit Kerja', 'Kategori', 'Risiko', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {findings.map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px', fontWeight: 700, color: 'var(--primary)' }}>{f.id}</td>
                    <td style={{ padding: '8px' }}>{f.unit}</td>
                    <td style={{ padding: '8px' }}>{f.kategori}</td>
                    <td style={{ padding: '8px' }}>
                      <span className={`badge ${f.risiko === 'Tinggi' ? 'badge-danger' : f.risiko === 'Sedang' ? 'badge-warning' : 'badge-info'}`}>{f.risiko}</span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span className={`badge ${f.status === 'Selesai' ? 'badge-success' : f.status === 'Belum Ditindak' ? 'badge-danger' : 'badge-warning'}`}>{f.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Compliance Chart */}
        <SectionCard title="Tren Kepatuhan Instansi (%)" icon={TrendingUp} iconColor="var(--success)">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[75, 100]} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12 }} />
                <Line type="monotone" dataKey="kepatuhan" name="Kepatuhan (%)" stroke="#db2777" strokeWidth={2.5} dot={{ fill: '#db2777', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--success-bg)', borderRadius: 'var(--border-radius)', fontSize: 'var(--text-xs)' }}>
            ✅ Kepatuhan instansi bulan Oktober mencapai <strong>87%</strong>, meningkat 3% dari bulan lalu.
          </div>
        </SectionCard>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [dashStats, setDashStats] = useState(FALLBACK_STATS);
  const [monthlyDiscipline, setMonthlyDiscipline] = useState(MONTHLY_DISCIPLINE_DATA || []);
  const [caseDistribution, setCaseDistribution] = useState(CASE_DISTRIBUTION || []);
  const [monthlyCases, setMonthlyCases] = useState(MONTHLY_CASES || []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, chartsRes] = await Promise.allSettled([
          dashboardService.getStats(),
          dashboardService.getCharts(),
        ]);
        if (statsRes.status === 'fulfilled' && statsRes.value?.success && statsRes.value?.data) {
          const d = statsRes.value.data;
          setDashStats({
            totalEmployees: d.active_employees ?? d.totalEmployees ?? 0,
            present: d.present ?? 0,
            activeCases: d.open_cases ?? d.activeCases ?? 0,
            newReports: d.pending_reports ?? d.newReports ?? 0,
            ...d,
          });
        }
        if (chartsRes.status === 'fulfilled' && chartsRes.value?.success && chartsRes.value?.data) {
          const c = chartsRes.value.data;
          if (c.monthlyDiscipline) setMonthlyDiscipline(c.monthlyDiscipline);
          if (c.caseDistribution) setCaseDistribution(c.caseDistribution);
          if (c.monthlyCases) setMonthlyCases(c.monthlyCases);
        }
      } catch {
        // Use mock fallback already set
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Memuat dashboard...</p>
      </div>
    );
  }

  const role = user?.role;

  const props = { stats: dashStats, monthlyDiscipline, caseDistribution, monthlyCases };

  if (role === 'admin')        return <DashboardAdmin {...props} />;
  if (role === 'atasan')       return <DashboardAtasan {...props} />;
  if (role === 'pemeriksa')    return <DashboardPemeriksa {...props} />;
  if (role === 'bkpsdm')       return <DashboardBKPSDM {...props} />;
  if (role === 'pegawai')      return <DashboardPegawai {...props} />;
  if (role === 'inspektorat')  return <DashboardInspektorat {...props} />;

  // Fallback jika role tidak dikenali
  return <DashboardAdmin {...props} />;
}
