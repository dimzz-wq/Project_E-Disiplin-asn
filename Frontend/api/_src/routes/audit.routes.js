import express from 'express';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);
router.use(authorize('admin', 'inspektorat', 'bkpsdm', 'atasan', 'pemeriksa'));

// GET /api/audit-logs?user_id=&module=&action=&from=&to=
router.get('/', async (req, res, next) => {
  try {
    const { user_id, module: mod, action, from, to, page = '1', limit = '25' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 25));
    const offset = (pageNum - 1) * pageSize;

    const conditions = [];
    const params = [];
    if (user_id) { conditions.push('al.user_id = ?'); params.push(user_id); }
    if (mod) { conditions.push('al.module = ?'); params.push(mod); }
    if (action) { conditions.push('al.action = ?'); params.push(action); }
    if (from) { conditions.push('al.created_at >= ?'); params.push(`${from} 00:00:00`); }
    if (to) { conditions.push('al.created_at <= ?'); params.push(`${to} 23:59:59`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRows = await query(`SELECT COUNT(*) AS total FROM audit_logs al ${where}`, params);
    const total = countRows[0]?.total || 0;

    const rows = await query(
      `SELECT al.* FROM audit_logs al ${where} ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({ success: true, data: rows, pagination: { page: pageNum, limit: pageSize, total, total_pages: Math.ceil(total / pageSize) } });
  } catch (err) {
    next(err);
  }
});

export default router;