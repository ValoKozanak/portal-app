// services/pgService.js
const fs = require('fs');
const { Pool } = require('pg');

let singletonPool = null;

function getPgPool() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) return null;
  if (singletonPool) return singletonPool;

  let ssl;
  if (process.env.PGSSLROOTCERT) {
    try {
      const ca = fs.readFileSync(process.env.PGSSLROOTCERT, 'utf8');
      ssl = { ca, rejectUnauthorized: true };
    } catch (_e) {
      // CA sa nepodarilo načítať → explicitne povoliť neoverený cert (staging)
      ssl = { rejectUnauthorized: false };
    }
  } else {
    // žiadny CA → staging/dev (napr. DO/Neon self-signed)
    ssl = { rejectUnauthorized: false };
  }

  singletonPool = new Pool({
    connectionString,
    ssl,
    max: Number(process.env.PG_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  // graceful shutdown
  const shutdown = async (signal) => {
    try { await singletonPool.end(); } finally { process.exit(0); }
  };
  process.once('SIGINT',  shutdown);
  process.once('SIGTERM', shutdown);

  return singletonPool;
}

// Jednoduché zdravie DB
async function checkPg() {
  const pool = getPgPool();
  if (!pool) return { enabled: false, ok: false, error: 'POSTGRES_URL not set' };
  try {
    const result = await pool.query('select now() as now');
    return { enabled: true, ok: true, now: (result.rows?.[0]?.now) || null };
  } catch (error) {
    return { enabled: true, ok: false, error: String(error?.message || error) };
  }
}

// --- NOVÉ: pohodlné API pre routes ---
async function query(text, params) {
  const pool = getPgPool();
  if (!pool) throw new Error('Postgres not configured (POSTGRES_URL missing)');
  // parameterizované dotazy ($1..$n) – bezpečné a odporúčané
  return pool.query(text, params);
}

// ak potrebuješ transakcie: const client = await getClient(); await client.query('BEGIN'); ...
async function getClient() {
  const pool = getPgPool();
  if (!pool) throw new Error('Postgres not configured (POSTGRES_URL missing)');
  return pool.connect();
}

module.exports = { getPgPool, checkPg, query, getClient };
