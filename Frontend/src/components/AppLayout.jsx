import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ClipboardList, FileText, Users, FolderOpen,
  BarChart3, Shield, Settings, Bell, Search, Menu, X,
  ChevronDown, LogOut, Eye, AlertTriangle, UserCheck,
  Scale, Clock, BookOpen, ChevronRight, Activity
} from 'lucide-react';
import { ROLE_LABELS } from '../data/mockData';

// Menu per role — each entry has an optional `roles` array (undefined = semua role)
const ALL_MENU = [
  {
    section: 'Utama',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    section: 'Monitoring',
    roles: ['admin', 'atasan', 'bkpsdm', 'inspektorat'],
    items: [
      { path: '/attendance', label: 'Kehadiran', icon: Clock, roles: ['admin', 'atasan', 'bkpsdm', 'inspektorat'] },
      { path: '/anomaly', label: 'Indikator Anomali', icon: AlertTriangle, roles: ['admin', 'atasan', 'inspektorat'] },
    ]
  },
  {
    section: 'Kehadiran Saya',
    roles: ['pegawai'],
    items: [
      { path: '/attendance', label: 'Rekam Kehadiran', icon: Clock, roles: ['pegawai'] },
    ]
  },
  {
    section: 'Pelaporan & Kasus',
    roles: ['admin', 'atasan', 'pemeriksa', 'bkpsdm', 'inspektorat'],
    items: [
      { path: '/reports', label: 'Laporan Pelanggaran', icon: FileText, badge: 3, roles: ['admin', 'atasan', 'bkpsdm', 'inspektorat'] },
      { path: '/cases', label: 'Manajemen Kasus', icon: FolderOpen, badge: 2, roles: ['admin', 'pemeriksa', 'bkpsdm', 'inspektorat'] },
      { path: '/examination', label: 'Pemeriksaan', icon: Scale, roles: ['admin', 'pemeriksa', 'inspektorat'] },
      { path: '/decisions', label: 'Keputusan / SK', icon: BookOpen, roles: ['admin', 'bkpsdm', 'inspektorat'] },
    ]
  },
  {
    section: 'Laporan Saya',
    roles: ['pegawai'],
    items: [
      { path: '/reports', label: 'Buat Laporan', icon: FileText, roles: ['pegawai'] },
    ]
  },
  {
    section: 'Data & Analitik',
    roles: ['admin', 'atasan', 'bkpsdm', 'inspektorat'],
    items: [
      { path: '/employees', label: 'Data Pegawai', icon: Users, roles: ['admin', 'atasan', 'bkpsdm', 'inspektorat'] },
      { path: '/analytics', label: 'Analitik', icon: BarChart3, roles: ['admin', 'bkpsdm', 'inspektorat'] },
    ]
  },
  {
    section: 'Administrasi',
    roles: ['admin'],
    items: [
      { path: '/audit-log', label: 'Audit Log', icon: Shield, roles: ['admin', 'inspektorat'] },
      { path: '/settings', label: 'Pengaturan', icon: Settings, roles: ['admin'] },
    ]
  },
  {
    section: 'Profil',
    roles: ['pegawai', 'pemeriksa'],
    items: [
      { path: '/settings', label: 'Profil Saya', icon: Settings },
    ]
  },
];

function getMenuForRole(role) {
  return ALL_MENU
    .filter(section => !section.roles || section.roles.includes(role))
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.roles || item.roles.includes(role)),
    }))
    .filter(section => section.items.length > 0);
}

export default function AppLayout({ children }) {
  const { user, logout, notifications, unreadCount } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Get menu for current role
  const menuItems = getMenuForRole(user?.role || 'pegawai');

  // Get current page title
  const currentPage = menuItems
    .flatMap(s => s.items)
    .find(i => location.pathname.startsWith(i.path));

  // Build user initials for avatar
  const avatarText =
    user?.avatar ||
    (user?.name
      ? user.name
          .split(/[\s,]+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
      : '?');

  return (
    <div className="app-layout">
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">eD</div>
          <div className="sidebar-brand">
            <h1>E-Disiplin</h1>
            <span>Pengawasan ASN</span>
          </div>
          <button
            className="modal-close"
            onClick={() => setSidebarOpen(false)}
            style={{ display: 'none', color: 'white' }}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((section) => (
            <div key={section.section} className="nav-section">
              <div className="nav-section-title">{section.section}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="nav-icon" size={18} />
                  <span>{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <div className="user-avatar">{avatarText}</div>
            <div className="user-info">
              <div className="name">{user?.name?.split(',')[0]}</div>
              <div className="role">{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
            <ChevronDown size={14} style={{ opacity: 0.6 }} />
          </div>

          {userMenuOpen && (
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 'var(--border-radius)',
              marginTop: 'var(--space-2)',
              padding: 'var(--space-2)',
            }}>
              <button
                className="nav-item"
                onClick={logout}
                style={{ width: '100%', textAlign: 'left', fontSize: '12px', padding: '6px 8px', color: '#f87171' }}
              >
                <LogOut size={14} />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <h2 className="header-title">{currentPage?.label || 'E-Disiplin ASN'}</h2>
              <div className="header-breadcrumb">
                <span>Beranda</span>
                <ChevronRight size={12} className="separator" />
                <span style={{ color: 'var(--text-primary)' }}>{currentPage?.label}</span>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="search-box" style={{ maxWidth: 240 }}>
              <Search className="search-icon" size={16} />
              <input type="text" placeholder="Cari..." />
            </div>
            <button className="header-btn" onClick={() => setNotifOpen(!notifOpen)}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="badge" />}
            </button>
            <div className="header-btn" style={{ cursor: 'default' }}>
              <Activity size={20} style={{ color: 'var(--success)' }} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content animate-fadeIn">
          {children}
        </div>
      </main>

      {/* Notification Panel */}
      <div className={`notification-panel ${notifOpen ? 'open' : ''}`}>
        <div className="notification-panel-header">
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>Notifikasi</h3>
          <button className="modal-close" onClick={() => setNotifOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <div className="notification-panel-body">
          {notifications.map(n => (
            <div key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`}>
              {!n.read && <div className="notification-dot" />}
              <div className="notification-body">
                <div className="notification-title">{n.title}</div>
                <div className="notification-text">{n.text}</div>
              </div>
              <div className="notification-time">{n.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification overlay */}
      {notifOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 'calc(var(--z-modal) - 1)' }}
          onClick={() => setNotifOpen(false)}
        />
      )}
    </div>
  );
}