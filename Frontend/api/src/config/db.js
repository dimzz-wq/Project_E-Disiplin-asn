import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { types } = pg;

// ── Type parsers ─────────────────────────────────────────────────────────────
// MySQL mengembalikan COUNT(*) sebagai number, PostgreSQL mengembalikan string.
types.setTypeParser(20, (v) => Number(v)); // int8  (COUNT(*), id besar)
types.setTypeParser(1700, (v) => Number(v)); // numeric (EXTRACT(...))

// MySQL (dengan timezone +07:00) mengembalikan kolom DATE sebagai Date pada
// tengah malam WIB. Samakan hasilnya agar format JSON tidak berubah di frontend.
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
types.setTypeParser(1082, (v) => {
  if (!v) return v;
  const [y, m, d] = v.split('-').map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return v;
  return new Date(Date.UTC(y, m - 1, d) - WIB_OFFSET_MS);
});

// ── Pool ─────────────────────────────────────────────────────────────────────
const sslConfig = process.env.DB_SSL === 'false'
  ? false
  : (process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL)
    ? { rejectUnauthorized: false }
    : false;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'edisiplin_asn',
      ssl: sslConfig,
    };

const pool = new pg.Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // Sesuaikan sesi dengan timezone lama MySQL (Asia/Jakarta / UTC+07:00),
  // agar literal tanggal & NOW() diinterpretasikan sama seperti sebelumnya.
  options: '-c TimeZone=Asia/Jakarta',
});

// Graceful error handling: log DB errors once they bubble up.
pool.on('connect', () => {
  console.log('[db] Connected to PostgreSQL');
});
pool.on('error', (err) => {
  console.error('[db] Idle client error:', err.message);
});

/**
 * Translate placeholder gaya MySQL ("?") ke placeholder PostgreSQL ($1, $2, …).
 * String literal ('…') dan identifier ber-quote ("…") dilewati agar tanda ?
 * di dalamnya tidak dianggap placeholder.
 * @param {string} sql
 * @returns {{ text: string, count: number }}
 */
export function toPostgresPlaceholders(sql) {
  let text = '';
  let count = 0;
  let i = 0;
  let quote = null; // null | "'" | '"'

  while (i < sql.length) {
    const ch = sql[i];

    if (quote) {
      text += ch;
      if (ch === quote) {
        // '' atau "" adalah escape dari quote itu sendiri
        if (sql[i + 1] === quote) {
          text += sql[i + 1];
          i += 2;
          continue;
        }
        quote = null;
      }
      i += 1;
      continue;
    }

    if (ch === "'" || ch === '"') {
      quote = ch;
      text += ch;
      i += 1;
      continue;
    }

    if (ch === '?') {
      count += 1;
      text += `$${count}`;
      i += 1;
      continue;
    }

    text += ch;
    i += 1;
  }

  return { text, count };
}

/**
 * Query helper — runs a SQL statement with params and returns the rows.
 * Tetap menerima placeholder "?" seperti kode lama, dikonversi ke $1..$n.
 * @param {string} sql
 * @param {Array} params
 */
export async function query(sql, params = []) {
  const { text, count } = toPostgresPlaceholders(sql);
  if (count !== params.length) {
    throw new Error(
      `[db] Parameter mismatch: SQL membutuhkan ${count} parameter, diberikan ${params.length}. SQL: ${sql.replace(/\s+/g, ' ').slice(0, 200)}`
    );
  }
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (err) {
    console.error('[db] Query error:', err.message);
    throw err;
  }
}

export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('[db] Connection OK');
    client.release();
    return true;
  } catch (err) {
    console.error('[db] Connection FAILED:', err.message);
    return false;
  }
}

export default pool;
