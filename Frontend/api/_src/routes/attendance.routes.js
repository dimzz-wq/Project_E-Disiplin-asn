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

// POST /api/attendance (Catat Presensi / Check-in)
router.post('/', async (req, res, next) => {
  try {
    let { employee_id, date, status = 'hadir', time_in, check_in, time_out, notes, note } = req.body || {};
    const empId = employee_id || req.user.id;
    const attDate = date || new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0];
    const finalNote = note || notes || 'Presensi Mandiri ASN';

    let finalStatus = (status || 'hadir').toLowerCase();
    if (finalStatus === 'present') finalStatus = 'hadir';
    if (finalStatus === 'late') finalStatus = 'terlambat';
    if (finalStatus === 'permission') finalStatus = 'ijin';
    if (finalStatus === 'sick') finalStatus = 'sakit';
    if (!['hadir', 'terlambat', 'ijin', 'sakit', 'alpa'].includes(finalStatus)) {
      finalStatus = 'hadir';
    }

    const checkInTime = time_in || check_in || nowTime;

    // Check if attendance already exists for today
    const existing = await query('SELECT id FROM attendance WHERE employee_id = ? AND date = ? LIMIT 1', [empId, attDate]);
    if (existing.length > 0) {
      const updated = await query(
        `UPDATE attendance
         SET status = COALESCE(?, status),
             time_out = COALESCE(?, time_out),
             note = COALESCE(?, note)
         WHERE id = ?
         RETURNING *`,
        [finalStatus, time_out || nowTime, finalNote, existing[0].id]
      );
      return res.json({ success: true, message: 'Presensi berhasil diperbarui.', data: updated[0] });
    }

    const inserted = await query(
      `INSERT INTO attendance (employee_id, date, status, time_in, time_out, note)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [empId, attDate, finalStatus, checkInTime, time_out || null, finalNote]
    );

    res.status(201).json({ success: true, message: 'Presensi berhasil dicatat.', data: inserted[0] });
  } catch (err) {
    next(err);
  }
});

export default router;