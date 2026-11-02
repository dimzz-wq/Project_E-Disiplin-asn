import { useState } from 'react';
import {
  Settings, Bell, Shield, Link, Save
} from 'lucide-react';

// TODO: connect to settings API — saat ini konfigurasi hanya disimpan di state lokal
const TABS = [
  { id: 'umum', label: 'Umum', icon: Settings },
  { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
  { id: 'keamanan', label: 'Keamanan', icon: Shield },
  { id: 'integrasi', label: 'Integrasi', icon: Link },
];

function Toggle({ label, desc, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{label}</div>
        {desc && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{desc}</div>}
      </div>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{checked ? 'Aktif' : 'Nonaktif'}</span>
      </label>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('umum');

  // Umum
  const [instansi, setInstansi] = useState('Pemerintah Kabupaten');
  const [zonaWaktu, setZonaWaktu] = useState('WIB');
  const [jamMulai, setJamMulai] = useState('07:30');
  const [jamSelesai, setJamSelesai] = useState('16:00');
  const [toleransi, setToleransi] = useState('30');

  // Notifikasi
  const [emailNotif, setEmailNotif] = useState(true);
  const [inAppNotif, setInAppNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  // Keamanan
  const [sesiTimeout, setSesiTimeout] = useState('30');
  const [twoFA, setTwoFA] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState('strong');

  // Integrasi
  const [simpegEnabled, setSimpegEnabled] = useState(true);
  const [simpegUrl, setSimpegUrl] = useState('https://simpeg.example.go.id/api');
  const [fingerprintEnabled, setFingerprintEnabled] = useState(true);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan</h1>
          <p className="page-subtitle">Konfigurasi sistem aplikasi E-Disiplin ASN</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <t.icon size={14} style={{ marginRight: 6 }} /> {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          {activeTab === 'umum' && (
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Pengaturan Umum</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Nama Instansi</label>
                  <input
                    type="text"
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={instansi}
                    onChange={e => setInstansi(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Zona Waktu</label>
                  <select className="filter-select" style={{ width: '100%' }} value={zonaWaktu} onChange={e => setZonaWaktu(e.target.value)}>
                    <option value="WIB">WIB (UTC+7)</option>
                    <option value="WITA">WITA (UTC+8)</option>
                    <option value="WIT">WIT (UTC+9)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Jam Kerja Mulai</label>
                  <input
                    type="time"
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={jamMulai}
                    onChange={e => setJamMulai(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Jam Kerja Selesai</label>
                  <input
                    type="time"
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={jamSelesai}
                    onChange={e => setJamSelesai(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Toleransi Keterlambatan (menit)</label>
                  <input
                    type="number"
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={toleransi}
                    onChange={e => setToleransi(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifikasi' && (
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Pengaturan Notifikasi</h3>
              <Toggle label="Notifikasi Email" desc="Kirim pemberitahuan melalui email" checked={emailNotif} onChange={e => setEmailNotif(e.target.checked)} />
              <Toggle label="Notifikasi In-App" desc="Tampilkan pemberitahuan di dalam aplikasi" checked={inAppNotif} onChange={e => setInAppNotif(e.target.checked)} />
              <Toggle label="Notifikasi SMS" desc="Kirim pemberitahuan penting melalui SMS" checked={smsNotif} onChange={e => setSmsNotif(e.target.checked)} />
            </div>
          )}

          {activeTab === 'keamanan' && (
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Pengaturan Keamanan</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Sesi Timeout</label>
                  <select className="filter-select" style={{ width: '100%' }} value={sesiTimeout} onChange={e => setSesiTimeout(e.target.value)}>
                    <option value="15">15 menit</option>
                    <option value="30">30 menit</option>
                    <option value="60">60 menit</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Kebijakan Kata Sandi</label>
                  <select className="filter-select" style={{ width: '100%' }} value={passwordPolicy} onChange={e => setPasswordPolicy(e.target.value)}>
                    <option value="basic">Dasar (min. 6 karakter)</option>
                    <option value="strong">Kuat (min. 8 karakter + angka & simbol)</option>
                  </select>
                </div>
              </div>
              <Toggle label="Autentikasi Dua Faktor (2FA)" desc="Wajibkan verifikasi tambahan saat login" checked={twoFA} onChange={e => setTwoFA(e.target.checked)} />
            </div>
          )}

          {activeTab === 'integrasi' && (
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Pengaturan Integrasi</h3>
              <Toggle label="Integrasi SIMPEG" desc="Sinkronisasi data pegawai dengan SIMPEG" checked={simpegEnabled} onChange={e => setSimpegEnabled(e.target.checked)} />
              {simpegEnabled && (
                <div style={{ margin: 'var(--space-3) 0' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>URL API SIMPEG</label>
                  <input
                    type="text"
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={simpegUrl}
                    onChange={e => setSimpegUrl(e.target.value)}
                  />
                </div>
              )}
              <Toggle label="Integrasi Fingerprint" desc="Tarik data kehadiran dari mesin fingerprint" checked={fingerprintEnabled} onChange={e => setFingerprintEnabled(e.target.checked)} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
            <button className="btn btn-primary">
              <Save size={14} style={{ marginRight: 6 }} /> Simpan Pengaturan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
