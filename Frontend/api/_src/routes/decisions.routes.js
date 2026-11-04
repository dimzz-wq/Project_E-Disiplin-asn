import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/decisions?status=&employee_id=&penalty_level=
router.get('/', async (req, res, next) => {
  try {
    const { status, employee_id, penalty_level, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * pageSize;

    const conditions = [];
    const params = [];
    if (status) { conditions.push('d.status = ?'); params.push(status); }
    if (employee_id) { conditions.push('d.employee_id = ?'); params.push(employee_id); }
    if (penalty_level) { conditions.push('d.penalty_level = ?'); params.push(penalty_level); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRows = await query(`SELECT COUNT(*) AS total FROM decisions d ${where}`, params);
    const total = countRows[0]?.total || 0;

    const rows = await query(
      `SELECT d.*, e.name AS employee_name, e.nip AS employee_nip,
              c.case_no, u.name AS issued_by_name
       FROM decisions d
       JOIN employees e ON e.id = d.employee_id
       JOIN cases c ON c.id = d.case_id
       LEFT JOIN users u ON u.id = d.issued_by_id
       ${where}
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({ success: true, data: rows, pagination: { page: pageNum, limit: pageSize, total, total_pages: Math.ceil(total / pageSize) } });
  } catch (err) {
    next(err);
  }
});

export default router;