const dbx = require('./dbx');

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
  const isInsert = /^\s*insert/i.test(String(sql));

  if (isInsert && !/\breturning\b/i.test(String(sql))) {
    const wrapped = `${sql} RETURNING id`;
    dbx.query(wrapped, params)
      .then(rows => {
        const ctx = { lastID: rows && rows[0] ? rows[0].id : undefined, changes: rows ? rows.length : 0 };
        if (cb) cb.call(ctx, null);
      })
      .catch(err => cb && cb(err));
    return;
  }

  dbx.execute(sql, params)
    .then(res => {
      const ctx = { lastID: undefined, changes: res.rowCount };
      if (cb) cb.call(ctx, null);
    })
    .catch(err => cb && cb(err));
}

module.exports = { get, all, run };


