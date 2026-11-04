import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Eye, EyeOff, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!nip || !password) {
      setError('NIP dan kata sandi harus diisi.');
      setLoading(false);
      return;
    }

    try {
      const result = await login(nip.trim(), password);
      if (!result.success) {
        setError(result.error || 'Login gagal. Periksa kembali NIP dan kata sandi Anda.');
      }
      // On success, App.jsx's LoginPageWrapper redirects to /dashboard automatically.
    } catch {
      setError('Tidak dapat terhubung ke server. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo">eD</div>
          <h1>E-Disiplin ASN</h1>
          <p>
            Platform Terpadu Pengawasan dan Penegakan Aturan Pegawai Pemerintah.
            Terintegrasi, akuntabel, dan berbasis data.
          </p>
        </div>
        <div className="login-features">
          <div className="login-feature">
            <div className="feature-icon">
              <Shield size={20} />
            </div>
            <span>Pengawasan kedisiplinan terintegrasi</span>
          </div>
          <div className="login-feature">
            <div className="feature-icon">
              <CheckCircle size={20} />
            </div>
            <span>Manajemen kasus yang terstruktur</span>
          </div>
          <div className="login-feature">
            <div className="feature-icon">
              <Lock size={20} />
            </div>
            <span>Keamanan data dan hak akses terkontrol</span>
          </div>
          <div className="login-feature">
            <div className="feature-icon">
              <AlertTriangle size={20} />
            </div>
            <span>Audit trail lengkap dan akuntabel</span>
          </div>
        </div>
      </div>

      <div className="login-right">
        <form className="login-form" onSubmit={handleSubmit}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-3)',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} />
            Kembali ke Beranda
          </Link>
          <h2>Masuk</h2>
          <p>Masukkan kredensial Anda untuk mengakses sistem.</p>

          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-light)',
              borderRadius: 'var(--border-radius)',
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--text-sm)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}>
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">NIP / Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="Masukkan NIP atau username"
              value={nip}
              onChange={e => setNip(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kata Sandi</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-5)',
            fontSize: 'var(--text-sm)',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
              <input type="checkbox" />
              <span style={{ color: 'var(--text-secondary)' }}>Ingat saya</span>
            </label>
            <a href="#" style={{ color: 'var(--secondary)', fontSize: 'var(--text-sm)' }}>Lupa kata sandi?</a>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" style={{
                  width: 16, height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
                Memproses...
              </span>
            ) : 'Masuk'}
          </button>

          <div className="login-footer">
            <p>© 2026 E-Disiplin ASN v1.0</p>
            <p style={{ marginTop: 4 }}>Platform Terpadu Pengawasan ASN</p>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
