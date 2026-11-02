import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Search, Eye, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle, Clock, UserCheck, RefreshCw, Plus
} from 'lucide-react';
import { casesService, reportsService } from '../services';

const CASE_STATUS_LABELS = {
  baru:             'Baru',
  penyelidikan:     'Penyelidikan',
  pemeriksaan:      'Pemeriksaan',
  sidang_kode_etik: 'Sidang Etik',
  putusan:          'Putusan',
  selesai:          'Selesai',
  dibatalkan:       'Dibatalkan',
};
const CASE_STATUS_BADGE = {
  baru:             'badge-info',
  penyelidikan:     'badge-warning',
  pemeriksaan:      'badge-review',
  sidang_kode_etik: 'badge-clarification',
  putusan:          'badge-waiting-decision',
  selesai:          'badge-success',
  dibatalkan:       'badge-closed',
};
const REPORT_STATUS_LABELS = {
  draft:                    'Draft',
  diajukan:                 'Diajukan',
  diverifikasi:             'Diverifikasi',
  ditolak:                  'Ditolak',
  ditingkatkan_ke_kasus:    'Ditingkatkan ke Kasus',
};
const REPORT_STATUS_BADGE = {
  draft:                  'badge-draft',
  diajukan:               'badge-submitted',
  diverifikasi:           'badge-review',
  ditolak:                'badge-rejected',
  ditingkatkan_ke_kasus:  'badge-decision',
};
const LEVEL_BADGE = {
  ringan: 'badge-info',
  sedang: 'badge-warning',
  berat:  'badge-danger',
};
const PRIORITY_BADGE = {
  rendah:  'badge-info',
  sedang:  'badge-warning',
  tinggi:  'badge-danger',
  kritis:  'badge-danger',
};

export default function CasesPage() {
  const navigate = useNavigate();
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab]     = useState('cases');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const [cases, setCases]             = useState([]);
  const [reports, setReports]         = useState([]);
  const [casesPag, setCasesPag]       = useState({ page: 1, total: 0, total_pages: 1, limit: 20 });
  const [reportsPag, setReportsPag]   = useState({ page: 1, total: 0, total_pages: 1, limit: 20 });

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (search)       params.search = search;
      if (filterStatus) params.status = filterStatus;

      if (activeTab === 'cases') {
        const res = await casesService.getAll(params);
        if (res.success) {
          setCases(Array.isArray(res.data) ? res.data : []);
          if (res.pagination) setCasesPag(res.pagination);
        }
      } else {
        const res = await reportsService.getAll(params);
        if (res.success) {
          setReports(Array.isArray(res.data) ? res.data : []);
          if (res.pagination) setReportsPag(res.pagination);
        }
      }
    } catch {
      setError('Gagal memuat data. Periksa koneksi server.');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, activeTab]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(1), 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  // Summary counts from loaded data
  const activeCases    = cases.filter(c => !['selesai', 'dibatalkan'].includes(c.status)).length;
  const examCases      = cases.filter(c => c.status === 'pemeriksaan').length;
  const pendingCases   = cases.filter(c => c.status === 'putusan').length;
  const doneCases      = cases.filter(c => c.status === 'selesai').length;

  const pag = activeTab === 'cases' ? casesPag : reportsPag;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Kasus</h1>
          <p className="page-subtitle">Kelola seluruh kasus dan laporan pelanggaran disiplin</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Kasus Baru
        </button>
      </div>

      {/* Summary */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Kasus Aktif',          value: activeCases,   color: 'yellow',  icon: FolderOpen },
          { label: 'Dalam Pemeriksaan',    value: examCases,    color: 'purple',  icon: UserCheck },
          { label: 'Menunggu Putusan',     value: pendingCases, color: 'blue',    icon: Clock },
          { label: 'Selesai',              value: doneCases,    color: 'green',   icon: CheckCircle },
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

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'cases' ? 'active' : ''}`} onClick={() => setActiveTab('cases')}>
          <FolderOpen size={14} style={{ marginRight: 6 }} /> Kasus ({casesPag.total})
        </button>
        <button className={`tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          <AlertTriangle size={14} style={{ marginRight: 6 }} /> Laporan ({reportsPag.total})
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {/* Filters */}
          <div className="filter-bar">
            <div className="search-box" style={{ flex: 1 }}>
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder={activeTab === 'cases' ? 'Cari No. Kasus, judul, atau pegawai...' : 'Cari No. Laporan atau pegawai...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Semua Status</option>
              {activeTab === 'cases'
                ? Object.entries(CASE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)
                : Object.entries(REPORT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)
              }
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => fetchData(1)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {error && (
            <div style={{ padding: 'var(--space-3)', background: 'var(--danger-bg)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
              ⚠ {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
              <p>Memuat data...</p>
            </div>
          ) : activeTab === 'cases' ? (
            // ── Cases Table ──
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Kasus</th>
                    <th>Tanggal</th>
                    <th>Subjek</th>
                    <th>Unit Kerja</th>
                    <th>Tingkat</th>
                    <th>Status</th>
                    <th>PIC</th>
                    <th>Tenggat</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>Tidak ada kasus ditemukan.</td></tr>
                  ) : cases.map(c => (
                    <tr key={c.id}>
                      <td><span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 'var(--text-xs)' }}>{c.case_no}</span></td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.employee_name || '-'}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{c.employee_nip || ''}</div>
                      </td>
                      <td style={{ fontSize: 'var(--text-xs)' }}>{c.unit_name || '-'}</td>
                      <td>
                        <span className={`badge ${LEVEL_BADGE[c.level] || 'badge-info'}`}>
                          {c.level ? c.level.charAt(0).toUpperCase() + c.level.slice(1) : '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${CASE_STATUS_BADGE[c.status] || 'badge-info'}`}>
                          {CASE_STATUS_LABELS[c.status] || c.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 'var(--text-xs)' }}>{c.pic_name?.split(',')[0] || '-'}</td>
                      <td>
                        {c.deadline
                          ? <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{new Date(c.deadline).toLocaleDateString('id-ID')}</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>-</span>
                        }
                      </td>
                      <td>
                        <button className="btn btn-sm btn-ghost btn-icon" onClick={() => navigate(`/cases/${c.id}`)}>
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // ── Reports Table ──
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Laporan</th>
                    <th>Tanggal</th>
                    <th>Terlapor</th>
                    <th>Perihal</th>
                    <th>Prioritas</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>Tidak ada laporan ditemukan.</td></tr>
                  ) : reports.map(r => (
                    <tr key={r.id}>
                      <td><span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 'var(--text-xs)' }}>{r.report_no}</span></td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.employee_name || '-'}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</td>
                      <td>
                        <span className={`badge ${PRIORITY_BADGE[r.priority] || 'badge-info'}`}>
                          {r.priority ? r.priority.charAt(0).toUpperCase() + r.priority.slice(1) : '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${REPORT_STATUS_BADGE[r.status] || 'badge-info'}`}>
                          {REPORT_STATUS_LABELS[r.status] || r.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-ghost btn-icon" onClick={() => navigate(`/cases/${r.id}`)}>
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-info">
              Menampilkan {activeTab === 'cases' ? cases.length : reports.length} dari {pag.total} data
            </div>
            <div className="pagination-controls">
              <button className="page-btn" disabled={pag.page <= 1} onClick={() => fetchData(pag.page - 1)}>
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, pag.total_pages || 1) }, (_, i) => (
                <button key={i + 1} className={`page-btn ${pag.page === i + 1 ? 'active' : ''}`} onClick={() => fetchData(i + 1)}>
                  {i + 1}
                </button>
              ))}
              <button className="page-btn" disabled={pag.page >= pag.total_pages} onClick={() => fetchData(pag.page + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}