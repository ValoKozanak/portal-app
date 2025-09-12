const fs = require('fs');
const { Pool } = require('pg');

let singletonPool = null;

function getPgPool() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('POSTGRES_URL is not set');
  }
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
    connectionTimeoutMillis: 5000
  });
  return singletonPool;
}

function toPgParams(sql, params) {
  if (!params || params.length === 0) return { sql, params: [] };
  let idx = 0;
  const newSql = String(sql).replace(/\?/g, () => '$' + (++idx));
  return { sql: newSql, params };
}

async function query(sql, params = []) {
  const pool = getPgPool();
  const q = toPgParams(sql, params);
  const res = await pool.query(q.sql, q.params);
  return res.rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows && rows[0] ? rows[0] : null;
}

async function execute(sql, params = []) {
  const pool = getPgPool();
  const q = toPgParams(sql, params);
  const res = await pool.query(q.sql, q.params);
  return { rowCount: res.rowCount };
}

module.exports = { getPgPool, query, queryOne, execute, toPgParams };


