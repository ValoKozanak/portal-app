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
      ssl = { rejectUnauthorized: false };
    }
  } else {
    ssl = { rejectUnauthorized: false };
  }

  singletonPool = new Pool({
    connectionString,
    ssl,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  return singletonPool;
}

async function checkPg() {
  const pool = getPgPool();
  if (!pool) return { enabled: false, ok: false, error: 'POSTGRES_URL not set' };
  try {
    const result = await pool.query('select now() as now');
    return { enabled: true, ok: true, now: (result.rows && result.rows[0] && result.rows[0].now) || null };
  } catch (error) {
    return { enabled: true, ok: false, error: String(error && error.message ? error.message : error) };
  }
}

module.exports = { getPgPool, checkPg };
