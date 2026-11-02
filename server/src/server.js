import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { testConnection } from './config/db.js';

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  // Attempt DB connection — warn but don't crash
  const dbOk = await testConnection();
  if (!dbOk) {
    console.warn('[server] ⚠  Database tidak terhubung. Beberapa endpoint akan error sampai DB aktif.');
  }

  app.listen(PORT, () => {
    console.log(`[server] ✅  E-Disiplin ASN API listening on http://localhost:${PORT}`);
    console.log(`[server]     Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch((err) => {
  console.error('[server] ❌  Fatal error:', err.message);
  process.exit(1);
});