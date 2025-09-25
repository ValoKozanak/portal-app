const express = require('express');
const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = Router();
const { authenticateToken } = require('./auth');
const db = require('../services/dbCompat');
const dropboxService = require('../services/dropboxService');
const spacesService = require('../services/spacesService');

/* ===========================
   Helpers
=========================== */

// Admin kontrola (role admin)
function ensureAdmin(req, res, next) {
  try {
    if (req.user && (req.user.role === 'admin' || req.user.isAdmin === true)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  } catch {
    return res.status(403).json({ error: 'Forbidden' });
  }
}

// Bezpečné I/O cesty
function ensureCompanyDir(companyId) {
  const id = String(companyId);
  if (!/^\d+$/.test(id)) {
    const err = new Error('Invalid companyId');
    err.status = 400;
    throw err;
  }
  const base = path.join(__dirname, '..', 'uploads', 'mdb', id);
  fs.mkdirSync(base, { recursive: true });
  return base;
}
function safeName(name) {
  const base = path.basename(String(name || ''));
  if (!base || base === '.' || base === '..') {
    const err = new Error('Invalid filename');
    err.status = 400;
    throw err;
  }
  return base;
}

// MDB reader helpers
function openMdbReader(mdbPath) {
  const MDBLib = require('mdb-reader');
  const MDBReader = MDBLib && MDBLib.default ? MDBLib.default : MDBLib;
  const buffer = fs.readFileSync(mdbPath);
  return new MDBReader(buffer);
}
function findTableCaseInsensitive(dbReader, ...nameCandidates) {
  const names = dbReader.getTableNames();
  const lower = names.map(n => n.toLowerCase());
  for (const candidate of nameCandidates) {
    const idx = lower.indexOf(String(candidate).toLowerCase());
    if (idx >= 0) return dbReader.getTable(names[idx]);
  }
  return null;
}

// Lokálne MDB – preferuj upload v uploads/mdb/<ICO> a ak nie je, hľadaj v zalohy/<rok>/<ICO_rok>/<ICO_rok>.mdb
function findLatestLocalMdb(companyIco, preferredYear) {
  const ico = String(companyIco);
  const rootDir = path.join(__dirname, '..', 'uploads', 'mdb', ico);
  if (!fs.existsSync(rootDir)) return null;

  if (preferredYear) {
    // súbory v tvojom prostredí sú typu: ICO_TIMESTAMP_ICO_ROK.mdb – skús presný pattern, inak padni na “najnovší”
    const exactCandidates = fs.readdirSync(rootDir)
      .filter(f => /\.mdb$/i.test(f) && f.includes(`_${preferredYear}.mdb`))
      .map(f => {
        const full = path.join(rootDir, f);
        const st = fs.statSync(full);
        return { full, mtime: st.mtime };
      })
      .sort((a,b) => b.mtime - a.mtime);
    if (exactCandidates[0]) return exactCandidates[0].full;
  }

  const all = fs.readdirSync(rootDir, { withFileTypes: true })
    .filter(e => e.isFile() && /\.mdb$/i.test(e.name))
    .map(e => {
      const full = path.join(rootDir, e.name);
      const st = fs.statSync(full);
      return { full, mtime: st.mtime };
    })
    .sort((a,b) => b.mtime - a.mtime);

  return all[0]?.full || null;
}

async function getMDBFilePath(companyIco, year) {
  const localLatest = findLatestLocalMdb(companyIco, year);
  if (localLatest && fs.existsSync(localLatest)) {
    return { path: localLatest, isTemp: false };
  }

  if (year) {
    const p = path.join(__dirname, '..', 'zalohy', String(year), `${companyIco}_${year}`, `${companyIco}_${year}.mdb`);
    if (fs.existsSync(p)) return { path: p, isTemp: false };
  }

  const zalohyRoot = path.join(__dirname, '..', 'zalohy');
  if (fs.existsSync(zalohyRoot)) {
    const years = fs.readdirSync(zalohyRoot).filter(d => /^(19|20)\d{2}$/.test(d)).sort((a,b)=> parseInt(b)-parseInt(a));
    for (const y of years) {
      const p = path.join(zalohyRoot, y, `${companyIco}_${y}`, `${companyIco}_${y}.mdb`);
      if (fs.existsSync(p)) return { path: p, isTemp: false };
    }
  }

  throw new Error('MDB súbor nebol nájdený');
}

// Multer pre .mdb upload
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const dest = ensureCompanyDir(req.params.companyId);
        cb(null, dest);
      } catch (e) { cb(e); }
    },
    filename: (req, file, cb) => {
      const companyId = String(req.params.companyId || 'unknown');
      const ts = Date.now();
      const safe = path.basename(file.originalname).replace(/\s+/g, '_');
      cb(null, `${companyId}_${ts}_${safe}`);
    }
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/\.mdb$/i.test(file.originalname)) {
      const err = new Error('Only .mdb allowed');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  }
});

/* ===========================
   Sanity / Test endpoints
=========================== */

router.get('/simple-test', (_req, res) => {
  res.json({ message: 'Accounting routes fungujú!', timestamp: new Date().toISOString() });
});
router.get('/dropbox-test-simple', (_req, res) => {
  try {
    res.json({
      message: 'Dropbox endpoint funguje!',
      isInitialized: dropboxService.isInitialized(),
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.get('/test-dropbox-token', (_req, res) => {
  const token = process.env.DROPBOX_ACCESS_TOKEN;
  res.json({
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    tokenStart: token ? token.substring(0, 10) + '...' : 'none',
    message: token ? 'Token je nastavený' : 'Token nie je nastavený'
  });
});

/* ===========================
   1) Nastavenia účtovníctva
=========================== */

router.get('/settings/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  db.get(`SELECT * FROM accounting_settings WHERE company_id = ?`, [companyId], (err, settings) => {
    if (err) {
      console.error('Chyba pri načítaní nastavení účtovníctva:', err);
      return res.status(500).json({ error: 'Chyba pri načítaní nastavení' });
    }
    res.json(settings || {
      company_id: parseInt(companyId, 10),
      pohoda_enabled: false,
      auto_sync: false,
      sync_frequency: 'daily'
    });
  });
});

router.post('/settings/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;

  if (!['admin', 'company', 'user'].includes(String(req.user?.role))) {
    return res.status(403).json({ error: 'Prístup zamietnutý. Len admin, firma alebo používateľ môže upravovať nastavenia.' });
  }

  const {
    pohoda_enabled,
    pohoda_url,
    pohoda_username,
    pohoda_password,
    pohoda_ico,
    pohoda_year,
    auto_sync,
    sync_frequency
  } = req.body;

  db.run(`
    INSERT OR REPLACE INTO accounting_settings (
      company_id, pohoda_enabled, pohoda_url, pohoda_username, pohoda_password,
      pohoda_ico, pohoda_year, auto_sync, sync_frequency, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [companyId, pohoda_enabled, pohoda_url, pohoda_username, pohoda_password,
      pohoda_ico, pohoda_year, auto_sync, sync_frequency], function(err) {
    if (err) {
      console.error('Chyba pri ukladaní nastavení účtovníctva:', err);
      return res.status(500).json({ error: 'Chyba pri ukladaní nastavení' });
    }
    res.json({ success: true, id: this.lastID });
  });
});

/* ===========================
   2) Štatistiky / Analýzy
=========================== */

// pUD summary z MDB (rýchly súčet)
router.get('/pud-summary/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });

    const mdbInfo = await getMDBFilePath(company.ico);
    const mdb = openMdbReader(mdbInfo.path);
    const pudTable = findTableCaseInsensitive(mdb, 'pUD', 'PUD', 'pud');
    if (!pudTable) return res.json({ total_kc: 0, total_count: 0 });

    const rows = pudTable.getData({ rowOffset: 0 });
    let total_kc = 0;
    for (const r of rows) {
      total_kc += Number(r.Kc || r.kc || 0);
    }
    res.json({ total_kc, total_count: rows.length });
  } catch (e) {
    console.error('Chyba pri získavaní súhrnu pUD:', e);
    res.status(500).json({ error: 'Chyba pri získavaní súhrnu pUD' });
  }
});

// Detailná analýza pUD (MDB)
router.get('/financial-analysis/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { dateFrom, dateTo } = req.query;
  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });

    const mdbInfo = await getMDBFilePath(company.ico);
    const mdb = openMdbReader(mdbInfo.path);
    const pud = findTableCaseInsensitive(mdb, 'pUD', 'pud', 'PUD');
    const pos = findTableCaseInsensitive(mdb, 'pOS', 'pos', 'POS');
    if (!pud) {
      return res.json({
        expenses: { total: 0, count: 0, details: [] },
        revenue: { total: 0, count: 0, details: [] },
        profit: 0, isProfit: true,
        filters: { dateFrom: dateFrom || null, dateTo: dateTo || null }
      });
    }

    const rows = pud.getData({ rowOffset: 0 });
    const posRows = pos ? pos.getData({ rowOffset: 0 }) : [];
    const nameBy = new Map();
    for (const r of posRows) {
      const acc = r.Ucet || r.ucet || r.AUcet || r.auct || r.UMD || r.UD;
      if (acc) nameBy.set(String(acc), r.Nazev || r.nazev || r.SText || r.stext || '');
    }

    const inRange = d => {
      if (!dateFrom && !dateTo) return true;
      if (!d) return false;
      const ds = new Date(d);
      if (Number.isNaN(ds.getTime())) return false;
      if (dateFrom && ds < new Date(dateFrom)) return false;
      if (dateTo && ds > new Date(dateTo)) return false;
      return true;
    };

    const expMap = new Map(); // 5xx: MD +, D -
    const revMap = new Map(); // 6xx: D +,  MD -
    for (const r of rows) {
      const kc = Number(r.Kc || r.kc || 0);
      const datum = r.Datum || r.datum;
      if (!inRange(datum)) continue;

      const umd = String(r.UMD || r.umd || '');
      const ud = String(r.UD || r.ud || '');

      if (umd.startsWith('5')) {
        const prev = expMap.get(umd) || { total_amount: 0, transaction_count: 0 };
        prev.total_amount += kc; prev.transaction_count += 1; expMap.set(umd, prev);
      }
      if (ud.startsWith('5')) {
        const prev = expMap.get(ud) || { total_amount: 0, transaction_count: 0 };
        prev.total_amount -= kc; prev.transaction_count += 1; expMap.set(ud, prev);
      }
      if (ud.startsWith('6')) {
        const prev = revMap.get(ud) || { total_amount: 0, transaction_count: 0 };
        prev.total_amount += kc; prev.transaction_count += 1; revMap.set(ud, prev);
      }
      if (umd.startsWith('6')) {
        const prev = revMap.get(umd) || { total_amount: 0, transaction_count: 0 };
        prev.total_amount -= kc; prev.transaction_count += 1; revMap.set(umd, prev);
      }
    }

    const toArr = (m) => Array.from(m.entries()).map(([account, v]) => ({
      account, account_name: nameBy.get(account) || `${account} (názov nenájdený)`,
      amount: v.total_amount, count: v.transaction_count
    })).sort((a,b)=> a.account.localeCompare(b.account));

    const expensesDetails = toArr(expMap);
    const revenueDetails  = toArr(revMap);
    const totalExpensesAmount = expensesDetails.reduce((s,r)=> s + r.amount, 0);
    const totalRevenueAmount  = revenueDetails.reduce((s,r)=> s + r.amount, 0);
    const profit = totalRevenueAmount - totalExpensesAmount;

    res.json({
      expenses: { total: totalExpensesAmount, count: expensesDetails.length, details: expensesDetails },
      revenue:  { total: totalRevenueAmount, count: revenueDetails.length, details: revenueDetails },
      profit,
      isProfit: profit >= 0,
      filters: { dateFrom: dateFrom || null, dateTo: dateTo || null }
    });
  } catch (e) {
    console.error('Chyba pri získavaní analýzy nákladov a výnosov:', e);
    res.status(500).json({ error: 'Chyba pri získavaní analýzy nákladov a výnosov' });
  }
});

/* ===========================
   3) Štatistiky (rýchle)
=========================== */

router.get('/stats/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { date_from, date_to } = req.query;

  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });

    const mdbInfo = await getMDBFilePath(company.ico);
    const mdb = openMdbReader(mdbInfo.path);
    const fa = findTableCaseInsensitive(mdb, 'FA', 'fa');
    if (!fa) {
      return res.json({
        issued_invoices:   { total_count: 0, total_amount: 0, paid_amount: 0, overdue_amount: 0 },
        received_invoices: { total_count: 0, total_amount: 0, paid_amount: 0, overdue_amount: 0 }
      });
    }

    const rows = fa.getData({ rowOffset: 0 });
    const inRange = d => {
      if (!date_from && !date_to) return true;
      if (!d) return false;
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return false;
      if (date_from && dt < new Date(date_from)) return false;
      if (date_to && dt > new Date(date_to)) return false;
      return true;
    };

    const relIssued   = 1;
    const relReceived = 11;

    const issued   = rows.filter(r => Number(r.RelTpFak || r.reltpfak || 0) === relIssued   && inRange(r.Datum || r.datum));
    const received = rows.filter(r => Number(r.RelTpFak || r.reltpfak || 0) === relReceived && inRange(r.Datum || r.datum));

    const sum = (arr, pick) => arr.reduce((s, r) => s + Number(pick(r) || 0), 0);

    const issuedTotal   = sum(issued,   r => r.KcCelkem || r.kccelkem || r.Kc || r.kc);
    const issuedPaid    = sum(issued,   r => r.KcU || r.kcu || 0);
    const issuedUnpaid  = sum(issued,   r => r.KcLikv || r.kclikv || 0);
    const receivedTotal = sum(received, r => r.KcCelkem || r.kccelkem || r.Kc || r.kc);
    const receivedPaid  = sum(received, r => r.KcU || r.kcu || 0);
    const receivedUnpaid= sum(received, r => r.KcLikv || r.kclikv || 0);

    res.json({
      issued_invoices: {
        total_count: issued.length, total_amount: issuedTotal,
        paid_amount: issuedPaid, overdue_amount: issuedUnpaid
      },
      received_invoices: {
        total_count: received.length, total_amount: receivedTotal,
        paid_amount: receivedPaid, overdue_amount: receivedUnpaid
      }
    });
  } catch (e) {
    console.error('Chyba pri načítaní štatistík (MDB):', e);
    res.status(500).json({ error: 'Chyba pri načítaní štatistík' });
  }
});

/* ===========================
   4) Vydané faktúry (MDB)
=========================== */

router.get('/issued-invoices/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { date_from, date_to, limit = 100, offset = 0 } = req.query;

  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });

    const mdbInfo = await getMDBFilePath(company.ico);
    const mdb = openMdbReader(mdbInfo.path);
    const fa = findTableCaseInsensitive(mdb, 'FA', 'fa');
    if (!fa) return res.json([]);

    const inRange = (d) => {
      if (!date_from && !date_to) return true;
      if (!d) return false;
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return false;
      if (date_from && dt < new Date(date_from)) return false;
      if (date_to && dt > new Date(date_to)) return false;
      return true;
    };

    const relIssued = 1;
    const rows = fa.getData({ rowOffset: 0 })
      .filter(r => Number(r.RelTpFak || r.reltpfak || 0) === relIssued)
      .filter(r => inRange(r.Datum || r.datum))
      .map(r => ({
        invoice_number: r.Cislo || r.cislo || '',
        customer_name: r.Firma || r.firma || '',
        customer_ico:  r.ICO || r.ico || '',
        issue_date:    r.Datum || r.datum || null,
        due_date:      r.DatSplat || r.datsplat || null,
        total_amount:  Number(r.KcCelkem || r.kccelkem || r.Kc || r.kc || 0),
        vat_amount:    Number((r.KcDPH1||0)+(r.KcDPH2||0)+(r.KcDPH3||0)),
        kc_likv:       Number(r.KcLikv || r.kclikv || 0),
        doplatok:      Number(r.KcLikv || r.kclikv || 0),
        var_sym:       r.VarSym || r.varsym || '',
        varsym:        r.VarSym || r.varsym || '',
        s_text:        r.SText || r.stext || ''
      }))
      .sort((a,b)=> new Date(b.issue_date||0) - new Date(a.issue_date||0))
      .slice(parseInt(offset,10), parseInt(offset,10) + parseInt(limit,10));

    res.json(rows);
  } catch (e) {
    console.error('Chyba pri načítaní vydaných faktúr (MDB):', e);
    res.status(500).json({ error: 'Chyba pri načítaní faktúr' });
  }
});

/* ===============================================
   4b) Vydané faktúry – RAW rýchly výpis z PG view
   GET /api/accounting/issued-invoices-raw/:companyId
   query: date_from, date_to, limit
================================================ */

router.get('/issued-invoices-raw/:companyId', authenticateToken, (req, res) => {
  const companyId = Number(req.params.companyId);
  const limit     = Math.min(Number(req.query.limit) || 100, 1000);
  const dateFrom  = req.query.date_from ? String(req.query.date_from) : null;
  const dateTo    = req.query.date_to   ? String(req.query.date_to)   : null;

  if (!companyId || Number.isNaN(companyId)) {
    return res.status(400).json({ error: 'Neplatné companyId' });
  }

  const sql = `
    SELECT id, invoice_number, varsym,
           issue_date, due_date, customer_name,
           total_amount, COALESCE(unpaid_amount,0) AS unpaid_amount,
           _company_id, _period, _import_id, _loaded_at
    FROM mdb_v_fa
    WHERE _company_id = $1
      AND ($2::date IS NULL OR issue_date >= $2::date)
      AND ($3::date IS NULL OR issue_date <= $3::date)
    ORDER BY COALESCE(issue_date, due_date) DESC, id DESC
    LIMIT $4
  `;
  const params = [companyId, dateFrom, dateTo, limit];

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('issued-invoices-raw error:', err);
      return res.status(500).json({ error: 'Chyba pri čítaní vydaných faktúr (raw)' });
    }
    return res.json(rows || []);
  });
});

/* ===========================
   5) Prijaté faktúry (MDB)
=========================== */

router.get('/received-invoices/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { date_from, date_to, limit = 100, offset = 0 } = req.query;

  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });

    const mdbInfo = await getMDBFilePath(company.ico);
    const mdb = openMdbReader(mdbInfo.path);
    const fa = findTableCaseInsensitive(mdb, 'FA', 'fa');
    if (!fa) return res.json([]);

    const inRange = (d) => {
      if (!date_from && !date_to) return true;
      if (!d) return false;
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return false;
      if (date_from && dt < new Date(date_from)) return false;
      if (date_to && dt > new Date(date_to)) return false;
      return true;
    };

    const relReceived = 11;
    const rows = fa.getData({ rowOffset: 0 })
      .filter(r => Number(r.RelTpFak || r.reltpfak || 0) === relReceived)
      .filter(r => inRange(r.Datum || r.datum))
      .map(r => ({
        invoice_number: r.Cislo || r.cislo || '',
        supplier_name:  r.Firma || r.firma || '',
        supplier_ico:   r.ICO || r.ico || '',
        issue_date:     r.Datum || r.datum || null,
        due_date:       r.DatSplat || r.datsplat || null,
        total_amount:   Number(r.KcCelkem || r.kccelkem || r.Kc || r.kc || 0),
        vat_amount:     Number((r.KcDPH1||0)+(r.KcDPH2||0)+(r.KcDPH3||0)),
        kc_likv:        Number(r.KcLikv || r.kclikv || 0),
        doplatok:       Number(r.KcLikv || r.kclikv || 0),
        var_sym:        r.VarSym || r.varsym || '',
        varsym:         r.VarSym || r.varsym || '',
        s_text:         r.SText || r.stext || ''
      }))
      .sort((a,b)=> new Date(b.issue_date||0) - new Date(a.issue_date||0))
      .slice(parseInt(offset,10), parseInt(offset,10) + parseInt(limit,10));

    res.json(rows);
  } catch (e) {
    console.error('Chyba pri načítaní prijatých faktúr (MDB):', e);
    res.status(500).json({ error: 'Chyba pri načítaní faktúr' });
  }
});

/* ===========================
   6) DPH z MDB
=========================== */

router.get('/vat-returns/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { year } = req.query;

  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });

    const mdbInfo = await getMDBFilePath(company.ico);
    const mdb = openMdbReader(mdbInfo.path);
    const dphTable = findTableCaseInsensitive(mdb, 'DPH', 'dph');
    const selectedYear = parseInt(year, 10) || new Date().getFullYear();

    let returns = [];
    if (dphTable) {
      const rows = dphTable.getData({ rowOffset: 0 });
      returns = rows
        .filter(r => parseInt(r.Rok || r.rok, 10) === selectedYear)
        .sort((a,b)=> (parseInt(a.RelObDPH||a.relobdph||0, 10)) - (parseInt(b.RelObDPH||b.relobdph||0, 10)))
        .map((row, idx) => ({
          id: idx + 1,
          rok: parseInt(row.Rok || row.rok, 10) || selectedYear,
          mesiac: parseInt(row.RelObDPH || row.relobdph || 0, 10) || 0,
          povinnost: Number(row.KcDan || row.kcdan || 0),
          odpočet: Number(row.KcOdpoc || row.kcodpoc || 0),
          odoslané: (row.ElOdeslano ?? row.elodeslano) === true
            || (row.ElOdeslano ?? row.elodeslano) === 1
            || (row.ElOdeslano ?? row.elodeslano) === 'True'
        }));
    }

    const summary = {
      totalPovinnost: returns.reduce((s, r) => s + r.povinnost, 0),
      totalOdpočet:   returns.reduce((s, r) => s + r.odpočet, 0),
      totalRozdiel:   returns.reduce((s, r) => s + (r.povinnost - r.odpočet), 0),
      odoslanéCount:  returns.filter(r => r.odoslané).length,
      neodoslanéCount:returns.filter(r => !r.odoslané).length
    };

    res.json({
      company: { id: company.id, name: company.name, ico: company.ico },
      year: selectedYear, returns, summary
    });
  } catch (e) {
    console.error('❌ Chyba pri načítaní DPH dát:', e);
    res.status(500).json({ error: 'Chyba pri načítaní DPH dát' });
  }
});

/* ===========================
   7) Bankové účty / Pokladňa
=========================== */

router.get('/bank-accounts/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });

    const mdbInfo = await getMDBFilePath(company.ico);
    const mdb = openMdbReader(mdbInfo.path);

    const sUcet = findTableCaseInsensitive(mdb, 'sUcet', 'sUCET', 'SUCET', 'sucet');
    const pUD   = findTableCaseInsensitive(mdb, 'pUD',   'PUD',   'pud');
    if (!pUD) {
      return res.json({
        company: { id: company.id, name: company.name, ico: company.ico },
        accounts: [],
        summary: { totalBalance: 0, totalCredit: 0, totalDebit: 0, accountCount: 0 },
        message: 'Tabuľka pUD nebola nájdená'
      });
    }

    const sRows = sUcet ? sUcet.getData({ rowOffset: 0 }) : [];
    const pRows = pUD.getData({ rowOffset: 0 });

    const byUMD = new Map();
    const byUD  = new Map();
    for (const r of pRows) {
      const kc = Number(r.Kc || r.kc || 0);
      const umd = String(r.UMD || r.umd || '');
      const ud  = String(r.UD  || r.ud  || '');
      if (umd) byUMD.set(umd, (byUMD.get(umd)||0) + kc);
      if (ud)  byUD.set(ud,  (byUD.get(ud)||0)  + kc);
    }

    const accounts = [];
    let totalBalance = 0, totalCredit = 0, totalDebit = 0;
    for (const a of sRows) {
      let num  = String(a.AUcet || a.aucet || '');
      const name = a.SText || a.stext || '';
      const rel  = Number(a.RelJeUcet || a.reljeucet || 0);
      const bank = a.Banka || a.banka || 'Neznáma banka';
      if (!name) continue;
      if (rel === 1) continue;
      if (!num) num = '221000';
      if (!num.startsWith('221')) continue;

      const creditTotal = Number(byUMD.get(num) || 0);
      const debitTotal  = Number(byUD.get(num)  || 0);
      const balance     = creditTotal - debitTotal;

      accounts.push({
        id: a.ID || accounts.length + 1,
        accountNumber: name,           // zobrazenie
        accountName:   name,
        bankName:      bank,
        balance, creditTotal, debitTotal,
        transactionCount: undefined,
        pudAccount: num
      });
      totalBalance += balance; totalCredit += creditTotal; totalDebit += debitTotal;
    }

    res.json({
      company: { id: company.id, name: company.name, ico: company.ico },
      accounts,
      summary: { totalBalance, totalCredit, totalDebit, accountCount: accounts.length },
      message: accounts.length === 0 ? 'Neboli nájdené žiadne bankové účty (221)' : undefined
    });
  } catch (e) {
    console.error('❌ Chyba pri načítaní bankových dát:', e);
    res.status(500).json({ error: 'Chyba pri načítaní bankových dát' });
  }
});

router.get('/bank-transactions/:companyId/:accountNumber', authenticateToken, async (req, res) => {
  const { companyId, accountNumber } = req.params;
  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });

    const mdbInfo = await getMDBFilePath(company.ico);
    const mdb = openMdbReader(mdbInfo.path);
    const sUcet = findTableCaseInsensitive(mdb, 'sUcet', 'sUCET', 'SUCET', 'sucet');
    const pUD   = findTableCaseInsensitive(mdb, 'pUD',   'PUD',   'pud');
    if (!pUD) {
      return res.json({
        company: { id: company.id, name: company.name, ico: company.ico },
        account: { accountNumber, accountName: accountNumber, bankName: 'Neznáma banka' },
        transactions: [],
        summary: { totalCredit: 0, totalDebit: 0, currentBalance: 0, transactionCount: 0 }
      });
    }

    const sUcetRows = sUcet ? sUcet.getData({ rowOffset: 0 }) : [];
    let pudAccountNumber = accountNumber;
    const matched = sUcetRows.find(a =>
      String(a.AUcet || a.aucet || '') === accountNumber ||
      String(a.SText || a.stext || '') === accountNumber
    );
    if (matched) pudAccountNumber = String(matched.AUcet || matched.aucet || accountNumber);

    const rows = pUD.getData({ rowOffset: 0 })
      .filter(r => String(r.UMD || r.umd || '') === pudAccountNumber || String(r.UD || r.ud || '') === pudAccountNumber)
      .sort((a,b)=> new Date(a.Datum || a.datum || 0) - new Date(b.Datum || b.datum || 0));

    const transactions = [];
    let totalCredit = 0, totalDebit = 0, runningBalance = 0;
    for (const r of rows) {
      const isCredit = String(r.UMD || r.umd || '') === pudAccountNumber;
      const amount = Number(r.Kc || r.kc || 0);
      if (isCredit) { runningBalance += amount; totalCredit += amount; }
      else          { runningBalance -= amount; totalDebit  += amount; }
      transactions.push({
        id: r.ID,
        datum: r.Datum || r.datum || null,
        popis: r.SText || r.stext || (r.Cislo ? `Transakcia ${r.Cislo}` : 'Transakcia'),
        kredit: isCredit ? amount : 0,
        debet:  isCredit ? 0 : amount,
        zostatok: runningBalance,
        typ: isCredit ? 'kredit' : 'debet',
        firma: r.Firma || r.firma || ''
      });
    }

    res.json({
      company: { id: company.id, name: company.name, ico: company.ico },
      account: {
        accountNumber: matched ? (matched.SText || matched.AUcet) : accountNumber,
        accountName:   matched ? (matched.SText || `Bankový účet ${matched.AUcet}`) : accountNumber,
        bankName:      matched ? (matched.Banka || 'Neznáma banka') : 'Neznáma banka',
        pudAccount:    pudAccountNumber
      },
      transactions,
      summary: { totalCredit, totalDebit, currentBalance: runningBalance, transactionCount: transactions.length }
    });
  } catch (e) {
    console.error('❌ Chyba pri načítaní transakcií:', e);
    res.status(500).json({ error: 'Chyba pri načítaní transakcií', details: e.message, stack: e.stack });
  }
});

// Pokladňa (211)
router.get('/cash-accounts/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });

    const mdbInfo = await getMDBFilePath(company.ico);
    const mdb = openMdbReader(mdbInfo.path);
    const sUcet = findTableCaseInsensitive(mdb, 'sUcet', 'sUCET', 'SUCET', 'sucet');
    const pUD   = findTableCaseInsensitive(mdb, 'pUD',   'PUD',   'pud');
    if (!sUcet || !pUD) {
      return res.json({
        company: { id: company.id, name: company.name, ico: company.ico }, accounts: [],
        summary: { totalBalance: 0, totalCredit: 0, totalDebit: 0, accountCount: 0 }
      });
    }

    const accountRows = sUcet.getData({ rowOffset: 0 }).filter(a => String(a.AUcet || a.aucet || '').startsWith('211'));
    const pudRows     = pUD.getData({ rowOffset: 0 });

    const byUMD = new Map();
    const byUD  = new Map();
    for (const r of pudRows) {
      const kc = Number(r.Kc || r.kc || 0);
      const umd = String(r.UMD || r.umd || '');
      const ud  = String(r.UD  || r.ud  || '');
      if (umd) byUMD.set(umd, (byUMD.get(umd)||0) + kc);
      if (ud)  byUD.set(ud,  (byUD.get(ud)||0)  + kc);
    }

    const accounts = [];
    let totalBalance = 0, totalCredit = 0, totalDebit = 0;
    for (const a of accountRows) {
      const num  = String(a.AUcet || a.aucet || '211000');
      const name = (num === '211000' || !a.SText) ? 'Hlavná pokladňa' : (a.SText || a.stext);
      const creditTotal = Number(byUMD.get(num) || 0);
      const debitTotal  = Number(byUD.get(num)  || 0);
      const balance     = creditTotal - debitTotal;

      accounts.push({
        id: a.ID || accounts.length + 1,
        accountNumber: num, accountName: name,
        balance, creditTotal, debitTotal, transactionCount: undefined
      });
      totalBalance += balance; totalCredit += creditTotal; totalDebit += debitTotal;
    }

    res.json({
      company: { id: company.id, name: company.name, ico: company.ico },
      accounts,
      summary: { totalBalance, totalCredit, totalDebit, accountCount: accounts.length }
    });
  } catch (e) {
    console.error('❌ Chyba pri načítaní pokladňových dát:', e);
    res.status(500).json({ error: 'Chyba pri načítaní pokladňových dát' });
  }
});

router.get('/cash-transactions/:companyId/:accountNumber', authenticateToken, async (req, res) => {
  const { companyId, accountNumber } = req.params;
  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });

    const mdbInfo = await getMDBFilePath(company.ico);
    const mdb = openMdbReader(mdbInfo.path);
    const sUcet = findTableCaseInsensitive(mdb, 'sUcet', 'sUCET', 'SUCET', 'sucet');
    const pUD   = findTableCaseInsensitive(mdb, 'pUD',   'PUD',   'pud');
    if (!pUD) {
      return res.json({
        company: { id: company.id, name: company.name, ico: company.ico },
        account: { accountNumber, accountName: accountNumber, bankName: 'Pokladňa' },
        transactions: [],
        summary: { totalCredit: 0, totalDebit: 0, currentBalance: 0, transactionCount: 0 }
      });
    }

    const sRows = sUcet ? sUcet.getData({ rowOffset: 0 }) : [];
    let pudAccountNumber = accountNumber;
    const matched = sRows.find(a =>
      String(a.AUcet || a.aucet || '') === accountNumber ||
      String(a.SText || a.stext || '') === accountNumber
    );
    if (matched) pudAccountNumber = String(matched.AUcet || matched.aucet || accountNumber);
    if (!pudAccountNumber) pudAccountNumber = '211000';

    const rows = pUD.getData({ rowOffset: 0 })
      .filter(r => String(r.UMD || r.umd || '') === pudAccountNumber || String(r.UD || r.ud || '') === pudAccountNumber)
      .sort((a,b)=> new Date(a.Datum || a.datum || 0) - new Date(b.Datum || b.datum || 0));

    const transactions = [];
    let totalCredit = 0, totalDebit = 0, runningBalance = 0;
    for (const r of rows) {
      const isCredit = String(r.UMD || r.umd || '') === pudAccountNumber;
      const amount = Number(r.Kc || r.kc || 0);
      if (isCredit) { runningBalance += amount; totalCredit += amount; }
      else          { runningBalance -= amount; totalDebit  += amount; }
      transactions.push({
        id: r.ID, datum: r.Datum || r.datum || null,
        popis: r.SText || r.stext || (r.Cislo ? `Transakcia ${r.Cislo}` : 'Transakcia'),
        kredit: isCredit ? amount : 0, debet: isCredit ? 0 : amount,
        zostatok: runningBalance, typ: isCredit ? 'kredit' : 'debet',
        firma: r.Firma || r.firma || ''
      });
    }

    res.json({
      company: { id: company.id, name: company.name, ico: company.ico },
      account: {
        accountNumber: matched ? (matched.SText || matched.AUcet) : accountNumber,
        accountName:   matched ? ((matched.AUcet === '211000' || !matched.SText) ? 'Hlavná pokladňa' : matched.SText) : accountNumber,
        bankName:      'Pokladňa',
        pudAccount:    pudAccountNumber
      },
      transactions,
      summary: { totalCredit, totalDebit, currentBalance: runningBalance, transactionCount: transactions.length }
    });
  } catch (e) {
    console.error('❌ Chyba pri načítaní transakcií pokladne:', e);
    res.status(500).json({ error: 'Chyba pri načítaní transakcií pokladne', details: e.message, stack: e.stack });
  }
});

/* ===========================
   8) Admin – MDB I/O
=========================== */

// Upload MDB
router.post('/admin/mdb/upload/:companyId', authenticateToken, ensureAdmin, upload.single('file'), (req, res) => {
  try {
    const { companyId } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "Súbor nie je priložený alebo pole sa nevolá 'file'" });
    }
    return res.json({
      success: true,
      message: 'MDB súbor bol úspešne nahraný',
      filename: req.file.originalname,
      storedAs: req.file.filename,
      size: req.file.size,
      companyId
    });
  } catch (e) {
    console.error('📦 MDB upload error:', e);
    const status = e.status || 500;
    res.status(status).json({ error: e.message || 'Upload failed' });
  }
});

// List lokálnych MDB (root vybrané)
router.get('/admin/mdb/files', authenticateToken, ensureAdmin, (req, res) => {
  try {
    const roots = [
      path.resolve(__dirname, '..', 'uploads'),
      path.resolve(__dirname, '..', 'zalohy'),
      path.resolve(__dirname, '..', '..', 'uploads')
    ];
    const allowed = new Set(['.mdb', '.accdb']);
    const filesFound = [];
    for (const rootDir of roots) {
      if (!fs.existsSync(rootDir)) continue;
      const walk = (dir) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) walk(full);
          else if (allowed.has(path.extname(e.name).toLowerCase())) {
            const st = fs.statSync(full);
            filesFound.push({ name: e.name, dir, path: full, size: st.size, mtime: st.mtime });
          }
        }
      };
      walk(rootDir);
    }
    filesFound.sort((a, b) => b.mtime - a.mtime);
    res.json({ count: filesFound.length, files: filesFound });
  } catch (err) {
    console.error('LIST MDB ERR:', err);
    res.status(500).json({ error: 'Failed to list MDB files' });
  }
});

// Per-company list
router.get('/admin/mdb/files/:companyId', authenticateToken, ensureAdmin, (req, res) => {
  try {
    const dir = ensureCompanyDir(req.params.companyId);
    if (!fs.existsSync(dir)) return res.json({ count: 0, files: [] });
    const files = fs.readdirSync(dir)
      .filter(f => /\.mdb$/i.test(f))
      .map(f => {
        const full = path.join(dir, f);
        const st = fs.statSync(full);
        return { name: f, size: st.size, mtime: st.mtime, path: full };
      })
      .sort((a, b) => b.mtime - a.mtime);
    res.json({ count: files.length, files });
  } catch (e) {
    console.error('Per-company list error:', e);
    res.status(500).json({ error: 'Failed to list company MDB files' });
  }
});

// Download
router.get('/admin/mdb/download/:companyId/:filename', authenticateToken, ensureAdmin, (req, res) => {
  try {
    const dir = ensureCompanyDir(req.params.companyId);
    const file = safeName(req.params.filename);
    if (!/\.mdb$/i.test(file)) {
      const err = new Error('Only .mdb files are allowed'); err.status = 400; throw err;
    }
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) {
      const err = new Error('File not found'); err.status = 404; throw err;
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
    res.setHeader('X-Accel-Buffering', 'no');
    fs.createReadStream(full).on('error', (e)=> res.status(500).end(e.message)).pipe(res);
  } catch (e) {
    console.error('Download MDB error:', e);
    res.status(e.status || 500).json({ error: e.message || 'Download failed' });
  }
});

// Delete
router.delete('/admin/mdb/file/:companyId/:filename', authenticateToken, ensureAdmin, (req, res) => {
  try {
    const dir = ensureCompanyDir(req.params.companyId);
    const file = safeName(req.params.filename);
    if (!/\.mdb$/i.test(file)) { const err = new Error('Only .mdb files are allowed'); err.status = 400; throw err; }
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) { const err = new Error('File not found'); err.status = 404; throw err; }
    fs.unlinkSync(full);
    res.json({ success: true, message: 'MDB súbor bol odstránený', filename: file });
  } catch (e) {
    console.error('Delete MDB error:', e);
    res.status(e.status || 500).json({ error: e.message || 'Delete failed' });
  }
});

// Scoped error handler pre /admin/mdb
router.use('/admin/mdb', (err, _req, res, _next) => {
  console.error('📦 MDB upload error:', err && err.message, err && err.stack);
  const status = err && err.status ? err.status : 500;
  res.status(status).json({ error: (err && err.message) || 'Upload failed' });
});

/* ===========================
   9) Spaces – PDF faktúry
=========================== */

// Presigned GET
router.get('/invoices/:kind/:invoiceId/presign', authenticateToken, async (req, res) => {
  const { kind, invoiceId } = req.params;
  try {
    if (!spacesService.isInitialized()) {
      return res.status(503).json({ error: 'Úložisko nie je nakonfigurované (SPACES_* env chýbajú)' });
    }
    const table = kind === 'issued' ? 'issued_invoices' : 'received_invoices';

    let company; let year; let lookupId = invoiceId;
    let invoice = await new Promise((resolve, reject) => {
      db.get(`SELECT id, company_id, COALESCE(issue_date, datum) AS issue_date FROM ${table} WHERE id = ?`,
        [invoiceId], (err, row) => err ? reject(err) : resolve(row));
    });

    if (invoice) {
      company = await new Promise((resolve, reject) => {
        db.get('SELECT id, ico FROM companies WHERE id = ?', [invoice.company_id],
          (err, row) => err ? reject(err) : resolve(row));
      });
      if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });
      const d = invoice.issue_date ? new Date(invoice.issue_date) : new Date();
      year = Number.isFinite(d.getFullYear()) ? d.getFullYear() : new Date().getFullYear();
    } else {
      const fallbackCompanyId = req.query.companyId || req.body?.companyId;
      const fallbackIssueDate = req.query.issueDate || req.body?.issueDate;
      if (!fallbackCompanyId) return res.status(404).json({ error: 'Faktúra nebola nájdená' });
      company = await new Promise((resolve, reject) => {
        db.get('SELECT id, ico FROM companies WHERE id = ?', [fallbackCompanyId],
          (err, row) => err ? reject(err) : resolve(row));
      });
      if (!company) return res.status(404).json({ error: 'Firma nebola nájdená (fallback)' });
      const d = fallbackIssueDate ? new Date(fallbackIssueDate) : new Date();
      year = Number.isFinite(d.getFullYear()) ? d.getFullYear() : new Date().getFullYear();
    }

    const key = spacesService.getInvoiceKey(company.ico, kind, year, lookupId, 'pdf');
    const exists = await spacesService.checkKeyExists(key);
    if (!exists) return res.status(404).json({ error: 'PDF faktúry nebolo nájdené' });

    const url = await spacesService.getPresignedGetUrl(key, 300);
    return res.json({ url, key });
  } catch (e) {
    console.error('Presign invoice error:', e);
    return res.status(500).json({ error: 'Chyba pri generovaní odkazu' });
  }
});

// Exists
router.get('/invoices/:kind/:invoiceId/exists', authenticateToken, async (req, res) => {
  const { kind, invoiceId } = req.params;
  try {
    if (!spacesService.isInitialized()) {
      return res.status(503).json({ error: 'Úložisko nie je nakonfigurované (SPACES_* env chýbajú)' });
    }
    const table = kind === 'issued' ? 'issued_invoices' : 'received_invoices';

    let company; let year; let lookupId = invoiceId;
    let invoice = await new Promise((resolve, reject) => {
      db.get(`SELECT id, company_id, COALESCE(issue_date, datum) AS issue_date FROM ${table} WHERE id = ?`,
        [invoiceId], (err, row) => err ? reject(err) : resolve(row));
    });

    if (invoice) {
      company = await new Promise((resolve, reject) => {
        db.get('SELECT id, ico FROM companies WHERE id = ?', [invoice.company_id],
          (err, row) => err ? reject(err) : resolve(row));
      });
      if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });
      const d = invoice.issue_date ? new Date(invoice.issue_date) : new Date();
      year = Number.isFinite(d.getFullYear()) ? d.getFullYear() : new Date().getFullYear();
    } else {
      const fallbackCompanyId = req.query.companyId || req.body?.companyId;
      const fallbackIssueDate = req.query.issueDate || req.body?.issueDate;
      if (!fallbackCompanyId) return res.json({ exists: false });
      company = await new Promise((resolve, reject) => {
        db.get('SELECT id, ico FROM companies WHERE id = ?', [fallbackCompanyId],
          (err, row) => err ? reject(err) : resolve(row));
      });
      if (!company) return res.json({ exists: false });
      const d = fallbackIssueDate ? new Date(fallbackIssueDate) : new Date();
      year = Number.isFinite(d.getFullYear()) ? d.getFullYear() : new Date().getFullYear();
    }

    const key = spacesService.getInvoiceKey(company.ico, kind, year, lookupId, 'pdf');
    const exists = await spacesService.checkKeyExists(key);
    return res.json({ exists, key });
  } catch {
    return res.json({ exists: false });
  }
});

// Upload (POST aj GET alias)
async function presignUpload(req, res) {
  const { kind, invoiceId } = req.params;
  try {
    if (!spacesService.isInitialized()) {
      return res.status(503).json({ error: 'Úložisko nie je nakonfigurované (SPACES_* env chýbajú)' });
    }
    const table = kind === 'issued' ? 'issued_invoices' : (kind === 'received' ? 'received_invoices' : null);
    if (!table) return res.status(400).json({ error: 'Neplatný typ faktúry' });

    let company; let year; let uploadId = invoiceId;
    let invoice = await new Promise((resolve, reject) => {
      db.get(`SELECT id, company_id, COALESCE(issue_date, datum) AS issue_date FROM ${table} WHERE id = ?`,
        [invoiceId], (err, row) => err ? reject(err) : resolve(row));
    });

    if (invoice) {
      company = await new Promise((resolve, reject) => {
        db.get('SELECT id, ico FROM companies WHERE id = ?', [invoice.company_id],
          (err, row) => err ? reject(err) : resolve(row));
      });
      if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });
      const d = invoice.issue_date ? new Date(invoice.issue_date) : new Date();
      year = Number.isFinite(d.getFullYear()) ? d.getFullYear() : new Date().getFullYear();
    } else {
      const fallbackCompanyId = req.query.companyId || req.body?.companyId;
      const fallbackIssueDate = req.query.issueDate || req.body?.issueDate;
      if (!fallbackCompanyId) return res.status(400).json({ error: 'Chýba companyId pre fallback' });
      company = await new Promise((resolve, reject) => {
        db.get('SELECT id, ico FROM companies WHERE id = ?', [fallbackCompanyId],
          (err, row) => err ? reject(err) : resolve(row));
      });
      if (!company) return res.status(404).json({ error: 'Firma nebola nájdená (fallback)' });
      const d = fallbackIssueDate ? new Date(fallbackIssueDate) : new Date();
      year = Number.isFinite(d.getFullYear()) ? d.getFullYear() : new Date().getFullYear();
    }

    const { url, key } = await spacesService.getPresignedUploadUrlForInvoice(company.ico, kind, year, uploadId);
    return res.json({ url, key, contentType: 'application/pdf' });
  } catch (e) {
    console.error('Presign upload invoice error:', e);
    return res.status(500).json({ error: 'Chyba pri generovaní upload odkazu' });
  }
}
router.post('/invoices/:kind/:invoiceId/presign-upload', authenticateToken, presignUpload);
router.get ('/invoices/:kind/:invoiceId/presign-upload', authenticateToken, presignUpload);

/* ===========================
   Export router
=========================== */

module.exports = router;
