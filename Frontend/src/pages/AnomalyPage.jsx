import { useState } from 'react';
import {
  AlertTriangle, Search, Filter, TrendingDown, Clock,
  Eye, Users, Activity, ChevronLeft, ChevronRight
} from 'lucide-react';

// TODO: connect to anomaly API when available (backend belum punya endpoint /anomalies)
const ANOMALIES = [
  { id: 'AN-001', employee: 'Sri Wahyuni, S.Pd.', nip: '198712152010012004', unit: 'Dinas Pendidikan', type: 'Ketidakhadiran Berulang', frequency: '5 hari berturut-turut', severity: 'Tinggi', lastDetected: '2026-10-13', trend: 'up' },
  { id: 'AN-002', employee: 'Andi Pratama, S.Kom.', nip: '199505212019011001', unit: 'Bidang Data & TI', type: 'Pola Terlambat', frequency: '12x dalam sebulan', severity: 'Sedang', lastDetected: '2026-10-12', trend: 'up' },
  { id: 'AN-003', employee: 'Rizky Firmansyah, S.H.', nip: '199606302021011001', unit: 'Bagian Hukum', type: 'Penurunan Kinerja', frequency: 'Skor -18% QoQ', severity: 'Sedang', lastDetected: '2026-10-11', trend: 'down' },
  { id: 'AN-004', employee: 'Budi Santoso, S.T.', nip: '198903172014021003', unit: 'Dinas Pekerjaan Umum', type: 'Ketidakhadiran Berulang', frequency: '4 hari dalam 2 minggu', severity: 'Sedang', lastDetected: '2026-10-10', trend: 'up' },
  { id: 'AN-005', employee: 'Mega Puspita, S.AP.', nip: '198801052012012003', unit: 'Kecamatan Utara', type: 'Anomali Jam Absen', frequency: 'Pola jam tidak wajar', severity: 'Rendah', lastDetected: '2026-10-09', trend: 'stable' },
  { id: 'AN-006', employee: 'Ratna Sari, A.Md.Kep.', nip: '199108232017012001', unit: 'Dinas Kesehatan', type: 'Pola Terlambat', frequency: '6x dalam sebulan', severity: 'Rendah', lastDetected: '2026-10-08', trend: 'stable' },
];

const UNITS = [...new Set(ANOMALIES.map(a => a.unit))];

export default function AnomalyPage() {
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filtered = ANOMALIES.filter(a => {
    const text = (a.employee + a.nip + a.type + a.id).toLowerCase();
    const matchSearch = text.includes(search.toLowerCase());
    const matchUnit = filterUnit === 'all' || a.unit === filterUnit;
    const matchSeverity = filterSeverity === 'all' || a.severity === filterSeverity;
    return matchSearch && matchUnit && matchSeverity;
  });

  const severityBadge = (s) => {
    switch (s) {
      case 'Tinggi': return <span className="badge badge-danger">Tinggi</span>;
      case 'Sedang': return <span className="badge badge-warning">Sedang</span>;
      default: return <span className="badge badge-success">Rendah</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Indikator Anomali</h1>
          <p className="page-subtitle">Deteksi dini pola kedisiplinan pegawai yang menyimpang</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Pola Terlambat', value: 2, color: 'yellow', icon: Clock },
          { label: 'Ketidakhadiran Berulang', value: 2, color: 'red', icon: AlertTriangle },
          { label: 'Kinerja Menurun', value: 1, color: 'purple', icon: TrendingDown },
          { label: 'Anomali Baru', value: 3, color: 'blue', icon: Activity },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${s.color}`}><s.icon size={22} /></div>
            <div className="stat-content">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="filter-bar">
            <div className="search-box">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Cari pegawai atau jenis anomali..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="filter-select" value={filterUnit} onChange={e => setFilterUnit(e.target.value)}>
              <option value="all">Semua Unit</option>
              {UNITS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <select className="filter-select" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
              <option value="all">Semua Tingkat</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Sedang">Sedang</option>
              <option value="Rendah">Rendah</option>
            </select>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pegawai</th>
                  <th>Unit Kerja</th>
                  <th>Jenis Anomali</th>
                  <th>Frekuensi</th>
                  <th>Tingkat</th>
                  <th>Terakhir Terdeteksi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.employee}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{a.nip}</div>
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)' }}>{a.unit}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Filter size={12} style={{ color: 'var(--warning)' }} />
                        {a.type}
                      </span>
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{a.frequency}</td>
                    <td>{severityBadge(a.severity)}</td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{a.lastDetected}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm btn-ghost btn-icon" title="Lihat detail">
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-sm btn-ghost btn-icon" title="Lihat profil pegawai">
                          <Users size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <div className="pagination-info">Menampilkan {filtered.length} data</div>
            <div className="pagination-controls">
              <button className="page-btn"><ChevronLeft size={16} /></button>
              <button className="page-btn active">1</button>
              <button className="page-btn"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
