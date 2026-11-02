import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Search, Clock, Eye, Filter,
  ChevronLeft, ChevronRight, Download, RefreshCw, Activity
} from 'lucide-react';
import { auditService } from '../services';

const ACTION_BADGE = {
  LOGIN:          'badge-info',
  LOGOUT:         'badge-info',
  VIEW:           'badge-draft',
  CREATE:         'badge-warning',
  UPDATE:         'badge-warning',
  UPDATE_STATUS:  'badge-warning',
  DELETE:         'badge-danger',
  UPLOAD:         'badge-success',
  EXPORT:         'badge-success',
  SYNC:           'badge-success',
  APPROVE:        'badge-success',
};

const ACTION_TYPES = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'UPDATE_STATUS', 'DELETE', 'UPLOAD', 'EXPORT', 'VIEW', 'SYNC', 'APPROVE'];
const MODULES = ['auth', 'reports', 'cases', 'examinations', 'decisions', 'employees', 'attendance', 'documents'];

export default function AuditLogPage() {
  const [search, setSearch]             = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterDate, setFilterDate]     = useState('');
  const [logs, setLogs]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [pagination, setPagination]     = useState({ page: 1, total: 0, total_pages: 1, limit: 25 });

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 25 };
      if (filterAction) params.action = filterAction;
      if (filterModule) params.module = filterModule;
      if (filterDate)   params.from   = filterDate;
      if (filterDate)   params.to     = filterDate;
      const res = await auditService.getAll(params);
      if (res.success) {
        setLogs(Array.isArray(res.data) ? res.data : []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch {
      setError('Gagal memuat audit log.');
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterModule, filterDate]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const text = ((l.user_name || '') + (l.action || '') + (l.detail || '') + (l.module || '')).toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const loginCount  = logs.filter(l => l.action === 'LOGIN').length;
  const changeCount = logs.filter(l => ['CREATE', 'UPDATE', 'UPDATE_STATUS', 'APPROVE'].includes(l.action)).length;
  const deleteCount = logs.filter(l => l.action === 'DELETE').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">Jejak audit aktivitas sistem dan pengguna</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => fetchData(pagination.page)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> Ekspor Log
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Total Log',        value: pagination.total || logs.length, color: 'blue',   icon: Shield },
          { label: 'Login',            value: loginCount,  color: 'green',  icon: Eye },
          { label: 'Perubahan Data',   value: changeCount, color: 'yellow', icon: Filter },
          { label: 'Hapus',            value: deleteCount, color: 'red',    icon: Activity },
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
              <input type="text" placeholder="Cari pengguna, aksi, atau detail..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
              <option value="">Semua Aksi</option>
              {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select className="filter-select" value={filterModule} onChange={e => setFilterModule(e.target.value)}>
              <option value="">Semua Modul</option>
              {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="date" className="filter-select" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </div>

          {error && (
            <div style={{ padding: 'var(--space-3)', background: 'var(--danger-bg)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
              ⚠ {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} style={{ marginBottom: 8 }} /><p>Memuat audit log...</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>Pengguna</th>
                      <th>Aksi</th>
                      <th>Detail</th>
                      <th>Modul</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>Belum ada log aktivitas.</td></tr>
                    ) : filtered.map(l => (
                      <tr key={l.id}>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            <Clock size={12} />
                            {l.created_at ? new Date(l.created_at).toLocaleString('id-ID') : '-'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{l.user_name || '-'}</td>
                        <td>
                          <span className={`badge ${ACTION_BADGE[l.action] || 'badge-info'}`}>
                            {l.action || '-'}
                          </span>
                        </td>
                        <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--text-xs)' }}>{l.detail || '-'}</td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{l.module || '-'}</td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{l.ip_address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <div className="pagination-info">Menampilkan {filtered.length} dari {pagination.total} log</div>
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
