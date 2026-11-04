import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog, getClientIp } from '../middleware/audit.js';

const router = express.Router();
router.use(authenticate);

const CASE_STATUSES = ['baru', 'penyelidikan', 'pemeriksaan', 'sidang_kode_etik', 'putusan', 'selesai', 'dibatalkan'];

// GET /api/cases?status=&level=&priority=&search=
router.get('/', async (req, res, next) => {
  try {
    const { status, level, priority, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * pageSize;

    const conditions = [];
    const params = [];

    if (status) { conditions.push('c.status = ?'); params.push(status); }
    if (level) { conditions.push('c.level = ?'); params.push(level); }
    if (priority) { conditions.push('c.priority = ?'); params.push(priority); }
    if (search) {
      conditions.push('(c.case_no ILIKE ? OR c.title ILIKE ? OR e.name ILIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRows = await query(
      `SELECT COUNT(*) AS total FROM cases c LEFT JOIN employees e ON e.id = c.subject_employee_id ${where}`,
      params
    );
    const total = countRows[0]?.total || 0;

    const rows = await query(
      `SELECT c.*, e.name AS employee_name, e.nip AS employee_nip,
              ou.name AS unit_name, u.name AS pic_name
       FROM cases c
       LEFT JOIN employees e ON e.id = c.subject_employee_id
       LEFT JOIN org_units ou ON ou.id = e.unit_id
       LEFT JOIN users u ON u.id = c.pic_id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({ success: true, data: rows, pagination: { page: pageNum, limit: pageSize, total, total_pages: Math.ceil(total / pageSize) } });
  } catch (err) {
    next(err);
  }
});

// GET /api/cases/:id (detail with timeline + documents)
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT c.*, e.name AS employee_name, e.nip AS employee_nip, e.position AS employee_position,
              ou.name AS unit_name, u.name AS pic_name, r.report_no
       FROM cases c
       LEFT JOIN employees e ON e.id = c.subject_employee_id
       LEFT JOIN org_units ou ON ou.id = e.unit_id
       LEFT JOIN users u ON u.id = c.pic_id
       LEFT JOIN reports r ON r.id = c.report_id
       WHERE c.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kasus tidak ditemukan.' });
    }

    const timeline = await query(
      `SELECT t.*, u.name AS actor_name
       FROM case_timeline t
       LEFT JOIN users u ON u.id = t.actor_id
       WHERE t.case_id = ?
       ORDER BY t.created_at ASC`,
      [req.params.id]
    );

    const documents = await query(
      `SELECT d.*, u.name AS uploader_name
       FROM documents d
       LEFT JOIN users u ON u.id = d.uploader_id
       WHERE d.case_id = ?
       ORDER BY d.created_at DESC`,
      [req.params.id]
    );

    const examinations = await query(
      `SELECT ex.*, u.name AS examiner_name
       FROM examinations ex
       LEFT JOIN users u ON u.id = ex.examiner_id
       WHERE ex.case_id = ?
       ORDER BY ex.schedule_time DESC`,
      [req.params.id]
    );

    const decisions = await query(
      `SELECT d.*, u.name AS issued_by_name
       FROM decisions d
       LEFT JOIN users u ON u.id = d.issued_by_id
       WHERE d.case_id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...rows[0],
        timeline,
        documents,
        examinations,
        decisions,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/cases/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, note } = req.body || {};
    if (!status || !CASE_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Status tidak valid. Pilihan: ${CASE_STATUSES.join(', ')}` });
    }

    const rows = await query('SELECT * FROM cases WHERE id = ? LIMIT 1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kasus tidak ditemukan.' });
    }
    const currentCase = rows[0];
    const prevStatus = currentCase.status;

    await query('UPDATE cases SET status = ? WHERE id = ?', [status, req.params.id]);

    const actionText = `Status diubah dari ${prevStatus} menjadi ${status}${note ? ` (Catatan: ${note})` : ''}`;
    await query(
      'INSERT INTO case_timeline (case_id, action, actor_id, type) VALUES (?, ?, ?, ?)',
      [req.params.id, actionText, req.user.id, 'status_change']
    );

    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'UPDATE_STATUS',
      detail: `Kasus ${currentCase.case_no}: status diubah dari ${prevStatus} ke ${status}`,
      module: 'cases',
      ipAddress: getClientIp(req),
    });

    res.json({ success: true, message: 'Status kasus berhasil diperbarui.', data: { id: req.params.id, status } });
  } catch (err) {
    next(err);
  }
});

export default router;