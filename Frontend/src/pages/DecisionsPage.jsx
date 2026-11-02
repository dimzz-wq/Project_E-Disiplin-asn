import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Search, Eye, CheckCircle,
  Clock, Download, ChevronLeft, ChevronRight, FileText, RefreshCw, AlertTriangle
} from 'lucide-react';
import { decisionsService } from '../services';

const LEVEL_BADGE = {
  ringan: 'badge-success',
  sedang: 'badge-warning',
  berat:  'badge-danger',
};
const STATUS_BADGE = {
  draft:      'badge-draft',
  ditetapkan: 'badge-review',
  berlaku:    'badge-success',
  dicabut:    'badge-danger',
};
const STATUS_LABEL = {
  draft:      'Draft',
  ditetapkan: 'Ditetapkan',
  berlaku:    'Berlaku',
  dicabut:    'Dicabut',
};

export default function DecisionsPage() {
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLevel, setFilterLevel]   = useState('');
  const [decisions, setDecisions]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [pagination, setPagination]     = useState({ page: 1, total: 0, total_pages: 1, limit: 20 });

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (filterStatus) params.status        = filterStatus;
      if (filterLevel)  params.penalty_level = filterLevel;
      const res = await decisionsService.getAll(params);
      if (res.success) {
        setDecisions(Array.isArray(res.data) ? res.data : []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch {
      setError('Gagal memuat data keputusan.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterLevel]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const filtered = decisions.filter(d => {
    if (!search) return true;
    const text = ((d.sk_no || d.decision_no || '') + (d.employee_name || '') + (d.employee_nip || '') + (d.penalty_type || '')).toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const ringanCount = decisions.filter(d => d.penalty_level === 'ringan').length;
  const sedangCount = decisions.filter(d => d.penalty_level === 'sedang').length;
  const beratCount  = decisions.filter(d => d.penalty_level === 'berat').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Keputusan / Surat Keputusan</h1>
          <p className="page-subtitle">Kelola surat keputusan hukuman disiplin ASN</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => fetchData(pagination.page)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Total SK',       value: pagination.total || decisions.length, color: 'blue',   icon: BookOpen },
          { label: 'Hukuman Ringan', value: ringanCount, color: 'green',  icon: FileText },
          { label: 'Hukuman Sedang', value: sedangCount, color: 'yellow', icon: Clock },
          { label: 'Hukuman Berat',  value: beratCount,  color: 'red',    icon: AlertTriangle },
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
            <div className="search-box" style={{ flex: 1 }}>
              <Search className="search-icon" size={16} />
              <input type="text" placeholder="Cari no. SK, pegawai, atau jenis hukuman..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
              <option value="">Semua Tingkat</option>
              <option value="ringan">Ringan</option>
              <option value="sedang">Sedang</option>
              <option value="berat">Berat</option>
            </select>
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {error && (
            <div style={{ padding: 'var(--space-3)', background: 'var(--danger-bg)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
              ⚠ {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} style={{ marginBottom: 8 }} /><p>Memuat data keputusan...</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No. SK</th>
                      <th>Tanggal</th>
                      <th>Pegawai</th>
                      <th>Kasus</th>
                      <th>Jenis Hukuman</th>
                      <th>Tingkat</th>
                      <th>Berlaku Mulai</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>Belum ada keputusan hukuman disiplin.</td></tr>
                    ) : filtered.map(d => (
                      <tr key={d.id}>
                        <td><span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 'var(--text-xs)' }}>{d.sk_no || d.decision_no || '-'}</span></td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {d.issued_date ? new Date(d.issued_date).toLocaleDateString('id-ID') : (d.created_at ? new Date(d.created_at).toLocaleDateString('id-ID') : '-')}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{d.employee_name || '-'}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{d.employee_nip || ''}</div>
                        </td>
                        <td><span style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 600 }}>{d.case_no || '-'}</span></td>
                        <td style={{ fontSize: 'var(--text-xs)' }}>{d.penalty_type || '-'}</td>
                        <td>
                          <span className={`badge ${LEVEL_BADGE[d.penalty_level] || 'badge-info'}`}>
                            {d.penalty_level ? d.penalty_level.charAt(0).toUpperCase() + d.penalty_level.slice(1) : '-'}
                          </span>
                        </td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {d.effective_from ? new Date(d.effective_from).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[d.status] || 'badge-info'}`}>
                            {STATUS_LABEL[d.status] || d.status || '-'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-sm btn-ghost btn-icon" title="Lihat detail"><Eye size={14} /></button>
                            <button className="btn btn-sm btn-ghost btn-icon" title="Unduh SK"><Download size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <div className="pagination-info">Menampilkan {filtered.length} dari {pagination.total} data</div>
                <div className="pagination-controls">
                  <button className="page-btn" disabled={pagination.page <= 1} onClick={() => fetchData(pagination.page - 1)}><ChevronLeft size={16} /></button>
                  {Array.from({ length: Math.min(5, pagination.total_pages || 1) }, (_, i) => (
                    <button key={i+1} className={`page-btn ${pagination.page === i+1 ? 'active' : ''}`} onClick={() => fetchData(i+1)}>{i+1}</button>
                  ))}
                  <button className="page-btn" disabled={pagination.page >= pagination.total_pages} onClick={() => fetchData(pagination.page + 1)}><ChevronRight size={16} /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
