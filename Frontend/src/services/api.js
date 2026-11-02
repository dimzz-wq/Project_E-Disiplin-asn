// ============================================
// Centralized HTTP client (fetch based)
// ============================================

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// In-memory access token. Not persisted so a page reload always
// re-establishes the session through the httpOnly refresh cookie.
let accessToken = null;

// Listeners fired whenever the session is cleared, so the UI can react
// to an expired/revoked session from anywhere in the app.
const sessionListeners = new Set();

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

export function onSessionExpired(listener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

function notifySessionExpired() {
  sessionListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // A misbehaving listener must never break the request flow.
    }
  });
}

// Build a full URL from an endpoint, supporting absolute URLs.
function buildUrl(endpoint) {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  return `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
}

// Read the response body as JSON when possible, otherwise as text.
async function parseBody(response) {
  const contentType = response.headers.get('content-type') || '';
  if (response.status === 204 || response.status === 205) return null;

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text ? { message: text } : null;
  } catch {
    return null;
  }
}

// Pull a human readable message out of whatever shape the server returned.
function extractMessage(body, fallback) {
  if (!body) return fallback;
  if (typeof body === 'string') return body;
  return body.message || body.error || fallback;
}

function isAuthEndpoint(endpoint) {
  return /\/auth\/(login|refresh|logout)/.test(endpoint);
}

// Single-flight guard: several requests hitting 401 at once must share
// one refresh round-trip instead of firing N parallel refreshes.
let refreshPromise = null;

async function performRefresh() {
  try {
    const response = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include', // sends the httpOnly refresh cookie
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const body = await parseBody(response);

    if (!response.ok) {
      clearAccessToken();
      return null;
    }

    const token = body?.accessToken || body?.token;
    if (!token) {
      clearAccessToken();
      return null;
    }

    setAccessToken(token);
    return token;
  } catch {
    clearAccessToken();
    return null;
  }
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ---------------------------------------------------------------
// Core request
// ---------------------------------------------------------------
export async function apiFetch(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    headers: customHeaders,
    isUpload = false,
    _retry = false,
    ...rest
  } = options;

  const url = buildUrl(endpoint);
  const headers = { Accept: 'application/json', ...(customHeaders || {}) };

  let finalBody = body;
  if (finalBody !== undefined && finalBody !== null && !isUpload) {
    if (typeof finalBody === 'object' && !(finalBody instanceof FormData)) {
      finalBody = JSON.stringify(finalBody);
      headers['Content-Type'] = 'application/json';
    }
  } else if (isUpload) {
    // Let the browser set the multipart boundary itself.
    delete headers['Content-Type'];
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      ...rest,
      body: finalBody,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    const error = new Error('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
    error.status = 0;
    throw error;
  }

  // Access token expired or invalid: refresh once, then retry the request.
  if (response.status === 401 && !_retry && !isAuthEndpoint(endpoint)) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch(endpoint, { ...options, _retry: true });
    }
    clearAccessToken();
    notifySessionExpired();
    const body = await parseBody(response);
    const error = new Error(extractMessage(body, 'Sesi Anda telah berakhir. Silakan login kembali.'));
    error.status = 401;
    throw error;
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    const error = new Error(extractMessage(payload, `Permintaan gagal (${response.status}).`));
    error.status = response.status;
    error.data = payload?.data ?? null;
    throw error;
  }

  if (payload && typeof payload === 'object') {
    // Normalise the backend envelope: { success, data, message }
    return {
      success: payload.success !== false,
      data: payload.data !== undefined ? payload.data : payload,
      message: payload.message || '',
      ...payload,
    };
  }

  return { success: true, data: payload, message: '' };
}

// Convenience wrappers
export const api = {
  get: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
  upload: (endpoint, formData, options) =>
    apiFetch(endpoint, { ...options, method: 'POST', body: formData, isUpload: true }),
};

// Helper for list endpoints that append a query string.
export function withQuery(endpoint, params) {
  if (!params) return endpoint;
  const search = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return search ? `${endpoint}?${search}` : endpoint;
}

export default api;