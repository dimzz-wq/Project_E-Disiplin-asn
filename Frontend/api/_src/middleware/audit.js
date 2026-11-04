import { query } from '../config/db.js';

/**
 * Creates an audit log entry in the audit_logs table.
 * Does not throw so that it will not interrupt primary user requests.
 */
export async function createAuditLog({
  userId = null,
  userName = null,
  action,
  detail = null,
  module: mod,
  ipAddress = null,
}) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, user_name, action, detail, module, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, userName, action, typeof detail === 'object' ? JSON.stringify(detail) : detail, mod, ipAddress]
    );
  } catch (err) {
    console.error('[audit] Failed to record audit log:', err.message);
  }
}

/** Express middleware helper to get client IP cleanly */
export function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
}