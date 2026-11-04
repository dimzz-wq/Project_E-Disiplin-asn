import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Bell, FileText, Scale, Clock, AlertTriangle,
  CheckCircle, ArrowRight, BookOpen, Users, HelpCircle,
  Phone, Mail, MapPin, ChevronDown, ChevronUp, ExternalLink,
  Award, Sparkles, Building2, Eye
} from 'lucide-react';

const ANNOUNCEMENTS = [
  {
    id: 1,
    tag: 'SURAT EDARAN RESMI',
    category: 'Edaran',
    urgent: true,
    date: '04 November 2026',
    title: 'SE Kewajiban Rekapitulasi Presensi & Disiplin Jam Kerja Triwulan Berjalan',
    summary: 'Seluruh Pejabat Pembina Kepegawaian dan Kepala Unit Kerja diwajibkan melakukan validasi kehadiran elektronik dan tindak lanjut anomali presensi sesuai Pasal 11 ayat (2) PP No. 94 Tahun 2021.',
    details: 'Setiap ASN yang tidak masuk kerja tanpa alasan sah wajib dimintakan klarifikasi oleh atasan langsung selambat-lambatnya 3 hari kerja setelah anomali presensi terdeteksi di sistem.',
  },
  {
    id: 2,
    tag: 'REGULASI & SANKSI',
    category: 'Disiplin',
    urgent: true,
    date: '28 Oktober 2026',
    title: 'Penegasan Ketentuan Sanksi Berat: 10 Hari Berturut-turut atau 28 Hari Kumulatif',
    summary: 'Pemberhentian dengan hormat tidak atas permintaan sendiri diberlakukan secara tegas bagi ASN yang meninggalkan tugas tanpa alasan sah selama 10 hari berturut-turut atau akumulasi 28 hari kerja dalam 1 tahun.',
    details: 'Atasan langsung yang tidak memanggil dan memeriksa ASN yang melanggar kewajiban jam kerja akan dijatuhi hukuman disiplin yang sama beratnya dengan pelanggar.',
  },
  {
    id: 3,
    tag: 'JADWAL SIDANG',
    category: 'Sidang',
    urgent: false,
    date: '20 Oktober 2026',
    title: 'Jadwal Sidang Majelis Pertimbangan Disiplin Pegawai ASN Periode November 2026',
    summary: 'Sidang pemeriksaan berkas dugaan pelanggaran kode etik, integritas, dan disiplin sedang-berat diselenggarakan setiap Selasa dan Kamis secara berkala di Kantor Inspektorat Daerah.',
    details: 'Terperiksa berhak didampingi dan memberikan pembelaan tertulis sesuai dengan tata cara pemanggilan pemeriksaan tingkat pertama dan kedua.',
  },
  {
    id: 4,
    tag: 'WHISTLEBLOWING SYSTEM',
    category: 'Aduan',
    urgent: false,
    date: '15 Oktober 2026',
    title: 'Kanal Pengaduan Pelanggaran Disiplin dengan Jaminan Perlindungan Kerahasiaan Saksi',
    summary: 'Masyarakat dan aparatur dapat melaporkan dugaan gratifikasi, pemerasan, pungli, serta penyalahgunaan wewenang melalui menu Pelaporan Pelanggaran dengan proteksi enkripsi identitas pelapor.',
    details: 'Laporan yang disertai bukti awal (foto, rekaman, atau dokumen) akan diprioritaskan untuk proses telaah awal dalam tempo maksimal 2 x 24 jam kerja.',
  },
];

const SANCTION_LEVELS = [
  {
    level: 'Ringan',
    color: '#0284C7',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    items: [
      'Teguran lisan oleh atasan langsung',
      'Teguran tertulis dengan tembusan ke BKPSDM',
      'Pernyataan tidak puas secara tertulis',
    ],
    cases: 'Tidak masuk kerja tanpa izin 3 - 10 hari kerja kumulatif / pelanggaran tata tertib kantor ringan.'
  },
  {
    level: 'Sedang',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    items: [
      'Pemotongan Tukin sebesar 25% selama 6 bulan',
      'Pemotongan Tukin sebesar 25% selama 9 bulan',
      'Pemotongan Tukin sebesar 25% selama 12 bulan',
    ],
    cases: 'Tidak masuk kerja 11 - 20 hari kerja kumulatif / penyalahgunaan wewenang ringan / pungli skala kecil.'
  },
  {
    level: 'Berat',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    items: [
      'Penurunan jabatan setingkat lebih rendah (12 bulan)',
      'Pembebasan dari jabatan menjadi pelaksana (12 bulan)',
      'Pemberhentian dengan hormat tidak atas permintaan sendiri',
    ],
    cases: 'Tidak masuk kerja 21 - 28 hari kerja atau 10 hari berturut-turut / tindak pidana jabatan / pelanggaran netralitas berat.'
  }
];

const FAQS = [
  {
    q: 'Apa dasar hukum utama penegakan disiplin ASN di platform ini?',
    a: 'Dasar hukum utama adalah Peraturan Pemerintah No. 94 Tahun 2021 tentang Disiplin Pegawai Negeri Sipil, serta Peraturan Kepala BKN No. 6 Tahun 2022 tentang Petunjuk Teknis Pelaksanaan Disiplin PNS.'
  },
  {
    q: 'Bagaimana cara seorang ASN atau atasan mengakses sistem E-Disiplin?',
    a: 'Setiap ASN yang terdaftar dapat masuk menggunakan NIP (Nomor Induk Pegawai) resmi dan kata sandi yang telah diterbitkan administrator kepegawaian melalui menu Masuk / Login.'
  },
  {
    q: 'Apakah pelapor pelanggaran dijamin kerahasiaan identitasnya?',
    a: 'Ya, sistem E-Disiplin ASN dilengkapi fitur proteksi kerahasiaan identitas saksi dan pelapor. Data pelapor hanya dapat diakses oleh pemeriksa khusus yang ditugaskan resmi oleh Inspektorat.'
  },
  {
    q: 'Berapa lama batas waktu penyelesaian pemeriksaan BAP?',
    a: 'Pemeriksaan oleh atasan langsung atau tim pemeriksa harus diselesaikan selambat-lambatnya 7 (tujuh) hari kerja setelah surat panggilan pemeriksaan kedua disampaikan.'
  }
];

export default function HomePage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [openFaq, setOpenFaq] = useState(null);
  const [activeModalNotice, setActiveModalNotice] = useState(null);

  const filteredAnnouncements = activeCategory === 'Semua'
    ? ANNOUNCEMENTS
    : ANNOUNCEMENTS.filter(a => a.category === activeCategory);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="home-container">
      {/* ── Top Announcement Banner ─────────────────────────────────── */}
      <div className="home-topbar">
        <div className="home-topbar-content">
          <div className="topbar-badge">
            <Bell size={13} />
            <span>PENGUMUMAN TERBARU</span>
          </div>
          <p className="topbar-text">
            Pemberlakuan monitoring disiplin presensi ASN terintegrasi PP 94/2021 aktif secara penuh.
          </p>
          <a href="#pemberitahuan" className="topbar-link">
            Selengkapnya &rarr;
          </a>
        </div>
      </div>

      {/* ── Navigation Header ──────────────────────────────────────── */}
      <header className="home-navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            <div className="brand-logo">eD</div>
            <div className="brand-text">
              <span className="brand-title">E-Disiplin ASN</span>
              <span className="brand-sub">Platform Pengawasan Pegawai</span>
            </div>
          </Link>

          <nav className="navbar-links">
            <a href="#beranda" className="nav-item">Beranda</a>
            <a href="#pemberitahuan" className="nav-item">Pemberitahuan Umum</a>
            <a href="#aturan" className="nav-item">Dasar Hukum</a>
            <a href="#alur" className="nav-item">Alur Penegakan</a>
            <a href="#faq" className="nav-item">Tanya Jawab</a>
          </nav>

          <div className="navbar-action">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="user-greet">Halo, <strong>{user.name}</strong></span>
                <Link to="/dashboard" className="btn btn-primary btn-sm">
                  Ke Dashboard &rarr;
                </Link>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary">
                Masuk ke Sistem &rarr;
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section id="beranda" className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Shield size={16} />
            <span>Portal Resmi Pengawasan Disiplin ASN</span>
          </div>
          <h1 className="hero-title">
            Transparansi, Akuntabilitas & Penegakan Disiplin ASN Berbasis Data
          </h1>
          <p className="hero-description">
            Sistem terintegrasi untuk pembinaan aparatur negara, pencatatan rekapitulasi kehadiran,
            pemeriksaan BAP, dan penegakan sanksi disiplin sesuai amanat <strong>Peraturan Pemerintah No. 94 Tahun 2021</strong>.
          </p>

          <div className="hero-buttons">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Buka Dashboard Saya
                <ArrowRight size={18} />
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary btn-lg">
                Masuk ke Sistem (Login)
                <ArrowRight size={18} />
              </Link>
            )}
            <a href="#pemberitahuan" className="btn btn-outline btn-lg">
              <Bell size={18} />
              Lihat Pemberitahuan Umum
            </a>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-number">PP 94 / 2021</div>
              <div className="stat-label">Rujukan Regulasi Resmi</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">3 Tingkatan</div>
              <div className="stat-label">Sanksi Disiplin Pegawai</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">100% Digital</div>
              <div className="stat-label">BAP & Rekomendasi Terpadu</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">Terenkripsi</div>
              <div className="stat-label">Perlindungan Saksi & Pelapor</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Pemberitahuan Umum ────────────────────────────── */}
      <section id="pemberitahuan" className="section-container">
        <div className="section-header">
          <div className="section-pill">
            <Bell size={14} />
            <span>Pemberitahuan Umum</span>
          </div>
          <h2 className="section-title">Papan Informasi & Pengumuman Disiplin</h2>
          <p className="section-subtitle">
            Informasi resmi, surat edaran, dan pengumuman kepatuhan kepegawaian untuk seluruh ASN dan masyarakat.
          </p>

          {/* Category Filter Tabs */}
          <div className="category-tabs">
            {['Semua', 'Edaran', 'Disiplin', 'Sidang', 'Aduan'].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`tab-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="announcements-grid">
          {filteredAnnouncements.map((item) => (
            <div key={item.id} className={`announcement-card ${item.urgent ? 'urgent-border' : ''}`}>
              <div className="card-top">
                <span className={`card-badge ${item.urgent ? 'badge-danger' : 'badge-info'}`}>
                  {item.tag}
                </span>
                <span className="card-date">
                  <Clock size={13} />
                  {item.date}
                </span>
              </div>
              <h3 className="card-title">{item.title}</h3>
              <p className="card-summary">{item.summary}</p>
              
              <div className="card-footer">
                <button
                  type="button"
                  className="card-read-btn"
                  onClick={() => setActiveModalNotice(item)}
                >
                  Baca Rincian Edaran &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section: Tingkatan Hukuman Disiplin ─────────────────────── */}
      <section id="aturan" className="section-container bg-alt">
        <div className="section-header">
          <div className="section-pill">
            <Scale size={14} />
            <span>Regulasi & Sanksi</span>
          </div>
          <h2 className="section-title">Tingkatan Hukuman Disiplin PNS (PP 94/2021)</h2>
          <p className="section-subtitle">
            Klasifikasi penjatuhan hukuman disiplin berdasarkan bobot pelanggaran kewajiban dan larangan.
          </p>
        </div>

        <div className="sanctions-grid">
          {SANCTION_LEVELS.map((sanc) => (
            <div
              key={sanc.level}
              className="sanction-card"
              style={{
                backgroundColor: sanc.bg,
                borderColor: sanc.border,
              }}
            >
              <div className="sanction-header" style={{ color: sanc.color }}>
                <Scale size={24} />
                <h3>Hukuman Disiplin {sanc.level}</h3>
              </div>
              <p className="sanction-cases">
                <strong>Pemicu Pelanggaran:</strong> {sanc.cases}
              </p>
              <div className="sanction-list-title">Bentuk Hukuman:</div>
              <ul className="sanction-list">
                {sanc.items.map((it, idx) => (
                  <li key={idx}>
                    <CheckCircle size={15} style={{ color: sanc.color, flexShrink: 0, marginTop: 2 }} />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section: Alur Penegakan Disiplin ────────────────────────── */}
      <section id="alur" className="section-container">
        <div className="section-header">
          <div className="section-pill">
            <FileText size={14} />
            <span>Standar Operasional Prosedur</span>
          </div>
          <h2 className="section-title">Alur Penegakan Disiplin Pegawai ASN</h2>
          <p className="section-subtitle">
            Proses berjenjang yang adil, terdokumentasi rapi, dan sesuai dengan ketentuan peraturan perundang-undangan.
          </p>
        </div>

        <div className="workflow-grid">
          <div className="workflow-step">
            <div className="step-num">1</div>
            <h4>Deteksi & Pelaporan</h4>
            <p>Terdeteksi melalui sistem anomali presensi otomatis atau laporan aduan masyarakat/atasan langsung.</p>
          </div>
          <div className="workflow-arrow">&rarr;</div>

          <div className="workflow-step">
            <div className="step-num">2</div>
            <h4>Pemanggilan & BAP</h4>
            <p>Atasan langsung memanggil terperiksa secara tertulis dan menyusun Berita Acara Pemeriksaan (BAP).</p>
          </div>
          <div className="workflow-arrow">&rarr;</div>

          <div className="workflow-step">
            <div className="step-num">3</div>
            <h4>Telaah Tim Disiplin</h4>
            <p>Kasus sedang dan berat diperiksa bersama Tim Disiplin / Inspektorat untuk merumuskan rekomendasi sanksi.</p>
          </div>
          <div className="workflow-arrow">&rarr;</div>

          <div className="workflow-step">
            <div className="step-num">4</div>
            <h4>Penerbitan SK Disiplin</h4>
            <p>Pejabat Pembina Kepegawaian (PPK) menerbitkan Keputusan Hukuman Disiplin dan mencatat pada riwayat ASN.</p>
          </div>
        </div>
      </section>

      {/* ── Section: Tanya Jawab (FAQ) ─────────────────────────────── */}
      <section id="faq" className="section-container bg-alt">
        <div className="section-header">
          <div className="section-pill">
            <HelpCircle size={14} />
            <span>Pertanyaan Umum</span>
          </div>
          <h2 className="section-title">Pertanyaan yang Sering Diajukan</h2>
          <p className="section-subtitle">
            Kumpulan panduan singkat mengenai prosedur dan pengoperasian sistem pengawasan disiplin ASN.
          </p>
        </div>

        <div className="faq-accordion">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="faq-item">
              <button
                type="button"
                className="faq-question"
                onClick={() => toggleFaq(idx)}
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {openFaq === idx && (
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────── */}
      <section className="cta-banner-section">
        <div className="cta-box">
          <div className="cta-text">
            <h2>Sudah Memiliki Akses Akun Kepegawaian?</h2>
            <p>
              Masuk ke akun Anda untuk memonitor kehadiran, memproses kasus pelanggaran, atau meninjau keputusan disiplin.
            </p>
          </div>
          <div className="cta-action">
            {user ? (
              <Link to="/dashboard" className="btn btn-light btn-lg">
                Masuk ke Dashboard Pegawai &rarr;
              </Link>
            ) : (
              <Link to="/login" className="btn btn-light btn-lg">
                Masuk ke Sistem Sekarang &rarr;
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="home-footer">
        <div className="footer-grid">
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <div className="brand-logo sm">eD</div>
              <span className="brand-title">E-Disiplin ASN</span>
            </div>
            <p className="footer-desc">
              Platform Tata Kelola Disiplin dan Penegakan Aturan Pegawai Pemerintah.
              Mewujudkan birokrasi berintegritas, profesional, dan melayani.
            </p>
            <div className="footer-meta">
              <span>Dasar Hukum: PP No. 94 Tahun 2021</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Navigasi Halaman</h4>
            <ul>
              <li><a href="#beranda">Beranda</a></li>
              <li><a href="#pemberitahuan">Pemberitahuan Umum</a></li>
              <li><a href="#aturan">Tingkatan Sanksi Disiplin</a></li>
              <li><a href="#alur">Alur Pemeriksaan BAP</a></li>
              <li><a href="#faq">Tanya Jawab (FAQ)</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Layanan Terintegrasi</h4>
            <ul>
              <li><Link to="/login">Portal Login ASN</Link></li>
              <li><a href="#pemberitahuan">Surat Edaran Disiplin</a></li>
              <li><a href="#pemberitahuan">Layanan Pengaduan ASN</a></li>
              <li><a href="#aturan">Ketentuan Presensi Elektronik</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Bantuan & Kontak</h4>
            <div className="contact-item">
              <Building2 size={16} />
              <span>Gedung Badan Kepegawaian & Pengembangan SDM</span>
            </div>
            <div className="contact-item">
              <Mail size={16} />
              <span>layanan-disiplin@instansi.go.id</span>
            </div>
            <div className="contact-item">
              <Phone size={16} />
              <span>Helpdesk Disiplin: (021) 7890-1234</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 E-Disiplin ASN — Hak Cipta Dilindungi Undang-Undang.</p>
          <p>Kementerian Pendayagunaan Aparatur Negara dan Reformasi Birokrasi / BKN RI</p>
        </div>
      </footer>

      {/* ── Modal Rincian Pemberitahuan ─────────────────────────────── */}
      {activeModalNotice && (
        <div className="modal-overlay" onClick={() => setActiveModalNotice(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className={`card-badge ${activeModalNotice.urgent ? 'badge-danger' : 'badge-info'}`}>
                {activeModalNotice.tag}
              </span>
              <button
                type="button"
                className="close-btn"
                onClick={() => setActiveModalNotice(null)}
              >
                &times;
              </button>
            </div>
            <h3 className="modal-title">{activeModalNotice.title}</h3>
            <div className="modal-date">
              <Clock size={14} />
              <span>Dipublikasikan pada: {activeModalNotice.date}</span>
            </div>
            <div className="modal-body">
              <p className="modal-summary"><strong>Ringkasan:</strong> {activeModalNotice.summary}</p>
              <div className="modal-detail-box">
                <h4>Ketentuan Teknis / Tindak Lanjut:</h4>
                <p>{activeModalNotice.details}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setActiveModalNotice(null)}
              >
                Tutup
              </button>
              <Link
                to="/login"
                className="btn btn-primary"
                onClick={() => setActiveModalNotice(null)}
              >
                Masuk untuk Tindak Lanjut &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Scoped Styling ─────────────────────────────────────────── */}
      <style>{`
        .home-container {
          min-height: 100vh;
          background-color: #F8FAFC;
          color: #0F172A;
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
          line-height: 1.6;
        }

        /* Topbar */
        .home-topbar {
          background: linear-gradient(90deg, #0369A1, #0284C7);
          color: white;
          font-size: 13px;
          padding: 8px 16px;
        }
        .home-topbar-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .topbar-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 10px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.5px;
        }
        .topbar-text {
          margin: 0;
          font-weight: 500;
        }
        .topbar-link {
          color: #BAE6FD;
          font-weight: 600;
          text-decoration: underline;
        }

        /* Navbar */
        .home-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #E2E8F0;
        }
        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }
        .brand-logo {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0284C7, #0369A1);
          color: white;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          box-shadow: 0 4px 10px rgba(2, 132, 199, 0.3);
        }
        .brand-logo.sm {
          width: 30px;
          height: 30px;
          font-size: 14px;
          border-radius: 8px;
        }
        .brand-text {
          display: flex;
          flex-direction: column;
        }
        .brand-title {
          font-size: 17px;
          font-weight: 800;
          color: #0369A1;
          letter-spacing: -0.3px;
        }
        .brand-sub {
          font-size: 11px;
          color: #64748B;
          font-weight: 500;
        }
        .navbar-links {
          display: flex;
          gap: 24px;
        }
        .nav-item {
          color: #334155;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: color 0.2s;
        }
        .nav-item:hover {
          color: #0284C7;
        }
        .user-greet {
          font-size: 13px;
          color: #334155;
        }

        /* Hero */
        .hero-section {
          background: radial-gradient(circle at 50% 0%, #E0F2FE 0%, #F8FAFC 60%);
          padding: 70px 24px 60px;
          text-align: center;
          border-bottom: 1px solid #E2E8F0;
        }
        .hero-content {
          max-width: 900px;
          margin: 0 auto;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #E0F2FE;
          color: #0369A1;
          font-size: 13px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 9999px;
          margin-bottom: 24px;
          border: 1px solid #BAE6FD;
        }
        .hero-title {
          font-size: 40px;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.25;
          margin-bottom: 20px;
          letter-spacing: -0.8px;
        }
        .hero-description {
          font-size: 17px;
          color: #475569;
          margin-bottom: 34px;
          max-width: 760px;
          margin-left: auto;
          margin-right: auto;
        }
        .hero-buttons {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 48px;
          flex-wrap: wrap;
        }
        .btn-outline {
          background: white;
          color: #0369A1;
          border: 1.5px solid #CBD5E1;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-outline:hover {
          border-color: #0284C7;
          background: #F0F9FF;
        }
        .hero-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          background: white;
          padding: 24px;
          border-radius: 14px;
          box-shadow: 0 4px 20px -2px rgba(0,0,0,0.06);
          border: 1px solid #E2E8F0;
        }
        .stat-card {
          text-align: center;
          padding: 8px;
        }
        .stat-number {
          font-size: 20px;
          font-weight: 800;
          color: #0284C7;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 12px;
          color: #64748B;
          font-weight: 600;
        }

        /* Section Layout */
        .section-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 70px 24px;
        }
        .bg-alt {
          background-color: #F1F5F9;
          border-top: 1px solid #E2E8F0;
          border-bottom: 1px solid #E2E8F0;
          max-width: 100%;
        }
        .bg-alt .section-header, .bg-alt .sanctions-grid, .bg-alt .faq-accordion {
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }
        .section-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 44px;
        }
        .section-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #E0F2FE;
          color: #0284C7;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 9999px;
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        .section-title {
          font-size: 30px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.5px;
          margin-bottom: 12px;
        }
        .section-subtitle {
          font-size: 15px;
          color: #64748B;
          margin: 0;
        }

        /* Tabs */
        .category-tabs {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
          flex-wrap: wrap;
        }
        .tab-btn {
          background: white;
          border: 1px solid #CBD5E1;
          color: #475569;
          padding: 6px 16px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn.active, .tab-btn:hover {
          background: #0284C7;
          color: white;
          border-color: #0284C7;
        }

        /* Announcements Grid */
        .announcements-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .announcement-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #E2E8F0;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .announcement-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
        }
        .announcement-card.urgent-border {
          border-left: 4px solid #DC2626;
        }
        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .card-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .badge-danger {
          background: #FEE2E2;
          color: #B91C1C;
        }
        .badge-info {
          background: #E0F2FE;
          color: #0369A1;
        }
        .card-date {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #64748B;
        }
        .card-title {
          font-size: 17px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .card-summary {
          font-size: 14px;
          color: #475569;
          margin-bottom: 18px;
          flex-grow: 1;
        }
        .card-footer {
          border-top: 1px solid #F1F5F9;
          padding-top: 14px;
        }
        .card-read-btn {
          background: none;
          border: none;
          color: #0284C7;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
        }
        .card-read-btn:hover {
          color: #0369A1;
          text-decoration: underline;
        }

        /* Sanctions Grid */
        .sanctions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .sanction-card {
          border-radius: 14px;
          padding: 24px;
          border: 1.5px solid transparent;
        }
        .sanction-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .sanction-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
        }
        .sanction-cases {
          font-size: 13px;
          color: #334155;
          margin-bottom: 16px;
          background: rgba(255,255,255,0.7);
          padding: 10px;
          border-radius: 8px;
        }
        .sanction-list-title {
          font-size: 13px;
          font-weight: 700;
          color: #1E293B;
          margin-bottom: 8px;
        }
        .sanction-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sanction-list li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: #334155;
          font-weight: 500;
        }

        /* Workflow */
        .workflow-grid {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .workflow-step {
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 22px 18px;
          flex: 1;
          text-align: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }
        .step-num {
          width: 36px;
          height: 36px;
          background: #0284C7;
          color: white;
          font-weight: 800;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          font-size: 16px;
        }
        .workflow-step h4 {
          font-size: 15px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 8px;
        }
        .workflow-step p {
          font-size: 13px;
          color: #64748B;
          margin: 0;
          line-height: 1.5;
        }
        .workflow-arrow {
          font-size: 24px;
          color: #94A3B8;
          font-weight: 700;
        }

        /* FAQ */
        .faq-accordion {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .faq-item {
          background: white;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          overflow: hidden;
        }
        .faq-question {
          width: 100%;
          text-align: left;
          padding: 16px 20px;
          background: none;
          border: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 15px;
          font-weight: 700;
          color: #1E293B;
          cursor: pointer;
        }
        .faq-question:hover {
          color: #0284C7;
        }
        .faq-answer {
          padding: 0 20px 16px;
          font-size: 14px;
          color: #475569;
          border-top: 1px solid #F1F5F9;
          padding-top: 12px;
        }
        .faq-answer p {
          margin: 0;
        }

        /* CTA Section */
        .cta-banner-section {
          max-width: 1200px;
          margin: 20px auto 70px;
          padding: 0 24px;
        }
        .cta-box {
          background: linear-gradient(135deg, #0369A1, #0284C7);
          color: white;
          border-radius: 16px;
          padding: 44px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.4);
        }
        .cta-text h2 {
          font-size: 26px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .cta-text p {
          font-size: 15px;
          color: #BAE6FD;
          margin: 0;
          max-width: 600px;
        }
        .btn-light {
          background: white;
          color: #0369A1;
          font-weight: 700;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          display: inline-block;
          white-space: nowrap;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .btn-light:hover {
          background: #F0F9FF;
        }

        /* Footer */
        .home-footer {
          background: #0F172A;
          color: #94A3B8;
          padding: 60px 24px 24px;
        }
        .footer-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .footer-brand .brand-title {
          color: white;
          font-size: 18px;
        }
        .footer-desc {
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .footer-meta {
          font-size: 12px;
          color: #38BDF8;
          font-weight: 600;
        }
        .footer-col h4 {
          color: white;
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .footer-col ul li a {
          color: #94A3B8;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s;
        }
        .footer-col ul li a:hover {
          color: #38BDF8;
        }
        .contact-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: #CBD5E1;
          margin-bottom: 12px;
        }
        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          border-top: 1px solid #334155;
          padding-top: 24px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .footer-bottom p {
          margin: 0;
        }

        /* Modal Notice */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .modal-box {
          background: white;
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          padding: 28px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          animation: popIn 0.25s ease-out;
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 26px;
          color: #94A3B8;
          cursor: pointer;
          line-height: 1;
        }
        .close-btn:hover {
          color: #0F172A;
        }
        .modal-title {
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 8px;
        }
        .modal-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748B;
          margin-bottom: 20px;
        }
        .modal-summary {
          font-size: 14px;
          color: #334155;
          margin-bottom: 16px;
        }
        .modal-detail-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .modal-detail-box h4 {
          font-size: 13px;
          font-weight: 700;
          color: #0369A1;
          margin-bottom: 6px;
        }
        .modal-detail-box p {
          font-size: 13px;
          color: #475569;
          margin: 0;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        /* Responsiveness */
        @media (max-width: 900px) {
          .announcements-grid, .sanctions-grid {
            grid-template-columns: 1fr;
          }
          .hero-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          .workflow-grid {
            flex-direction: column;
          }
          .workflow-arrow {
            transform: rotate(90deg);
          }
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
          .cta-box {
            flex-direction: column;
            text-align: center;
          }
          .navbar-links {
            display: none;
          }
        }
        @media (max-width: 600px) {
          .hero-title {
            font-size: 28px;
          }
          .footer-grid {
            grid-template-columns: 1fr;
          }
          .hero-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
