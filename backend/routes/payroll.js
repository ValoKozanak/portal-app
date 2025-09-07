const express = require('express');
const router = express.Router();
const { db } = require('../database');
const fs = require('fs');
const path = require('path');

// Middleware pre autentifikáciu
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Prístupový token je povinný' });
  }

  // Pre jednoduchosť akceptujeme akýkoľvek token
  // V produkcii by sa mal overovať JWT token
  next();
};

// Získanie mzdových období pre firmu
router.get('/periods/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { year } = req.query;

  let query = `
    SELECT * FROM payroll_periods 
    WHERE company_id = ?
  `;
  let params = [companyId];

  if (year) {
    query += ' AND year = ?';
    params.push(year);
  }

  query += ' ORDER BY year DESC, month DESC';

  db.all(query, params, (err, periods) => {
    if (err) {
      console.error('Chyba pri získavaní mzdových období:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní mzdových období' });
    }
    
    res.json(periods);
  });
});

// Získanie aktuálneho neuzatvoreného obdobia
router.get('/periods/:companyId/current', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  db.get(`
    SELECT * FROM payroll_periods 
    WHERE company_id = ? AND year = ? AND month = ?
  `, [companyId, currentYear, currentMonth], (err, period) => {
    if (err) {
      console.error('Chyba pri získavaní aktuálneho obdobia:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní aktuálneho obdobia' });
    }
    
    res.json(period);
  });
});

// Inicializácia mzdových období pre rok (vytvorí chýbajúce mesiace)
router.post('/periods/:companyId/init', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { year } = req.body || {};
  const targetYear = Number(year) || new Date().getFullYear();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const runInsert = (month, cb) => {
    let isClosed = 0;
    let closedAt = null;
    let closedBy = null;
    if (targetYear < currentYear || (targetYear === currentYear && month < currentMonth)) {
      isClosed = 1;
      // nastavíme closed_at na prvý deň mesiaca daného obdobia
      closedAt = new Date(targetYear, month - 1, 1).toISOString();
      closedBy = 'system';
    }
    db.run(
      `INSERT OR IGNORE INTO payroll_periods (
         company_id, year, month, is_closed, closed_at, closed_by
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [companyId, targetYear, month, isClosed, closedAt, closedBy],
      cb
    );
  };

  // vložíme 12 mesiacov (INSERT OR IGNORE – neprepíše existujúce)
  let pending = 12;
  let failed = false;
  for (let m = 1; m <= 12; m++) {
    runInsert(m, (err) => {
      if (failed) return;
      if (err) {
        failed = true;
        console.error('Chyba pri inicializácii mzdových období:', err);
        return res.status(500).json({ error: 'Chyba pri inicializácii mzdových období' });
      }
      pending--;
      if (pending === 0) {
        // po dokončení vrátime zoznam období pre rok
        db.all(
          `SELECT * FROM payroll_periods WHERE company_id = ? AND year = ? ORDER BY month ASC`,
          [companyId, targetYear],
          (e2, rows) => {
            if (e2) {
              console.error('Chyba pri načítaní mzdových období po inicializácii:', e2);
              return res.status(500).json({ error: 'Chyba pri načítaní mzdových období' });
            }
            res.json(rows || []);
          }
        );
      }
    });
  }
});

// Uzatvorenie mzdového obdobia
router.post('/periods/:companyId/close', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { year, month, closedBy } = req.body;

  // Kontrola či je možné uzatvoriť obdobie (len minulé mesiace)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  if (year > currentYear || (year === currentYear && month >= currentMonth)) {
    return res.status(400).json({ 
      error: 'Nie je možné uzatvoriť aktuálne alebo budúce obdobie' 
    });
  }

  db.run(`
    UPDATE payroll_periods 
    SET is_closed = 1, closed_at = CURRENT_TIMESTAMP, closed_by = ?, updated_at = CURRENT_TIMESTAMP
    WHERE company_id = ? AND year = ? AND month = ?
  `, [closedBy, companyId, year, month], function(err) {
    if (err) {
      console.error('Chyba pri uzatváraní mzdového obdobia:', err);
      return res.status(500).json({ error: 'Chyba pri uzatváraní mzdového obdobia' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Mzdové obdobie nebolo nájdené' });
    }
    
    res.json({ 
      message: 'Mzdové obdobie úspešne uzatvorené',
      changes: this.changes 
    });
  });
});

// Odomknutie mzdového obdobia
router.post('/periods/:companyId/open', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { year, month } = req.body;

  db.run(`
    UPDATE payroll_periods 
    SET is_closed = 0, closed_at = NULL, closed_by = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE company_id = ? AND year = ? AND month = ?
  `, [companyId, year, month], function(err) {
    if (err) {
      console.error('Chyba pri odomknutí mzdového obdobia:', err);
      return res.status(500).json({ error: 'Chyba pri odomknutí mzdového obdobia' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Mzdové obdobie nebolo nájdené' });
    }
    
    res.json({ 
      message: 'Mzdové obdobie úspešne odomknuté',
      changes: this.changes 
    });
  });
});

// Kontrola či je obdobie uzatvorené
router.get('/periods/:companyId/check/:year/:month', authenticateToken, (req, res) => {
  const { companyId, year, month } = req.params;

  db.get(`
    SELECT is_closed FROM payroll_periods 
    WHERE company_id = ? AND year = ? AND month = ?
  `, [companyId, year, month], (err, period) => {
    if (err) {
      console.error('Chyba pri kontrole mzdového obdobia:', err);
      return res.status(500).json({ error: 'Chyba pri kontrole mzdového obdobia' });
    }
    
    res.json({ 
      isClosed: period ? period.is_closed === 1 : false 
    });
  });
});

module.exports = router;

// ------------------------------------------------------------
// 📄 Výplatné pásky (read-only z MDB: MZSK)
// ------------------------------------------------------------

// Pomocné funkcie – inšpirované accounting.js (lokálna kópia, read-only)
function openMdbReader(mdbPath) {
  const MDBLib = require('mdb-reader');
  const MDBReader = MDBLib && MDBLib.default ? MDBLib.default : MDBLib;
  const buffer = fs.readFileSync(mdbPath);
  return new MDBReader(buffer);
}

function ensureCompanyDir(companyId) {
  const id = String(companyId);
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'mdb', id);
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  return uploadsDir;
}

function findLatestLocalMdb(companyIco, preferredYear) {
  const ico = String(companyIco);
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'mdb', ico);
  if (!fs.existsSync(uploadsDir)) return null;
  const entries = fs.readdirSync(uploadsDir)
    .filter(name => name.toLowerCase().endsWith('.mdb'))
    .map(name => ({ name, full: path.join(uploadsDir, name) }));
  if (entries.length === 0) return null;
  // Preferuj rok, ak je zadaný v názve
  if (preferredYear) {
    const year = String(preferredYear);
    const match = entries.find(e => e.name.includes(year));
    if (match) return match.full;
  }
  // Inak najnovší podľa mtime
  entries.sort((a, b) => fs.statSync(b.full).mtimeMs - fs.statSync(a.full).mtimeMs);
  return entries[0].full;
}

async function getMDBFilePath(companyId, companyIco, year) {
  // 1) Lokálne nahratý MDB v uploads/mdb/<COMPANY_ID>/
  try {
    const byIdDir = path.join(__dirname, '..', 'uploads', 'mdb', String(companyId));
    if (fs.existsSync(byIdDir)) {
      const files = fs.readdirSync(byIdDir).filter(n => n.toLowerCase().endsWith('.mdb'));
      if (files.length > 0) {
        const prefer = year ? files.find(n => n.includes(String(year))) : null;
        const chosen = prefer || files.sort((a, b) => fs.statSync(path.join(byIdDir, b)).mtimeMs - fs.statSync(path.join(byIdDir, a)).mtimeMs)[0];
        return { path: path.join(byIdDir, chosen), source: 'uploads-companyId' };
      }
    }
  } catch {}
  // 2) Lokálne nahratý MDB v uploads/mdb/<ICO>/
  const local = findLatestLocalMdb(companyIco, year);
  if (local && fs.existsSync(local)) {
    return { path: local, source: 'uploads-ico' };
  }
  // 3) Zálohy v backend/zalohy/<YEAR>/<ICO_YEAR>/...
  const zalohyDir = path.join(__dirname, '..', 'zalohy');
  if (fs.existsSync(zalohyDir)) {
    const years = year ? [String(year)] : fs.readdirSync(zalohyDir).filter(d => /\d{4}/.test(d));
    for (const y of years) {
      const candidateDir = path.join(zalohyDir, y, `${companyIco}_${y}`);
      if (fs.existsSync(candidateDir)) {
        const files = fs.readdirSync(candidateDir).filter(n => n.toLowerCase().endsWith('.mdb'));
        if (files.length > 0) {
          // vezmi najnovší súbor
          const full = files
            .map(n => ({ n, p: path.join(candidateDir, n) }))
            .sort((a, b) => fs.statSync(b.p).mtimeMs - fs.statSync(a.p).mtimeMs)[0].p;
          return { path: full, source: 'zalohy' };
        }
      }
    }
  }
  throw new Error('MDB súbor nebol nájdený');
}

function normalizeBirthNumber(value) {
  if (!value) return '';
  return String(value).replace(/[^0-9]/g, '');
}

// Export helper pre iné routy (napr. HR)
module.exports.getMDBFilePath = getMDBFilePath;

function mapMZSKRowToMonth(row) {
  const toNumber = (v) => (v === null || v === undefined || v === '' ? 0 : Number(String(v).toString().replace(',', '.')) || 0);
  return {
    year: Number(row.Rok) || 0,
    month: Number(row.RelMes) || 0,
    employeeCode: row.OsCislo || null,
    calendarDays: Number(row.DnyKal) || 0,
    holidays: Number(row.DnyStSv) || 0,
    workingDays: Number(row.DnyPrac) || 0,
    workRatio: row.DUvazek || null,
    workedDays: Number(row.DnyOdpra) || 0,
    workedHours: toNumber(row.HodOdpra),
    baseWage: toNumber(row.KcSzM),
    bonuses: toNumber(row.KcPremM),
    grossWage: toNumber(row.KcHrubaM),
    taxableIncome: toNumber(row.KcZdanPrijem),
    wageTax: toNumber(row.KcZalDan),
    taxBonus: toNumber(row.KcDanBon),
    netWage: toNumber(row.KcCistaM),
    advance: toNumber(row.KcZaloha),
    settlement: toNumber(row.KcVyuct),
    // Odvody zamestnanca
    socialInsurance: toNumber(row.KcNem) + toNumber(row.KcSoc) + toNumber(row.KcInv) + toNumber(row.KcFz),
    healthInsurance: toNumber(row.KcZdr)
  };
}

function summarizePayslips(months) {
  const sum = (k) => months.reduce((acc, m) => acc + (m[k] || 0), 0);
  const monthsCount = months.length;
  return {
    totalGross: sum('grossWage'),
    totalNet: sum('netWage'),
    totalAdvance: sum('advance'),
    totalSettlement: sum('settlement'),
    totalBonuses: sum('bonuses'),
    totalTax: sum('wageTax'),
    totalTaxableIncome: sum('taxableIncome'),
    totalWorkedHours: sum('workedHours'),
    totalWorkedDays: sum('workedDays'),
    totalSocialInsurance: sum('socialInsurance'),
    totalHealthInsurance: sum('healthInsurance'),
    monthsCount
  };
}

// Zoznam miezd za rok pre zamestnanca (podľa RČ v MZSK)
router.get('/payslips/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { employeeId, year } = req.query;

  if (!employeeId || !year) {
    return res.status(400).json({ error: 'Chýba employeeId alebo year' });
  }

  try {
    // Získaj firmu (kvôli ICO)
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT id, ico FROM companies WHERE id = ?', [companyId], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });

    // Získaj RČ z employees (birth_number)
    const employee = await new Promise((resolve, reject) => {
      db.get('SELECT id, birth_number FROM employees WHERE id = ? AND company_id = ?', [employeeId, companyId], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!employee || !employee.birth_number) {
      return res.status(404).json({ error: 'Zamestnanec alebo jeho RČ nebolo nájdené' });
    }

    const targetRC = normalizeBirthNumber(employee.birth_number);
    const mdbInfo = await getMDBFilePath(company.id, company.ico, year);
    const mdb = openMdbReader(mdbInfo.path);

    // Načítaj tabuľku MZSK
    const table = mdb.getTable('MZSK');
    const rows = table.getData();

    // Filtrovanie podľa roka a RČ
    const months = rows
      .filter(r => Number(r.Rok) === Number(year) && normalizeBirthNumber(r.RodCisl) === targetRC)
      .map(mapMZSKRowToMonth)
      .sort((a, b) => a.month - b.month);

    return res.json({
      year: Number(year),
      employeeId: Number(employeeId),
      months,
      summary: summarizePayslips(months),
      source: mdbInfo.source
    });
  } catch (error) {
    console.error('Chyba pri čítaní výplatných pások z MDB:', error);
    return res.status(500).json({ error: 'Chyba pri čítaní údajov z MDB' });
  }
});

// Detail výplatnej pásky za mesiac
router.get('/payslips/:companyId/detail', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { employeeId, year, month } = req.query;
  if (!employeeId || !year || !month) {
    return res.status(400).json({ error: 'Chýba employeeId, year alebo month' });
  }
  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT id, ico FROM companies WHERE id = ?', [companyId], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!company) return res.status(404).json({ error: 'Firma nebola nájdená' });

    const employee = await new Promise((resolve, reject) => {
      db.get('SELECT id, birth_number FROM employees WHERE id = ? AND company_id = ?', [employeeId, companyId], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!employee || !employee.birth_number) {
      return res.status(404).json({ error: 'Zamestnanec alebo jeho RČ nebolo nájdené' });
    }

    const targetRC = normalizeBirthNumber(employee.birth_number);
    const mdbInfo = await getMDBFilePath(company.id, company.ico, year);
    const mdb = openMdbReader(mdbInfo.path);
    const table = mdb.getTable('MZSK');
    const rows = table.getData();

    const match = rows.find(r => Number(r.Rok) === Number(year) && Number(r.RelMes) === Number(month) && normalizeBirthNumber(r.RodCisl) === targetRC);
    if (!match) return res.status(404).json({ error: 'Výplatná páska pre dané obdobie nebola nájdená' });

    const monthData = mapMZSKRowToMonth(match);
    const debug = req.query.debug === '1' ? {
      RodCisl: match.RodCisl,
      Rok: match.Rok,
      RelMes: match.RelMes,
      KcNem: match.KcNem,
      KcSoc: match.KcSoc,
      KcInv: match.KcInv,
      KcFz: match.KcFz,
      KcZdr: match.KcZdr
    } : undefined;
    return res.json({
      year: Number(year),
      month: Number(month),
      employeeId: Number(employeeId),
      payslip: monthData,
      source: mdbInfo.source,
      ...(debug ? { debug } : {})
    });
  } catch (error) {
    console.error('Chyba pri čítaní detailu výplatnej pásky:', error);
    return res.status(500).json({ error: 'Chyba pri čítaní údajov z MDB' });
  }
});
