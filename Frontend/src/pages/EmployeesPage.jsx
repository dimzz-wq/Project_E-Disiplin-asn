import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Eye, UserCheck,
  Building2, ChevronLeft, ChevronRight, X, RefreshCw,
  Plus, Edit2, Trash2, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { employeesService } from '../services';

const STATUS_BADGE = {
  active:    <span className="badge badge-success">Aktif</span>,
  inactive:  <span className="badge badge-warning">Tidak Aktif</span>,
  suspended: <span className="badge badge-danger">Ditangguhkan</span>,
  pension:   <span className="badge badge-info">Pensiun</span>,
};

export default function EmployeesPage() {
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [employees, setEmployees]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [feedback, setFeedback]         = useState(null);
  const [pagination, setPagination]     = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });

  // Modals state
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isCreateOpen, setIsCreateOpen]         = useState(false);
  const [editingEmployee, setEditingEmployee]   = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [isSubmitting, setIsSubmitting]         = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nip: '',
    name: '',
    unit_id: 1,
    position: 'Staff Pelaksana',
    rank_grade: 'III/a',
    type: 'PNS',
    status: 'active',
  });

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
    } catch {
      setError('Gagal memuat data pegawai. Periksa koneksi server.');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEmployees(1), 300);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  const showNotification = (msg, isErr = false) => {
    setFeedback({ msg, isErr });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nip || !formData.name) {
      return showNotification('NIP dan Nama wajib diisi.', true);
    }
    setIsSubmitting(true);
    try {
      const res = await employeesService.create(formData);
      if (res.success) {
        showNotification('Pegawai berhasil ditambahkan ke pangkalan data.');
        setIsCreateOpen(false);
        setFormData({
          nip: '',
          name: '',
          unit_id: 1,
          position: 'Staff Pelaksana',
          rank_grade: 'III/a',
          type: 'PNS',
          status: 'active',
        });
        fetchEmployees(1);
      } else {
        showNotification(res.message || 'Gagal menambahkan pegawai.', true);
      }
    } catch (err) {
      showNotification(err.message || 'Terjadi kesalahan sistem saat menambahkan pegawai.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingEmployee.name) {
      return showNotification('Nama pegawai wajib diisi.', true);
    }
    setIsSubmitting(true);
    try {
      const res = await employeesService.update(editingEmployee.id, {
        name: editingEmployee.name,
        unit_id: editingEmployee.unit_id,
        position: editingEmployee.position,
        rank_grade: editingEmployee.rank_grade,
        type: editingEmployee.type,
        status: editingEmployee.status,
      });
      if (res.success) {
        showNotification(`Data pegawai ${editingEmployee.name} berhasil diperbarui.`);
        setEditingEmployee(null);
        fetchEmployees(pagination.page);
      } else {
        showNotification(res.message || 'Gagal memperbarui pegawai.', true);
      }
    } catch (err) {
      showNotification(err.message || 'Terjadi kesalahan saat memperbarui pegawai.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingEmployee) return;
    setIsSubmitting(true);
    try {
      const res = await employeesService.delete(deletingEmployee.id);
      if (res.success) {
        showNotification(`Pegawai ${deletingEmployee.name} berhasil dihapus.`);
        setDeletingEmployee(null);
        fetchEmployees(pagination.page);
      } else {
        showNotification(res.message || 'Gagal menghapus pegawai.', true);
      }
    } catch (err) {
      showNotification(err.message || 'Terjadi kesalahan saat menghapus data pegawai.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pnsCount  = employees.filter(e => e.type === 'PNS').length;
  const pppkCount = employees.filter(e => e.type === 'PPPK').length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Pegawai</h1>
          <p className="page-subtitle">Direktori dan informasi kepegawaian ASN</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsCreateOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> Tambah Pegawai
        </button>
      </div>

      {feedback && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--border-radius)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 'var(--text-sm)',
          background: feedback.isErr ? 'var(--danger-bg)' : '#e6f7ed',
          color: feedback.isErr ? 'var(--danger)' : '#0d7a3e',
          border: `1px solid ${feedback.isErr ? '#fca5a5' : '#86efac'}`
        }}>
          {feedback.isErr ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Total Pegawai',  value: pagination.total || employees.length, color: 'blue',   icon: Users },
          { label: 'PNS',            value: pnsCount,                             color: 'green',  icon: UserCheck },
          { label: 'PPPK',           value: pppkCount,                            color: 'purple', icon: UserCheck },
          { label: 'Halaman',        value: `${pagination.page}/${pagination.total_pages || 1}`, color: 'yellow', icon: Building2 },
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

          {error && (
            <div style={{ padding: 'var(--space-3)', background: 'var(--danger-bg)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
              ⚠ {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
              <p>Memuat data pegawai...</p>
            </div>
          ) : (
            <>
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
                      <th style={{ textAlign: 'center' }}>Aksi</th>
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
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button
                              className="btn btn-sm btn-ghost btn-icon"
                              title="Lihat detail"
                              onClick={() => setSelectedEmployee(e)}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="btn btn-sm btn-ghost btn-icon"
                              title="Edit pegawai"
                              onClick={() => setEditingEmployee({ ...e })}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-sm btn-ghost btn-icon"
                              title="Hapus pegawai"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => setDeletingEmployee(e)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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
                  {Array.from({ length: Math.min(5, pagination.total_pages || 1) }, (_, i) => {
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

      {/* Detail Modal */}
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

              <div className="detail-grid">
                {[
                  { label: 'NIP',           value: selectedEmployee.nip },
                  { label: 'Unit Kerja',    value: selectedEmployee.unit_name || '-' },
                  { label: 'Golongan',      value: selectedEmployee.rank_grade || '-' },
                  { label: 'Tgl Bergabung', value: selectedEmployee.join_date ? new Date(selectedEmployee.join_date).toLocaleDateString('id-ID') : '-' },
                  { label: 'Total Kasus',   value: selectedEmployee.total_cases ?? 0 },
                  { label: 'Total SK',      value: selectedEmployee.total_decisions ?? 0 },
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
              <button
                className="btn btn-outline"
                onClick={() => {
                  setEditingEmployee({ ...selectedEmployee });
                  setSelectedEmployee(null);
                }}
              >
                <Edit2 size={14} style={{ marginRight: 6 }} /> Edit Pegawai
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedEmployee(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsCreateOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title">Tambah Pegawai Baru</h3>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>NIP (18 Digit)</label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    placeholder="Contoh: 199001012020011001"
                    className="filter-select"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                    value={formData.nip}
                    onChange={e => setFormData({ ...formData, nip: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ahmad Fauzi, S.Kom."
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Jabatan</label>
                    <input
                      type="text"
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={formData.position}
                      onChange={e => setFormData({ ...formData, position: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Golongan/Pangkat</label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={formData.rank_grade}
                      onChange={e => setFormData({ ...formData, rank_grade: e.target.value })}
                    >
                      <option value="II/a">II/a - Pengatur Muda</option>
                      <option value="II/b">II/b - Pengatur Muda Tk.I</option>
                      <option value="II/c">II/c - Pengatur</option>
                      <option value="II/d">II/d - Pengatur Tk.I</option>
                      <option value="III/a">III/a - Penata Muda</option>
                      <option value="III/b">III/b - Penata Muda Tk.I</option>
                      <option value="III/c">III/c - Penata</option>
                      <option value="III/d">III/d - Penata Tk.I</option>
                      <option value="IV/a">IV/a - Pembina</option>
                      <option value="IV/b">IV/b - Pembina Tk.I</option>
                      <option value="IV/c">IV/c - Pembina Utama Muda</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Tipe Pegawai</label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="PNS">PNS</option>
                      <option value="PPPK">PPPK</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Status</label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Tidak Aktif</option>
                      <option value="suspended">Ditangguhkan</option>
                      <option value="pension">Pensiun</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pegawai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setEditingEmployee(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Pegawai — {editingEmployee.nip}</h3>
              <button className="modal-close" onClick={() => setEditingEmployee(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={editingEmployee.name || ''}
                    onChange={e => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Jabatan</label>
                    <input
                      type="text"
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={editingEmployee.position || ''}
                      onChange={e => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Golongan</label>
                    <input
                      type="text"
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={editingEmployee.rank_grade || ''}
                      onChange={e => setEditingEmployee({ ...editingEmployee, rank_grade: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Tipe Pegawai</label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={editingEmployee.type || 'PNS'}
                      onChange={e => setEditingEmployee({ ...editingEmployee, type: e.target.value })}
                    >
                      <option value="PNS">PNS</option>
                      <option value="PPPK">PPPK</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Status Kepegawaian</label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={editingEmployee.status || 'active'}
                      onChange={e => setEditingEmployee({ ...editingEmployee, status: e.target.value })}
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Tidak Aktif</option>
                      <option value="suspended">Ditangguhkan</option>
                      <option value="pension">Pensiun</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditingEmployee(null)} disabled={isSubmitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Memperbarui...' : 'Perbarui Pegawai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmployee && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setDeletingEmployee(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--danger)' }}>Konfirmasi Hapus</h3>
              <button className="modal-close" onClick={() => setDeletingEmployee(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                Apakah Anda yakin ingin menghapus data pegawai <strong>{deletingEmployee.name}</strong> (NIP: {deletingEmployee.nip})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeletingEmployee(null)} disabled={isSubmitting}>
                Batal
              </button>
              <button className="btn btn-danger" onClick={handleDeleteSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
