import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/attendance?employee_id=&date=&status=&month=&year=
router.get('/', async (req, res, next) => {
  try {
    const { employee_id, date, status, month, year, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * pageSize;

    const conditions = [];
    const params = [];

    if (employee_id) {
      conditions.push('a.employee_id = ?');
      params.push(employee_id);
    }
    if (date) {
      conditions.push('a.date = ?');
      params.push(date);
    }
    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    }
    if (month) {
      conditions.push('EXTRACT(MONTH FROM a.date) = ?');
      params.push(month);
    }
    if (year) {
      conditions.push('EXTRACT(YEAR FROM a.date) = ?');
      params.push(year);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRows = await query(`SELECT COUNT(*) AS total FROM attendance a ${where}`, params);
    const total = countRows[0]?.total || 0;

    const rows = await query(
      `SELECT a.*, e.name AS employee_name, e.nip
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       ${where}
       ORDER BY a.date DESC, a.time_in ASC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({ success: true, data: rows, pagination: { page: pageNum, limit: pageSize, total, total_pages: Math.ceil(total / pageSize) } });
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/summary  (today overview or per month)
router.get('/summary', async (req, res, next) => {
  try {
    const [hadir] = await query("SELECT COUNT(*) AS c FROM attendance WHERE date = CURRENT_DATE AND status = 'hadir'");
    const [terlambat] = await query("SELECT COUNT(*) AS c FROM attendance WHERE date = CURRENT_DATE AND status = 'terlambat'");
    const [ijin] = await query("SELECT COUNT(*) AS c FROM attendance WHERE date = CURRENT_DATE AND status = 'ijin'");
    const [sakit] = await query("SELECT COUNT(*) AS c FROM attendance WHERE date = CURRENT_DATE AND status = 'sakit'");
    const [alpa] = await query("SELECT COUNT(*) AS c FROM attendance WHERE date = CURRENT_DATE AND status = 'alpa'");
    const [totalEmp] = await query("SELECT COUNT(*) AS c FROM employees WHERE status = 'active'");

    res.json({
      success: true,
      data: {
        date: new Date().toISOString().split('T')[0],
        total_employees: totalEmp?.c || 0,
        hadir: hadir?.c || 0,
        terlambat: terlambat?.c || 0,
        ijin: ijin?.c || 0,
        sakit: sakit?.c || 0,
        alpa: alpa?.c || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;