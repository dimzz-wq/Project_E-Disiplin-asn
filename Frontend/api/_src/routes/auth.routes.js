import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog, getClientIp } from '../middleware/audit.js';

dotenv.config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const REFRESH_COOKIE_NAME = 'refresh_token';

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, nip: user.nip, name: user.name, role: user.role, unit_id: user.unit_id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function signRefreshToken(user) {
  return jwt.sign({ id: user.id, nip: user.nip }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

function setRefreshCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function refreshExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

function publicUser(u) {
  return {
    id: u.id,
    nip: u.nip,
    name: u.name,
    email: u.email,
    role: u.role,
    position: u.position,
    unit_id: u.unit_id,
    avatar: u.avatar,
    is_active: !!u.is_active,
  };
}

// ---------------------------------------------------------------- LOGIN
router.post('/login', async (req, res, next) => {
  try {
    const { nip, password } = req.body || {};
    if (!nip || !password) {
      return res.status(400).json({ success: false, message: 'NIP dan password wajib diisi.' });
    }

    const rows = await query('SELECT * FROM users WHERE nip = ? LIMIT 1', [String(nip).trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'NIP atau password salah.' });
    }

    const user = rows[0];
    const valid = password === user.password_hash;
    if (!valid) {
      await createAuditLog({
        userId: user.id,
        userName: user.name,
        action: 'LOGIN_FAILED',
        detail: 'Password salah',
        module: 'auth',
        ipAddress: getClientIp(req),
      });
      return res.status(401).json({ success: false, message: 'NIP atau password salah.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Akun Anda tidak aktif. Hubungi administrator.' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [
      user.id,
      refreshToken,
      refreshExpiryDate(),
    ]);
    setRefreshCookie(res, refreshToken);

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      detail: 'Login berhasil',
      module: 'auth',
      ipAddress: getClientIp(req),
    });

    // Join unit name for a richer profile
    let unit_name = null;
    if (user.unit_id) {
      const uRows = await query('SELECT name FROM org_units WHERE id = ?', [user.unit_id]);
      if (uRows.length) unit_name = uRows[0].name;
    }

    res.json({ success: true, message: 'Login berhasil.', token: accessToken, user: { ...publicUser(user), unit_name } });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------- REFRESH
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token tidak ditemukan.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Refresh token tidak valid atau sudah kadaluarsa.' });
    }

    const rows = await query(
      `SELECT u.* FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = ? AND rt.expires_at > NOW() LIMIT 1`,
      [token]
    );
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Refresh token sudah tidak berlaku.' });
    }

    const user = rows[0];
    const accessToken = signAccessToken(user);

    // Rotate the refresh token
    const newRefresh = signRefreshToken(user);
    await query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
    await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [
      user.id,
      newRefresh,
      refreshExpiryDate(),
    ]);
    setRefreshCookie(res, newRefresh);

    res.json({ success: true, token: accessToken, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------- LOGOUT
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (token) {
      await query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
    }
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/api/auth',
    });

    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        action: 'LOGOUT',
        detail: 'Logout berhasil',
        module: 'auth',
        ipAddress: getClientIp(req),
      });
    }
    res.json({ success: true, message: 'Logout berhasil.' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------- ME
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT u.*, ou.name AS unit_name
       FROM users u
       LEFT JOIN org_units ou ON ou.id = u.unit_id
       WHERE u.id = ? LIMIT 1`,
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }
    res.json({ success: true, user: { ...publicUser(rows[0]), unit_name: rows[0].unit_name } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/profile or /me
async function handleUpdateProfile(req, res, next) {
  try {
    const { name, email, position, avatar } = req.body || {};
    const updated = await query(
      `UPDATE users
       SET name = COALESCE(?, name),
           email = COALESCE(?, email),
           position = COALESCE(?, position),
           avatar = COALESCE(?, avatar),
           updated_at = NOW()
       WHERE id = ?
       RETURNING *`,
      [name, email, position, avatar, req.user.id]
    );
    res.json({ success: true, message: 'Profil berhasil diperbarui.', user: publicUser(updated[0]) });
  } catch (err) {
    next(err);
  }
}

router.put('/me', authenticate, handleUpdateProfile);
router.put('/profile', authenticate, handleUpdateProfile);

// PUT /api/auth/password
router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Kata sandi lama dan baru wajib diisi.' });
    }

    const rows = await query('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    if (rows.length === 0 || rows[0].password_hash !== current_password) {
      return res.status(400).json({ success: false, message: 'Kata sandi saat ini tidak cocok.' });
    }

    await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [new_password, req.user.id]);
    res.json({ success: true, message: 'Kata sandi berhasil diperbarui.' });
  } catch (err) {
    next(err);
  }
});

export default router;