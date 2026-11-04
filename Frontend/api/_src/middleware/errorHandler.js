/**
 * Global error handler middleware.
 * Returns a standard JSON format: { success: false, message, error? }
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan pada server.';

  // PostgreSQL constraint errors
  if (err.code === '23505') {
    // unique_violation
    return res.status(409).json({ success: false, message: 'Data sudah ada (duplikat).', error: err.detail });
  }
  if (err.code === '23503') {
    // foreign_key_violation
    return res.status(400).json({ success: false, message: 'Data referensi tidak ditemukan.', error: err.detail });
  }
  if (err.code === '23514') {
    // check_violation (pengganti ENUM MySQL)
    return res.status(400).json({ success: false, message: 'Nilai tidak valid untuk kolom tersebut.', error: err.detail });
  }

  // Multer / file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'Ukuran file terlalu besar.' });
  }

  // Validation error
  if (err.name === 'ValidationError' && Array.isArray(err.errors)) {
    return res.status(400).json({ success: false, message: 'Validasi gagal.', error: err.errors.map((e) => e.msg).join(', ') });
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { error: err.stack } : {}),
  });
}

/** 404 handler for unmatched routes */
export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route tidak ditemukan: ${req.method} ${req.originalUrl}` });
}