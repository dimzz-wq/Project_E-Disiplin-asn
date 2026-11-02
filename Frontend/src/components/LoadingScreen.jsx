// Full-page loading spinner shown while the auth session is being verified
// on app mount (or during any auth-critical suspense).

export default function LoadingScreen({ message = 'Memuat aplikasi...' }) {
  return (
    <div
      className="loading-screen"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        background: 'var(--bg-primary)',
        zIndex: 'var(--z-modal)',
      }}
    >
      <div
        className="spinner"
        style={{
          width: 40,
          height: 40,
          border: '3px solid var(--primary-50)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <div
          className="sidebar-logo"
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--border-radius)',
            fontSize: 'var(--text-sm)',
            fontWeight: 800,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--secondary), var(--secondary-light))',
            boxShadow: '0 2px 8px rgba(78, 165, 217, 0.3)',
          }}
        >
          eD
        </div>
        <span
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--primary)',
          }}
        >
          E-Disiplin ASN
        </span>
      </div>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-muted)',
          marginTop: 'calc(-1 * var(--space-2))',
        }}
      >
        {message}
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .loading-screen {
          animation: fadeIn 0.2s ease;
        }
      `}</style>
    </div>
  );
}