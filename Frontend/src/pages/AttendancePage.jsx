import { useState, useEffect, useCallback } from 'react';
import {
  Clock, Search, Download, Calendar, CheckCircle,
  XCircle, AlertTriangle, ChevronLeft, ChevronRight, RefreshCw,
  Plus, X, CheckCircle2
} from 'lucide-react';
import { attendanceService, employeesService } from '../services';

const STATUS_MAP = {
  hadir:     { label: 'Hadir',      badgeClass: 'badge-success', icon: CheckCircle },
  terlambat: { label: 'Terlambat',  badgeClass: 'badge-warning', icon: AlertTriangle },
  ijin:      { label: 'Izin',       badgeClass: 'badge-info',    icon: Calendar },
  sakit:     { label: 'Sakit',      badgeClass: 'badge-info',    icon: Calendar },
  alpa:      { label: 'Alpa',       badgeClass: 'badge-danger',  icon: XCircle },
};

const today = new Date().toISOString().split('T')[0];

export default function AttendancePage() {
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate]     = useState(today);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [feedback, setFeedback]         = useState(null);

  const [records, setRecords]       = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [summary, setSummary]       = useState({});
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1, limit: 20 });

  // Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting]           = useState(false);
  const [recordForm, setRecordForm]               = useState({
    employee_id: '',
    date: today,
    status: 'hadir',
    time_in: '07:30',
    time_out: '16:00',
    notes: 'Presensi harian'
  });

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (search)       params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterDate)   params.date   = filterDate;

      const [allRes, sumRes] = await Promise.allSettled([
        attendanceService.getAll(params),
        attendanceService.getSummary(),
      ]);

      if (allRes.status === 'fulfilled' && allRes.value?.success) {
        setRecords(Array.isArray(allRes.value.data) ? allRes.value.data : []);
        if (allRes.value.pagination) setPagination(allRes.value.pagination);
      }
      if (sumRes.status === 'fulfilled' && sumRes.value?.success) {
        setSummary(sumRes.value.data || {});
      }
    } catch {
      setError('Gagal memuat data kehadiran. Periksa koneksi server.');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterDate]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(1), 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  // Load employee list for recording form
  useEffect(() => {
    if (isRecordModalOpen && employees.length === 0) {
      employeesService.getAll({ limit: 100 }).then(res => {
        if (res.success && Array.isArray(res.data)) {
          setEmployees(res.data);
          if (res.data.length > 0 && !recordForm.employee_id) {
            setRecordForm(prev => ({ ...prev, employee_id: res.data[0].id }));
          }
        }
      }).catch(() => {});
    }
  }, [isRecordModalOpen, employees.length, recordForm.employee_id]);

  const showNotification = (msg, isErr = false) => {
    setFeedback({ msg, isErr });
    setTimeout(() => setFeedback(null), 4000);
  };

  // CSV Export handler
  const handleExportCSV = () => {
    if (records.length === 0) {
      return showNotification('Tidak ada data kehadiran untuk diekspor.', true);
    }

    const headers = ['No', 'Nama Pegawai', 'NIP', 'Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status', 'Keterangan'];
    const rows = records.map((r, idx) => [
      idx + 1,
      `"${(r.employee_name || '').replace(/"/g, '""')}"`,
      `"${r.nip || ''}"`,
      r.date || '',
      r.time_in || '-',
      r.time_out || '-',
      r.status || '',
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_kehadiran_${filterDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('File CSV rekap presensi berhasil diunduh.');
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await attendanceService.record(recordForm);
      if (res.success) {
        showNotification('Presensi pegawai berhasil dicatat.');
        setIsRecordModalOpen(false);
        fetchData(pagination.page);
      } else {
        showNotification(res.message || 'Gagal mencatat presensi.', true);
      }
    } catch (err) {
      showNotification(err.message || 'Terjadi kesalahan sistem.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalEmp = summary.total_employees || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Monitoring Kehadiran</h1>
          <p className="page-subtitle">Rekap kehadiran pegawai · Data dari sistem presensi</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            className="btn btn-primary"
            onClick={() => setIsRecordModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Catat Presensi
          </button>
          <button
            className="btn btn-outline"
            onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={16} /> Ekspor CSV
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => fetchData(1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
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
      <div className="grid-stats" style={{ marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Hadir',       value: summary.hadir     ?? 0, total: totalEmp, color: 'green',  icon: CheckCircle },
          { label: 'Terlambat',   value: summary.terlambat ?? 0, total: totalEmp, color: 'yellow', icon: Clock },
          { label: 'Alpa',        value: summary.alpa      ?? 0, total: totalEmp, color: 'red',    icon: XCircle },
          { label: 'Izin/Sakit',  value: (summary.ijin ?? 0) + (summary.sakit ?? 0), total: totalEmp, color: 'blue', icon: Calendar },
        ].map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className={`stat-icon ${stat.color}`}><stat.icon size={22} /></div>
            <div className="stat-content">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
                {totalEmp > 0 ? `${((stat.value / totalEmp) * 100).toFixed(1)}% dari ${totalEmp} pegawai` : 'Belum ada data hari ini'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          {/* Filters */}
          <div className="filter-bar">
            <div className="search-box" style={{ flex: 1 }}>
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Cari nama atau NIP pegawai..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="hadir">Hadir</option>
              <option value="terlambat">Terlambat</option>
              <option value="ijin">Izin</option>
              <option value="sakit">Sakit</option>
              <option value="alpa">Alpa</option>
            </select>
            <input
              type="date"
              className="filter-select"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
            />
          </div>

          {error && (
            <div style={{ padding: 'var(--space-3)', background: 'var(--danger-bg)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
              ⚠ {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
              <p>Memuat data kehadiran...</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Pegawai</th>
                      <th>NIP</th>
                      <th>Tanggal</th>
                      <th>Jam Masuk</th>
                      <th>Jam Pulang</th>
                      <th>Status</th>
                      <th>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                          {filterDate === today
                            ? 'Belum ada data kehadiran hari ini. Klik "Catat Presensi" untuk menambahkan presensi.'
                            : 'Tidak ada data kehadiran untuk filter yang dipilih.'}
                        </td>
                      </tr>
                    ) : records.map(r => {
                      const s = STATUS_MAP[r.status] || { label: r.status, badgeClass: 'badge-info', icon: CheckCircle };
                      const SIcon = s.icon;
                      return (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600 }}>{r.employee_name || '-'}</td>
                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                              {r.nip || '-'}
                            </span>
                          </td>
                          <td style={{ fontSize: 'var(--text-xs)' }}>
                            {r.date ? new Date(r.date).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                            {r.time_in ? r.time_in.slice(0, 5) : '-'}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                            {r.time_out ? r.time_out.slice(0, 5) : '-'}
                          </td>
                          <td>
                            <span className={`badge ${s.badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <SIcon size={12} />
                              {s.label}
                            </span>
                          </td>
                          <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            {r.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <div className="pagination-info">
                  Menampilkan {records.length} dari {pagination.total} data
                </div>
                <div className="pagination-controls">
                  <button
                    className="page-btn"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchData(pagination.page - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(5, pagination.total_pages || 1) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        className={`page-btn ${pagination.page === p ? 'active' : ''}`}
                        onClick={() => fetchData(p)}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    className="page-btn"
                    disabled={pagination.page >= pagination.total_pages}
                    onClick={() => fetchData(pagination.page + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Record Attendance Modal */}
      {isRecordModalOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsRecordModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">Input / Catat Presensi</h3>
              <button className="modal-close" onClick={() => setIsRecordModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRecordSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Pilih Pegawai</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={recordForm.employee_id}
                    onChange={e => setRecordForm({ ...recordForm, employee_id: e.target.value })}
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.nip})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Tanggal</label>
                    <input
                      type="date"
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={recordForm.date}
                      onChange={e => setRecordForm({ ...recordForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Status Kehadiran</label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={recordForm.status}
                      onChange={e => setRecordForm({ ...recordForm, status: e.target.value })}
                    >
                      <option value="hadir">Hadir</option>
                      <option value="terlambat">Terlambat</option>
                      <option value="ijin">Izin</option>
                      <option value="sakit">Sakit</option>
                      <option value="alpa">Alpa</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Jam Masuk</label>
                    <input
                      type="time"
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={recordForm.time_in}
                      onChange={e => setRecordForm({ ...recordForm, time_in: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Jam Pulang</label>
                    <input
                      type="time"
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={recordForm.time_out}
                      onChange={e => setRecordForm({ ...recordForm, time_out: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Keterangan / Catatan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Hadir tepat waktu di kantor"
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={recordForm.notes}
                    onChange={e => setRecordForm({ ...recordForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsRecordModalOpen(false)} disabled={isSubmitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kehadiran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
