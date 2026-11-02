import { api, setAccessToken, clearAccessToken } from './api.js';

export const authService = {
  /**
   * Log in with NIP and password.
   * On success, sets in-memory accessToken and returns { user, token }.
   */
  login: async (nip, password) => {
    const res = await api.post('/auth/login', { nip, password });
    const token = res.token || res.accessToken || res.data?.token || res.data?.accessToken;
    const user = res.user || res.data?.user || res.data;

    if (token) {
      setAccessToken(token);
    }

    return {
      success: true,
      token,
      user,
      message: res.message,
    };
  },

  /**
   * Terminate current session on server and clear local token.
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
    }
    return { success: true };
  },

  /**
   * Fetch current authenticated user's profile.
   */
  getMe: async () => {
    const res = await api.get('/auth/me');
    const user = res.user || res.data?.user || res.data;
    return user;
  },

  /**
   * Refresh accessToken via httpOnly cookie.
   * Sets in-memory accessToken and returns it.
   */
  refresh: async () => {
    const res = await api.post('/auth/refresh');
    const token = res.token || res.accessToken || res.data?.token || res.data?.accessToken;
    const user = res.user || res.data?.user || res.data;

    if (token) {
      setAccessToken(token);
      return { token, user };
    }

    clearAccessToken();
    return null;
  },
};

export default authService;
