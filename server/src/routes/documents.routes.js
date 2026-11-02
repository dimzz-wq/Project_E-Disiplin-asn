import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog, getClientIp } from '../middleware/audit.js';

const router = express.Router();
router.use(authenticate);

// Ensure uploads folder exists
const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /api/documents/upload (multipart with file, optional case_id, report_id, name)
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan dalam request.' });
    }

    const { case_id, report_id, name } = req.body;
    const docName = name || req.file.originalname;

    const result = await query(
      `INSERT INTO documents (case_id, report_id, name, original_name, file_path, file_size, mime_type, uploader_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
      [
        case_id || null,
        report_id || null,
        docName,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        req.user.id,
      ]
    );

    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'UPLOAD_DOCUMENT',
      detail: `Upload file ${req.file.originalname} (id: ${result[0].id})`,
      module: 'documents',
      ipAddress: getClientIp(req),
    });

    const [created] = await query('SELECT * FROM documents WHERE id = ?', [result[0].id]);
    res.status(201).json({ success: true, message: 'File berhasil diupload.', data: created });
  } catch (err) {
    next(err);
  }
});

// GET /api/documents/:id (download / get metadata)
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM documents WHERE id = ? LIMIT 1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan.' });
    }
    const doc = rows[0];
    if (req.query.download === '1') {
      return res.download(doc.file_path, doc.original_name);
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

export default router;