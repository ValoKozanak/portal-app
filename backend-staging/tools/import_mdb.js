#!/usr/bin/env node
/**
 * import_mdb.js
 * Použitie:
 *   node tools/import_mdb.js --company 2 --period 2025 --file /absolutna/cesta/subor.mdb
 */
const fs = require('fs');
const crypto = require('crypto');
const { Client } = require('pg');
const MDBReader = require('mdb-reader').default;

function getEnvUrl() {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL;
}
function qid(s) {
  return '"' + String(s).replace(/"/g, '""') + '"';
}
function sha256File(path) {
  const h = crypto.createHash('sha256');
  const s = fs.createReadStream(path);
  return new Promise((res, rej) => {
    s.on('data', (d) => h.update(d));
    s.on('end', () => res(h.digest('hex')));
    s.on('error', rej);
  });
}

async function ensureRawTable(pg, tableName) {
  await pg.query(`CREATE SCHEMA IF NOT EXISTS mdb_raw`);
  await pg.query(`
    CREATE TABLE IF NOT EXISTS mdb_raw.${qid(tableName)} (
      _company_id  int,
      _period      text,
      _import_id   bigint,
      _loaded_at   timestamptz DEFAULT now(),
      raw_json     jsonb
    )
  `);
}

async function main() {
  // --- parse args ---
  const args = process.argv.slice(2);
  const getArg = (k) => {
    const i = args.indexOf(k);
    if (i >= 0 && i + 1 < args.length) return args[i + 1];
    return null;
  };
  const companyId = Number(getArg('--company'));
  const period    = getArg('--period') || '';
  const filePath  = getArg('--file');

  if (!companyId || !filePath) {
    console.error('Použitie: node tools/import_mdb.js --company <id> --period <YYYY|text> --file </absolutna/cesta.mdb>');
    process.exit(2);
  }
  if (!fs.existsSync(filePath)) {
    console.error('Súbor neexistuje:', filePath);
    process.exit(2);
  }

  const fileHash = await sha256File(filePath);
  const connStr = getEnvUrl();
  if (!connStr) {
    console.error('POSTGRES_URL/DATABASE_URL nie je v env.');
    process.exit(2);
  }

  const pg = new Client({ connectionString: connStr });
  await pg.connect();

  let importId = null;

  try {
    // idempotentná session
    const upsert = await pg.query(
      `
      INSERT INTO import_sessions (company_id, period, source_path, file_hash, status)
      VALUES ($1, $2, $3, $4, 'queued')
      ON CONFLICT (company_id, period, file_hash) DO UPDATE
      SET status='queued', started_at=now(), finished_at=NULL, rows_imported=0, error=NULL
      RETURNING id
      `,
      [companyId, period, filePath, fileHash]
    );
    importId = upsert.rows[0].id;

    await pg.query(`UPDATE import_sessions SET status='running', started_at=now() WHERE id=$1`, [importId]);

    // načítaj MDB
    const buf = fs.readFileSync(filePath);
    const mdb = new MDBReader(buf);
    const names = mdb.getTableNames();

    let totalRows = 0;

    for (const name of names) {
      const table = mdb.getTable(name);
      const rows = table.getData(); // pole objektov

      // priprav raw tabuľku
      await ensureRawTable(pg, name);

      // vlož v batchoch
      const BATCH = 500;
      for (let i = 0; i < rows.length; i += BATCH) {
        const slice = rows.slice(i, i + BATCH);
        const params = [];
        const values = slice
          .map((r, idx) => {
            const p = idx * 4;
            params.push(companyId, String(period), importId, JSON.stringify(r));
            return `($${p + 1}, $${p + 2}, $${p + 3}, now(), $${p + 4})`;
          })
          .join(',');

        await pg.query(
          `INSERT INTO mdb_raw.${qid(name)} (_company_id, _period, _import_id, _loaded_at, raw_json) VALUES ${values}`,
          params
        );
        totalRows += slice.length;
      }

      console.log(`→ ${name}: ${rows.length} riadkov`);
    }

    await pg.query(
      `UPDATE import_sessions
       SET status='completed', rows_imported=$1, finished_at=now()
       WHERE id=$2`,
      [totalRows, importId]
    );
    console.log(`✅ Hotovo. Import #${importId}, riadkov: ${totalRows}`);
  } catch (e) {
    console.error('💥 Chyba importu:', e);
    if (importId) {
      await pg.query(
        `UPDATE import_sessions SET status='failed', error=$1, finished_at=now() WHERE id=$2`,
        [String(e?.message || e), importId]
      );
    }
    process.exit(1);
  } finally {
    await pg.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
