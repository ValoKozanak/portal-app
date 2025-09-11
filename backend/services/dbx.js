const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

const usePg = !!process.env.POSTGRES_URL;
let pgPool = null;
let sqliteDb = null;

function getPgPool() {
  if (!usePg) return null;
  if (pgPool) return pgPool;
  let ssl;
  if (process.env.PGSSLROOTCERT) {
    try {
      const ca = fs.readFileSync(process.env.PGSSLROOTCERT, 'utf8');
      ssl = { ca, rejectUnauthorized: true };
    } catch {
      ssl = { rejectUnauthorized: false };
    }
  } else {
    ssl = { rejectUnauthorized: false };
  }
  pgPool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  return pgPool;
}

function getSqlite() {
  if (sqliteDb) return sqliteDb;
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'databases', 'portal.db');
  sqliteDb = new sqlite3.Database(dbPath);
  return sqliteDb;
}

// Preveď "?" na "$1..$n" pre PG
function toPgParams(sql, params) {
  if (!params || params.length === 0) return { sql, params };
  let idx = 0;
  const newSql = sql.replace(/\?/g, () => '$' + (++idx));
  return { sql: newSql, params };
}

async function query(sql, params = []) {
  if (usePg) {
    const pool = getPgPool();
    const q = toPgParams(sql, params);
    const res = await pool.query(q.sql, q.params);
    return res.rows;
  }
  // SQLite
  const db = getSqlite();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []));
  });
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows && rows[0] ? rows[0] : null;
}

async function execute(sql, params = []) {
  if (usePg) {
    const pool = getPgPool();
    const q = toPgParams(sql, params);
    const res = await pool.query(q.sql, q.params);
    return { rowCount: res.rowCount };
  }
  const db = getSqlite();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

module.exports = { query, queryOne, execute, getPgPool };
