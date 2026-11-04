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
    let { status, note } = req.body || {};
    const STATUS_MAP = {
      in_progress: 'pemeriksaan',
      investigation: 'penyelidikan',
      review: 'pemeriksaan',
      decision: 'putusan',
      completed: 'selesai',
      canceled: 'dibatalkan',
      cancelled: 'dibatalkan'
    };
    if (status && STATUS_MAP[status]) status = STATUS_MAP[status];

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

// POST /api/cases (Buat Kasus Baru)
router.post('/', async (req, res, next) => {
  try {
    const {
      subject_employee_id, employee_id,
      title, description, level = 'ringan',
      priority = 'sedang', status = 'baru',
      pic_id, deadline, report_id,
      category, violation_type
    } = req.body || {};

    const targetEmpId = subject_employee_id || employee_id;
    if (!targetEmpId || !title) {
      return res.status(400).json({ success: false, message: 'Pegawai terlapor dan judul kasus wajib diisi.' });
    }

    const finalCategory = category || violation_type || 'kehadiran';

    // Generate case number: KASUS-YYYY-NNNN
    const year = new Date().getFullYear();
    const rows = await query('SELECT case_no FROM cases WHERE case_no ILIKE ? ORDER BY id DESC LIMIT 1', [`KASUS-${year}-%`]);
    let nextNum = 1;
    if (rows && rows.length > 0 && rows[0].case_no) {
      const parts = rows[0].case_no.split('-');
      const num = parseInt(parts[2], 10);
      if (!Number.isNaN(num)) nextNum = num + 1;
    }
    const case_no = `KASUS-${year}-${String(nextNum).padStart(4, '0')}`;

    const inserted = await query(
      `INSERT INTO cases (case_no, report_id, subject_employee_id, category, title, description, level, priority, status, pic_id, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        case_no,
        report_id || null,
        targetEmpId,
        finalCategory,
        title.trim(),
        description ? description.trim() : 'Kasus baru didaftarkan',
        level,
        priority,
        status,
        pic_id || req.user.id,
        deadline || null
      ]
    );

    // Initial timeline entry
    await query(
      'INSERT INTO case_timeline (case_id, action, actor_id, type) VALUES (?, ?, ?, ?)',
      [inserted[0].id, `Kasus ${case_no} dibuat`, req.user.id, 'case_created']
    );

    res.status(201).json({ success: true, message: 'Kasus berhasil didaftarkan.', data: inserted[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/cases/:id (Update Kasus)
router.put('/:id', async (req, res, next) => {
  try {
    let { title, description, level, priority, status, pic_id, deadline, notes } = req.body || {};
    const STATUS_MAP = {
      in_progress: 'pemeriksaan',
      investigation: 'penyelidikan',
      review: 'pemeriksaan',
      decision: 'putusan',
      completed: 'selesai',
      canceled: 'dibatalkan',
      cancelled: 'dibatalkan'
    };
    if (status && STATUS_MAP[status]) status = STATUS_MAP[status];

    const existing = await query('SELECT * FROM cases WHERE id = ? LIMIT 1', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Kasus tidak ditemukan.' });
    }

    const updated = await query(
      `UPDATE cases
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           level = COALESCE(?, level),
           priority = COALESCE(?, priority),
           status = COALESCE(?, status),
           pic_id = COALESCE(?, pic_id),
           deadline = COALESCE(?, deadline),
           updated_at = NOW()
       WHERE id = ?
       RETURNING *`,
      [title, description, level, priority, status, pic_id, deadline, req.params.id]
    );

    if (notes || status) {
      await query(
        'INSERT INTO case_timeline (case_id, action, actor_id, type) VALUES (?, ?, ?, ?)',
        [req.params.id, notes || `Kasus diperbarui: status ${updated[0].status}`, req.user.id, 'update']
      );
    }

    res.json({ success: true, message: 'Kasus berhasil diperbarui.', data: updated[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/cases/:id/timeline (Tambah catatan kronologi)
router.post('/:id/timeline', async (req, res, next) => {
  try {
    const { action, type = 'note' } = req.body || {};
    if (!action) {
      return res.status(400).json({ success: false, message: 'Catatan aksi wajib diisi.' });
    }

    const inserted = await query(
      'INSERT INTO case_timeline (case_id, action, actor_id, type) VALUES (?, ?, ?, ?) RETURNING *',
      [req.params.id, action.trim(), req.user.id, type]
    );

    res.status(201).json({ success: true, message: 'Kronologi berhasil ditambahkan.', data: inserted[0] });
  } catch (err) {
    next(err);
  }
});

export default router;