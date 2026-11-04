import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Clock, User, Building2, Calendar, Paperclip,
  Download, CheckCircle, AlertTriangle, MessageSquare, Shield,
  ChevronRight, Eye, Scale, Edit3, Upload, X, CheckCircle2
} from 'lucide-react';
import {
  CASES, REPORTS, CASE_STATUS_LABELS, CASE_STATUS_BADGE,
  VIOLATION_LEVELS, REPORT_CATEGORIES
} from '../data/mockData';
import { casesService, reportsService } from '../services';

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary');
  const [data, setData]           = useState(null);
  const [isCase, setIsCase]       = useState(true);
  const [loading, setLoading]     = useState(true);
  const [feedback, setFeedback]   = useState(null);

  // Modals state
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isEditOpen, setIsEditOpen]     = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [statusForm, setStatusForm] = useState({
    status: '',
    note: '',
  });

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    level: 'ringan',
    priority: 'sedang',
    deadline: '',
  });

  const [docForm, setDocForm] = useState({
    name: '',
    type: 'BAP / Dokumen Pendukung',
  });

  const loadData = useCallback(async () => {
    // 1) Try mockData first if matches
    const mockCase = CASES.find(c => c.id === id);
    const mockReport = REPORTS.find(r => r.id === id);
    if (mockCase) {
      setData(mockCase);
      setIsCase(true);
      setStatusForm({ status: mockCase.status, note: '' });
      setEditForm({
        title: mockCase.title,
        description: mockCase.description,
        level: mockCase.level || 'ringan',
        priority: mockCase.priority || 'sedang',
        deadline: mockCase.deadline || '',
      });
      setLoading(false);
      return;
    }
    if (mockReport) {
      setData(mockReport);
      setIsCase(false);
      setLoading(false);
      return;
    }

    // 2) Try API
    try {
      const [caseRes, reportRes] = await Promise.allSettled([
        casesService.getById(id),
        reportsService.getById(id),
      ]);
      if (caseRes.status === 'fulfilled' && caseRes.value?.data) {
        const c = caseRes.value.data;
        setData(c);
        setIsCase(true);
        setStatusForm({ status: c.status || 'baru', note: '' });
        setEditForm({
          title: c.title || '',
          description: c.description || '',
          level: c.level || 'ringan',
          priority: c.priority || 'sedang',
          deadline: c.deadline ? c.deadline.split('T')[0] : '',
        });
      } else if (reportRes.status === 'fulfilled' && reportRes.value?.data) {
        const r = reportRes.value.data;
        setData(r);
        setIsCase(false);
      }
    } catch {
      // not found
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotification = (msg, isErr = false) => {
    setFeedback({ msg, isErr });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isCase) {
        const res = await casesService.updateStatus(id, {
          status: statusForm.status,
          note: statusForm.note,
        });
        if (res.success) {
          showNotification(`Status kasus berhasil diubah menjadi ${CASE_STATUS_LABELS[statusForm.status] || statusForm.status}.`);
          setIsStatusOpen(false);
          loadData();
        } else {
          showNotification(res.message || 'Gagal mengubah status kasus.', true);
        }
      } else {
        const res = await reportsService.update(id, {
          status: statusForm.status,
          notes: statusForm.note,
        });
        if (res.success) {
          showNotification('Status laporan berhasil diperbarui.');
          setIsStatusOpen(false);
          loadData();
        } else {
          showNotification(res.message || 'Gagal memperbarui status laporan.', true);
        }
      }
    } catch (err) {
      showNotification(err.message || 'Terjadi kesalahan sistem.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return showNotification('Judul kasus wajib diisi.', true);
    setIsSubmitting(true);
    try {
      const res = await casesService.update(id, editForm);
      if (res.success) {
        showNotification('Data kasus berhasil diperbarui.');
        setIsEditOpen(false);
        loadData();
      } else {
        showNotification(res.message || 'Gagal menyimpan perubahan kasus.', true);
      }
    } catch (err) {
      showNotification(err.message || 'Terjadi kesalahan sistem.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!docForm.name.trim()) return showNotification('Nama dokumen wajib diisi.', true);
    setIsSubmitting(true);
    try {
      await casesService.addTimeline(id, {
        action: `Dokumen "${docForm.name}" (${docForm.type}) berhasil dilampirkan ke berkas perkara`,
        type: 'document'
      });
      showNotification(`Dokumen "${docForm.name}" berhasil diunggah.`);
      setIsUploadOpen(false);
      setDocForm({ name: '', type: 'BAP / Dokumen Pendukung' });
      loadData();
    } catch (err) {
      showNotification(err.message || 'Gagal mengunggah dokumen.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Memuat data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <h3>Data tidak ditemukan</h3>
        <p>Kasus atau laporan dengan ID {id} tidak ditemukan.</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/cases')}>
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  const level = VIOLATION_LEVELS ? VIOLATION_LEVELS[data.level] : null;
  const category = REPORT_CATEGORIES ? REPORT_CATEGORIES[data.category] : null;

  const tabs = [
    { id: 'summary',     label: 'Ringkasan',          icon: FileText },
    { id: 'timeline',    label: 'Kronologi',           icon: Clock },
    { id: 'documents',   label: 'Dokumen & Bukti',     icon: Paperclip },
    { id: 'examination', label: 'Pemeriksaan',         icon: Scale },
    { id: 'decision',    label: 'Keputusan',           icon: Shield },
    { id: 'audit',       label: 'Audit Trail',         icon: MessageSquare },
  ];

  const employeeName = data.subject || data.employee_name || data.reported || data.reported_name || '-';
  const employeeNip  = data.nip || data.employee_nip || data.reported_nip || '-';
  const unitName     = data.unit || data.unit_name || '-';
  const caseNoDisplay= data.case_no || data.report_no || data.id;

  return (
    <div>
      {/* Back Button */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <button
          onClick={() => navigate('/cases')}
          className="btn btn-ghost btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={16} /> Kembali ke Manajemen Kasus
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

      {/* Case Header Card */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: 'var(--border-radius-full)' }}>
                  {caseNoDisplay}
                </span>
                <span className={`badge ${CASE_STATUS_BADGE[data.status] || 'badge-info'}`}>
                  {CASE_STATUS_LABELS[data.status] || data.status}
                </span>
                {level && (
                  <span className={`badge badge-${level.color}`}>
                    Tingkat: {level.label}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 4 }}>
                {data.title}
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', maxWidth: 650 }}>
                {data.description}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {isCase && (
                <button className="btn btn-outline btn-sm" onClick={() => setIsEditOpen(true)}>
                  <Edit3 size={14} /> Edit Kasus
                </button>
              )}
              <button className="btn btn-primary btn-sm" onClick={() => setIsStatusOpen(true)}>
                <CheckCircle size={14} /> Ubah Status
              </button>
            </div>
          </div>

          {/* Info Grid */}
          <div style={{ marginTop: 'var(--space-5)', borderTop: '1px solid var(--border-light)', paddingTop: 'var(--space-5)' }}>
            <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="detail-item">
                <div className="detail-label"><User size={12} style={{ display: 'inline', marginRight: 4 }} />Subjek / Terlapor</div>
                <div className="detail-value">{employeeName}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label"><Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />Unit Kerja</div>
                <div className="detail-value">{unitName}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label"><Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />Tanggal Laporan</div>
                <div className="detail-value">{data.date || (data.created_at ? new Date(data.created_at).toLocaleDateString('id-ID') : '-')}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label"><FileText size={12} style={{ display: 'inline', marginRight: 4 }} />Kategori / Level</div>
                <div className="detail-value">{category?.label || data.level || '-'}</div>
              </div>
              {isCase && (
                <>
                  <div className="detail-item">
                    <div className="detail-label">Penanggung Jawab (PIC)</div>
                    <div className="detail-value">{data.pic || data.pic_name || 'Tim Pemeriksa Inspektorat'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Tenggat Selesai</div>
                    <div className="detail-value" style={{ color: 'var(--danger)', fontWeight: 600 }}>
                      {data.deadline ? (data.deadline.includes('T') ? new Date(data.deadline).toLocaleDateString('id-ID') : data.deadline) : 'Sesuai SOP PP 94'}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Prioritas</div>
                    <div className="detail-value" style={{ textTransform: 'capitalize' }}>{data.priority || 'Sedang'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">NIP Terlapor</div>
                    <div className="detail-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{employeeNip}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={14} style={{ marginRight: 6 }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card">
        <div className="card-body">
          {activeTab === 'summary' && (
            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Ringkasan Kasus</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {data.description || 'Tidak ada uraian ringkasan tambahan.'}
              </p>

              {isCase && (
                <div style={{ marginTop: 'var(--space-6)' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>Progress Penanganan Kasus</h4>
                  <div className="progress-bar" style={{ height: 8, marginBottom: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      className="progress-fill"
                      style={{
                        height: '100%',
                        background: 'var(--primary)',
                        width: data.status === 'selesai' ? '100%' : data.status === 'putusan' ? '85%' : data.status === 'pemeriksaan' ? '60%' : data.status === 'penyelidikan' ? '35%' : '15%'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Tahapan aktif: <strong>{CASE_STATUS_LABELS[data.status] || data.status}</strong>
                  </div>
                </div>
              )}

              <div style={{
                marginTop: 'var(--space-5)',
                background: 'var(--info-bg)',
                border: '1px solid var(--info-light)',
                borderRadius: 'var(--border-radius)',
                padding: 'var(--space-4)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
              }}>
                <strong>⚖️ Ketentuan Hukum:</strong> Berdasarkan PP No. 94 Tahun 2021 tentang Disiplin Pegawai Negeri Sipil, setiap tahapan wajib dituangkan dalam Berita Acara Pemeriksaan (BAP) dan Keputusan resmi oleh Atasan Langsung / Pejabat yang Berwenang Menghukum (PyBM).
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>Kronologi & Jejak Kasus</h3>
                <button className="btn btn-outline btn-sm" onClick={() => setIsStatusOpen(true)}>
                  + Tambah Catatan
                </button>
              </div>
              <div className="timeline">
                {data.timeline && data.timeline.length > 0 ? (
                  data.timeline.map((item, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className={`timeline-dot ${item.type || 'info'}`} />
                      <div className="timeline-content">
                        <div className="timeline-time">
                          {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : (item.date || '-')}
                        </div>
                        <div className="timeline-text" style={{ fontWeight: 600 }}>{item.action}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                          oleh: {item.actor_name || item.actor || 'Sistem'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Belum ada catatan kronologi.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>Dokumen & Bukti Perkara</h3>
                <button className="btn btn-sm btn-primary" onClick={() => setIsUploadOpen(true)}>
                  <Upload size={14} /> Unggah Dokumen
                </button>
              </div>

              {data.documents && data.documents.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nama File Dokumen</th>
                        <th>Tipe</th>
                        <th>Ukuran</th>
                        <th>Tanggal Unggah</th>
                        <th>Pengunggah</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.documents.map((doc, idx) => (
                        <tr key={idx}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Paperclip size={14} style={{ color: 'var(--text-muted)' }} />
                              <span style={{ fontWeight: 500 }}>{doc.name || doc.file_name}</span>
                            </div>
                          </td>
                          <td><span className="badge badge-info">{doc.type || 'Berkas Pendukung'}</span></td>
                          <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{doc.size || '320 KB'}</td>
                          <td style={{ fontSize: 'var(--text-xs)' }}>
                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString('id-ID') : (doc.date || '-')}
                          </td>
                          <td style={{ fontSize: 'var(--text-xs)' }}>{doc.uploader_name || doc.uploader || 'Admin'}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-ghost btn-icon"
                              title="Unduh Dokumen"
                              onClick={() => showNotification(`Mengunduh dokumen: ${doc.name || doc.file_name}`)}
                            >
                              <Download size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="upload-area" style={{ cursor: 'pointer' }} onClick={() => setIsUploadOpen(true)}>
                  <Paperclip className="upload-icon" size={32} />
                  <h4>Belum ada dokumen yang dilampirkan</h4>
                  <p>Klik di sini untuk mengunggah dokumen BAP, surat panggilan, atau bukti penunjang</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'examination' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>Agenda Pemeriksaan & Klarifikasi</h3>
                <button className="btn btn-sm btn-outline" onClick={() => navigate('/examinations')}>
                  Buka Menu Pemeriksaan
                </button>
              </div>

              {data.examinations && data.examinations.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>No. Pemeriksaan</th>
                        <th>Jadwal</th>
                        <th>Lokasi</th>
                        <th>Pemeriksa</th>
                        <th>Status</th>
                        <th>Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.examinations.map((ex, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{ex.exam_no}</td>
                          <td style={{ fontSize: 'var(--text-xs)' }}>
                            {ex.schedule_time ? new Date(ex.schedule_time).toLocaleString('id-ID') : '-'}
                          </td>
                          <td>{ex.venue || '-'}</td>
                          <td>{ex.examiner_name || '-'}</td>
                          <td><span className="badge badge-warning">{ex.status}</span></td>
                          <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{ex.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <Scale size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <h3>Belum ada agenda pemeriksaan terdaftar untuk kasus ini</h3>
                  <p>Pemeriksaan dapat dijadwalkan oleh Tim Pemeriksa atau Auditor Inspektorat.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'decision' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>Surat Keputusan Hukuman Disiplin</h3>
                <button className="btn btn-sm btn-outline" onClick={() => navigate('/decisions')}>
                  Buka Menu SK Keputusan
                </button>
              </div>

              {data.decisions && data.decisions.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>No. SK</th>
                        <th>Jenis Hukuman</th>
                        <th>Tingkat</th>
                        <th>Mulai Berlaku</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.decisions.map((dec, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{dec.sk_no}</td>
                          <td>{dec.penalty_type}</td>
                          <td><span className="badge badge-danger">{dec.penalty_level}</span></td>
                          <td>{dec.effective_date ? new Date(dec.effective_date).toLocaleDateString('id-ID') : '-'}</td>
                          <td><span className="badge badge-success">{dec.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <Scale size={48} style={{ opacity: 0.3 }} />
                  <h3>Belum ada keputusan / SK penjatuhan hukuman disiplin</h3>
                  <p>Surat keputusan hukuman disiplin akan diterbitkan setelah proses sidang atau pemeriksaan selesai.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Audit Trail & Log Transaksi</h3>
              {data.timeline && data.timeline.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Waktu Kejadian</th>
                        <th>Aktivitas Log</th>
                        <th>Pengguna / Aktor</th>
                        <th>Tipe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.timeline.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                            {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : (item.date || '-')}
                          </td>
                          <td style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{item.action}</td>
                          <td style={{ fontSize: 'var(--text-xs)' }}>{item.actor_name || item.actor || 'System'}</td>
                          <td>
                            <span className="badge badge-info">{item.type || 'event'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <h3>Belum ada riwayat audit log</h3>
                  <p>Riwayat audit trail akan tercatat otomatis setiap terjadi perubahan data.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Change Status Modal */}
      {isStatusOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsStatusOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title">Perbarui Status {isCase ? 'Kasus' : 'Laporan'}</h3>
              <button className="modal-close" onClick={() => setIsStatusOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleStatusSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Pilih Status Baru</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={statusForm.status}
                    onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}
                  >
                    {isCase ? (
                      <>
                        <option value="baru">Baru</option>
                        <option value="penyelidikan">Penyelidikan</option>
                        <option value="pemeriksaan">Pemeriksaan (BAP)</option>
                        <option value="sidang_kode_etik">Sidang Kode Etik</option>
                        <option value="putusan">Putusan</option>
                        <option value="selesai">Selesai</option>
                        <option value="dibatalkan">Dibatalkan</option>
                      </>
                    ) : (
                      <>
                        <option value="diajukan">Diajukan</option>
                        <option value="diverifikasi">Diverifikasi</option>
                        <option value="ditingkatkan_ke_kasus">Ditingkatkan ke Kasus</option>
                        <option value="ditolak">Ditolak</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Catatan Perubahan / Alasan</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Berkas telah lengkap dan diteruskan untuk pemeriksaan saksi..."
                    className="filter-select"
                    style={{ width: '100%', resize: 'vertical' }}
                    value={statusForm.note}
                    onChange={e => setStatusForm({ ...statusForm, note: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsStatusOpen(false)} disabled={isSubmitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Perbarui Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Case Modal */}
      {isEditOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsEditOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Rincian Kasus</h3>
              <button className="modal-close" onClick={() => setIsEditOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Judul Perkara</label>
                  <input
                    type="text"
                    required
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Uraian Kasus</label>
                  <textarea
                    rows={3}
                    className="filter-select"
                    style={{ width: '100%', resize: 'vertical' }}
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Tingkat Dugaan</label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={editForm.level}
                      onChange={e => setEditForm({ ...editForm, level: e.target.value })}
                    >
                      <option value="ringan">Ringan</option>
                      <option value="sedang">Sedang</option>
                      <option value="berat">Berat</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Prioritas</label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={editForm.priority}
                      onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                    >
                      <option value="rendah">Rendah</option>
                      <option value="sedang">Sedang</option>
                      <option value="tinggi">Tinggi</option>
                      <option value="kritis">Kritis</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Tenggat Penanganan</label>
                  <input
                    type="date"
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={editForm.deadline}
                    onChange={e => setEditForm({ ...editForm, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsUploadOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title">Unggah Dokumen Perkara</h3>
              <button className="modal-close" onClick={() => setIsUploadOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Nama Dokumen / Berkas</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Berita Acara Pemeriksaan Saksi.pdf"
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={docForm.name}
                    onChange={e => setDocForm({ ...docForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Klasifikasi Dokumen</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={docForm.type}
                    onChange={e => setDocForm({ ...docForm, type: e.target.value })}
                  >
                    <option value="Berita Acara Pemeriksaan (BAP)">Berita Acara Pemeriksaan (BAP)</option>
                    <option value="Surat Panggilan Pemeriksaan">Surat Panggilan Pemeriksaan</option>
                    <option value="Laporan Hasil Pemeriksaan (LHP)">Laporan Hasil Pemeriksaan (LHP)</option>
                    <option value="Bukti Rekap Kehadiran">Bukti Rekap Kehadiran</option>
                    <option value="Surat Keputusan (SK)">Surat Keputusan (SK)</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsUploadOpen(false)} disabled={isSubmitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Mengunggah...' : 'Simpan Lampiran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
