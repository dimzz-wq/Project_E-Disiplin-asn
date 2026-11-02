import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Eye, UserCheck,
  Building2, ChevronLeft, ChevronRight, X, RefreshCw,
  Filter, Plus,
} from 'lucide-react';
import { employeesService } from '../services';

const STATUS_BADGE = {
  active:    <span className="badge badge-success">Aktif</span>,
  inactive:  <span className="badge badge-warning">Tidak Aktif</span>,
  suspended: <span className="badge badge-danger">Ditangguhkan</span>,
  pension:   <span className="badge badge-info">Pensiun</span>,
};

const EMPLOYEE_FALLBACK = [];

export default function EmployeesPage() {
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [employees, setEmployees]     = useState(EMPLOYEE_FALLBACK);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [pagination, setPagination]   = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });

  const fetchEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (search)       params.search = search;
      if (filterStatus) params.status = filterStatus;

      const res = await employeesService.getAll(params);
      if (res.success) {
        const rows = Array.isArray(res.data) ? res.data : [];
        setEmployees(rows);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      setError('Gagal memuat data pegawai. Periksa koneksi server.');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEmployees(1), 300);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  const pnsCount   = employees.filter(e => e.type === 'PNS').length;
  const pppkCount  = employees.filter(e => e.type === 'PPPK').length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Pegawai</h1>
          <p className="page-subtitle">Direktori dan informasi kepegawaian ASN</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Tambah Pegawai
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Total Pegawai',  value: pagination.total || employees.length, color: 'blue',   icon: Users },
          { label: 'PNS',            value: pnsCount,                             color: 'green',  icon: UserCheck },
          { label: 'PPPK',           value: pppkCount,                            color: 'purple', icon: UserCheck },
          { label: 'Halaman',        value: `${pagination.page}/${pagination.total_pages}`, color: 'yellow', icon: Building2 },
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

      {/* Table Card */}
      <div className="card">
        <div className="card-body">
          {/* Filters */}
          <div className="filter-bar">
            <div className="search-box" style={{ flex: 1 }}>
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Cari nama, NIP, atau jabatan..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
              <option value="suspended">Ditangguhkan</option>
              <option value="pension">Pensiun</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => fetchEmployees(pagination.page)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: 'var(--space-3)', background: 'var(--danger-bg)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
              ⚠ {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
              <p>Memuat data pegawai...</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>NIP</th>
                      <th>Nama</th>
                      <th>Unit Kerja</th>
                      <th>Jabatan</th>
                      <th>Golongan</th>
                      <th>Tipe</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                          Tidak ada data pegawai ditemukan.
                        </td>
                      </tr>
                    ) : employees.map((e, idx) => (
                      <tr key={e.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                          {(pagination.page - 1) * pagination.limit + idx + 1}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
                            {e.nip}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{e.name}</td>
                        <td style={{ fontSize: 'var(--text-xs)' }}>{e.unit_name || '-'}</td>
                        <td style={{ fontSize: 'var(--text-xs)' }}>{e.position || '-'}</td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{e.rank_grade || '-'}</td>
                        <td>
                          <span className={`badge ${e.type === 'PNS' ? 'badge-info' : 'badge-warning'}`}>
                            {e.type || '-'}
                          </span>
                        </td>
                        <td>{STATUS_BADGE[e.status] || <span className="badge">{e.status}</span>}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-ghost btn-icon"
                            title="Lihat detail"
                            onClick={() => setSelectedEmployee(e)}
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <div className="pagination-info">
                  Menampilkan {employees.length} dari {pagination.total} data
                </div>
                <div className="pagination-controls">
                  <button
                    className="page-btn"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchEmployees(pagination.page - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        className={`page-btn ${pagination.page === p ? 'active' : ''}`}
                        onClick={() => fetchEmployees(p)}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    className="page-btn"
                    disabled={pagination.page >= pagination.total_pages}
                    onClick={() => fetchEmployees(pagination.page + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="modal-backdrop" onClick={() => setSelectedEmployee(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Detail Pegawai</h3>
              <button className="modal-close" onClick={() => setSelectedEmployee(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {/* Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                <div style={{
                  width: 64, height: 64,
                  borderRadius: 'var(--border-radius-full)',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 'var(--text-xl)', flexShrink: 0,
                }}>
                  {selectedEmployee.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 'var(--text-lg)' }}>{selectedEmployee.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 6 }}>{selectedEmployee.position || '-'}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className={`badge ${selectedEmployee.type === 'PNS' ? 'badge-info' : 'badge-warning'}`}>
                      {selectedEmployee.type || '-'}
                    </span>
                    {STATUS_BADGE[selectedEmployee.status]}
                  </div>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="detail-grid">
                {[
                  { label: 'NIP',          value: selectedEmployee.nip },
                  { label: 'Unit Kerja',   value: selectedEmployee.unit_name || '-' },
                  { label: 'Golongan',     value: selectedEmployee.rank_grade || '-' },
                  { label: 'Tgl Bergabung',value: selectedEmployee.join_date ? new Date(selectedEmployee.join_date).toLocaleDateString('id-ID') : '-' },
                  { label: 'Total Kasus',  value: selectedEmployee.total_cases ?? '-' },
                  { label: 'Total SK',     value: selectedEmployee.total_decisions ?? '-' },
                ].map((item, i) => (
                  <div key={i} className="detail-item">
                    <div className="detail-label">{item.label}</div>
                    <div className="detail-value"
                      style={item.label === 'NIP' ? { fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' } : {}}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedEmployee(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
