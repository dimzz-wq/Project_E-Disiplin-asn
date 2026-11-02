import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog, getClientIp } from '../middleware/audit.js';

const router = express.Router();
router.use(authenticate);

// GET /api/examinations?status=&case_id=
router.get('/', async (req, res, next) => {
  try {
    const { status, case_id, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * pageSize;

    const conditions = [];
    const params = [];
    if (status) { conditions.push('ex.status = ?'); params.push(status); }
    if (case_id) { conditions.push('ex.case_id = ?'); params.push(case_id); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRows = await query(`SELECT COUNT(*) AS total FROM examinations ex ${where}`, params);
    const total = countRows[0]?.total || 0;

    const rows = await query(
      `SELECT ex.*, e.name AS employee_name, e.nip AS employee_nip,
              u.name AS examiner_name, c.case_no
       FROM examinations ex
       JOIN employees e ON e.id = ex.subject_employee_id
       JOIN users u ON u.id = ex.examiner_id
       JOIN cases c ON c.id = ex.case_id
       ${where}
       ORDER BY ex.schedule_time DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({ success: true, data: rows, pagination: { page: pageNum, limit: pageSize, total, total_pages: Math.ceil(total / pageSize) } });
  } catch (err) {
    next(err);
  }
});

// POST /api/examinations  (schedule an examination)
router.post('/', async (req, res, next) => {
  try {
    const {
      case_id, subject_employee_id, examiner_id,
      schedule_time, venue, notes, status = 'terjadwal',
    } = req.body || {};

    const errors = [];
    if (!case_id) errors.push('case_id wajib diisi');
    if (!subject_employee_id) errors.push('subject_employee_id wajib diisi');
    if (!examiner_id) errors.push('examiner_id wajib diisi');
    if (!schedule_time) errors.push('schedule_time wajib diisi');
    if (!venue || String(venue).trim().length < 3) errors.push('venue minimal 3 karakter');
    if (errors.length) {
      return res.status(400).json({ success: false, message: 'Validasi gagal.', error: errors.join('; ') });
    }

    // Generate exam number: BAP-YYYY-NNNN
    const year = new Date().getFullYear();
    const rows = await query(
      'SELECT exam_no FROM examinations WHERE exam_no ILIKE ? ORDER BY id DESC LIMIT 1',
      [`BAP-${year}-%`]
    );
    let nextNum = 1;
    if (rows && rows.length > 0 && rows[0].exam_no) {
      const num = parseInt(String(rows[0].exam_no).split('-').pop(), 10);
      if (!Number.isNaN(num)) nextNum = num + 1;
    }
    const exam_no = `BAP-${year}-${String(nextNum).padStart(4, '0')}`;

    const result = await query(
      `INSERT INTO examinations
       (exam_no, case_id, subject_employee_id, examiner_id, schedule_time, venue, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
      [exam_no, case_id, subject_employee_id, examiner_id, schedule_time, venue.trim(), status, notes || null]
    );

    const caseRows = await query('SELECT case_no FROM cases WHERE id = ? LIMIT 1', [case_id]);
    await query(
      'INSERT INTO case_timeline (case_id, action, actor_id, type) VALUES (?, ?, ?, ?)',
      [case_id, `Pemeriksaan dijadwalkan (${exam_no}) pada ${schedule_time} di ${venue}`, req.user.id, 'examination']
    );

    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'CREATE',
      detail: `Menjadwalkan pemeriksaan ${exam_no} untuk kasus ${caseRows[0]?.case_no || case_id}`,
      module: 'examinations',
      ipAddress: getClientIp(req),
    });

    const [created] = await query('SELECT * FROM examinations WHERE id = ?', [result[0].id]);
    res.status(201).json({ success: true, message: 'Pemeriksaan berhasil dijadwalkan.', data: created });
  } catch (err) {
    next(err);
  }
});

export default router;