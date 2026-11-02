import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="empty-state" style={{ marginTop: 'var(--space-12)' }}>
      <AlertTriangle size={64} style={{ opacity: 0.3, margin: '0 auto var(--space-4)' }} />
      <h3>Halaman Tidak Ditemukan</h3>
      <p>Halaman yang Anda cari tidak tersedia atau telah dipindahkan.</p>
      <Link
        to="/dashboard"
        className="btn btn-primary"
        style={{ marginTop: 'var(--space-5)', display: 'inline-flex' }}
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
