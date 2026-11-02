import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, Search, Calendar, Eye, CheckCircle,
  Clock, ChevronLeft, ChevronRight, Users, FileText, RefreshCw
} from 'lucide-react';
import { examinationsService } from '../services';

const STATUS_BADGE = {
  terjadwal:   'badge-info',
  berlangsung: 'badge-warning',
  selesai:     'badge-success',
  ditunda:     'badge-danger',
};
const STATUS_LABEL = {
  terjadwal:   'Terjadwal',
  berlangsung: 'Berlangsung',
  selesai:     'Selesai',
  ditunda:     'Ditunda',
};

export default function ExaminationPage() {
  const navigate = useNavigate();
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [examinations, setExaminations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [pagination, setPagination]     = useState({ page: 1, total: 0, total_pages: 1, limit: 20 });

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (filterStatus) params.status = filterStatus;
      const res = await examinationsService.getAll(params);
      if (res.success) {
        setExaminations(Array.isArray(res.data) ? res.data : []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch {
      setError('Gagal memuat data pemeriksaan.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const filtered = examinations.filter(e => {
    if (!search) return true;
    const text = (
      (e.exam_no || '') +
      (e.case_no || '') +
      (e.employee_name || '') +
      (e.examiner_name || '')
    ).toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const terjadwal   = examinations.filter(e => e.status === 'terjadwal').length;
  const berlangsung = examinations.filter(e => e.status === 'berlangsung').length;
  const selesai     = examinations.filter(e => e.status === 'selesai').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pemeriksaan</h1>
          <p className="page-subtitle">Kelola proses pemeriksaan dan investigasi kasus pelanggaran</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => fetchData(pagination.page)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Total Pemeriksaan',  value: pagination.total || examinations.length, color: 'blue',   icon: Scale },
          { label: 'Berlangsung',         value: berlangsung, color: 'yellow', icon: Clock },
          { label: 'Terjadwal',           value: terjadwal,   color: 'purple', icon: Calendar },
          { label: 'Selesai',             value: selesai,     color: 'green',  icon: CheckCircle },
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
              <input type="text" placeholder="Cari no. pemeriksaan, kasus, atau subjek..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
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
              <RefreshCw size={20} style={{ marginBottom: 8 }} /><p>Memuat data pemeriksaan...</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No. Pemeriksaan</th>
                      <th>Kasus Terkait</th>
                      <th>Subjek</th>
                      <th>Pemeriksa</th>
                      <th>Jadwal</th>
                      <th>Lokasi</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>Belum ada jadwal pemeriksaan.</td></tr>
                    ) : filtered.map(e => (
                      <tr key={e.id}>
                        <td><span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 'var(--text-xs)' }}>{e.exam_no || '-'}</span></td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--primary)' }}>{e.case_no || '-'}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{e.employee_name || '-'}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{e.employee_nip || ''}</div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)' }}>
                            <Users size={12} style={{ color: 'var(--text-muted)' }} />
                            {e.examiner_name || '-'}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            <Calendar size={12} />
                            {e.schedule_time ? new Date(e.schedule_time).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                          </span>
                        </td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{e.venue || '-'}</td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[e.status] || 'badge-info'}`}>
                            {STATUS_LABEL[e.status] || e.status || '-'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-sm btn-ghost btn-icon" title="Lihat kasus" onClick={() => navigate(`/cases/${e.case_id}`)}>
                              <Eye size={14} />
                            </button>
                            <button className="btn btn-sm btn-ghost btn-icon" title="Lihat BAP">
                              <FileText size={14} />
                            </button>
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
