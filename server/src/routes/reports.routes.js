import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog, getClientIp } from '../middleware/audit.js';

const router = express.Router();
router.use(authenticate);

const CATEGORIES = ['kehadiran', 'kinerja', 'kode_etik', 'pidana', 'penyalahgunaan_wewenang', 'lainnya'];
const PRIORITIES = ['rendah', 'sedang', 'tinggi', 'kritis'];

// GET /api/reports?status=&category=&priority=&employee_id=&search=
router.get('/', async (req, res, next) => {
  try {
    const { status, category, priority, employee_id, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * pageSize;

    const conditions = [];
    const params = [];

    if (status) { conditions.push('r.status = ?'); params.push(status); }
    if (category) { conditions.push('r.category = ?'); params.push(category); }
    if (priority) { conditions.push('r.priority = ?'); params.push(priority); }
    if (employee_id) { conditions.push('r.reported_employee_id = ?'); params.push(employee_id); }
    if (search) {
      conditions.push('(r.title ILIKE ? OR r.report_no ILIKE ? OR e.name ILIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRows = await query(
      `SELECT COUNT(*) AS total FROM reports r LEFT JOIN employees e ON e.id = r.reported_employee_id ${where}`,
      params
    );
    const total = countRows[0]?.total || 0;

    const rows = await query(
      `SELECT r.*, e.name AS employee_name, e.nip AS employee_nip, u.name AS reporter_name
       FROM reports r
       LEFT JOIN employees e ON e.id = r.reported_employee_id
       LEFT JOIN users u ON u.id = r.reporter_id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({ success: true, data: rows, pagination: { page: pageNum, limit: pageSize, total, total_pages: Math.ceil(total / pageSize) } });
  } catch (err) {
    next(err);
  }
});

// POST /api/reports  (create)
router.post('/', async (req, res, next) => {
  try {
    const {
      reported_employee_id,
      category,
      title,
      description,
      incident_date,
      incident_location,
      priority = 'sedang',
    } = req.body || {};

    const errors = [];
    if (!reported_employee_id) errors.push('reported_employee_id wajib diisi');
    if (!category || !CATEGORIES.includes(category)) errors.push(`category harus salah satu dari: ${CATEGORIES.join(', ')}`);
    if (!title || title.trim().length < 3) errors.push('title minimal 3 karakter');
    if (!description || description.trim().length < 5) errors.push('description minimal 5 karakter');
    if (priority && !PRIORITIES.includes(priority)) errors.push(`priority harus salah satu dari: ${PRIORITIES.join(', ')}`);
    if (errors.length) {
      return res.status(400).json({ success: false, message: 'Validasi gagal.', error: errors.join('; ') });
    }

    // Verify employee exists
    const emp = await query('SELECT id, name FROM employees WHERE id = ? LIMIT 1', [reported_employee_id]);
    if (emp.length === 0) {
      return res.status(404).json({ success: false, message: 'Pegawai yang dilaporkan tidak ditemukan.' });
    }

    // Generate report number: LAP-YYYY-NNNN
    const year = new Date().getFullYear();
    const rows = await query(
      "SELECT report_no FROM reports WHERE report_no ILIKE ? ORDER BY id DESC LIMIT 1",
      [`LAP-${year}-%`]
    );
    let nextNum = 1;
    if (rows && rows.length > 0 && rows[0].report_no) {
      const parts = rows[0].report_no.split('-');
      const num = parseInt(parts[2], 10);
      if (!Number.isNaN(num)) nextNum = num + 1;
    }
    const report_no = `LAP-${year}-${String(nextNum).padStart(4, '0')}`;

    const result = await query(
      `INSERT INTO reports
       (report_no, reporter_id, reported_employee_id, category, title, description, incident_date, incident_location, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'diajukan')
       RETURNING id`,
      [
        report_no,
        req.user.id,
        reported_employee_id,
        category,
        title.trim(),
        description.trim(),
        incident_date || null,
        incident_location || null,
        priority,
      ]
    );

    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'CREATE',
      detail: `Membuat laporan ${report_no} atas nama ${emp[0].name}`,
      module: 'reports',
      ipAddress: getClientIp(req),
    });

    const [created] = await query('SELECT * FROM reports WHERE id = ?', [result[0].id]);
    res.status(201).json({ success: true, message: 'Laporan berhasil dibuat.', data: created });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/:id
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT r.*, e.name AS employee_name, e.nip AS employee_nip, e.unit_id,
              ou.name AS unit_name, u.name AS reporter_name
       FROM reports r
       LEFT JOIN employees e ON e.id = r.reported_employee_id
       LEFT JOIN org_units ou ON ou.id = e.unit_id
       LEFT JOIN users u ON u.id = r.reporter_id
       WHERE r.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
    }

    const documents = await query('SELECT * FROM documents WHERE report_id = ? ORDER BY created_at DESC', [req.params.id]);
    const linkedCases = await query('SELECT id, case_no, title, status FROM cases WHERE report_id = ?', [req.params.id]);

    res.json({ success: true, data: { ...rows[0], documents, linked_cases: linkedCases } });
  } catch (err) {
    next(err);
  }
});

export default router;