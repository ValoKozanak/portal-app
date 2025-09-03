const express = require('express');
const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const dest = ensureCompanyDir(req.params.companyId);
        cb(null, dest);
      } catch (e) {
        cb(e);
      }
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
const router = Router();
const { authenticateToken } = require('./auth');
const { db } = require('../database');
const dropboxService = require('../services/dropboxService');

// Helper: admin kontrola
function ensureAdmin(req, res, next) {
  try {
    if (req.user && (req.user.role === 'admin' || req.user.isAdmin === true)) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
  } catch (e) {
    return res.status(403).json({ error: 'Forbidden' });
  }
}

// Helper: zabezpečenie adresára firmy pre MDB uploady
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

// Helper: bezpečný názov súboru
function safeName(name) {
  const base = path.basename(String(name || ''));
  if (!base || base === '.' || base === '..') {
    const err = new Error('Invalid filename');
    err.status = 400;
    throw err;
  }
  return base;
}

// Helper: otvor MDB cez mdb-reader
function openMdbReader(mdbPath) {
  const MDBLib = require('mdb-reader');
  const MDBReader = MDBLib && MDBLib.default ? MDBLib.default : MDBLib;
  const buffer = fs.readFileSync(mdbPath);
  return new MDBReader(buffer);
}

// Helper: nájdi tabuľku case-insensitive; ak má viac aliasov, ber prvý
function findTableCaseInsensitive(dbReader, ...nameCandidates) {
  const names = dbReader.getTableNames();
  const lower = names.map(n => n.toLowerCase());
  for (const candidate of nameCandidates) {
    const idx = lower.indexOf(String(candidate).toLowerCase());
    if (idx >= 0) return dbReader.getTable(names[idx]);
  }
  return null;
}

// ===== ÚČTOVNÍCTVO API ROUTES =====

// JEDNODUCHÝ TEST ENDPOINT NA ZAČIATKU
router.get('/simple-test', (req, res) => {
  res.json({ 
    message: "Accounting routes fungujú!", 
    timestamp: new Date().toISOString() 
  });
});

// DROPBOX TEST ENDPOINT NA ZAČIATKU  
router.get('/dropbox-test-simple', async (req, res) => {
  try {
    res.json({
      message: "Dropbox endpoint funguje!",
      isInitialized: dropboxService.isInitialized(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TEST DROPBOX TOKEN ENDPOINT
router.get('/test-dropbox-token', (req, res) => {
  const token = process.env.DROPBOX_ACCESS_TOKEN;
  res.json({
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    tokenStart: token ? token.substring(0, 10) + '...' : 'none',
    message: token ? "Token je nastavený" : "Token nie je nastavený"
  });
});

// Helper: nájdi najnovší lokálny MDB v uploads/mdb/<ICO>/ (názov ICO_ROK.mdb)
function findLatestLocalMdb(companyIco, preferredYear) {
  const ico = String(companyIco);
  const rootDir = path.join(__dirname, '..', 'uploads', 'mdb', ico);
  if (!fs.existsSync(rootDir)) {
    return null;
  }
  // Ak je preferovaný rok, preferuj presný súbor
  if (preferredYear) {
    const exact = path.join(rootDir, `${ico}_${preferredYear}.mdb`);
    if (fs.existsSync(exact)) return exact;
  }
  // Vyber najnovší .mdb podľa mtime
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const candidates = entries
    .filter(e => e.isFile() && /\.mdb$/i.test(e.name) && e.name.toLowerCase().startsWith(`${ico.toLowerCase()}_`))
    .map(e => {
      const full = path.join(rootDir, e.name);
      const st = fs.statSync(full);
      return { full, mtime: st.mtime };
    })
    .sort((a, b) => b.mtime - a.mtime);
  return candidates[0]?.full || null;
}

// Helper funkcia na získanie MDB súboru (lokálny uploads/mdb -> zalohy)
async function getMDBFilePath(companyIco, year) {
  // 1) Preferuj lokálne nahratý MDB v uploads/mdb/<ICO>/ICO_ROK.mdb
  const localLatest = findLatestLocalMdb(companyIco, year);
  if (localLatest && fs.existsSync(localLatest)) {
    return { path: localLatest, isTemp: false };
  }
  // 2) Fallback: zalohy podľa daného roka, ak je zadaný
  if (year) {
    const localPath = path.join(__dirname, '..', 'zalohy', String(year), `${companyIco}_${year}`, `${companyIco}_${year}.mdb`);
    if (fs.existsSync(localPath)) {
      return { path: localPath, isTemp: false };
    }
  }
  // 3) Fallback: pokus nájsť v zalohy najnovší rok (ak existuje štruktúra)
  const zalohyRoot = path.join(__dirname, '..', 'zalohy');
  if (fs.existsSync(zalohyRoot)) {
    const years = fs.readdirSync(zalohyRoot).filter(d => /^(19|20)\d{2}$/.test(d));
    const sortedYears = years.sort((a, b) => parseInt(b) - parseInt(a));
    for (const y of sortedYears) {
      const p = path.join(zalohyRoot, y, `${companyIco}_${y}`, `${companyIco}_${y}.mdb`);
      if (fs.existsSync(p)) return { path: p, isTemp: false };
    }
  }
  throw new Error('MDB súbor nebol nájdený');
}

// 1. NASTAVENIA ÚČTOVNÍCTVA

// Získanie nastavení účtovníctva pre firmu
router.get('/settings/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  
  db.get(`
    SELECT * FROM accounting_settings 
    WHERE company_id = ?
  `, [companyId], (err, settings) => {
    if (err) {
      console.error('Chyba pri načítaní nastavení účtovníctva:', err);
      return res.status(500).json({ error: 'Chyba pri načítaní nastavení' });
    }
    
    res.json(settings || {
      company_id: parseInt(companyId),
      pohoda_enabled: false,
      auto_sync: false,
      sync_frequency: 'daily'
    });
  });
});

// Uloženie nastavení účtovníctva
router.post('/settings/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  
  // Kontrola, či je používateľ admin, company alebo user
  if (req.user.role !== 'admin' && req.user.role !== 'company' && req.user.role !== 'user') {
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

// 2. HOSPODÁRSKE VÝSLEDKY (pUD)

// Získanie súčtu Kc z pUD
router.get('/pud-summary/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;

  try {
    // Získanie informácií o firme
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }
    
    const mdbFileInfo = await getMDBFilePath(company.ico, undefined);
    const mdbPath = mdbFileInfo.path;

    // Čítanie MDB cez mdb-reader
    const MDBLib = require('mdb-reader');
    const MDBReader = MDBLib && MDBLib.default ? MDBLib.default : MDBLib;
    const buffer = fs.readFileSync(mdbPath);
    const dbReader = new MDBReader(buffer);

    // Tabuľka pUD – názov sa môže líšiť (pUD / PUD / pud)
    const tableName = dbReader.getTableNames().find(t => t.toLowerCase() === 'pud');
    if (!tableName) {
      return res.json({ total_kc: 0, total_count: 0 });
    }
    const pudTable = dbReader.getTable(tableName);
    const rows = pudTable.getData({ rowOffset: 0 });

    // Stĺpce: Kc – suma; filter priamo v JS
    let total_kc = 0;
    let total_count = 0;
    for (const row of rows) {
      const val = Number(row.Kc || row.kc || 0);
      if (!Number.isNaN(val)) {
        total_kc += val;
      }
      total_count += 1;
    }

    res.json({ total_kc, total_count });
    
  } catch (error) {
    console.error('Chyba pri získavaní súhrnu pUD:', error);
    res.status(500).json({ error: 'Chyba pri získavaní súhrnu pUD' });
  }
});

// Podrobná analýza nákladov a výnosov z pUD
router.get('/financial-analysis/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { dateFrom, dateTo } = req.query;

  try {
    // Získanie informácií o firme
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }
    
    const mdbInfo = await getMDBFilePath(company.ico, undefined);
    const mdbPath = mdbInfo.path;

    const mdb = openMdbReader(mdbPath);
    const pud = findTableCaseInsensitive(mdb, 'pUD', 'pud', 'PUD');
    const pos = findTableCaseInsensitive(mdb, 'pOS', 'pos', 'POS');
    if (!pud) {
      return res.json({ expenses: { total: 0, count: 0, details: [] }, revenue: { total: 0, count: 0, details: [] }, profit: 0, isProfit: true, filters: { dateFrom: dateFrom || null, dateTo: dateTo || null } });
    }

    const rows = pud.getData({ rowOffset: 0 });
    const posRows = pos ? pos.getData({ rowOffset: 0 }) : [];
    const accountNameBy = new Map();
    for (const r of posRows) {
      const acc = r.Ucet || r.ucet || r.AUcet || r.auct || r.UMD || r.UD;
      if (acc) accountNameBy.set(String(acc), r.Nazev || r.nazev || r.SText || r.stext || '');
    }

    const inRange = (d) => {
      if (!dateFrom && !dateTo) return true;
      if (!d) return false;
      const ds = new Date(d);
      if (Number.isNaN(ds.getTime())) return false;
      if (dateFrom && ds < new Date(dateFrom)) return false;
      if (dateTo && ds > new Date(dateTo)) return false;
      return true;
    };

    const expMap = new Map();
    const revMap = new Map();
    let totalExpensesAmount = 0;
    let totalRevenueAmount = 0;

    for (const r of rows) {
      const kc = Number(r.Kc || r.kc || 0);
      const datum = r.Datum || r.datum;
      if (!inRange(datum)) continue;

      const umd = String(r.UMD || r.umd || '');
      const ud = String(r.UD || r.ud || '');

      if (umd.startsWith('5')) {
        const prev = expMap.get(umd) || { total_amount: 0, transaction_count: 0 };
        prev.total_amount += kc;
        prev.transaction_count += 1;
        expMap.set(umd, prev);
        totalExpensesAmount += kc;
      }

      if (ud.startsWith('6')) {
        const prev = revMap.get(ud) || { total_amount: 0, transaction_count: 0 };
        prev.total_amount += kc;
        prev.transaction_count += 1;
        revMap.set(ud, prev);
        totalRevenueAmount += kc;
      }
    }

    const expensesDetails = Array.from(expMap.entries()).map(([account, v]) => ({
      account,
      account_name: accountNameBy.get(account) || `${account} (názov nenájdený)`,
      amount: v.total_amount,
      count: v.transaction_count
    })).sort((a,b)=>a.account.localeCompare(b.account));

    const revenueDetails = Array.from(revMap.entries()).map(([account, v]) => ({
      account,
      account_name: accountNameBy.get(account) || `${account} (názov nenájdený)`,
      amount: v.total_amount,
      count: v.transaction_count
    })).sort((a,b)=>a.account.localeCompare(b.account));

    const profit = totalRevenueAmount - totalExpensesAmount;

    res.json({
      expenses: { total: totalExpensesAmount, count: expensesDetails.length, details: expensesDetails },
      revenue: { total: totalRevenueAmount, count: revenueDetails.length, details: revenueDetails },
      profit,
      isProfit: profit >= 0,
      filters: { dateFrom: dateFrom || null, dateTo: dateTo || null }
    });
    
        } catch (error) {
    console.error('Chyba pri získavaní analýzy nákladov a výnosov:', error);
    res.status(500).json({ error: 'Chyba pri získavaní analýzy nákladov a výnosov' });
  }
});

// Podrobná analýza nákladov a výnosov z pUD (bez autentifikácie pre testovanie)
router.get('/financial-analysis-test/:companyId', async (req, res) => {
  const { companyId } = req.params;
  const { dateFrom, dateTo } = req.query;

  try {
    // Získanie informácií o firme
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }
    
    const mdbPath = path.join(__dirname, '..', 'zalohy', '2025', `${company.ico}_2025`, `${company.ico}_2025.mdb`);

    if (!fs.existsSync(mdbPath)) {
      return res.status(404).json({ error: 'MDB súbor nebol nájdený' });
    }
    
    // Import z MDB
    const ADODB = require('node-adodb');
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // Vytvorenie dátumových filtrov
    let dateFilter = '';
    if (dateFrom && dateTo) {
      // Použijeme CDate() funkciu pre správne porovnanie dátumov
      dateFilter = ` AND CDate(Datum) BETWEEN CDate('${dateFrom}') AND CDate('${dateTo}')`;

    }
    
    // Analýza nákladov (účty začínajúce 5)
    const expensesQuery = `
      SELECT 
        pUD.UMD as account,
        pOS.Nazev as account_name,
        SUM(pUD.Kc) as total_amount,
        COUNT(*) as transaction_count
      FROM pUD 
      LEFT JOIN pOS ON pUD.UMD = pOS.Ucet
      WHERE pUD.UMD LIKE '5%'${dateFilter}
      GROUP BY pUD.UMD, pOS.Nazev
      ORDER BY pUD.UMD
    `;
    
    // Analýza výnosov (účty začínajúce 6)
    const revenueQuery = `
      SELECT 
        pUD.UD as account,
        pOS.Nazev as account_name,
        SUM(pUD.Kc) as total_amount,
        COUNT(*) as transaction_count
      FROM pUD 
      LEFT JOIN pOS ON pUD.UD = pOS.Ucet
      WHERE pUD.UD LIKE '6%'${dateFilter}
      GROUP BY pUD.UD, pOS.Nazev
      ORDER BY pUD.UD
    `;
    
    // Celkové súčty
    const totalExpensesQuery = `SELECT SUM(Kc) as total_expenses FROM pUD WHERE UMD LIKE '5%'${dateFilter}`;
    const totalRevenueQuery = `SELECT SUM(Kc) as total_revenue FROM pUD WHERE UD LIKE '6%'${dateFilter}`;
    
    // Vykonanie queries
    const expenses = await connection.query(expensesQuery);
    const revenue = await connection.query(revenueQuery);
    const totalExpenses = await connection.query(totalExpensesQuery);
    const totalRevenue = await connection.query(totalRevenueQuery);
    
    // Výpočet zisku/straty
    const totalExpensesAmount = totalExpenses[0]?.total_expenses || 0;
    const totalRevenueAmount = totalRevenue[0]?.total_revenue || 0;
    const profit = totalRevenueAmount - totalExpensesAmount;
    
    const analysis = {
      expenses: {
        total: totalExpensesAmount,
        count: expenses.length,
        details: expenses.map(item => ({
          account: item.account,
          account_name: item.account_name || `${item.account} (názov nenájdený)`,
          amount: item.total_amount || 0,
          count: item.transaction_count || 0
        }))
      },
      revenue: {
        total: totalRevenueAmount,
        count: revenue.length,
        details: revenue.map(item => ({
          account: item.account,
          account_name: item.account_name || `${item.account} (názov nenájdený)`,
          amount: item.total_amount || 0,
          count: item.transaction_count || 0
        }))
      },
      profit: profit,
      isProfit: profit >= 0,
      filters: {
        dateFrom: dateFrom || null,
        dateTo: dateTo || null
      }
    };

    res.json(analysis);
    
  } catch (error) {
    console.error('Chyba pri získavaní analýzy nákladov a výnosov:', error);
    res.status(500).json({ error: 'Chyba pri získavaní analýzy nákladov a výnosov' });
  }
});

// 3. ŠTATISTIKY

// 0. KONTROLA SÚBOROV (DEBUG)
router.get('/check-files/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const fs = require('fs');
  const path = require('path');
  
  const fileChecks = {
    databases: [],
    zalohy: []
  };
  
  // Kontrola databases adresára
  const databasesPath = path.join(__dirname, '..', 'databases');
  if (fs.existsSync(databasesPath)) {
    try {
      const files = fs.readdirSync(databasesPath);
      fileChecks.databases = files;
    } catch (err) {
      fileChecks.databases = [`Error: ${err.message}`];
    }
  } else {
    fileChecks.databases = ['Adresár neexistuje'];
  }
  
  // Kontrola zalohy adresára
  const zalohyPath = path.join(__dirname, '..', 'zalohy');
  if (fs.existsSync(zalohyPath)) {
    try {
      const files = fs.readdirSync(zalohyPath);
      fileChecks.zalohy = files;
      
      // Kontrola podadresárov
      if (files.includes('2025')) {
        const year2025Path = path.join(zalohyPath, '2025');
        const year2025Files = fs.readdirSync(year2025Path);
        fileChecks.zalohy_2025 = year2025Files;
        
        if (year2025Files.includes('77788897_2025')) {
          const companyPath = path.join(year2025Path, '77788897_2025');
          const companyFiles = fs.readdirSync(companyPath);
          fileChecks.zalohy_2025_77788897 = companyFiles;
        }
      }
    } catch (err) {
      fileChecks.zalohy = [`Error: ${err.message}`];
    }
  } else {
    fileChecks.zalohy = ['Adresár neexistuje'];
  }
  
  res.json(fileChecks);
});

// Získanie štatistík účtovníctva
router.get('/stats/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { date_from, date_to } = req.query;
  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
    if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });

    const mdbInfo = await getMDBFilePath(company.ico, undefined);
    const mdbPath = mdbInfo.path;
    const mdb = openMdbReader(mdbPath);
    const fa = findTableCaseInsensitive(mdb, 'FA', 'fa');
    if (!fa) return res.json({ issued_invoices: { total_count: 0, total_amount: 0, paid_amount: 0, overdue_amount: 0 }, received_invoices: { total_count: 0, total_amount: 0, paid_amount: 0, overdue_amount: 0 } });

    const rows = fa.getData({ rowOffset: 0 });
    const inRange = (d) => {
      if (!date_from && !date_to) return true; if (!d) return false; const dt=new Date(d); if(Number.isNaN(dt.getTime())) return false; if(date_from && dt<new Date(date_from)) return false; if(date_to && dt>new Date(date_to)) return false; return true;
    };

    const issued = rows.filter(r => Number(r.RelTpFak || r.reltpfak || 0) === 1 && inRange(r.Datum || r.datum));
    const received = rows.filter(r => Number(r.RelTpFak || r.reltpfak || 0) === 11 && inRange(r.Datum || r.datum));

    const sum = (arr, sel) => arr.reduce((s, r) => s + Number(sel(r) || 0), 0);

    const issuedTotal = sum(issued, r => r.KcCelkem || r.kccelkem || r.Kc || r.kc);
    const issuedPaid = sum(issued, r => r.KcLikv || r.kclikv);
    const receivedTotal = sum(received, r => r.KcCelkem || r.kccelkem || r.Kc || r.kc);
    const receivedPaid = sum(received, r => r.KcLikv || r.kclikv);

    res.json({
      issued_invoices: {
        total_count: issued.length,
        total_amount: issuedTotal,
        paid_amount: issuedPaid,
        overdue_amount: Math.max(issuedTotal - issuedPaid, 0)
      },
      received_invoices: {
        total_count: received.length,
        total_amount: receivedTotal,
        paid_amount: receivedPaid,
        overdue_amount: Math.max(receivedTotal - receivedPaid, 0)
      }
    });
  } catch (error) {
    console.error('Chyba pri načítaní štatistík (MDB):', error);
    res.status(500).json({ error: 'Chyba pri načítaní štatistík' });
  }
});

// 4. VYDANÉ FAKTÚRY

// Získanie vydaných faktúr
router.get('/issued-invoices/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { date_from, date_to, limit = 100, offset = 0 } = req.query;
  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
    if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });
    const mdbInfo = await getMDBFilePath(company.ico, undefined);
    const mdbPath = mdbInfo.path;
    const mdb = openMdbReader(mdbPath);
    const fa = findTableCaseInsensitive(mdb, 'FA', 'fa');
    if (!fa) return res.json([]);
    const rows = fa.getData({ rowOffset: 0 });
    const relIssued = 1; // vydané
    const filtered = rows.filter(r => (Number(r.RelTpFak || r.reltpfak || 0) === relIssued));
    const inRange = (d) => {
      if (!date_from && !date_to) return true; if (!d) return false; const dt=new Date(d); if(Number.isNaN(dt.getTime())) return false; if(date_from && dt<new Date(date_from)) return false; if(date_to && dt>new Date(date_to)) return false; return true;
    };
    const mapped = filtered
      .filter(r => inRange(r.Datum || r.datum))
      .map(r => ({
        invoice_number: r.Cislo || r.cislo || '',
        customer_name: r.Firma || r.firma || '',
        customer_ico: r.ICO || r.ico || '',
        issue_date: r.Datum || r.datum || null,
        due_date: r.DatSplat || r.datsplat || null,
        total_amount: Number(r.KcCelkem || r.kccelkem || r.Kc || r.kc || 0),
        vat_amount: Number((r.KcDPH1||0)+(r.KcDPH2||0)+(r.KcDPH3||0)),
        var_sym: r.VarSym || r.varsym || '',
        s_text: r.SText || r.stext || ''
      }))
      .sort((a,b)=> new Date(b.issue_date||0) - new Date(a.issue_date||0))
      .slice(parseInt(offset), parseInt(offset)+parseInt(limit));
    res.json(mapped);
  } catch (error) {
    console.error('Chyba pri načítaní vydaných faktúr (MDB):', error);
    res.status(500).json({ error: 'Chyba pri načítaní faktúr' });
  }
});

// Vytvorenie novej vydanej faktúry
router.post('/issued-invoices/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  
  // Kontrola, či je používateľ admin, company alebo user
  if (req.user.role !== 'admin' && req.user.role !== 'company' && req.user.role !== 'user') {
    return res.status(403).json({ error: 'Prístup zamietnutý. Len admin, firma alebo používateľ môže vytvárať faktúry.' });
  }
  
  const {
    invoice_number,
    customer_name,
    customer_ico,
    customer_dic,
    customer_address,
    issue_date,
    due_date,
    total_amount,
    vat_amount,
    currency,
    notes,
    items
  } = req.body;
  
  const created_by = req.user.email;
  
  db.run(`
    INSERT INTO issued_invoices (
      company_id, invoice_number, customer_name, customer_ico, customer_dic,
      customer_address, issue_date, due_date, total_amount, vat_amount,
      currency, notes, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [companyId, invoice_number, customer_name, customer_ico, customer_dic,
      customer_address, issue_date, due_date, total_amount, vat_amount,
      currency, notes, created_by], function(err) {
    if (err) {
      console.error('Chyba pri vytváraní faktúry:', err);
      return res.status(500).json({ error: 'Chyba pri vytváraní faktúry' });
    }
    
    const invoiceId = this.lastID;
    
    // Pridanie položiek faktúry
    if (items && items.length > 0) {
      const itemValues = items.map(item => [
        invoiceId,
        item.description,
        item.quantity,
        item.unit_price,
        item.vat_rate,
        item.total_price,
        item.vat_amount,
        item.unit || 'ks'
      ]);
      
      const placeholders = items.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(',');
      
      db.run(`
        INSERT INTO issued_invoice_items (
          invoice_id, description, quantity, unit_price, vat_rate,
          total_price, vat_amount, unit
        ) VALUES ${placeholders}
      `, itemValues.flat(), (err) => {
        if (err) {
          console.error('Chyba pri pridávaní položiek faktúry:', err);
        }
      });
    }
    
    res.json({ success: true, id: invoiceId });
  });
});

// 4. PRIJATÉ FAKTÚRY

// Získanie prijatých faktúr
router.get('/received-invoices/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { date_from, date_to, limit = 100, offset = 0 } = req.query;
  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
    if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });
    const mdbInfo = await getMDBFilePath(company.ico, undefined);
    const mdbPath = mdbInfo.path;
    const mdb = openMdbReader(mdbPath);
    const fa = findTableCaseInsensitive(mdb, 'FA', 'fa');
    if (!fa) return res.json([]);
    const rows = fa.getData({ rowOffset: 0 });
    const relReceived = 11; // prijaté
    const filtered = rows.filter(r => (Number(r.RelTpFak || r.reltpfak || 0) === relReceived));
    const inRange = (d) => { if (!date_from && !date_to) return true; if (!d) return false; const dt=new Date(d); if(Number.isNaN(dt.getTime())) return false; if(date_from && dt<new Date(date_from)) return false; if(date_to && dt>new Date(date_to)) return false; return true; };
    const mapped = filtered
      .filter(r => inRange(r.Datum || r.datum))
      .map(r => ({
        invoice_number: r.Cislo || r.cislo || '',
        supplier_name: r.Firma || r.firma || '',
        supplier_ico: r.ICO || r.ico || '',
        issue_date: r.Datum || r.datum || null,
        due_date: r.DatSplat || r.datsplat || null,
        total_amount: Number(r.KcCelkem || r.kccelkem || r.Kc || r.kc || 0),
        vat_amount: Number((r.KcDPH1||0)+(r.KcDPH2||0)+(r.KcDPH3||0)),
        var_sym: r.VarSym || r.varsym || '',
        s_text: r.SText || r.stext || ''
      }))
      .sort((a,b)=> new Date(b.issue_date||0) - new Date(a.issue_date||0))
      .slice(parseInt(offset), parseInt(offset)+parseInt(limit));
    res.json(mapped);
  } catch (error) {
    console.error('Chyba pri načítaní prijatých faktúr (MDB):', error);
    res.status(500).json({ error: 'Chyba pri načítaní faktúr' });
  }
});

// 5. OBNOVENIE FAKTÚR Z MDB

// Obnovenie vydaných faktúr z MDB
router.post('/refresh-invoices/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  
  try {

    // Najprv nájdeme firmu a jej IČO
    db.get("SELECT ico, name FROM companies WHERE id = ?", [companyId], async (err, company) => {
      if (err) {
        console.error('Chyba pri hľadaní firmy:', err);
        return res.status(500).json({ error: 'Chyba pri načítaní firmy' });
      }
      
      if (!company) {
        return res.status(404).json({ error: 'Firma nenájdená' });
      }

      // Vymazanie existujúcich faktúr
      db.run("DELETE FROM issued_invoices WHERE company_id = ?", [companyId], function(err) {
    if (err) {
          console.error('Chyba pri mazaní faktúr:', err);
          return res.status(500).json({ error: 'Chyba pri mazaní faktúr' });
        }

        // Pripojenie k MDB
        const ADODB = require('node-adodb');
        const currentYear = new Date().getFullYear();
        const mdbPath = path.join(__dirname, '..', 'zalohy', currentYear.toString(), `${company.ico}_${currentYear}`, `${company.ico}_${currentYear}.mdb`);

        const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
        
        try {
                     const query = `
             SELECT 
               ID,
               Cislo,
               Firma,
               ICO,
               DIC,
               Ulice,
               PSC,
               Obec,
               Datum,
               DatSplat,
               Kc0,
               Kc1,
               Kc2,
               Kc3,
               KcDPH1, 
               KcDPH2,
               KcDPH3,
               KcCelkem,
               VarSym,
               SText,
               RelTpFak,
               KcLikv,
               KcZUplat,
               DatLikv
             FROM [FA] 
             WHERE RelTpFak = 1
             ORDER BY Datum DESC
           `;
          
          connection.query(query)
            .then(data => {

              // Import faktúr do databázy
              let importedCount = 0;
              
              data.forEach((row, index) => {
                // Výpočet základu bez DPH (Kc0 + Kc1 + Kc2 + Kc3)
                const base_amount = (parseFloat(row.Kc0) || 0) + (parseFloat(row.Kc1) || 0) + (parseFloat(row.Kc2) || 0) + (parseFloat(row.Kc3) || 0);
                
                // Výpočet celkovej DPH
                const vat_total = (parseFloat(row.KcDPH1) || 0) + (parseFloat(row.KcDPH2) || 0) + (parseFloat(row.KcDPH3) || 0);
                
                                 // Vloženie novej faktúry - OPRAVENÝ INSERT s likvidáciou
                 db.run(`
                   INSERT INTO issued_invoices (
                     company_id, invoice_number, customer_name, customer_ico, customer_dic, 
                     customer_address, issue_date, due_date, total_amount, vat_amount, 
                     currency, status, pohoda_id, notes, created_by, created_at, updated_at,
                     kc_dph1, kc_dph2, kc_dph3, var_sym, s_text, kc_celkem, kc0, dat_splat, 
                     firma, ico, dic, ulice, psc, obec, mdb_cislo, mdb_id, rel_tp_fak, datum,
                     kc1, kc2, kc3, kc_likv, kc_u, dat_likv
                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                     ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 `, [
                   companyId,
                   row.Cislo || '',
                   row.Firma || '',
                   row.ICO || '',
                   row.DIC || '',
                   `${row.Ulice || ''}, ${row.PSC || ''} ${row.Obec || ''}`.trim().replace(/^,\s*/, ''),
                   row.Datum ? new Date(row.Datum).toISOString().split('T')[0] : '',
                   row.DatSplat ? new Date(row.DatSplat).toISOString().split('T')[0] : '',
                   base_amount,
                   vat_total,
                   'EUR',
                   'sent',
                   null, // pohoda_id
                   row.SText || '',
                   req.user.email,
                   new Date().toISOString(),
                   new Date().toISOString(),
                   parseFloat(row.KcDPH1) || 0,
                   parseFloat(row.KcDPH2) || 0,
                   parseFloat(row.KcDPH3) || 0,
                   row.VarSym || '',
                   row.SText || '',
                   parseFloat(row.KcCelkem) || 0,
                   parseFloat(row.Kc0) || 0,
                   row.DatSplat || null,
                   row.Firma || '',
                   row.ICO || '',
                   row.DIC || '',
                   row.Ulice || '',
                   row.PSC || '',
                   row.Obec || '',
                   row.Cislo || '',
                   row.ID || null,
                   row.RelTpFak || null,
                   row.Datum || null,
                   parseFloat(row.Kc1) || 0,
                   parseFloat(row.Kc2) || 0,
                   parseFloat(row.Kc3) || 0,
                   parseFloat(row.KcLikv) || 0,
                   parseFloat(row.KcU) || 0,
                   row.DatLikv ? new Date(row.DatLikv).toISOString().split('T')[0] : null
                 ], function(err) {
    if (err) {
                    console.error('Chyba pri vkladaní faktúry:', err);
                  } else {
                    importedCount++;

                  }
                  
                  // Ak sme spracovali všetky faktúry, pošleme odpoveď
                  if (index === data.length - 1) {
                    res.json({
                      success: true,
                      message: `Obnovenie dokončené. Importovaných ${importedCount} faktúr.`,
                      importedCount: importedCount,
                      totalCount: data.length
                    });
                  }
          });
        });
            })
            .catch(error => {
              console.error('Chyba pri čítaní MDB:', error);
              res.status(500).json({ error: 'Chyba pri čítaní MDB databázy' });
            });
            
        } catch (error) {
          console.error('Chyba pri vytváraní pripojenia k MDB:', error);
          res.status(500).json({ error: 'Chyba pri pripojení k MDB databáze' });
        }
  });
});

  } catch (error) {
    console.error('Chyba pri obnovení faktúr:', error);
    res.status(500).json({ error: 'Chyba pri obnovení faktúr' });
  }
});

// Obnovenie prijatých faktúr z MDB
router.post('/refresh-received-invoices/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  
  try {

    // Najprv nájdeme firmu a jej IČO
    db.get("SELECT ico, name FROM companies WHERE id = ?", [companyId], async (err, company) => {
    if (err) {
        console.error('Chyba pri hľadaní firmy:', err);
        return res.status(500).json({ error: 'Chyba pri načítaní firmy' });
      }
      
      if (!company) {
        return res.status(404).json({ error: 'Firma nenájdená' });
      }

      // Vymazanie existujúcich prijatých faktúr
      db.run("DELETE FROM received_invoices WHERE company_id = ?", [companyId], function(err) {
        if (err) {
          console.error('Chyba pri mazaní prijatých faktúr:', err);
          return res.status(500).json({ error: 'Chyba pri mazaní prijatých faktúr' });
        }

        // Pripojenie k MDB
        const ADODB = require('node-adodb');
        const currentYear = new Date().getFullYear();
        const mdbPath = path.join(__dirname, '..', 'zalohy', currentYear.toString(), `${company.ico}_${currentYear}`, `${company.ico}_${currentYear}.mdb`);

        const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
        
        try {
                     const query = `
          SELECT 
               ID,
               Cislo,
               Firma,
               ICO,
               DIC,
               Ulice,
               PSC,
               Obec,
               Datum,
               DatSplat,
               Kc0,
               Kc1,
               Kc2,
               Kc3,
               KcDPH1, 
               KcDPH2,
               KcDPH3,
               KcCelkem,
               VarSym,
               SText,
               RelTpFak,
               KcLikv,
               KcU,
               DatLikv
             FROM [FA] 
             WHERE RelTpFak = 11
             ORDER BY Datum DESC
           `;
          
          connection.query(query)
            .then(data => {

              // Import prijatých faktúr do databázy
    let importedCount = 0;
              
              data.forEach((row, index) => {
                // Výpočet základu bez DPH (Kc0 + Kc1 + Kc2 + Kc3)
                const base_amount = (parseFloat(row.Kc0) || 0) + (parseFloat(row.Kc1) || 0) + (parseFloat(row.Kc2) || 0) + (parseFloat(row.Kc3) || 0);
                
                // Výpočet celkovej DPH
                const vat_total = (parseFloat(row.KcDPH1) || 0) + (parseFloat(row.KcDPH2) || 0) + (parseFloat(row.KcDPH3) || 0);
                
                                 // Vloženie novej prijatej faktúry s likvidáciou
              db.run(`
                   INSERT INTO received_invoices (
                     company_id, invoice_number, supplier_name, supplier_ico, supplier_dic,
                     supplier_address, issue_date, due_date, total_amount, vat_amount,
                     kc0, kc1, kc2, kc3, kc_dph1, kc_dph2, kc_dph3, kc_celkem, var_sym, s_text,
                     mdb_id, rel_tp_fak, datum, dat_splat, firma, ico, dic, ulice, psc, obec,
                     mdb_cislo, base_0, base_1, base_2, base_3, vat_0, vat_1, vat_2, vat_3,
                     varsym, currency, status, pohoda_id, notes, created_by, created_at, updated_at,
                     kc_likv, kc_u, dat_likv
                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                     ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                companyId,
                   row.Cislo || '',
                   row.Firma || '',
                   row.ICO || '',
                   row.DIC || '',
                   `${row.Ulice || ''}, ${row.PSC || ''} ${row.Obec || ''}`.trim().replace(/^,\s*/, ''),
                   row.Datum ? new Date(row.Datum).toISOString().split('T')[0] : '',
                   row.DatSplat ? new Date(row.DatSplat).toISOString().split('T')[0] : '',
                   base_amount,
                   vat_total,
                   parseFloat(row.Kc0) || 0,
                   parseFloat(row.Kc1) || 0,
                   parseFloat(row.Kc2) || 0,
                   parseFloat(row.Kc3) || 0,
                   parseFloat(row.KcDPH1) || 0,
                   parseFloat(row.KcDPH2) || 0,
                   parseFloat(row.KcDPH3) || 0,
                   parseFloat(row.KcCelkem) || 0,
                   row.VarSym || '',
                   row.SText || '',
                   row.ID || null,
                   row.RelTpFak || null,
                   row.Datum || null,
                   row.DatSplat || null,
                   row.Firma || '',
                   row.ICO || '',
                   row.DIC || '',
                   row.Ulice || '',
                   row.PSC || '',
                   row.Obec || '',
                   row.Cislo || '',
                   parseFloat(row.Kc0) || 0,
                   parseFloat(row.Kc1) || 0,
                   parseFloat(row.Kc2) || 0,
                   parseFloat(row.Kc3) || 0,
                   parseFloat(row.KcDPH1) || 0,
                   parseFloat(row.KcDPH2) || 0,
                   parseFloat(row.KcDPH3) || 0,
                   parseFloat(row.KcDPH3) || 0,
                   row.VarSym || '',
                   'EUR',
                   'received',
                   null, // pohoda_id
                   row.SText || '',
                   req.user.email,
                   new Date().toISOString(),
                   new Date().toISOString(),
                   parseFloat(row.KcLikv) || 0,
                   parseFloat(row.KcU) || 0,
                   row.DatLikv ? new Date(row.DatLikv).toISOString().split('T')[0] : null
              ], function(err) {
    if (err) {
                    console.error('Chyba pri vkladaní prijatej faktúry:', err);
                  } else {
          importedCount++;

                  }
                  
                  // Ak sme spracovali všetky faktúry, pošleme odpoveď
                  if (index === data.length - 1) {
          res.json({
      success: true, 
                      message: `Obnovenie prijatých faktúr dokončené. Importovaných ${importedCount} faktúr.`,
                      importedCount: importedCount,
                      totalCount: data.length
                    });
                  }
        });
      });
            })
            .catch(error => {
              console.error('Chyba pri čítaní MDB:', error);
              res.status(500).json({ error: 'Chyba pri čítaní MDB databázy' });
    });
            
        } catch (error) {
          console.error('Chyba pri vytváraní pripojenia k MDB:', error);
          res.status(500).json({ error: 'Chyba pri pripojení k MDB databáze' });
        }
  });
});

  } catch (error) {
    console.error('Chyba pri obnovení prijatých faktúr:', error);
    res.status(500).json({ error: 'Chyba pri obnovení prijatých faktúr' });
  }
});

// 6. DPH PODANIA

// Získanie DPH podaní z MDB
router.get('/vat-returns/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { year } = req.query;

  try {
    // Získanie informácií o firme
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }
    
    const mdbInfo = await getMDBFilePath(company.ico, undefined);
    const mdbPath = mdbInfo.path;
    const mdb = openMdbReader(mdbPath);
    const dphTable = findTableCaseInsensitive(mdb, 'DPH', 'dph');
    const selectedYear = parseInt(year) || new Date().getFullYear();

    let returns = [];
    if (dphTable) {
      const rows = dphTable.getData({ rowOffset: 0 });
      returns = rows
        .filter(r => parseInt(r.Rok || r.rok) === selectedYear)
        .sort((a,b)=> (parseInt(a.RelObDPH||a.relobdph||0)) - (parseInt(b.RelObDPH||b.relobdph||0)))
        .map((row, index) => ({
          id: index + 1,
          rok: parseInt(row.Rok || row.rok) || selectedYear,
          mesiac: parseInt(row.RelObDPH || row.relobdph || 0) || 0,
          povinnost: Number(row.KcDan || row.kcdan || 0),
          odpočet: Number(row.KcOdpoc || row.kcodpoc || 0),
          odoslané: (row.ElOdeslano ?? row.elodeslano) === true || (row.ElOdeslano ?? row.elodeslano) === 1 || (row.ElOdeslano ?? row.elodeslano) === 'True'
        }));
    }
    
    // Výpočet súhrnu
    const summary = {
      totalPovinnost: returns.reduce((sum, item) => sum + item.povinnost, 0),
      totalOdpočet: returns.reduce((sum, item) => sum + item.odpočet, 0),
      totalRozdiel: returns.reduce((sum, item) => sum + (item.povinnost - item.odpočet), 0),
      odoslanéCount: returns.filter(item => item.odoslané).length,
      neodoslanéCount: returns.filter(item => !item.odoslané).length
    };
    
    const response = {
      company: {
        id: company.id,
        name: company.name,
        ico: company.ico
      },
      year: parseInt(selectedYear),
      returns: returns,
      summary: summary
    };

    res.json(response);
    
  } catch (error) {
    console.error('❌ Chyba pri načítaní DPH dát:', error);
    res.status(500).json({ error: 'Chyba pri načítaní DPH dát' });
  }
});

// 7. BANKOVÉ ÚČTY

// Získanie bankových účtov z MDB
router.get('/bank-accounts/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;

  try {
    // Získanie informácií o firme
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
              });
            });
          
    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }

    const mdbInfo = await getMDBFilePath(company.ico, undefined);
    const mdbPath = mdbInfo.path;
    const mdb = openMdbReader(mdbPath);
    const sUcet = findTableCaseInsensitive(mdb, 'sUcet', 'sUCET', 'SUCET', 'sucet');
    const pUD = findTableCaseInsensitive(mdb, 'pUD', 'PUD', 'pud');
    if (!sUcet || !pUD) {
      return res.json({ company: { id: company.id, name: company.name, ico: company.ico }, accounts: [], summary: { totalBalance: 0, totalCredit: 0, totalDebit: 0, accountCount: 0 }, message: 'Tabuľky sUcet/pUD neboli nájdené' });
    }
    const accountRows = sUcet.getData({ rowOffset: 0 });
    const pudRows = pUD.getData({ rowOffset: 0 });
    const byUMD = new Map();
    const byUD = new Map();
    for (const r of pudRows) { const kc=Number(r.Kc||r.kc||0); const umd=String(r.UMD||r.umd||''); const ud=String(r.UD||r.ud||''); if(umd) byUMD.set(umd,(byUMD.get(umd)||0)+kc); if(ud) byUD.set(ud,(byUD.get(ud)||0)+kc); }
    const accounts = [];
    let totalBalance=0,totalCredit=0,totalDebit=0;
    for (const a of accountRows) {
      let num=String(a.AUcet||a.aucet||''); const name=a.SText||a.stext||''; const rel=Number(a.RelJeUcet||a.reljeucet||0); const bank=a.Banka||a.banka||'Neznáma banka';
      if(!name) continue; if(rel===1) continue; if(!num) num='221000'; if(!num.startsWith('221')) continue;
      const creditTotal=Number(byUMD.get(num)||0); const debitTotal=Number(byUD.get(num)||0); const balance=creditTotal-debitTotal;
      accounts.push({ id:a.ID||accounts.length+1, accountNumber:name, accountName:name, bankName:bank, balance, creditTotal, debitTotal, transactionCount:undefined, pudAccount:num });
      totalBalance+=balance; totalCredit+=creditTotal; totalDebit+=debitTotal;
    }
    res.json({ company:{ id:company.id, name:company.name, ico:company.ico }, accounts, summary:{ totalBalance, totalCredit, totalDebit, accountCount:accounts.length }, message: accounts.length===0?'Neboli nájdené žiadne bankové účty (221)':undefined });
    
  } catch (error) {
    console.error('❌ Chyba pri načítaní bankových dát:', error);
    res.status(500).json({ error: 'Chyba pri načítaní bankových dát' });
  }
});

// 8. POKLADŇA

// Získanie pokladňových účtov z MDB
router.get('/cash-accounts/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  
  try {
    // Získanie informácií o firme
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }
    
    const mdbInfo = await getMDBFilePath(company.ico, undefined);
    const mdbPath = mdbInfo.path;
    const mdb = openMdbReader(mdbPath);
    const sUcet = findTableCaseInsensitive(mdb, 'sUcet', 'sUCET', 'SUCET', 'sucet');
    const pUD = findTableCaseInsensitive(mdb, 'pUD', 'PUD', 'pud');
    if (!sUcet || !pUD) {
      return res.json({ company: { id: company.id, name: company.name, ico: company.ico }, accounts: [], summary: { totalBalance: 0, totalCredit: 0, totalDebit: 0, accountCount: 0 } });
    }
    const accountRows = sUcet.getData({ rowOffset: 0 }).filter(a => String(a.AUcet || a.aucet || '').startsWith('211'));
    const pudRows = pUD.getData({ rowOffset: 0 });
    const byUMD = new Map();
    const byUD = new Map();
    for (const r of pudRows) { const kc=Number(r.Kc||r.kc||0); const umd=String(r.UMD||r.umd||''); const ud=String(r.UD||r.ud||''); if(umd) byUMD.set(umd,(byUMD.get(umd)||0)+kc); if(ud) byUD.set(ud,(byUD.get(ud)||0)+kc); }
    const accounts = [];
    let totalBalance = 0, totalCredit = 0, totalDebit = 0;
    for (const a of accountRows) {
      const num = String(a.AUcet || a.aucet || '211000');
      const accountName = (num === '211000' || !a.SText) ? 'Hlavná pokladňa' : (a.SText || a.stext);
      const creditTotal = Number(byUMD.get(num) || 0);
      const debitTotal = Number(byUD.get(num) || 0);
      const balance = creditTotal - debitTotal;
      accounts.push({ id: a.ID || accounts.length + 1, accountNumber: num, accountName, balance, creditTotal, debitTotal, transactionCount: undefined });
      totalBalance += balance; totalCredit += creditTotal; totalDebit += debitTotal;
    }
    res.json({ company: { id: company.id, name: company.name, ico: company.ico }, accounts, summary: { totalBalance, totalCredit, totalDebit, accountCount: accounts.length } });
    
  } catch (error) {
    console.error('❌ Chyba pri načítaní pokladňových dát:', error);
    res.status(500).json({ error: 'Chyba pri načítaní pokladňových dát' });
  }
});

// 9. BANKOVÉ TRANSAKCIE

// Získanie transakcií pre konkrétny bankový účet
router.get('/bank-transactions/:companyId/:accountNumber', authenticateToken, async (req, res) => {
  const { companyId, accountNumber } = req.params;

  try {
    // Získanie informácií o firme
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
              });
            });
          
    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }
    
    const mdbInfo = await getMDBFilePath(company.ico, undefined);
    const mdbPath = mdbInfo.path;
    const mdb = openMdbReader(mdbPath);
    const sUcet = findTableCaseInsensitive(mdb, 'sUcet', 'sUCET', 'SUCET', 'sucet');
    const pUD = findTableCaseInsensitive(mdb, 'pUD', 'PUD', 'pud');
    if (!pUD) {
      return res.json({ company: { id: company.id, name: company.name, ico: company.ico }, account: { accountNumber, accountName: accountNumber, bankName: 'Neznáma banka' }, transactions: [], summary: { totalCredit: 0, totalDebit: 0, currentBalance: 0, transactionCount: 0 } });
    }
    const sUcetRows = sUcet ? sUcet.getData({ rowOffset: 0 }) : [];
    // Očakávame, že param je AUcet (napr. 221000). Ak by prišiel SText, nájdeme ho a použijeme jeho AUcet.
    let pudAccountNumber = accountNumber;
    const matched = sUcetRows.find(a => String(a.AUcet || a.aucet || '') === accountNumber || String(a.SText || a.stext || '') === accountNumber);
    if (matched) pudAccountNumber = String(matched.AUcet || matched.aucet || accountNumber);

    const rows = pUD.getData({ rowOffset: 0 }).filter(r => String(r.UMD || r.umd || '') === pudAccountNumber || String(r.UD || r.ud || '') === pudAccountNumber);
    rows.sort((a,b)=> new Date(a.Datum || a.datum || 0) - new Date(b.Datum || b.datum || 0));

    const transactions = [];
    let totalCredit = 0;
    let totalDebit = 0;
    let runningBalance = 0;
    for (const r of rows) {
      const isCredit = String(r.UMD || r.umd || '') === pudAccountNumber;
      const amount = Number(r.Kc || r.kc || 0);
      if (isCredit) { runningBalance += amount; totalCredit += amount; }
      else { runningBalance -= amount; totalDebit += amount; }
      transactions.push({
        id: r.ID,
        datum: r.Datum || r.datum || null,
        popis: r.SText || r.stext || (r.Cislo ? `Transakcia ${r.Cislo}` : 'Transakcia'),
        kredit: isCredit ? amount : 0,
        debet: isCredit ? 0 : amount,
        zostatok: runningBalance,
        typ: isCredit ? 'kredit' : 'debet',
        firma: r.Firma || r.firma || ''
      });
    }

    res.json({
      company: { id: company.id, name: company.name, ico: company.ico },
      account: {
        accountNumber: matched ? (matched.SText || matched.AUcet) : accountNumber,
        accountName: matched ? (matched.SText || `Bankový účet ${matched.AUcet}`) : accountNumber,
        bankName: matched ? (matched.Banka || 'Neznáma banka') : 'Neznáma banka',
        pudAccount: pudAccountNumber
      },
      transactions,
      summary: { totalCredit, totalDebit, currentBalance: runningBalance, transactionCount: transactions.length }
    });
          
        } catch (error) {
    console.error('❌ Chyba pri načítaní transakcií:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    res.status(500).json({ 
      error: 'Chyba pri načítaní transakcií',
      details: error.message,
      stack: error.stack
    });
  }
});

// Získanie pokladní z MDB
router.get('/cash-accounts/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;

  try {
    // Získanie informácií o firme
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }

    const mdbPath = path.join(__dirname, '..', 'zalohy', '2025', `${company.ico}_2025`, `${company.ico}_2025.mdb`);

    if (!fs.existsSync(mdbPath)) {

      return res.status(404).json({ 
        error: 'MDB súbor nebol nájdený',
        details: {
          companyId: companyId,
          companyName: company.name,
          companyIco: company.ico,
          mdbPath: mdbPath
        }
      });
    }

    // Načítanie pokladní z MDB
    const ADODB = require('node-adodb');
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // Získanie všetkých účtov z tabuľky sUcet a potom filtrovanie pokladní
    const accountsQuery = `
      SELECT 
        ID,
        AUcet,
        SText,
        Banka,
        RelJeUcet
      FROM sUcet 
      ORDER BY AUcet
    `;

    const allAccountsData = await connection.query(accountsQuery);
    
    console.log('💰 Nájdených účtov v sUcet (pred filtrovaním):', allAccountsData.length);
    
    const accounts = [];
    let totalBalance = 0;
    let totalCredit = 0;
    let totalDebit = 0;
    
    for (const account of allAccountsData) {
      let accountNumber = account.AUcet;
      let displayAccountNumber = account.SText; // Pre zobrazenie použijeme SText
      
      // Ak je SText prázdne, preskočíme tento účet úplne
      if (!displayAccountNumber || displayAccountNumber === '') {

        continue;
      }
      
      // Ak je AUcet prázdne, použijeme 211000 pre výpočty v pUD
      if (!accountNumber || accountNumber === '') {
        accountNumber = '211000'; // Pre výpočty v pUD

      }
      
      // Filtrujeme iba pokladne (211)
      if (!accountNumber.startsWith('211')) {
        continue; // Preskočíme tento účet, ak nie je 211
      }
      
      const accountName = displayAccountNumber; // Používame SText, ktorý už vieme že nie je prázdny
      const bankName = account.Banka || 'Pokladňa';
      
      console.log(`💰 Spracujem pokladňu: ${accountNumber} (pUD), zobrazenie: ${displayAccountNumber}, názov: ${accountName}`);
      
      // Získanie kreditných pohybov (UMD) pre túto pokladňu z pUD
      const creditQuery = `
        SELECT 
          SUM(pUD.Kc) as credit_total,
          COUNT(*) as transaction_count
        FROM pUD 
        WHERE pUD.UMD = '${accountNumber}'
      `;
      
      // Získanie debetných pohybov (UD) pre túto pokladňu z pUD
      const debitQuery = `
        SELECT 
          SUM(pUD.Kc) as debit_total
        FROM pUD 
        WHERE pUD.UD = '${accountNumber}'
      `;

      const creditData = await connection.query(creditQuery);
      const debitData = await connection.query(debitQuery);

      const creditTotal = parseFloat(creditData[0]?.credit_total) || 0;
      const debitTotal = parseFloat(debitData[0]?.debit_total) || 0;
      const balance = creditTotal - debitTotal;
      const transactionCount = parseInt(creditData[0]?.transaction_count) || 0;
      
      accounts.push({
        id: account.ID || accounts.length + 1,
        accountNumber: displayAccountNumber, // Zobrazujeme SText
        accountName: accountName,
        bankName: bankName,
        balance: balance,
        creditTotal: creditTotal,
        debitTotal: debitTotal,
        transactionCount: transactionCount
      });
      
      totalBalance += balance;
      totalCredit += creditTotal;
      totalDebit += debitTotal;
    }
    
    const response = {
      company: {
        id: company.id,
        name: company.name,
        ico: company.ico
      },
      accounts: accounts,
      summary: {
        totalBalance: totalBalance,
        totalCredit: totalCredit,
        totalDebit: totalDebit,
        accountCount: accounts.length
      },
      message: accounts.length === 0 ? 'Neboli nájdené žiadne pokladne (211)' : undefined
    };

    res.json(response);
    
  } catch (error) {
    console.error('❌ Chyba pri načítaní pokladňových dát:', error);
    res.status(500).json({ error: 'Chyba pri načítaní pokladňových dát' });
  }
});

// Získanie transakcií pokladne z MDB
router.get('/cash-transactions/:companyId/:accountNumber', authenticateToken, async (req, res) => {
  const { companyId, accountNumber } = req.params;

  try {
    // Získanie informácií o firme
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }
    
    const mdbInfo = await getMDBFilePath(company.ico, undefined);
    const mdbPath = mdbInfo.path;
    const mdb = openMdbReader(mdbPath);
    const sUcet = findTableCaseInsensitive(mdb, 'sUcet', 'sUCET', 'SUCET', 'sucet');
    const pUD = findTableCaseInsensitive(mdb, 'pUD', 'PUD', 'pud');
    if (!pUD) {
      return res.json({ company: { id: company.id, name: company.name, ico: company.ico }, account: { accountNumber, accountName: accountNumber, bankName: 'Pokladňa' }, transactions: [], summary: { totalCredit: 0, totalDebit: 0, currentBalance: 0, transactionCount: 0 } });
    }
    const sRows = sUcet ? sUcet.getData({ rowOffset: 0 }) : [];
    let pudAccountNumber = accountNumber;
    const matched = sRows.find(a => String(a.AUcet || a.aucet || '') === accountNumber || String(a.SText || a.stext || '') === accountNumber);
    if (matched) pudAccountNumber = String(matched.AUcet || matched.aucet || accountNumber);
    if (!pudAccountNumber || pudAccountNumber === '') pudAccountNumber = '211000';

    const rows = pUD.getData({ rowOffset: 0 }).filter(r => String(r.UMD || r.umd || '') === pudAccountNumber || String(r.UD || r.ud || '') === pudAccountNumber);
    rows.sort((a,b)=> new Date(a.Datum || a.datum || 0) - new Date(b.Datum || b.datum || 0));

    const transactions = [];
    let totalCredit = 0, totalDebit = 0, runningBalance = 0;
    for (const r of rows) {
      const isCredit = String(r.UMD || r.umd || '') === pudAccountNumber;
      const amount = Number(r.Kc || r.kc || 0);
      if (isCredit) { runningBalance += amount; totalCredit += amount; }
      else { runningBalance -= amount; totalDebit += amount; }
      transactions.push({ id: r.ID, datum: r.Datum || r.datum || null, popis: r.SText || r.stext || (r.Cislo ? `Transakcia ${r.Cislo}` : 'Transakcia'), kredit: isCredit ? amount : 0, debet: isCredit ? 0 : amount, zostatok: runningBalance, typ: isCredit ? 'kredit' : 'debet', firma: r.Firma || r.firma || '' });
    }

    res.json({ company: { id: company.id, name: company.name, ico: company.ico }, account: { accountNumber: matched ? (matched.SText || matched.AUcet) : accountNumber, accountName: matched ? ((matched.AUcet === '211000' || !matched.SText) ? 'Hlavná pokladňa' : matched.SText) : accountNumber, bankName: matched ? (matched.Banka || 'Pokladňa') : 'Pokladňa', pudAccount: pudAccountNumber }, transactions, summary: { totalCredit, totalDebit, currentBalance: runningBalance, transactionCount: transactions.length } });
    
  } catch (error) {
    console.error('❌ Chyba pri načítaní transakcií pokladne:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    res.status(500).json({ 
      error: 'Chyba pri načítaní transakcií pokladne',
      details: error.message,
      stack: error.stack
    });
  }
});

// TESTOVACÍ ENDPOINT PRE DROPBOX BEZ AUTENTIFIKÁCIE
router.get('/test-dropbox-public', async (req, res) => {
  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      dropbox: {
        isInitialized: dropboxService.isInitialized(),
        accessToken: dropboxService.isInitialized() ? 'Nastavený' : 'Chýba',
        testResults: {}
      }
    };

    // Test Dropbox pripojenia
    if (dropboxService.isInitialized()) {
      try {
        // Test 1: Zoznam dostupných MDB súborov
        const mdbFiles = await dropboxService.listMDBFiles();
        testResults.dropbox.testResults.availableFiles = mdbFiles;
        testResults.dropbox.testResults.listFilesSuccess = true;
        
        // Test 2: Kontrola existencie konkrétneho MDB súboru (ak existujú súbory)
        if (mdbFiles && mdbFiles.length > 0) {
          const firstFile = mdbFiles[0];
          const fileName = firstFile.name;
          const companyIco = fileName.split('_')[0]; // Predpokladáme formát ICO_ROK.mdb
          
          const fileExists = await dropboxService.checkMDBFileExists(companyIco, '2025');
          testResults.dropbox.testResults.sampleFileExists = fileExists;
          testResults.dropbox.testResults.sampleCompanyIco = companyIco;
        }
    
  } catch (error) {
        testResults.dropbox.testResults.error = error.message;
        testResults.dropbox.testResults.errorStack = error.stack;
      }
    }

    res.json(testResults);
    
  } catch (error) {
    console.error('❌ Chyba pri testovaní Dropbox:', error);
    res.status(500).json({ 
      error: 'Chyba pri testovaní Dropbox',
      details: error.message,
      stack: error.stack});
    console.error('Chyba pri upload endpoint:', error);
    res.status(500).json({ error: 'Chyba pri spracovaní požiadavky' });
  }
});
// Test Spaces endpoint
router.get('/admin/spaces/test', authenticateToken, async (req, res) => {
  try {
    // Kontrola, či je používateľ admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Prístup zamietnutý. Len admin môže testovať Spaces.' });
    }

    // Pre test endpoint - vrátiť success
    res.json({ 
      success: true, 
      message: 'Spaces test endpoint je dostupný',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chyba pri Spaces test:', error);
    res.status(500).json({ error: 'Chyba pri spracovaní požiadavky' });
  }
});

// Admin: výpis dostupných MDB/ACCDB súborov (lokálne)
router.get('/admin/mdb/files', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const roots = [
      path.resolve(__dirname, '..', 'uploads'),
      path.resolve(__dirname, '..', 'zalohy'),
      path.resolve(__dirname, '..', '..', 'uploads')
    ];

    const allowedExtensions = new Set(['.mdb', '.accdb']);
    const filesFound = [];

    for (const rootDir of roots) {
      if (!fs.existsSync(rootDir)) continue;
      const entries = fs.readdirSync(rootDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (!allowedExtensions.has(ext)) continue;
        const fullPath = path.join(rootDir, entry.name);
        const stats = fs.statSync(fullPath);
        filesFound.push({
          name: entry.name,
          dir: rootDir,
          path: fullPath,
          size: stats.size,
          mtime: stats.mtime
        });
      }
    }

    filesFound.sort((a, b) => b.mtime - a.mtime);
    res.json({ count: filesFound.length, files: filesFound });
  } catch (err) {
    console.error('LIST MDB ERR:', err);
    res.status(500).json({ error: 'Failed to list MDB files' });
  }
});

// Per-company listing
router.get('/admin/mdb/files/:companyId', authenticateToken, ensureAdmin, (req, res, next) => {
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
  } catch (e) { next(e); }
});

// Download file
router.get('/admin/mdb/download/:companyId/:filename', authenticateToken, ensureAdmin, (req, res, next) => {
  try {
    const dir = ensureCompanyDir(req.params.companyId);
    const file = safeName(req.params.filename);
    if (!/\.mdb$/i.test(file)) {
      const err = new Error('Only .mdb files are allowed');
      err.status = 400; throw err;
    }
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) {
      const err = new Error('File not found');
      err.status = 404; throw err;
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
    res.setHeader('X-Accel-Buffering', 'no');
    const stream = fs.createReadStream(full);
    stream.on('error', next);
    stream.pipe(res);
  } catch (e) { next(e); }
});

// Delete file
router.delete('/admin/mdb/file/:companyId/:filename', authenticateToken, ensureAdmin, (req, res, next) => {
  try {
    const dir = ensureCompanyDir(req.params.companyId);
    const file = safeName(req.params.filename);
    if (!/\.mdb$/i.test(file)) {
      const err = new Error('Only .mdb files are allowed');
      err.status = 400; throw err;
    }
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) {
      const err = new Error('File not found');
      err.status = 404; throw err;
    }
    fs.unlinkSync(full);
    res.json({ success: true, message: 'MDB súbor bol odstránený', filename: file });
  } catch (e) { next(e); }
});

// HEAD exist
router.head('/admin/mdb/file/:companyId/:filename', authenticateToken, ensureAdmin, (req, res, next) => {
  try {
    const dir = ensureCompanyDir(req.params.companyId);
    const file = safeName(req.params.filename);
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) return res.sendStatus(404);
    return res.sendStatus(200);
  } catch (e) { next(e); }
});

// Scoped error handler for /admin/mdb
router.use('/admin/mdb', (err, req, res, next) => {
  console.error('📦 MDB upload error:', err && err.message, err && err.stack);
  const status = err && err.status ? err.status : 500;
  res.status(status).json({ error: (err && err.message) || 'Upload failed' });
});

module.exports = router;

router.post("/admin/mdb/upload/:companyId", authenticateToken, ensureAdmin, upload.single("file"), async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "Súbor nie je priložený alebo pole sa nevolá 'file'" });
    }
    
    return res.json({
      success: true,
      message: "MDB súbor bol úspešne nahraný",
      filename: req.file.originalname,
      storedAs: req.file.filename,
      size: req.file.size,
      companyId
    });

  } catch (error) {
    console.error("Chyba pri upload endpoint:", error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || "Chyba pri spracovaní požiadavky" });
  }
});
