import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, Search, Calendar, Eye, CheckCircle,
  Clock, ChevronLeft, ChevronRight, Users, FileText, RefreshCw,
  Plus, X, Printer, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { examinationsService, casesService } from '../services';

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
  const [cases, setCases]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [feedback, setFeedback]         = useState(null);
  const [pagination, setPagination]     = useState({ page: 1, total: 0, total_pages: 1, limit: 20 });

  // Modal State
  const [selectedExam, setSelectedExam] = useState(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    case_id: '',
    schedule_time: '',
    venue: 'Ruang Pemeriksaan Inspektorat Lt. 2',
    notes: 'Pemeriksaan lanjutan dan klarifikasi bukti keterangan saksi',
    status: 'terjadwal'
  });

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

  // Load cases for scheduling
  useEffect(() => {
    if (isScheduleOpen && cases.length === 0) {
      casesService.getAll({ limit: 50 }).then(res => {
        if (res.success && Array.isArray(res.data)) {
          setCases(res.data);
          if (res.data.length > 0 && !scheduleForm.case_id) {
            setScheduleForm(prev => ({ ...prev, case_id: res.data[0].id }));
          }
        }
      }).catch(() => {});
    }
  }, [isScheduleOpen, cases.length, scheduleForm.case_id]);

  const showNotification = (msg, isErr = false) => {
    setFeedback({ msg, isErr });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleForm.case_id) {
      return showNotification('Pilih kasus yang akan diperiksa.', true);
    }
    setIsSubmitting(true);
    try {
      const res = await examinationsService.create(scheduleForm);
      if (res.success) {
        showNotification('Agenda pemeriksaan baru berhasil dijadwalkan.');
        setIsScheduleOpen(false);
        fetchData(1);
      } else {
        showNotification(res.message || 'Gagal menjadwalkan pemeriksaan.', true);
      }
    } catch (err) {
      showNotification(err.message || 'Terjadi kesalahan sistem.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="page-title">Pemeriksaan & BAP</h1>
          <p className="page-subtitle">Kelola proses pemeriksaan, berita acara, dan investigasi pelanggaran</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            className="btn btn-primary"
            onClick={() => setIsScheduleOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Jadwalkan Pemeriksaan
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => fetchData(pagination.page)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
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
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
              <p>Memuat data pemeriksaan...</p>
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
                      <th style={{ textAlign: 'center' }}>Aksi</th>
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
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button className="btn btn-sm btn-ghost btn-icon" title="Lihat kasus" onClick={() => navigate(`/cases/${e.case_id}`)}>
                              <Eye size={14} />
                            </button>
                            <button
                              className="btn btn-sm btn-ghost btn-icon"
                              title="Lihat & Cetak BAP"
                              onClick={() => setSelectedExam(e)}
                            >
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

      {/* BAP Details Modal */}
      {selectedExam && (
        <div className="modal-backdrop" onClick={() => setSelectedExam(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">Berita Acara Pemeriksaan (BAP)</h3>
              <button className="modal-close" onClick={() => setSelectedExam(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ borderBottom: '2px solid #000', paddingBottom: 10, marginBottom: 14, textAlign: 'center' }}>
                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)' }}>INSPEKTORAT / TIM PEMERIKSA DISIPLIN</h4>
                <h3 style={{ margin: '4px 0', fontSize: 'var(--text-base)', fontWeight: 800 }}>BERITA ACARA PEMERIKSAAN</h3>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>NO: {selectedExam.exam_no}</div>
              </div>

              <div className="detail-grid" style={{ marginBottom: 16 }}>
                {[
                  { label: 'Kasus', value: selectedExam.case_no },
                  { label: 'Pegawai Terperiksa', value: selectedExam.employee_name },
                  { label: 'NIP', value: selectedExam.employee_nip },
                  { label: 'Pemeriksa', value: selectedExam.examiner_name },
                  { label: 'Jadwal & Waktu', value: selectedExam.schedule_time ? new Date(selectedExam.schedule_time).toLocaleString('id-ID') : '-' },
                  { label: 'Lokasi / Tempat', value: selectedExam.venue },
                  { label: 'Status', value: selectedExam.status },
                ].map((item, i) => (
                  <div key={i} className="detail-item">
                    <div className="detail-label">{item.label}</div>
                    <div className="detail-value">{item.value || '-'}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-3)', borderRadius: 'var(--border-radius)' }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', marginBottom: 4 }}>Catatan & Uraian Hasil Pemeriksaan:</div>
                <div style={{ fontSize: 'var(--text-xs)', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                  {selectedExam.notes || 'Pemeriksaan telah dilaksanakan sesuai ketentuan PP 94 Tahun 2021. Terperiksa telah memberikan keterangan secara jujur dan sadar.'}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedExam(null)}>Tutup</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  window.print();
                  showNotification('Perintah cetak BAP dikirim.');
                }}
              >
                <Printer size={14} style={{ marginRight: 6 }} /> Cetak Lembar BAP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Exam Modal */}
      {isScheduleOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsScheduleOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">Jadwalkan Pemeriksaan / BAP</h3>
              <button className="modal-close" onClick={() => setIsScheduleOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Pilih Kasus</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={scheduleForm.case_id}
                    onChange={e => setScheduleForm({ ...scheduleForm, case_id: e.target.value })}
                  >
                    {cases.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.case_no} — {c.employee_name} ({c.title})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Waktu & Tanggal Pemeriksaan</label>
                  <input
                    type="datetime-local"
                    required
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={scheduleForm.schedule_time}
                    onChange={e => setScheduleForm({ ...scheduleForm, schedule_time: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Lokasi Ruangan / Tempat</label>
                  <input
                    type="text"
                    required
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={scheduleForm.venue}
                    onChange={e => setScheduleForm({ ...scheduleForm, venue: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Catatan / Agenda Pemeriksaan</label>
                  <textarea
                    rows={3}
                    className="filter-select"
                    style={{ width: '100%', resize: 'vertical' }}
                    value={scheduleForm.notes}
                    onChange={e => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsScheduleOpen(false)} disabled={isSubmitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menjadwalkan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
