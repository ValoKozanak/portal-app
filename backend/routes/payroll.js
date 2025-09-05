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

async function getMDBFilePath(companyIco, year) {
  // 1) Lokálne nahratý MDB v uploads/mdb/<ICO>/
  const local = findLatestLocalMdb(companyIco, year);
  if (local && fs.existsSync(local)) {
    return { path: local, source: 'uploads' };
  }
  // 2) Zálohy v backend/zalohy/<YEAR>/<ICO_YEAR>/...
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
    settlement: toNumber(row.KcVyuct)
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
    const mdbInfo = await getMDBFilePath(company.ico, year);
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
    const mdbInfo = await getMDBFilePath(company.ico, year);
    const mdb = openMdbReader(mdbInfo.path);
    const table = mdb.getTable('MZSK');
    const rows = table.getData();

    const match = rows.find(r => Number(r.Rok) === Number(year) && Number(r.RelMes) === Number(month) && normalizeBirthNumber(r.RodCisl) === targetRC);
    if (!match) return res.status(404).json({ error: 'Výplatná páska pre dané obdobie nebola nájdená' });

    const monthData = mapMZSKRowToMonth(match);
    return res.json({
      year: Number(year),
      month: Number(month),
      employeeId: Number(employeeId),
      payslip: monthData,
      source: mdbInfo.source
    });
  } catch (error) {
    console.error('Chyba pri čítaní detailu výplatnej pásky:', error);
    return res.status(500).json({ error: 'Chyba pri čítaní údajov z MDB' });
  }
});
