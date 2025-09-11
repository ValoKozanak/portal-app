const dbx = require('./dbx');

function isPg() { return !!process.env.POSTGRES_URL; }

function get(sql, params, cb) {
  if (typeof params === 'function') { cb = params; params = []; }
  dbx.queryOne(sql, params || [])
    .then(row => cb && cb(null, row))
    .catch(err => cb && cb(err));
}

function all(sql, params, cb) {
  if (typeof params === 'function') { cb = params; params = []; }
  dbx.query(sql, params || [])
    .then(rows => cb && cb(null, rows))
    .catch(err => cb && cb(err));
}

function run(sql, params, cb) {
  if (typeof params === 'function') { cb = params; params = []; }
  params = params || [];
  const insert = /^\s*insert/i.test(sql);

  if (isPg() && insert) {
    const hasReturning = /\breturning\b/i.test(sql);
    const sqlWithReturning = hasReturning ? sql : (sql + ' RETURNING id');
    dbx.query(sqlWithReturning, params)
      .then(rows => {
        const ctx = {
          lastID: rows && rows[0] ? rows[0].id : undefined,
          changes: rows ? rows.length : 0,
          rowCount: rows ? rows.length : 0
        };
        if (cb) cb.call(ctx, null);
      })
      .catch(err => cb && cb(err));
  } else {
    dbx.execute(sql, params)
      .then(res => {
        const ctx = {
          lastID: res.lastID,
          changes: typeof res.rowCount === 'number' ? res.rowCount : res.changes,
          rowCount: res.rowCount
        };
        if (cb) cb.call(ctx, null);
      })
      .catch(err => cb && cb(err));
  }
}

module.exports = { get, all, run };
