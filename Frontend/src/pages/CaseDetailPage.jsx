import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Clock, User, Building2, Calendar, Paperclip,
  Download, CheckCircle, AlertTriangle, MessageSquare, Shield,
  ChevronRight, Eye, Scale, Edit3, Upload
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
  const [data, setData] = useState(null);
  const [isCase, setIsCase] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      // 1) Try mockData first (instant)
      const mockCase = CASES.find(c => c.id === id);
      const mockReport = REPORTS.find(r => r.id === id);
      if (mockCase) { setData(mockCase); setIsCase(true); setLoading(false); return; }
      if (mockReport) { setData(mockReport); setIsCase(false); setLoading(false); return; }

      // 2) Try API
      try {
        const [caseRes, reportRes] = await Promise.allSettled([
          casesService.getById(id),
          reportsService.getById(id),
        ]);
        if (!active) return;
        if (caseRes.status === 'fulfilled' && caseRes.value?.data) {
          setData(caseRes.value.data); setIsCase(true);
        } else if (reportRes.status === 'fulfilled' && reportRes.value?.data) {
          setData(reportRes.value.data); setIsCase(false);
        }
      } catch {
        // not found
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [id]);

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

  const level = VIOLATION_LEVELS.find(v => v.id === data.level);
  const category = REPORT_CATEGORIES.find(c => c.id === data.category);

  const tabs = [
    { id: 'summary', label: 'Ringkasan', icon: FileText },
    { id: 'timeline', label: 'Kronologi', icon: Clock },
    { id: 'documents', label: 'Dokumen & Bukti', icon: Paperclip },
    { id: 'examination', label: 'Pemeriksaan', icon: Scale },
    { id: 'decision', label: 'Keputusan', icon: CheckCircle },
    { id: 'audit', label: 'Audit Trail', icon: Shield },
  ];

  return (
    <div>
      {/* Back Button */}
      <button
        className="btn btn-ghost"
        style={{ marginBottom: 'var(--space-4)', color: 'var(--text-muted)' }}
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} /> Kembali
      </button>

      {/* Header */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 10px', borderRadius: 'var(--border-radius-full)' }}>
                  {data.id}
                </span>
                <span className={`badge ${CASE_STATUS_BADGE[data.status]}`}>
                  {CASE_STATUS_LABELS[data.status]}
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
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', maxWidth: 600 }}>
                {data.description}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm"><Edit3 size={14} /> Edit</button>
              <button className="btn btn-primary btn-sm"><CheckCircle size={14} /> Ubah Status</button>
            </div>
          </div>

          {/* Info Grid */}
          <div style={{ marginTop: 'var(--space-5)', borderTop: '1px solid var(--border-light)', paddingTop: 'var(--space-5)' }}>
            <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="detail-item">
                <div className="detail-label"><User size={12} style={{ display: 'inline', marginRight: 4 }} />Subjek / Terlapor</div>
                <div className="detail-value">{isCase ? data.subject : data.reported}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label"><Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />Unit Kerja</div>
                <div className="detail-value">{data.unit}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label"><Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />Tanggal Laporan</div>
                <div className="detail-value">{data.date}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label"><FileText size={12} style={{ display: 'inline', marginRight: 4 }} />Kategori</div>
                <div className="detail-value">{category?.label || '-'}</div>
              </div>
              {isCase && (
                <>
                  <div className="detail-item">
                    <div className="detail-label">Penanggung Jawab</div>
                    <div className="detail-value">{data.pic}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Tenggat</div>
                    <div className="detail-value" style={{ color: 'var(--danger)' }}>{data.deadline}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">No. Laporan Asal</div>
                    <div className="detail-value">{data.reportId}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">NIP</div>
                    <div className="detail-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{data.nip}</div>
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
                {data.description}
              </p>

              {isCase && (
                <div style={{ marginTop: 'var(--space-6)' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>Progress Penanganan</h4>
                  <div className="progress-bar" style={{ height: 8, marginBottom: 8 }}>
                    <div className="progress-fill" style={{ width: data.status === 'examination_in_progress' ? '50%' : '30%' }} />
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {data.status === 'examination_in_progress' ? 'Pemeriksaan berlangsung — tahap 1 dari 2 selesai' : 'Menunggu pemeriksaan dimulai'}
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
                <strong>⚖️ Catatan:</strong> Status kasus ini merupakan status administratif dalam sistem.
                Penetapan kesalahan dan keputusan disiplin hanya dapat dilakukan oleh pejabat yang berwenang
                setelah melalui pemeriksaan sesuai ketentuan yang berlaku.
              </div>
            </div>
          )}

          {activeTab === 'timeline' && isCase && (
            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-5)' }}>Kronologi Penanganan</h3>
              <div className="timeline">
                {data.timeline?.map((item, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className={`timeline-dot ${item.type}`} />
                    <div className="timeline-content">
                      <div className="timeline-time">{item.date}</div>
                      <div className="timeline-text">{item.action}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                        oleh {item.actor}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>Dokumen & Bukti</h3>
                <button className="btn btn-sm btn-primary"><Upload size={14} /> Unggah Dokumen</button>
              </div>

              {isCase && data.documents?.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nama File</th>
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
                              <span style={{ fontWeight: 500 }}>{doc.name}</span>
                            </div>
                          </td>
                          <td><span className="badge badge-info">{doc.type}</span></td>
                          <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{doc.size}</td>
                          <td style={{ fontSize: 'var(--text-xs)' }}>{doc.date}</td>
                          <td style={{ fontSize: 'var(--text-xs)' }}>{doc.uploader}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn-sm btn-ghost btn-icon"><Eye size={14} /></button>
                              <button className="btn btn-sm btn-ghost btn-icon"><Download size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="upload-area">
                  <Paperclip className="upload-icon" size={32} />
                  <h4>Belum ada dokumen</h4>
                  <p>Seret file atau klik untuk mengunggah dokumen pendukung</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'examination' && (
            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Pemeriksaan</h3>
              {isCase ? (
                <div>
                  <div className="detail-grid" style={{ marginBottom: 'var(--space-5)' }}>
                    <div className="detail-item">
                      <div className="detail-label">Tim Pemeriksa</div>
                      <div className="detail-value">{data.pic}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Status Pemeriksaan</div>
                      <div className="detail-value">
                        <span className="badge badge-examination">Berlangsung</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Tahap</div>
                      <div className="detail-value">1 dari 2</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Jadwal Berikutnya</div>
                      <div className="detail-value">17 Oktober 2026</div>
                    </div>
                  </div>

                  <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}>
                    <div className="card-header">
                      <div className="card-title" style={{ fontSize: 'var(--text-sm)' }}>Pemeriksaan Tahap 1 — 13 Oktober 2026</div>
                      <span className="badge badge-success">Selesai</span>
                    </div>
                    <div className="card-body">
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                        Pemeriksaan dilakukan di Ruang Rapat Inspektorat. Pegawai yang diperiksa hadir didampingi penasihat.
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span className="badge badge-info"><Paperclip size={10} /> BAP Tahap 1.pdf</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <h3>Belum ada pemeriksaan</h3>
                  <p>Pemeriksaan akan dijadwalkan setelah laporan diverifikasi dan kasus dibentuk.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'decision' && (
            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Keputusan & Tindak Lanjut</h3>
              <div className="empty-state">
                <Scale size={48} style={{ opacity: 0.3 }} />
                <h3>Belum ada keputusan</h3>
                <p>Keputusan akan tersedia setelah proses pemeriksaan selesai dan ditelaah oleh pejabat yang berwenang.</p>
              </div>
              <div style={{
                marginTop: 'var(--space-4)',
                background: 'var(--warning-bg)',
                border: '1px solid var(--warning-light)',
                borderRadius: 'var(--border-radius)',
                padding: 'var(--space-3)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
              }}>
                <strong>⚠️ Penting:</strong> E-Disiplin ASN tidak mempunyai kewenangan hukum untuk menetapkan sanksi.
                Keputusan harus dibuat oleh pejabat yang berwenang setelah pemeriksaan sesuai ketentuan.
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Audit Trail</h3>
              {isCase && data.timeline ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Waktu</th>
                        <th>Aktivitas</th>
                        <th>Pengguna</th>
                        <th>Tipe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.timeline.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{item.date}</td>
                          <td style={{ fontSize: 'var(--text-sm)' }}>{item.action}</td>
                          <td style={{ fontSize: 'var(--text-xs)' }}>{item.actor}</td>
                          <td>
                            <span className={`badge badge-${item.type === 'danger' ? 'danger' : item.type === 'warning' ? 'warning' : item.type === 'success' ? 'success' : 'info'}`}>
                              {item.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <h3>Belum ada riwayat</h3>
                  <p>Audit trail akan tersedia setelah kasus dibentuk.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
