import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service.js';
import { onSessionExpired } from '../services/api.js';
import { NOTIFICATIONS } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  // Restore authenticated session on mount
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const refreshed = await authService.refresh();
        if (refreshed && mounted) {
          const profile = await authService.getMe();
          if (mounted) {
            setUser(profile || refreshed.user || null);
          }
        } else if (mounted) {
          setUser(null);
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkSession();

    // Clear user when an API call reports an unrefreshable 401
    const unsub = onSessionExpired(() => {
      if (mounted) setUser(null);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // Login handler returning { success, user, error }
  const login = useCallback(async (nip, password) => {
    try {
      const res = await authService.login(nip, password);
      let profile = res.user;

      // Ensure full profile with unit details is available
      if (!profile || !profile.role) {
        try {
          profile = await authService.getMe();
        } catch {
          // Fall back to the login payload user
        }
      }

      setUser(profile);
      return { success: true, user: profile };
    } catch (err) {
      const message = err?.message || 'Login gagal. Periksa kembali NIP dan kata sandi Anda.';
      return { success: false, error: message };
    }
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Continue clearing local state regardless of network status
    } finally {
      setUser(null);
    }
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        notifications,
        markNotificationRead,
        unreadCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
