require('dotenv').config({ path: __dirname + '/../.env' });
const { Pool } = require('pg');
const fs = require('fs');

function buildSsl() {
  if (process.env.PGSSLROOTCERT) {
    try {
      const ca = fs.readFileSync(process.env.PGSSLROOTCERT, 'utf8');
      return { ca, rejectUnauthorized: true };
    } catch {
      return { rejectUnauthorized: false };
    }
  }
  // ak máš v URL sslmode=require, PG si SSL zapne
  return { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: buildSsl(),
  max: 5
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('drop view if exists mdb.fa_view cascade;');
    await client.query(`
      create view mdb.fa_view as
      with latest as (
        select company, period, max(id) as id
        from import_sessions
        group by company, period
      )
      select
        s.company,
        s.period,
        fa.session_id,
        (fa.raw_json->>'ID')::bigint as id,
        fa.raw_json->>'Cislo'       as fa_number,
        fa.raw_json->>'VarSym'      as var_symbol,
        fa.raw_json->>'SText'       as note,
        nullif(fa.raw_json->>'Datum','')::date    as doc_date,
        nullif(fa.raw_json->>'DatUcP','')::date   as issue_date,
        nullif(fa.raw_json->>'DatSplat','')::date as due_date,
        nullif(fa.raw_json->>'DatLikv','')::date  as paid_date,
        nullif(fa.raw_json->>'DatZdPln','')::date as tax_date,
        case (fa.raw_json->>'RelTpFak')
          when '1'  then 'issued'
          when '11' then 'received'
          else null
        end as direction,
        nullif(fa.raw_json->>'KcCelkem','')::numeric as total,
        nullif(fa.raw_json->>'KcLikv','')::numeric   as paid_total,
        nullif(fa.raw_json->>'KcU','')::numeric      as balance,
        fa.raw_json->>'Firma' as partner_name,
        fa.raw_json->>'ICO'   as ico,
        fa.raw_json->>'DIC'   as dic,
        fa.raw_json->>'ICDPH' as ic_dph,
        fa.raw_json           as data
      from mdb_raw.fa fa
      join latest s on s.id = fa.session_id;
    `);
    console.log('✅ mdb.fa_view created');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => {
  console.error('❌ DDL ERR:', e && e.message ? e.message : e);
  process.exit(1);
});


