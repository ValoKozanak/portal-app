// routes/accounting.js

const express = require('express');
const { Router } = require('express');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB
});
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const router = Router();

const { authenticateToken } = require('./auth');
const { db } = require('../database');
const dropboxService = require('../services/dropboxService');
const spacesService = require('../services/spacesService');

// -------- CORS (pre tieto routes) --------
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
router.use(cors(corsOptions));

// ====== RÝCHLE TESTY ======

// 0) Simple ping
router.get('/simple-test', (req, res) => {
  res.json({
    message: 'Accounting routes fungujú!',
    timestamp: new Date().toISOString()
  });
});

// 1) Dropbox init ping
router.get('/dropbox-test-simple', async (req, res) => {
  try {
    res.json({
      message: 'Dropbox endpoint funguje!',
      isInitialized: dropboxService.isInitialized(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2) Dropbox token info
router.get('/test-dropbox-token', (req, res) => {
  const token = process.env.DROPBOX_ACCESS_TOKEN;
  res.json({
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    tokenStart: token ? token.substring(0, 10) + '...' : 'none',
    message: token ? 'Token je nastavený' : 'Token nie je nastavený'
  });
});

// 3) Spaces detailný test (NECHAŤ TENTO — druhú, kratšiu verziu sme zmazali)
router.get('/admin/spaces/test', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Prístup zamietnutý. Len admin môže testovať Spaces pripojenie.'
      });
    }

    const testResults = {
      timestamp: new Date().toISOString(),
      spaces: {
        isInitialized: spacesService.isInitialized(),
        config: {
          hasEndpoint: !!process.env.SPACES_ENDPOINT,
          hasBucket: !!process.env.SPACES_BUCKET,
          hasKey: !!process.env.SPACES_KEY,
          hasSecret: !!process.env.SPACES_SECRET,
          endpoint: process.env.SPACES_ENDPOINT || 'CHÝBA',
          bucket: process.env.SPACES_BUCKET || 'CHÝBA',
          region: process.env.SPACES_REGION || 'CHÝBA'
        }
      }
    };

    if (spacesService.isInitialized()) {
      try {
        const mdbFiles = await spacesService.listMdbFiles();
        testResults.spaces.availableFiles = mdbFiles.length;
        testResults.spaces.testResults = {
          listFilesSuccess: true,
          filesList: mdbFiles.slice(0, 5)
        };
      } catch (error) {
        testResults.spaces.testResults = {
          listFilesSuccess: false,
          error: error.message
        };
      }
    } else {
      testResults.spaces.error = 'DigitalOcean Spaces nie je nakonfigurované';
    }

    res.json(testResults);
  } catch (error) {
    console.error('❌ Chyba pri testovaní Spaces:', error);
    res.status(500).json({
      error: 'Chyba pri testovaní Spaces pripojenia',
      details: error.message
    });
  }
});

// ===== Helper: cesta k MDB =====
async function getMDBFilePath(companyIco, year = '2025') {
  // 1) Dropbox
  if (dropboxService.isInitialized()) {
    try {
      console.log(`🔍 Dropbox: ${companyIco}_${year}`);
      const tempFilePath = await dropboxService.getMDBFile(companyIco, year);
      return { path: tempFilePath, isTemp: true };
    } catch (error) {
      console.log(`⚠️ Dropbox neúspešný, skúšam lokálny súbor: ${error.message}`);
    }
  }
  // 2) Lokálne
  const localPath = path.join(
    __dirname,
    '..',
    'zalohy',
    year,
    `${companyIco}_${year}`,
    `${companyIco}_${year}.mdb`
  );
  if (fs.existsSync(localPath)) {
    return { path: localPath, isTemp: false };
  }
  throw new Error('MDB súbor nebol nájdený ani v Dropbox ani lokálne');
}

// ===== 1. NASTAVENIA ÚČTOVNÍCTVA =====

// get settings
router.get('/settings/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;

  db.get(
    `
    SELECT * FROM accounting_settings 
    WHERE company_id = ?
  `,
    [companyId],
    (err, settings) => {
      if (err) {
        console.error('Chyba pri načítaní nastavení účtovníctva:', err);
        return res.status(500).json({ error: 'Chyba pri načítaní nastavení' });
      }

      res.json(
        settings || {
          company_id: parseInt(companyId),
          pohoda_enabled: false,
          auto_sync: false,
          sync_frequency: 'daily'
        }
      );
    }
  );
});

// save settings
router.post('/settings/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;

  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'company' &&
    req.user.role !== 'user'
  ) {
    return res.status(403).json({
      error:
        'Prístup zamietnutý. Len admin, firma alebo používateľ môže upravovať nastavenia.'
    });
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

  db.run(
    `
    INSERT OR REPLACE INTO accounting_settings (
      company_id, pohoda_enabled, pohoda_url, pohoda_username, pohoda_password,
      pohoda_ico, pohoda_year, auto_sync, sync_frequency, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `,
    [
      companyId,
      pohoda_enabled,
      pohoda_url,
      pohoda_username,
      pohoda_password,
      pohoda_ico,
      pohoda_year,
      auto_sync,
      sync_frequency
    ],
    function (err) {
      if (err) {
        console.error('Chyba pri ukladaní nastavení účtovníctva:', err);
        return res.status(500).json({ error: 'Chyba pri ukladaní nastavení' });
      }

      res.json({ success: true, id: this.lastID });
    }
  );
});

// ===== 2. HOSPODÁRSKE VÝSLEDKY (pUD) =====

// pUD summary (placeholder bez MDB na Linuxe)
router.get('/pud-summary/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;

  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }

    // Placeholder, pokiaľ MDB nebeží
    const summary = {
      total_kc: 0,
      total_count: 0
    };
    res.json(summary);
  } catch (error) {
    console.error('Chyba pri získavaní súhrnu pUD:', error);
    res.status(500).json({ error: 'Chyba pri získavaní súhrnu pUD' });
  }
});

// detailná analýza (ADODB – vyžaduje Windows/ODBC)
router.get('/financial-analysis/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { dateFrom, dateTo } = req.query;

  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }

    const mdbPath = path.join(
      __dirname,
      '..',
      'zalohy',
      '2025',
      `${company.ico}_2025`,
      `${company.ico}_2025.mdb`
    );

    if (!fs.existsSync(mdbPath)) {
      return res.status(404).json({ error: 'MDB súbor nebol nájdený' });
    }

    const ADODB = require('node-adodb');
    const connection = ADODB.open(
      `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`
    );

    let dateFilter = '';
    if (dateFrom && dateTo) {
      dateFilter = ` AND CDate(Datum) BETWEEN CDate('${dateFrom}') AND CDate('${dateTo}')`;
    }

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

    const totalExpensesQuery = `SELECT SUM(Kc) as total_expenses FROM pUD WHERE UMD LIKE '5%'${dateFilter}`;
    const totalRevenueQuery = `SELECT SUM(Kc) as total_revenue FROM pUD WHERE UD LIKE '6%'${dateFilter}`;

    const expenses = await connection.query(expensesQuery);
    const revenue = await connection.query(revenueQuery);
    const totalExpenses = await connection.query(totalExpensesQuery);
    const totalRevenue = await connection.query(totalRevenueQuery);

    const totalExpensesAmount = totalExpenses[0]?.total_expenses || 0;
    const totalRevenueAmount = totalRevenue[0]?.total_revenue || 0;
    const profit = totalRevenueAmount - totalExpensesAmount;

    const analysis = {
      expenses: {
        total: totalExpensesAmount,
        count: expenses.length,
        details: expenses.map((item) => ({
          account: item.account,
          account_name: item.account_name || `${item.account} (názov nenájdený)`,
          amount: item.total_amount || 0,
          count: item.transaction_count || 0
        }))
      },
      revenue: {
        total: totalRevenueAmount,
        count: revenue.length,
        details: revenue.map((item) => ({
          account: item.account,
          account_name: item.account_name || `${item.account} (názov nenájdený)`,
          amount: item.total_amount || 0,
          count: item.transaction_count || 0
        }))
      },
      profit,
      isProfit: profit >= 0,
      filters: { dateFrom: dateFrom || null, dateTo: dateTo || null }
    };

    res.json(analysis);
  } catch (error) {
    console.error('Chyba pri získavaní analýzy nákladov a výnosov:', error);
    res.status(500).json({ error: 'Chyba pri získavaní analýzy nákladov a výnosov' });
  }
});

// test verzia bez auth
router.get('/financial-analysis-test/:companyId', async (req, res) => {
  const { companyId } = req.params;
  const { dateFrom, dateTo } = req.query;

  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }

    const mdbPath = path.join(
      __dirname,
      '..',
      'zalohy',
      '2025',
      `${company.ico}_2025`,
      `${company.ico}_2025.mdb`
    );

    if (!fs.existsSync(mdbPath)) {
      return res.status(404).json({ error: 'MDB súbor nebol nájdený' });
    }

    const ADODB = require('node-adodb');
    const connection = ADODB.open(
      `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`
    );

    let dateFilter = '';
    if (dateFrom && dateTo) {
      dateFilter = ` AND CDate(Datum) BETWEEN CDate('${dateFrom}') AND CDate('${dateTo}')`;
    }

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

    const totalExpensesQuery = `SELECT SUM(Kc) as total_expenses FROM pUD WHERE UMD LIKE '5%'${dateFilter}`;
    const totalRevenueQuery = `SELECT SUM(Kc) as total_revenue FROM pUD WHERE UD LIKE '6%'${dateFilter}`;

    const expenses = await connection.query(expensesQuery);
    const revenue = await connection.query(revenueQuery);
    const totalExpenses = await connection.query(totalExpensesQuery);
    const totalRevenue = await connection.query(totalRevenueQuery);

    const totalExpensesAmount = totalExpenses[0]?.total_expenses || 0;
    const totalRevenueAmount = totalRevenue[0]?.total_revenue || 0;
    const profit = totalRevenueAmount - totalExpensesAmount;

    const analysis = {
      expenses: {
        total: totalExpensesAmount,
        count: expenses.length,
        details: expenses.map((item) => ({
          account: item.account,
          account_name: item.account_name || `${item.account} (názov nenájdený)`,
          amount: item.total_amount || 0,
          count: item.transaction_count || 0
        }))
      },
      revenue: {
        total: totalRevenueAmount,
        count: revenue.length,
        details: revenue.map((item) => ({
          account: item.account,
          account_name: item.account_name || `${item.account} (názov nenájdený)`,
          amount: item.total_amount || 0,
          count: item.transaction_count || 0
        }))
      },
      profit,
      isProfit: profit >= 0,
      filters: { dateFrom: dateFrom || null, dateTo: dateTo || null }
    };

    res.json(analysis);
  } catch (error) {
    console.error('Chyba pri získavaní analýzy nákladov a výnosov:', error);
    res.status(500).json({ error: 'Chyba pri získavaní analýzy nákladov a výnosov' });
  }
});

// ===== 3. ŠTATISTIKY & DEBUG SÚBOROV =====

router.get('/check-files/:companyId', authenticateToken, (req, res) => {
  const fileChecks = { databases: [], zalohy: [] };

  const databasesPath = path.join(__dirname, '..', 'databases');
  if (fs.existsSync(databasesPath)) {
    try {
      fileChecks.databases = fs.readdirSync(databasesPath);
    } catch (err) {
      fileChecks.databases = [`Error: ${err.message}`];
    }
  } else {
    fileChecks.databases = ['Adresár neexistuje'];
  }

  const zalohyPath = path.join(__dirname, '..', 'zalohy');
  if (fs.existsSync(zalohyPath)) {
    try {
      const files = fs.readdirSync(zalohyPath);
      fileChecks.zalohy = files;

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

router.get('/stats/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { date_from, date_to } = req.query;

  let dateFilter = '';
  const params = [companyId];

  if (date_from && date_to) {
    dateFilter = ' AND issue_date BETWEEN ? AND ?';
    params.push(date_from, date_to);
  }

  db.get(
    `
    SELECT 
      COUNT(*) as total_issued,
      SUM(total_amount) as total_issued_amount,
      SUM(vat_amount) as total_issued_vat,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_issued,
      SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_issued_amount,
      SUM(CASE WHEN kc_likv > 0 THEN kc_likv ELSE 0 END) as unpaid_amount
    FROM issued_invoices 
    WHERE company_id = ?${dateFilter}
  `,
    params,
    (err, issuedStats) => {
      if (err) {
        console.error('Chyba pri načítaní vydaných faktúr:', err);
        return res.status(500).json({ error: 'Chyba pri načítaní štatistík' });
      }

      db.get(
        `
        SELECT 
          COUNT(*) as total_received,
          SUM(total_amount) as total_received_amount,
          SUM(vat_amount) as total_received_vat,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_received,
          SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_received_amount,
          SUM(CASE WHEN kc_likv > 0 THEN kc_likv ELSE 0 END) as unpaid_amount
        FROM received_invoices 
        WHERE company_id = ?${dateFilter}
      `,
        params,
        (err2, receivedStats) => {
          if (err2) {
            console.error('Chyba pri načítaní prijatých faktúr:', err2);
            return res.status(500).json({ error: 'Chyba pri načítaní štatistík' });
          }

          const stats = {
            issued_invoices: {
              total_count: issuedStats.total_issued || 0,
              total_amount: issuedStats.total_issued_amount || 0,
              paid_amount: issuedStats.paid_issued_amount || 0,
              overdue_amount: issuedStats.unpaid_amount || 0
            },
            received_invoices: {
              total_count: receivedStats.total_received || 0,
              total_amount: receivedStats.total_received_amount || 0,
              paid_amount: receivedStats.paid_received_amount || 0,
              overdue_amount: receivedStats.unpaid_amount || 0
            }
          };

          res.json(stats);
        }
      );
    }
  );
});

// ===== 4. VYDANÉ FAKTÚRY =====

router.get('/issued-invoices/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { status, date_from, date_to, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT * FROM issued_invoices 
    WHERE company_id = ?
  `;
  const params = [companyId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (date_from) {
    query += ' AND issue_date >= ?';
    params.push(date_from);
  }
  if (date_to) {
    query += ' AND issue_date <= ?';
    params.push(date_to);
  }

  query += ' ORDER BY issue_date DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  db.all(query, params, (err, invoices) => {
    if (err) {
      console.error('Chyba pri načítaní vydaných faktúr:', err);
      return res.status(500).json({ error: 'Chyba pri načítaní faktúr' });
    }
    res.json(invoices);
  });
});

router.post('/issued-invoices/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;

  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'company' &&
    req.user.role !== 'user'
  ) {
    return res.status(403).json({
      error:
        'Prístup zamietnutý. Len admin, firma alebo používateľ môže vytvárať faktúry.'
    });
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

  db.run(
    `
    INSERT INTO issued_invoices (
      company_id, invoice_number, customer_name, customer_ico, customer_dic,
      customer_address, issue_date, due_date, total_amount, vat_amount,
      currency, notes, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      companyId,
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
      created_by
    ],
    function (err) {
      if (err) {
        console.error('Chyba pri vytváraní faktúry:', err);
        return res.status(500).json({ error: 'Chyba pri vytváraní faktúry' });
      }

      const invoiceId = this.lastID;

      if (items && items.length > 0) {
        const itemValues = items.map((item) => [
          invoiceId,
          item.description,
          item.quantity,
          item.unit_price,
          item.vat_rate,
          item.total_price,
          item.vat_amount,
          item.unit || 'ks'
        ]);

        const placeholders = items
          .map(() => '(?, ?, ?, ?, ?, ?, ?, ?)')
          .join(',');

        db.run(
          `
          INSERT INTO issued_invoice_items (
            invoice_id, description, quantity, unit_price, vat_rate,
            total_price, vat_amount, unit
          ) VALUES ${placeholders}
        `,
          itemValues.flat(),
          (err2) => {
            if (err2) {
              console.error('Chyba pri pridávaní položiek faktúry:', err2);
            }
          }
        );
      }

      res.json({ success: true, id: invoiceId });
    }
  );
});

// ===== 5. PRIJATÉ FAKTÚRY =====

router.get('/received-invoices/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { status, date_from, date_to, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT * FROM received_invoices 
    WHERE company_id = ?
  `;
  const params = [companyId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (date_from) {
    query += ' AND issue_date >= ?';
    params.push(date_from);
  }
  if (date_to) {
    query += ' AND issue_date <= ?';
    params.push(date_to);
  }

  query += ' ORDER BY issue_date DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  db.all(query, params, (err, invoices) => {
    if (err) {
      console.error('Chyba pri načítaní prijatých faktúr:', err);
      return res.status(500).json({ error: 'Chyba pri načítaní faktúr' });
    }
    res.json(invoices);
  });
});

// ===== 5A. OBNOVENIE VYDANÝCH FAKTÚR Z MDB =====

router.post('/refresh-invoices/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;

  try {
    db.get('SELECT ico, name FROM companies WHERE id = ?', [companyId], async (err, company) => {
      if (err) {
        console.error('Chyba pri hľadaní firmy:', err);
        return res.status(500).json({ error: 'Chyba pri načítaní firmy' });
      }
      if (!company) {
        return res.status(404).json({ error: 'Firma nenájdená' });
      }

      db.run('DELETE FROM issued_invoices WHERE company_id = ?', [companyId], function (delErr) {
        if (delErr) {
          console.error('Chyba pri mazaní faktúr:', delErr);
          return res.status(500).json({ error: 'Chyba pri mazaní faktúr' });
        }

        const ADODB = require('node-adodb');
        const currentYear = new Date().getFullYear();
        const mdbPath = path.join(
          __dirname,
          '..',
          'zalohy',
          currentYear.toString(),
          `${company.ico}_${currentYear}`,
          `${company.ico}_${currentYear}.mdb`
        );

        const connection = ADODB.open(
          `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`
        );

        const query = `
          SELECT 
            ID, Cislo, Firma, ICO, DIC, Ulice, PSC, Obec,
            Datum, DatSplat,
            Kc0, Kc1, Kc2, Kc3,
            KcDPH1, KcDPH2, KcDPH3,
            KcCelkem, VarSym, SText,
            RelTpFak, KcLikv, KcZUplat, DatLikv
          FROM [FA] 
          WHERE RelTpFak = 1
          ORDER BY Datum DESC
        `;

        connection
          .query(query)
          .then((data) => {
            let importedCount = 0;

            if (!data || data.length === 0) {
              return res.json({
                success: true,
                message: 'Neboli nájdené žiadne vydané faktúry v MDB.',
                importedCount: 0,
                totalCount: 0
              });
            }

            let processed = 0;

            data.forEach((row) => {
              const base_amount =
                (parseFloat(row.Kc0) || 0) +
                (parseFloat(row.Kc1) || 0) +
                (parseFloat(row.Kc2) || 0) +
                (parseFloat(row.Kc3) || 0);

              const vat_total =
                (parseFloat(row.KcDPH1) || 0) +
                (parseFloat(row.KcDPH2) || 0) +
                (parseFloat(row.KcDPH3) || 0);

              db.run(
                `
                INSERT INTO issued_invoices (
                  company_id, invoice_number, customer_name, customer_ico, customer_dic, 
                  customer_address, issue_date, due_date, total_amount, vat_amount, 
                  currency, status, pohoda_id, notes, created_by, created_at, updated_at,
                  kc_dph1, kc_dph2, kc_dph3, var_sym, s_text, kc_celkem, kc0, dat_splat, 
                  firma, ico, dic, ulice, psc, obec, mdb_cislo, mdb_id, rel_tp_fak, datum,
                  kc1, kc2, kc3, kc_likv, kc_u, dat_likv
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
                [
                  companyId,
                  row.Cislo || '',
                  row.Firma || '',
                  row.ICO || '',
                  row.DIC || '',
                  `${row.Ulice || ''}, ${row.PSC || ''} ${row.Obec || ''}`
                    .trim()
                    .replace(/^,\s*/, ''),
                  row.Datum ? new Date(row.Datum).toISOString().split('T')[0] : '',
                  row.DatSplat
                    ? new Date(row.DatSplat).toISOString().split('T')[0]
                    : '',
                  base_amount,
                  vat_total,
                  'EUR',
                  'sent',
                  null,
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
                ],
                (insErr) => {
                  processed += 1;
                  if (!insErr) importedCount += 1;

                  if (processed === data.length) {
                    return res.json({
                      success: true,
                      message: `Obnovenie dokončené. Importovaných ${importedCount} faktúr.`,
                      importedCount,
                      totalCount: data.length
                    });
                  }
                }
              );
            });
          })
          .catch((error) => {
            console.error('Chyba pri čítaní MDB:', error);
            res.status(500).json({ error: 'Chyba pri čítaní MDB databázy' });
          });
      });
    });
  } catch (error) {
    console.error('Chyba pri obnovení faktúr:', error);
    res.status(500).json({ error: 'Chyba pri obnovení faktúr' });
  }
});

// ===== 5B. OBNOVENIE PRIJATÝCH FAKTÚR Z MDB =====

router.post('/refresh-received-invoices/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;

  try {
    db.get('SELECT ico, name FROM companies WHERE id = ?', [companyId], async (err, company) => {
      if (err) {
        console.error('Chyba pri hľadaní firmy:', err);
        return res.status(500).json({ error: 'Chyba pri načítaní firmy' });
      }
      if (!company) {
        return res.status(404).json({ error: 'Firma nenájdená' });
      }

      db.run('DELETE FROM received_invoices WHERE company_id = ?', [companyId], function (delErr) {
        if (delErr) {
          console.error('Chyba pri mazaní prijatých faktúr:', delErr);
          return res.status(500).json({ error: 'Chyba pri mazaní prijatých faktúr' });
        }

        const ADODB = require('node-adodb');
        const currentYear = new Date().getFullYear();
        const mdbPath = path.join(
          __dirname,
          '..',
          'zalohy',
          currentYear.toString(),
          `${company.ico}_${currentYear}`,
          `${company.ico}_${currentYear}.mdb`
        );

        const connection = ADODB.open(
          `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`
        );

        const query = `
          SELECT 
            ID, Cislo, Firma, ICO, DIC, Ulice, PSC, Obec,
            Datum, DatSplat,
            Kc0, Kc1, Kc2, Kc3,
            KcDPH1, KcDPH2, KcDPH3,
            KcCelkem, VarSym, SText,
            RelTpFak, KcLikv, KcU, DatLikv
          FROM [FA] 
          WHERE RelTpFak = 11
          ORDER BY Datum DESC
        `;

        connection
          .query(query)
          .then((data) => {
            let importedCount = 0;

            if (!data || data.length === 0) {
              return res.json({
                success: true,
                message: 'Neboli nájdené žiadne prijaté faktúry v MDB.',
                importedCount: 0,
                totalCount: 0
              });
            }

            let processed = 0;

            data.forEach((row) => {
              const base_amount =
                (parseFloat(row.Kc0) || 0) +
                (parseFloat(row.Kc1) || 0) +
                (parseFloat(row.Kc2) || 0) +
                (parseFloat(row.Kc3) || 0);

              const vat_total =
                (parseFloat(row.KcDPH1) || 0) +
                (parseFloat(row.KcDPH2) || 0) +
                (parseFloat(row.KcDPH3) || 0);

              db.run(
                `
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
              `,
                [
                  companyId,
                  row.Cislo || '',
                  row.Firma || '',
                  row.ICO || '',
                  row.DIC || '',
                  `${row.Ulice || ''}, ${row.PSC || ''} ${row.Obec || ''}`
                    .trim()
                    .replace(/^,\s*/, ''),
                  row.Datum ? new Date(row.Datum).toISOString().split('T')[0] : '',
                  row.DatSplat
                    ? new Date(row.DatSplat).toISOString().split('T')[0]
                    : '',
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
                  null,
                  row.SText || '',
                  req.user.email,
                  new Date().toISOString(),
                  new Date().toISOString(),
                  parseFloat(row.KcLikv) || 0,
                  parseFloat(row.KcU) || 0,
                  row.DatLikv ? new Date(row.DatLikv).toISOString().split('T')[0] : null
                ],
                (insErr) => {
                  processed += 1;
                  if (!insErr) importedCount += 1;

                  if (processed === data.length) {
                    return res.json({
                      success: true,
                      message: `Obnovenie prijatých faktúr dokončené. Importovaných ${importedCount} faktúr.`,
                      importedCount,
                      totalCount: data.length
                    });
                  }
                }
              );
            });
          })
          .catch((error) => {
            console.error('Chyba pri čítaní MDB:', error);
            res.status(500).json({ error: 'Chyba pri čítaní MDB databázy' });
          });
      });
    });
  } catch (error) {
    console.error('Chyba pri obnovení prijatých faktúr:', error);
    res.status(500).json({ error: 'Chyba pri obnovení prijatých faktúr' });
  }
});

// ===== 6. DPH PODANIA =====

router.get('/vat-returns/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { year } = req.query;

  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }

    const mdbPath = path.join(
      __dirname,
      '..',
      'zalohy',
      '2025',
      `${company.ico}_2025`,
      `${company.ico}_2025.mdb`
    );

    if (!fs.existsSync(mdbPath)) {
      return res.status(404).json({ error: 'MDB súbor nebol nájdený' });
    }

    const ADODB = require('node-adodb');
    const connection = ADODB.open(
      `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`
    );

    const selectedYear = year || new Date().getFullYear();

    const query = `
      SELECT 
        ID, Rok, RelObDPH, KcDan, KcOdpoc, ElOdeslano
      FROM DPH 
      WHERE Rok = ${selectedYear}
      ORDER BY RelObDPH ASC
    `;

    const data = await connection.query(query);

    const returns = data.map((row, index) => ({
      id: index + 1,
      rok: parseInt(row.Rok) || selectedYear,
      mesiac: parseInt(row.RelObDPH) || 0,
      povinnost: parseFloat(row.KcDan) || 0,
      odpočet: parseFloat(row.KcOdpoc) || 0,
      odoslané:
        row.ElOdeslano === true ||
        row.ElOdeslano === 1 ||
        row.ElOdeslano === 'True'
    }));

    const summary = {
      totalPovinnost: returns.reduce((s, i) => s + i.povinnost, 0),
      totalOdpočet: returns.reduce((s, i) => s + i.odpočet, 0),
      totalRozdiel: returns.reduce((s, i) => s + (i.povinnost - i.odpočet), 0),
      odoslanéCount: returns.filter((i) => i.odoslané).length,
      neodoslanéCount: returns.filter((i) => !i.odoslané).length
    };

    res.json({
      company: { id: company.id, name: company.name, ico: company.ico },
      year: parseInt(selectedYear, 10),
      returns,
      summary
    });
  } catch (error) {
    console.error('❌ Chyba pri načítaní DPH dát:', error);
    res.status(500).json({ error: 'Chyba pri načítaní DPH dát' });
  }
});

// ===== 7. BANKOVÉ ÚČTY =====

router.get('/bank-accounts/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;

  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }

    const mdbPath = path.join(
      __dirname,
      '..',
      'zalohy',
      '2025',
      `${company.ico}_2025`,
      `${company.ico}_2025.mdb`
    );

    if (!fs.existsSync(mdbPath)) {
      return res.status(404).json({
        error: 'MDB súbor nebol nájdený',
        details: {
          companyId,
          companyName: company.name,
          companyIco: company.ico,
          mdbPath
        }
      });
    }

    const ADODB = require('node-adodb');
    const connection = ADODB.open(
      `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`
    );

    // pokus o výpis tabuliek (len log)
    try {
      const tablesQuery = 'SELECT Name FROM MSysObjects WHERE Type=1 AND Flags=0';
      const tables = await connection.query(tablesQuery);
      console.log('📋 Dostupné tabuľky:', tables.map((t) => t.Name));
    } catch (e) {
      // prežijeme bez toho
    }

    const accountsQuery = `
      SELECT ID, AUcet, SText, Banka, RelJeUcet
      FROM sUcet 
      ORDER BY AUcet
    `;

    const allAccountsData = await connection.query(accountsQuery);

    const accounts = [];
    let totalBalance = 0;
    let totalCredit = 0;
    let totalDebit = 0;

    for (const account of allAccountsData) {
      let accountNumber = account.AUcet;
      const displayAccountNumber = account.SText;

      if (!displayAccountNumber || displayAccountNumber === '') continue;
      if (account.RelJeUcet === 1) continue; // pokladňa -> sem nepatrí

      if (!accountNumber || accountNumber === '') accountNumber = '221000';
      if (!accountNumber.startsWith('221')) continue;

      const accountName = displayAccountNumber;
      const bankName = account.Banka || 'Neznáma banka';

      const creditQuery = `
        SELECT SUM(pUD.Kc) as credit_total, COUNT(*) as transaction_count
        FROM pUD WHERE pUD.UMD = '${accountNumber}'
      `;
      const debitQuery = `
        SELECT SUM(pUD.Kc) as debit_total
        FROM pUD WHERE pUD.UD = '${accountNumber}'
      `;

      const creditData = await connection.query(creditQuery);
      const debitData = await connection.query(debitQuery);

      const creditTotal = parseFloat(creditData[0]?.credit_total) || 0;
      const debitTotal = parseFloat(debitData[0]?.debit_total) || 0;
      const balance = creditTotal - debitTotal;
      const transactionCount = parseInt(creditData[0]?.transaction_count, 10) || 0;

      accounts.push({
        id: account.ID || accounts.length + 1,
        accountNumber: displayAccountNumber,
        accountName,
        bankName,
        balance,
        creditTotal,
        debitTotal,
        transactionCount
      });

      totalBalance += balance;
      totalCredit += creditTotal;
      totalDebit += debitTotal;
    }

    res.json({
      company: { id: company.id, name: company.name, ico: company.ico },
      accounts,
      summary: {
        totalBalance,
        totalCredit,
        totalDebit,
        accountCount: accounts.length
      },
      message: accounts.length === 0 ? 'Neboli nájdené žiadne bankové účty (221)' : undefined
    });
  } catch (error) {
    console.error('❌ Chyba pri načítaní bankových dát:', error);
    res.status(500).json({ error: 'Chyba pri načítaní bankových dát' });
  }
});

// ===== 8. POKLADŇA (cash accounts) =====

router.get('/cash-accounts/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;

  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }

    const mdbPath = path.join(
      __dirname,
      '..',
      'zalohy',
      '2025',
      `${company.ico}_2025`,
      `${company.ico}_2025.mdb`
    );

    if (!fs.existsSync(mdbPath)) {
      return res.status(404).json({ error: 'MDB súbor nebol nájdený' });
    }

    const ADODB = require('node-adodb');
    const connection = ADODB.open(
      `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`
    );

    const accountsQuery = `
      SELECT ID, AUcet, SText
      FROM sUcet 
      WHERE AUcet LIKE '211%'
      ORDER BY AUcet
    `;

    const accountsData = await connection.query(accountsQuery);

    const accounts = [];
    let totalBalance = 0;
    let totalCredit = 0;
    let totalDebit = 0;

    for (const account of accountsData) {
      const accountNumber = account.AUcet;
      const accountName =
        accountNumber === '211000' || !account.SText || account.SText === ''
          ? 'Hlavná pokladňa'
          : account.SText;

      const creditQuery = `
        SELECT SUM(pUD.Kc) as credit_total, COUNT(*) as transaction_count
        FROM pUD WHERE pUD.UMD = '${accountNumber}'
      `;
      const debitQuery = `
        SELECT SUM(pUD.Kc) as debit_total
        FROM pUD WHERE pUD.UD = '${accountNumber}'
      `;

      const creditData = await connection.query(creditQuery);
      const debitData = await connection.query(debitQuery);

      const creditTotal = parseFloat(creditData[0]?.credit_total) || 0;
      const debitTotal = parseFloat(debitData[0]?.debit_total) || 0;
      const balance = creditTotal - debitTotal;
      const transactionCount = parseInt(creditData[0]?.transaction_count, 10) || 0;

      accounts.push({
        id: account.ID || accounts.length + 1,
        accountNumber,
        accountName,
        balance,
        creditTotal,
        debitTotal,
        transactionCount
      });

      totalBalance += balance;
      totalCredit += creditTotal;
      totalDebit += debitTotal;
    }

    res.json({
      company: { id: company.id, name: company.name, ico: company.ico },
      accounts,
      summary: {
        totalBalance,
        totalCredit,
        totalDebit,
        accountCount: accounts.length
      }
    });
  } catch (error) {
    console.error('❌ Chyba pri načítaní pokladňových dát:', error);
    res.status(500).json({ error: 'Chyba pri načítaní pokladňových dát' });
  }
});

// ===== 9. BANKOVÉ TRANSAKCIE =====

router.get('/bank-transactions/:companyId/:accountNumber', authenticateToken, async (req, res) => {
  const { companyId, accountNumber } = req.params;

  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }

    const mdbPath = path.join(
      __dirname,
      '..',
      'zalohy',
      '2025',
      `${company.ico}_2025`,
      `${company.ico}_2025.mdb`
    );

    if (!fs.existsSync(mdbPath)) {
      return res.status(404).json({ error: 'MDB súbor nebol nájdený' });
    }

    const ADODB = require('node-adodb');
    const connectionString = `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`;
    const connection = ADODB.open(connectionString);

    const accountQuery = `
      SELECT ID, AUcet, SText, Banka
      FROM sUcet 
      WHERE SText = '${accountNumber}' OR AUcet = '${accountNumber}'
    `;

    const accountData = await connection.query(accountQuery);
    if (accountData.length === 0) {
      return res.status(404).json({ error: 'Účet nebol nájdený' });
    }

    const account = accountData[0];
    const pudAccountNumber = account.AUcet || '221000';

    const transactionsQuery = `
      SELECT ID, Datum, Cislo, SText, Kc, UMD, UD, Firma
      FROM pUD 
      WHERE UMD = '${pudAccountNumber}' OR UD = '${pudAccountNumber}'
      ORDER BY Datum ASC
    `;

    const transactionsData = await connection.query(transactionsQuery);

    const transactions = [];
    let totalCredit = 0;
    let totalDebit = 0;
    let runningBalance = 0;
    let isFirstTransaction = true;

    for (const transaction of transactionsData) {
      const isCredit = transaction.UMD === pudAccountNumber;
      const amount = parseFloat(transaction.Kc) || 0;

      if (isFirstTransaction) {
        if (isCredit) {
          runningBalance = amount;
          totalCredit += amount;
          transactions.push({
            id: transaction.ID,
            datum: transaction.Datum,
            popis: transaction.SText || `Transakcia ${transaction.Cislo || ''}`,
            kredit: amount,
            debet: 0,
            zostatok: runningBalance,
            typ: 'kredit',
            firma: transaction.Firma || ''
          });
        } else {
          runningBalance = -amount;
          totalDebit += amount;
          transactions.push({
            id: transaction.ID,
            datum: transaction.Datum,
            popis: transaction.SText || `Transakcia ${transaction.Cislo || ''}`,
            kredit: 0,
            debet: amount,
            zostatok: runningBalance,
            typ: 'debet',
            firma: transaction.Firma || ''
          });
        }
        isFirstTransaction = false;
      } else {
        if (isCredit) {
          runningBalance += amount;
          totalCredit += amount;
          transactions.push({
            id: transaction.ID,
            datum: transaction.Datum,
            popis: transaction.SText || `Transakcia ${transaction.Cislo || ''}`,
            kredit: amount,
            debet: 0,
            zostatok: runningBalance,
            typ: 'kredit',
            firma: transaction.Firma || ''
          });
        } else {
          runningBalance -= amount;
          totalDebit += amount;
          transactions.push({
            id: transaction.ID,
            datum: transaction.Datum,
            popis: transaction.SText || `Transakcia ${transaction.Cislo || ''}`,
            kredit: 0,
            debet: amount,
            zostatok: runningBalance,
            typ: 'debet',
            firma: transaction.Firma || ''
          });
        }
      }
    }

    res.json({
      company: { id: company.id, name: company.name, ico: company.ico },
      account: {
        accountNumber: account.SText || account.AUcet,
        accountName: account.SText || `Bankový účet ${account.AUcet}`,
        bankName: account.Banka || 'Neznáma banka'
      },
      transactions,
      summary: {
        totalCredit,
        totalDebit,
        currentBalance: runningBalance,
        transactionCount: transactions.length
      }
    });
  } catch (error) {
    console.error('❌ Chyba pri načítaní transakcií:', error);
    res.status(500).json({
      error: 'Chyba pri načítaní transakcií',
      details: error.message
    });
  }
});

// ===== 10. POKLADŇOVÉ TRANSAKCIE =====

router.get('/cash-transactions/:companyId/:accountNumber', authenticateToken, async (req, res) => {
  const { companyId, accountNumber } = req.params;

  try {
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }

    const mdbPath = path.join(
      __dirname,
      '..',
      'zalohy',
      '2025',
      `${company.ico}_2025`,
      `${company.ico}_2025.mdb`
    );

    if (!fs.existsSync(mdbPath)) {
      return res.status(404).json({ error: 'MDB súbor nebol nájdený' });
    }

    const ADODB = require('node-adodb');
    const connection = ADODB.open(
      `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`
    );

    const accountQuery = `
      SELECT ID, AUcet, SText, Banka, RelJeUcet
      FROM sUcet 
      WHERE SText = '${accountNumber}' OR AUcet = '${accountNumber}'
    `;
    const accountData = await connection.query(accountQuery);
    if (accountData.length === 0) {
      return res.status(404).json({ error: 'Pokladňa nebola nájdená' });
    }
    const account = accountData[0];

    let pudAccountNumber = account.AUcet;
    if (!pudAccountNumber || pudAccountNumber === '') pudAccountNumber = '211000';

    const transactionsQuery = `
      SELECT ID, Datum, Cislo, SText, Kc, UMD, UD, Firma
      FROM pUD 
      WHERE UMD = '${pudAccountNumber}' OR UD = '${pudAccountNumber}'
      ORDER BY Datum ASC
    `;
    const transactionsData = await connection.query(transactionsQuery);

    const transactions = [];
    let totalCredit = 0;
    let totalDebit = 0;
    let runningBalance = 0;
    let isFirstTransaction = true;

    for (const transaction of transactionsData) {
      const isCredit = transaction.UMD === pudAccountNumber;
      const amount = parseFloat(transaction.Kc) || 0;

      if (isFirstTransaction) {
        if (isCredit) {
          runningBalance = amount;
          totalCredit += amount;
          transactions.push({
            id: transaction.ID,
            datum: transaction.Datum,
            popis: transaction.SText || `Transakcia ${transaction.Cislo || ''}`,
            kredit: amount,
            debet: 0,
            zostatok: runningBalance,
            typ: 'kredit',
            firma: transaction.Firma || ''
          });
        } else {
          runningBalance = -amount;
          totalDebit += amount;
          transactions.push({
            id: transaction.ID,
            datum: transaction.Datum,
            popis: transaction.SText || `Transakcia ${transaction.Cislo || ''}`,
            kredit: 0,
            debet: amount,
            zostatok: runningBalance,
            typ: 'debet',
            firma: transaction.Firma || ''
          });
        }
        isFirstTransaction = false;
      } else {
        if (isCredit) {
          runningBalance += amount;
          totalCredit += amount;
          transactions.push({
            id: transaction.ID,
            datum: transaction.Datum,
            popis: transaction.SText || `Transakcia ${transaction.Cislo || ''}`,
            kredit: amount,
            debet: 0,
            zostatok: runningBalance,
            typ: 'kredit',
            firma: transaction.Firma || ''
          });
        } else {
          runningBalance -= amount;
          totalDebit += amount;
          transactions.push({
            id: transaction.ID,
            datum: transaction.Datum,
            popis: transaction.SText || `Transakcia ${transaction.Cislo || ''}`,
            kredit: 0,
            debet: amount,
            zostatok: runningBalance,
            typ: 'debet',
            firma: transaction.Firma || ''
          });
        }
      }
    }

    res.json({
      company: { id: company.id, name: company.name, ico: company.ico },
      account: {
        accountNumber: account.SText || account.AUcet,
        accountName:
          account.AUcet === '211000' || !account.SText || account.SText === ''
            ? 'Hlavná pokladňa'
            : account.SText,
        bankName: account.Banka || 'Pokladňa'
      },
      transactions,
      summary: {
        totalCredit,
        totalDebit,
        currentBalance: runningBalance,
        transactionCount: transactions.length
      }
    });
  } catch (error) {
    console.error('❌ Chyba pri načítaní transakcií pokladne:', error);
    res.status(500).json({
      error: 'Chyba pri načítaní transakcií pokladne',
      details: error.message
    });
  }
});

// ===== 11. TEST DROPBOX PUBLIC (fixnutý double-response v catch) =====

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

    if (dropboxService.isInitialized()) {
      try {
        const mdbFiles = await dropboxService.listMDBFiles();
        testResults.dropbox.testResults.availableFiles = mdbFiles;
        testResults.dropbox.testResults.listFilesSuccess = true;

        if (mdbFiles && mdbFiles.length > 0) {
          const firstFile = mdbFiles[0];
          const fileName = firstFile.name;
          const companyIco = fileName.split('_')[0]; // formát ICO_ROK.mdb

          const fileExists = await dropboxService.checkMDBFileExists(companyIco, '2025');
          testResults.dropbox.testResults.sampleFileExists = fileExists;
          testResults.dropbox.testResults.sampleCompanyIco = companyIco;
        }
      } catch (err) {
        testResults.dropbox.testResults.error = err.message;
        testResults.dropbox.testResults.errorStack = err.stack;
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

// ===== 12. MDB UPLOAD (admin) — FIXNUTÁ VERZIA =====

/**
 * Admin MDB upload
 * - multer.memoryStorage()
 * - uloží do /var/www/html/portal-app/uploads
 * - vyžaduje rolu admin
 * Ponechané poradie: upload -> authenticateToken
 */
router.post(
  '/admin/mdb/upload/:companyId',
  upload.single('file'),
  authenticateToken,
  async (req, res) => {
    try {
      const { companyId } = req.params;

      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Prístup zamietnutý. Len admin môže uploadovať MDB súbory.'
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Súbor nie je priložený' });
      }

      const outDir = '/var/www/html/portal-app/uploads';
      const savedName = `${Date.now()}_${req.file.originalname}`;
      const outPath = `${outDir}/${savedName}`;

      await fs.promises.mkdir(outDir, { recursive: true });
      await fs.promises.writeFile(outPath, req.file.buffer);

      return res.json({
        success: true,
        message: 'MDB súbor bol úspešne nahraný',
        filename: req.file.originalname,
        savedAs: savedName,
        size: req.file.size,
        companyId
      });
    } catch (error) {
      console.error('Chyba pri upload endpoint:', error);
      return res.status(500).json({ error: 'Chyba pri spracovaní požiadavky' });
    }
  }
);

module.exports = router;
