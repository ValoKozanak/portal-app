// services/pgService.js
// CommonJS verzia – drop-in náhrada za tvoju pôvodnú implementáciu
const fs = require('fs');
const { Pool } = require('pg');

let singletonPool = null;

function buildSslConfig() {
  // Preferuj dôveryhodnú CA, ak je dostupná (napr. /etc/ssl/certs/ca-bundle.crt)
  if (process.env.PGSSLROOTCERT) {
    try {
      const ca = fs.readFileSync(process.env.PGSSLROOTCERT, 'utf8');
      return { ca, rejectUnauthorized: true };
    } catch {
      // Fallback pre staging/dev (self-signed)
      return { rejectUnauthorized: false };
    }
  }
  // Ak connection string už obsahuje sslmode=require, SSL zapne pg automaticky,
  // no explicitná konfigurácia nevadí:
  return { rejectUnauthorized: false };
}

function getPgPool() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) return null;
  if (singletonPool) return singletonPool;

  const ssl = buildSslConfig();

  singletonPool = new Pool({
    connectionString,
    ssl,
    max: Number(process.env.PG_POOL_MAX || 10),
    min: Number(process.env.PG_POOL_MIN || 0),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 5_000),
    keepAlive: true,
    allowExitOnIdle: false,
    application_name: process.env.PG_APP_NAME || 'portal-backend',
  });

  // Logni pool-level chyby (napr. resetnuté idle connections)
  singletonPool.on('error', (err) => {
    console.error('[pg] Pool error:', err?.message || err);
  });

  // Inicializačné SET-y na každom novom spojení
  singletonPool.on('connect', async (client) => {
    try {
      const statementTimeout = Number(process.env.PG_STATEMENT_TIMEOUT_MS || 30_000);
      const idleTxnTimeout  = Number(process.env.PG_IDLE_TXN_TIMEOUT_MS || 30_000);
      await client.query(`SET statement_timeout = ${statementTimeout}`);
      await client.query(`SET idle_in_transaction_session_timeout = ${idleTxnTimeout}`);
    } catch (e) {
      console.warn('[pg] Failed to run SET statements:', e?.message || e);
    }
  });

  // Graceful shutdown (vhodné pod systemd/PM2)
  const shutdown = async () => {
    try { await singletonPool.end(); }
    finally { process.exit(0); }
  };
  if (!process.env.PG_DISABLE_SIGNAL_HANDLERS) {
    process.once('SIGINT',  shutdown);
    process.once('SIGTERM', shutdown);
  }

  return singletonPool;
}

// Jednoduché zdravie DB (na /api/health)
async function checkPg() {
  const pool = getPgPool();
  if (!pool) return { enabled: false, ok: false, error: 'POSTGRES_URL not set' };
  try {
    const { rows } = await pool.query('select now() as now, version() as version');
    return {
      enabled: true,
      ok: true,
      now: rows?.[0]?.now || null,
      version: rows?.[0]?.version || null
    };
  } catch (error) {
    return { enabled: true, ok: false, error: String(error?.message || error) };
  }
}

// Pohodlné API pre routes – parameterizované dotazy
async function query(text, params) {
  const pool = getPgPool();
  if (!pool) throw new Error('Postgres not configured (POSTGRES_URL missing)');
  return pool.query(text, params);
}

// Transakcie: const c = await getClient(); await c.query('BEGIN'); ...
async function getClient() {
  const pool = getPgPool();
  if (!pool) throw new Error('Postgres not configured (POSTGRES_URL missing)');
  return pool.connect();
}

// Umožniť korektné ukončenie poolu (testy, skripty, migrácie)
async function endPgPool() {
  if (singletonPool) {
    await singletonPool.end();
    singletonPool = null;
  }
}

module.exports = { getPgPool, checkPg, query, getClient, endPgPool };
