import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/employees?search=&unit=&status=
router.get('/', async (req, res, next) => {
  try {
    const { search = '', unit = '', status = '', page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * pageSize;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(e.name ILIKE ? OR e.nip ILIKE ? OR e.position ILIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (unit) {
      conditions.push('e.unit_id = ?');
      params.push(unit);
    }
    if (status) {
      conditions.push('e.status = ?');
      params.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRows = await query(`SELECT COUNT(*) AS total FROM employees e ${where}`, params);
    const total = countRows[0]?.total || 0;

    const rows = await query(
      `SELECT e.*, ou.name AS unit_name
       FROM employees e
       LEFT JOIN org_units ou ON ou.id = e.unit_id
       ${where}
       ORDER BY e.name ASC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page: pageNum, limit: pageSize, total, total_pages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/employees/:id
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT e.*, ou.name AS unit_name
       FROM employees e
       LEFT JOIN org_units ou ON ou.id = e.unit_id
       WHERE e.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pegawai tidak ditemukan.' });
    }

    // Attach recent discipline counts
    const [caseCount] = await query('SELECT COUNT(*) AS total FROM cases WHERE subject_employee_id = ?', [req.params.id]);
    const [decisionCount] = await query('SELECT COUNT(*) AS total FROM decisions WHERE employee_id = ?', [req.params.id]);

    res.json({
      success: true,
      data: {
        ...rows[0],
        total_cases: caseCount?.total || 0,
        total_decisions: decisionCount?.total || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;