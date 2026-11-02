import { useState, useEffect, useCallback } from 'react';
import {
  Clock, Search, Download, Calendar, CheckCircle,
  XCircle, AlertTriangle, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import { attendanceService } from '../services';

// Mapping status dari DB (lowercase) ke label tampilan
const STATUS_MAP = {
  hadir:     { label: 'Hadir',      badgeClass: 'badge-success', icon: CheckCircle },
  terlambat: { label: 'Terlambat',  badgeClass: 'badge-warning', icon: AlertTriangle },
  ijin:      { label: 'Izin',       badgeClass: 'badge-info',    icon: Calendar },
  sakit:     { label: 'Sakit',      badgeClass: 'badge-info',    icon: Calendar },
  alpa:      { label: 'Alpa',       badgeClass: 'badge-danger',  icon: XCircle },
};

const today = new Date().toISOString().split('T')[0];

export default function AttendancePage() {
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate]   = useState(today);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const [records, setRecords]   = useState([]);
  const [summary, setSummary]   = useState({});
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1, limit: 20 });

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

  const totalEmp = summary.total_employees || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Monitoring Kehadiran</h1>
          <p className="page-subtitle">Rekap kehadiran pegawai · Data dari sistem presensi</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={() => fetchData(1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={16} /> Ekspor
          </button>
        </div>
      </div>

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
              <RefreshCw size={20} style={{ marginBottom: 8 }} />
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
                            ? 'Belum ada data kehadiran hari ini. Data akan muncul setelah presensi diinput.'
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
                            {r.date ? new Date(r.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: r.time_in ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              {r.time_in || '-'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: r.time_out ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              {r.time_out || '-'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${s.badgeClass}`}>
                              <SIcon size={11} /> {s.label}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                              {r.note || '-'}
                            </span>
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
                  <button className="page-btn" disabled={pagination.page <= 1} onClick={() => fetchData(pagination.page - 1)}>
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(5, pagination.total_pages || 1) }, (_, i) => (
                    <button key={i + 1} className={`page-btn ${pagination.page === i + 1 ? 'active' : ''}`} onClick={() => fetchData(i + 1)}>
                      {i + 1}
                    </button>
                  ))}
                  <button className="page-btn" disabled={pagination.page >= pagination.total_pages} onClick={() => fetchData(pagination.page + 1)}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
