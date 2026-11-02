import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Search, Plus, Eye, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle, Clock, X, RefreshCw
} from 'lucide-react';
import { reportsService, employeesService } from '../services';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'kehadiran',               label: 'Kehadiran' },
  { id: 'kinerja',                 label: 'Kinerja' },
  { id: 'kode_etik',               label: 'Kode Etik' },
  { id: 'pidana',                  label: 'Pidana' },
  { id: 'penyalahgunaan_wewenang', label: 'Penyalahgunaan Wewenang' },
  { id: 'lainnya',                 label: 'Lainnya' },
];
const PRIORITY_BADGE = { rendah: 'badge-info', sedang: 'badge-warning', tinggi: 'badge-danger', kritis: 'badge-danger' };
const STATUS_BADGE = {
  draft:                   'badge-draft',
  diajukan:                'badge-submitted',
  diverifikasi:            'badge-review',
  ditolak:                 'badge-rejected',
  ditingkatkan_ke_kasus:   'badge-decision',
};
const STATUS_LABEL = {
  draft:                  'Draft',
  diajukan:               'Diajukan',
  diverifikasi:           'Diverifikasi',
  ditolak:                'Ditolak',
  ditingkatkan_ke_kasus:  'Jadi Kasus',
};

const EMPTY_FORM = {
  reported_employee_id: '',
  category: '',
  title: '',
  description: '',
  incident_location: '',
  incident_date: '',
  priority: 'sedang',
};

export default function ReportsPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [search, setSearch]           = useState('');
  const [filterCat, setFilterCat]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [successMsg, setSuccessMsg]   = useState('');
  const [errorMsg, setErrorMsg]       = useState('');
  const [formError, setFormError]     = useState('');
  const [reports, setReports]         = useState([]);
  const [employees, setEmployees]     = useState([]);
  const [pagination, setPagination]   = useState({ page: 1, total: 0, total_pages: 1, limit: 20 });
  const [formData, setFormData]       = useState(EMPTY_FORM);

  const fetchReports = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search)       params.search   = search;
      if (filterCat)    params.category = filterCat;
      if (filterStatus) params.status   = filterStatus;
      const res = await reportsService.getAll(params);
      if (res.success) {
        setReports(Array.isArray(res.data) ? res.data : []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch {
      setErrorMsg('Gagal memuat laporan. Periksa koneksi server.');
    } finally {
      setLoading(false);
    }
  }, [search, filterCat, filterStatus]);

  useEffect(() => {
    const t = setTimeout(() => fetchReports(1), 300);
    return () => clearTimeout(t);
  }, [fetchReports]);

  // Load employee list for dropdown when form opens
  useEffect(() => {
    if (!showForm || employees.length > 0) return;
    employeesService.getAll({ limit: 200 }).then(res => {
      if (res.success) setEmployees(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
  }, [showForm, employees.length]);

  async function handleSubmit() {
    setFormError('');
    if (!formData.reported_employee_id) return setFormError('Pilih pegawai terlapor.');
    if (!formData.category)              return setFormError('Pilih kategori pelanggaran.');
    if (formData.title.trim().length < 3) return setFormError('Perihal minimal 3 karakter.');
    if (formData.description.trim().length < 10) return setFormError('Kronologi minimal 10 karakter.');

    setSubmitting(true);
    try {
      const res = await reportsService.create({
        reported_employee_id: formData.reported_employee_id,
        category:             formData.category,
        title:                formData.title.trim(),
        description:          formData.description.trim(),
        incident_location:    formData.incident_location || undefined,
        incident_date:        formData.incident_date || undefined,
        priority:             formData.priority,
      });
      if (res.success) {
        setSuccessMsg(`Laporan ${res.data?.report_no || ''} berhasil diajukan!`);
        setShowForm(false);
        setFormData(EMPTY_FORM);
        fetchReports(1);
      } else {
        setFormError(res.message || res.error || 'Gagal mengajukan laporan.');
      }
    } catch {
      setFormError('Gagal mengajukan laporan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  // Stats
  const pendingCount = reports.filter(r => r.status === 'diajukan').length;
  const examCount    = reports.filter(r => r.status === 'diverifikasi').length;
  const doneCount    = reports.filter(r => r.status === 'ditingkatkan_ke_kasus').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan Dugaan Pelanggaran</h1>
          <p className="page-subtitle">Kelola dan pantau seluruh laporan pelanggaran disiplin ASN</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setFormError(''); setSuccessMsg(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Buat Laporan
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-light)', borderRadius: 'var(--border-radius)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          <CheckCircle size={16} style={{ color: 'var(--success)' }} />{successMsg}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSuccessMsg('')}><X size={14}/></button>
        </div>
      )}
      {errorMsg && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-light)', borderRadius: 'var(--border-radius)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
          <AlertTriangle size={16} />{errorMsg}
        </div>
      )}

      {/* Summary */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Total Laporan',          value: pagination.total || reports.length, color: 'blue',   icon: FileText },
          { label: 'Perlu Ditindaklanjuti',  value: pendingCount,                       color: 'yellow', icon: AlertTriangle },
          { label: 'Diverifikasi',           value: examCount,                          color: 'purple', icon: Eye },
          { label: 'Ditingkatkan ke Kasus',  value: doneCount,                          color: 'green',  icon: CheckCircle },
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
          <div className="filter-bar">
            <div className="search-box" style={{ flex: 1 }}>
              <Search className="search-icon" size={16} />
              <input type="text" placeholder="Cari No. Laporan, judul, atau terlapor..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">Semua Kategori</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => fetchReports(1)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} style={{ marginBottom: 8 }} /><p>Memuat laporan...</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No. Laporan</th>
                      <th>Tanggal</th>
                      <th>Terlapor</th>
                      <th>Kategori</th>
                      <th>Perihal</th>
                      <th>Prioritas</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>Belum ada laporan yang diajukan.</td></tr>
                    ) : reports.map(r => (
                      <tr key={r.id}>
                        <td><span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 'var(--text-xs)' }}>{r.report_no}</span></td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td><div style={{ fontWeight: 600 }}>{r.employee_name || '-'}</div></td>
                        <td>
                          <span style={{ fontSize: 'var(--text-xs)', textTransform: 'capitalize' }}>
                            {CATEGORIES.find(c => c.id === r.category)?.label || r.category || '-'}
                          </span>
                        </td>
                        <td><div style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div></td>
                        <td>
                          <span className={`badge ${PRIORITY_BADGE[r.priority] || 'badge-info'}`}>
                            {r.priority ? r.priority.charAt(0).toUpperCase() + r.priority.slice(1) : '-'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[r.status] || 'badge-info'}`}>
                            {STATUS_LABEL[r.status] || r.status || '-'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-ghost btn-icon" title="Detail" onClick={() => navigate(`/cases/${r.id}`)}>
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <div className="pagination-info">Menampilkan {reports.length} dari {pagination.total} laporan</div>
                <div className="pagination-controls">
                  <button className="page-btn" disabled={pagination.page <= 1} onClick={() => fetchReports(pagination.page - 1)}><ChevronLeft size={16} /></button>
                  {Array.from({ length: Math.min(5, pagination.total_pages || 1) }, (_, i) => (
                    <button key={i+1} className={`page-btn ${pagination.page === i+1 ? 'active' : ''}`} onClick={() => fetchReports(i+1)}>{i+1}</button>
                  ))}
                  <button className="page-btn" disabled={pagination.page >= pagination.total_pages} onClick={() => fetchReports(pagination.page + 1)}><ChevronRight size={16} /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Report Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Buat Laporan Dugaan Pelanggaran</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-light)', borderRadius: 'var(--border-radius)', padding: 'var(--space-3)', marginBottom: 'var(--space-5)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
                <span>Laporan ini merupakan informasi awal yang akan ditelaah petugas berwenang. Laporan <strong>bukan merupakan keputusan</strong> bahwa pelanggaran telah terjadi.</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kategori Pelanggaran <span className="required">*</span></label>
                  <select className="form-select" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    <option value="">Pilih kategori...</option>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Prioritas</label>
                  <select className="form-select" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="rendah">Rendah</option>
                    <option value="sedang">Sedang</option>
                    <option value="tinggi">Tinggi</option>
                    <option value="kritis">Kritis</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pegawai Terlapor <span className="required">*</span></label>
                <select className="form-select" value={formData.reported_employee_id} onChange={e => setFormData({ ...formData, reported_employee_id: e.target.value })}>
                  <option value="">-- Pilih Pegawai --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.nip})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Perihal Laporan <span className="required">*</span></label>
                <input type="text" className="form-input" placeholder="Judul singkat laporan..." value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tanggal Kejadian</label>
                  <input type="date" className="form-input" value={formData.incident_date} onChange={e => setFormData({ ...formData, incident_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Lokasi Kejadian</label>
                  <input type="text" className="form-input" placeholder="Opsional" value={formData.incident_location} onChange={e => setFormData({ ...formData, incident_location: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Kronologi <span className="required">*</span></label>
                <textarea className="form-textarea" rows={4} placeholder="Uraikan kronologi kejadian secara singkat dan jelas..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              {formError && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', background: 'var(--danger-bg)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--border-radius)' }}>
                  ⚠ {formError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowForm(false)} disabled={submitting}>Batal</button>
              <button className="btn btn-primary" disabled={submitting} onClick={handleSubmit}>
                {submitting ? 'Mengirim...' : 'Ajukan Laporan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}