import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Search, Eye, CheckCircle,
  Clock, Download, ChevronLeft, ChevronRight, FileText, RefreshCw, AlertTriangle,
  Plus, X, Printer, CheckCircle2
} from 'lucide-react';
import { decisionsService, casesService } from '../services';

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
  const [cases, setCases]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [feedback, setFeedback]         = useState(null);
  const [pagination, setPagination]     = useState({ page: 1, total: 0, total_pages: 1, limit: 20 });

  // Modals state
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [previewSk, setPreviewSk]               = useState(null);
  const [isCreateOpen, setIsCreateOpen]         = useState(false);
  const [isSubmitting, setIsSubmitting]         = useState(false);

  const [newSk, setNewSk] = useState({
    case_id: '',
    penalty_type: 'Teguran Lisan',
    penalty_level: 'ringan',
    effective_date: new Date().toISOString().split('T')[0],
    status: 'ditetapkan',
    description: 'Berdasarkan hasil pemeriksaan dan bukti yang ada, diputuskan penjatuhan hukuman disiplin sesuai PP 94/2021.'
  });

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

  // Load cases for create modal
  useEffect(() => {
    if (isCreateOpen && cases.length === 0) {
      casesService.getAll({ limit: 50 }).then(res => {
        if (res.success && Array.isArray(res.data)) {
          setCases(res.data);
          if (res.data.length > 0 && !newSk.case_id) {
            setNewSk(prev => ({ ...prev, case_id: res.data[0].id }));
          }
        }
      }).catch(() => {});
    }
  }, [isCreateOpen, cases.length, newSk.case_id]);

  const showNotification = (msg, isErr = false) => {
    setFeedback({ msg, isErr });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newSk.case_id) {
      return showNotification('Pilih kasus yang akan diputuskan.', true);
    }
    setIsSubmitting(true);
    try {
      const res = await decisionsService.create(newSk);
      if (res.success) {
        showNotification(`Surat Keputusan ${res.data?.sk_no || ''} berhasil diterbitkan.`);
        setIsCreateOpen(false);
        fetchData(1);
      } else {
        showNotification(res.message || 'Gagal menerbitkan SK.', true);
      }
    } catch (err) {
      showNotification(err.message || 'Terjadi kesalahan sistem.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <p className="page-subtitle">Kelola surat keputusan penjatuhan hukuman disiplin ASN</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            className="btn btn-primary"
            onClick={() => setIsCreateOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Terbitkan SK Baru
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
          {/* Filters */}
          <div className="filter-bar">
            <div className="search-box" style={{ flex: 1 }}>
              <Search className="search-icon" size={16} />
              <input type="text" placeholder="Cari nomor SK, nama pegawai, NIP, atau jenis sanksi..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
              <option value="">Semua Tingkat</option>
              <option value="ringan">Tingkat Ringan</option>
              <option value="sedang">Tingkat Sedang</option>
              <option value="berat">Tingkat Berat</option>
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
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
              <p>Memuat data keputusan...</p>
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
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>Belum ada keputusan hukuman disiplin.</td></tr>
                    ) : filtered.map(d => (
                      <tr key={d.id}>
                        <td><span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 'var(--text-xs)' }}>{d.sk_no || d.decision_no || '-'}</span></td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {d.created_at ? new Date(d.created_at).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{d.employee_name || '-'}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{d.employee_nip || ''}</div>
                        </td>
                        <td><span style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 600 }}>{d.case_no || '-'}</span></td>
                        <td style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>{d.penalty_type || '-'}</td>
                        <td>
                          <span className={`badge ${LEVEL_BADGE[d.penalty_level] || 'badge-info'}`}>
                            {d.penalty_level ? d.penalty_level.charAt(0).toUpperCase() + d.penalty_level.slice(1) : '-'}
                          </span>
                        </td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {d.effective_date ? new Date(d.effective_date).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[d.status] || 'badge-info'}`}>
                            {STATUS_LABEL[d.status] || d.status || '-'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button
                              className="btn btn-sm btn-ghost btn-icon"
                              title="Lihat detail SK"
                              onClick={() => setSelectedDecision(d)}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="btn btn-sm btn-ghost btn-icon"
                              title="Cetak / Unduh SK"
                              onClick={() => setPreviewSk(d)}
                            >
                              <Download size={14} />
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

      {/* Decision Detail Modal */}
      {selectedDecision && (
        <div className="modal-backdrop" onClick={() => setSelectedDecision(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title">Detail Surat Keputusan</h3>
              <button className="modal-close" onClick={() => setSelectedDecision(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Nomor SK Resmi</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                  {selectedDecision.sk_no}
                </div>
              </div>

              <div className="detail-grid">
                {[
                  { label: 'Pegawai Terhukum', value: selectedDecision.employee_name },
                  { label: 'NIP', value: selectedDecision.employee_nip },
                  { label: 'Kasus Terkait', value: selectedDecision.case_no },
                  { label: 'Tingkat Hukuman', value: selectedDecision.penalty_level?.toUpperCase() },
                  { label: 'Jenis Hukuman', value: selectedDecision.penalty_type },
                  { label: 'Tanggal Berlaku', value: selectedDecision.effective_date ? new Date(selectedDecision.effective_date).toLocaleDateString('id-ID') : '-' },
                  { label: 'Status SK', value: selectedDecision.status },
                  { label: 'Ditetapkan Oleh', value: selectedDecision.issued_by_name || 'Pejabat Pembina Kepegawaian' },
                ].map((item, i) => (
                  <div key={i} className="detail-item">
                    <div className="detail-label">{item.label}</div>
                    <div className="detail-value">{item.value || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => { setPreviewSk(selectedDecision); setSelectedDecision(null); }}>
                <Printer size={14} style={{ marginRight: 6 }} /> Pratinjau Cetak SK
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedDecision(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* SK Document Print / Download Preview Modal */}
      {previewSk && (
        <div className="modal-backdrop" onClick={() => setPreviewSk(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <h3 className="modal-title">Pratinjau Surat Keputusan Resmi</h3>
              <button className="modal-close" onClick={() => setPreviewSk(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 'var(--space-6)', borderRadius: 'var(--border-radius)' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 12, marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: 'var(--text-base)', textTransform: 'uppercase', letterSpacing: 1 }}>Pemerintah Republik Indonesia</h4>
                <h3 style={{ margin: '4px 0', fontSize: 'var(--text-lg)', fontWeight: 800 }}>KEPUTUSAN PEJABAT PEMBINA KEPEGAWAIAN</h3>
                <div style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>NOMOR: {previewSk.sk_no}</div>
              </div>

              <div style={{ textAlign: 'center', margin: '16px 0', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                TENTANG<br />
                PENJATUHAN HUKUMAN DISIPLIN TINGKAT {previewSk.penalty_level?.toUpperCase()}
              </div>

              <div style={{ fontSize: 'var(--text-xs)', lineHeight: 1.8, color: '#334155' }}>
                <p>Menimbang: Berdasarkan hasil pemeriksaan Berita Acara Pemeriksaan (BAP) dan ketentuan Peraturan Pemerintah Nomor 94 Tahun 2021 tentang Disiplin Pegawai Negeri Sipil;</p>
                <p><strong>MEMUTUSKAN:</strong> Menjatuhkan Hukuman Disiplin kepada:</p>
                <table style={{ width: '100%', margin: '10px 0', fontSize: 'var(--text-xs)' }}>
                  <tbody>
                    <tr><td style={{ width: 140, fontWeight: 600 }}>Nama</td><td>: {previewSk.employee_name}</td></tr>
                    <tr><td style={{ fontWeight: 600 }}>NIP</td><td>: {previewSk.employee_nip}</td></tr>
                    <tr><td style={{ fontWeight: 600 }}>Jenis Hukuman</td><td>: <strong>{previewSk.penalty_type}</strong></td></tr>
                    <tr><td style={{ fontWeight: 600 }}>Mulai Berlaku</td><td>: {previewSk.effective_date ? new Date(previewSk.effective_date).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}</td></tr>
                  </tbody>
                </table>
                <p>Keputusan ini berlaku sejak tanggal ditetapkan dengan ketentuan apabila di kemudian hari terdapat kekeliruan akan diperbaiki sebagaimana mestinya.</p>
              </div>

              <div style={{ marginTop: 24, textAlign: 'right', fontSize: 'var(--text-xs)' }}>
                <div>Ditetapkan di: Jakarta</div>
                <div>Pada tanggal: {previewSk.effective_date ? new Date(previewSk.effective_date).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}</div>
                <div style={{ marginTop: 40, fontWeight: 700 }}>{previewSk.issued_by_name || 'Pejabat yang Berwenang Menghukum'}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setPreviewSk(null)}>Tutup</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  window.print();
                  showNotification('Perintah cetak SK dikirim.');
                }}
              >
                <Printer size={16} style={{ marginRight: 6 }} /> Cetak Dokumen SK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Decision Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsCreateOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title">Penerbitan Surat Keputusan (SK) Disiplin</h3>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Pilih Kasus Terkait</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={newSk.case_id}
                    onChange={e => setNewSk({ ...newSk, case_id: e.target.value })}
                  >
                    {cases.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.case_no} — {c.employee_name} ({c.title})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Tingkat Hukuman</label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={newSk.penalty_level}
                      onChange={e => setNewSk({ ...newSk, penalty_level: e.target.value })}
                    >
                      <option value="ringan">Tingkat Ringan</option>
                      <option value="sedang">Tingkat Sedang</option>
                      <option value="berat">Tingkat Berat</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Tanggal Efektif</label>
                    <input
                      type="date"
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={newSk.effective_date}
                      onChange={e => setNewSk({ ...newSk, effective_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Jenis Hukuman Disiplin (PP 94/2021)</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={newSk.penalty_type}
                    onChange={e => setNewSk({ ...newSk, penalty_type: e.target.value })}
                  >
                    {newSk.penalty_level === 'ringan' && (
                      <>
                        <option value="Teguran Lisan">Teguran Lisan</option>
                        <option value="Teguran Tertulis">Teguran Tertulis</option>
                        <option value="Pernyataan Tidak Puas secara Tertulis">Pernyataan Tidak Puas secara Tertulis</option>
                      </>
                    )}
                    {newSk.penalty_level === 'sedang' && (
                      <>
                        <option value="Pemotongan Tukin 25% selama 6 bulan">Pemotongan Tukin 25% selama 6 bulan</option>
                        <option value="Pemotongan Tukin 25% selama 9 bulan">Pemotongan Tukin 25% selama 9 bulan</option>
                        <option value="Pemotongan Tukin 25% selama 12 bulan">Pemotongan Tukin 25% selama 12 bulan</option>
                      </>
                    )}
                    {newSk.penalty_level === 'berat' && (
                      <>
                        <option value="Penurunan Jabatan Setingkat Lebih Rendah selama 12 bulan">Penurunan Jabatan Lebih Rendah (12 bulan)</option>
                        <option value="Pembebasan dari Jabatan Menjadi Pelaksana selama 12 bulan">Pembebasan dari Jabatan (12 bulan)</option>
                        <option value="Pemberhentian dengan Hormat Tidak atas Permintaan Sendiri">Pemberhentian dengan Hormat (PTDH)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Pertimbangan / Deskripsi Putusan</label>
                  <textarea
                    rows={3}
                    className="filter-select"
                    style={{ width: '100%', resize: 'vertical' }}
                    value={newSk.description}
                    onChange={e => setNewSk({ ...newSk, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menerbitkan...' : 'Terbitkan SK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
