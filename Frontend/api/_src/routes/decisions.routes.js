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

// POST /api/decisions (Terbitkan SK Hukuman Disiplin)
router.post('/', async (req, res, next) => {
  try {
    const {
      case_id,
      employee_id,
      decision_number,
      sk_no,
      punishment_type,
      penalty_type,
      severity,
      penalty_level,
      effective_date,
      status = 'ditetapkan',
      file_path,
      description
    } = req.body || {};

    if (!case_id) {
      return res.status(400).json({ success: false, message: 'case_id wajib diisi.' });
    }

    // Lookup case
    const caseRows = await query('SELECT id, case_no, subject_employee_id FROM cases WHERE id = ? LIMIT 1', [case_id]);
    if (caseRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kasus tidak ditemukan.' });
    }
    const currentCase = caseRows[0];
    const targetEmpId = employee_id || currentCase.subject_employee_id;

    const pType = penalty_type || punishment_type || 'Teguran Lisan / Tertulis';
    let pLevel = (penalty_level || severity || 'ringan').toLowerCase();
    if (!['ringan', 'sedang', 'berat'].includes(pLevel)) {
      pLevel = 'ringan';
    }

    // Generate sk_no if not provided
    const year = new Date().getFullYear();
    let finalSkNo = sk_no || decision_number;
    if (!finalSkNo) {
      const rows = await query('SELECT sk_no FROM decisions WHERE sk_no ILIKE ? ORDER BY id DESC LIMIT 1', [`SK-${year}-%`]);
      let nextNum = 1;
      if (rows && rows.length > 0 && rows[0].sk_no) {
        const parts = rows[0].sk_no.split('-');
        const num = parseInt(parts[2], 10);
        if (!Number.isNaN(num)) nextNum = num + 1;
      }
      finalSkNo = `SK-${year}-${String(nextNum).padStart(4, '0')}`;
    }

    const effDate = effective_date || new Date().toISOString().split('T')[0];

    const inserted = await query(
      `INSERT INTO decisions (sk_no, case_id, employee_id, penalty_type, penalty_level, effective_date, issued_by_id, status, file_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        finalSkNo,
        case_id,
        targetEmpId,
        pType,
        pLevel,
        effDate,
        req.user?.id || null,
        status,
        file_path || null
      ]
    );

    // Update case status to 'putusan' or 'selesai'
    await query("UPDATE cases SET status = 'putusan' WHERE id = ?", [case_id]);

    // Add timeline
    await query(
      'INSERT INTO case_timeline (case_id, action, actor_id, type) VALUES (?, ?, ?, ?)',
      [case_id, `SK Hukuman Disiplin diterbitkan: ${finalSkNo} (${pType})`, req.user?.id || null, 'decision']
    );

    res.status(201).json({
      success: true,
      message: 'Surat Keputusan berhasil diterbitkan.',
      data: inserted[0]
    });
  } catch (err) {
    next(err);
  }
});

export default router;