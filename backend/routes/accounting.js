const express = require('express');
const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = Router();
const { authenticateToken } = require('./auth');
const { db } = require('../database');

// ===== ÚČTOVNÍCTVO API ROUTES =====

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
  
  console.log('📊 Získavam súhrn pUD pre company_id:', companyId);
  console.log('🔍 Používateľ:', req.user.email);
  
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
    
    console.log('📁 Načítavam dáta z:', mdbPath);
    
    if (!fs.existsSync(mdbPath)) {
      return res.status(404).json({ error: 'MDB súbor nebol nájdený' });
    }
    
    // Import z MDB
    const ADODB = require('node-adodb');
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // Získanie súčtu Kc
    const sumResult = await connection.query('SELECT SUM(Kc) as total_kc, COUNT(*) as total_count FROM pUD');
    
    const summary = {
      total_kc: sumResult[0].total_kc || 0,
      total_count: sumResult[0].total_count || 0
    };
    
    console.log('✅ Súhrn pUD:', summary);
    res.json(summary);
    
  } catch (error) {
    console.error('Chyba pri získavaní súhrnu pUD:', error);
    res.status(500).json({ error: 'Chyba pri získavaní súhrnu pUD' });
  }
});

// Podrobná analýza nákladov a výnosov z pUD
router.get('/financial-analysis/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { dateFrom, dateTo } = req.query;
  
  console.log('📊 Získavam podrobnú analýzu nákladov a výnosov pre company_id:', companyId);
  console.log('📅 Filtre dátumov:', { dateFrom, dateTo });
  
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
    
    console.log('📁 Načítavam dáta z:', mdbPath);
    
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
      console.log('📅 Dátumové filtre:', { dateFrom, dateTo });
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
    
    console.log('✅ Analýza nákladov a výnosov:', analysis);
    res.json(analysis);
    
  } catch (error) {
    console.error('Chyba pri získavaní analýzy nákladov a výnosov:', error);
    res.status(500).json({ error: 'Chyba pri získavaní analýzy nákladov a výnosov' });
  }
});

// Podrobná analýza nákladov a výnosov z pUD (bez autentifikácie pre testovanie)
router.get('/financial-analysis-test/:companyId', async (req, res) => {
  const { companyId } = req.params;
  const { dateFrom, dateTo } = req.query;
  
  console.log('📊 Získavam podrobnú analýzu nákladov a výnosov pre company_id:', companyId);
  console.log('📅 Filtre dátumov:', { dateFrom, dateTo });
  
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
    
    console.log('📁 Načítavam dáta z:', mdbPath);
    
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
      console.log('📅 Dátumové filtre:', { dateFrom, dateTo });
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
    
    console.log('✅ Analýza nákladov a výnosov:', analysis);
    res.json(analysis);
    
  } catch (error) {
    console.error('Chyba pri získavaní analýzy nákladov a výnosov:', error);
    res.status(500).json({ error: 'Chyba pri získavaní analýzy nákladov a výnosov' });
  }
});

// 3. ŠTATISTIKY

// Získanie štatistík účtovníctva
router.get('/stats/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { date_from, date_to } = req.query;
  
  console.log('🔍 Načítavam štatistiky pre company_id:', companyId);
  console.log('🔍 Používateľ:', req.user.email);
  
  let dateFilter = '';
  let params = [companyId];
  
  if (date_from && date_to) {
    dateFilter = ' AND issue_date BETWEEN ? AND ?';
    params.push(date_from, date_to);
  }
  
  // Štatistiky vydaných faktúr
  db.get(`
    SELECT 
      COUNT(*) as total_issued,
      SUM(total_amount) as total_issued_amount,
      SUM(vat_amount) as total_issued_vat,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_issued,
      SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_issued_amount,
      SUM(CASE WHEN kc_likv > 0 THEN kc_likv ELSE 0 END) as unpaid_amount
    FROM issued_invoices 
    WHERE company_id = ?${dateFilter}
  `, params, (err, issuedStats) => {
    if (err) {
      console.error('Chyba pri načítaní štatistík vydaných faktúr:', err);
      return res.status(500).json({ error: 'Chyba pri načítaní štatistík' });
    }
    
    // Štatistiky prijatých faktúr
    db.get(`
      SELECT 
        COUNT(*) as total_received,
        SUM(total_amount) as total_received_amount,
        SUM(vat_amount) as total_received_vat,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_received,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_received_amount,
        SUM(CASE WHEN kc_likv > 0 THEN kc_likv ELSE 0 END) as unpaid_amount
      FROM received_invoices 
      WHERE company_id = ?${dateFilter}
    `, params, (err, receivedStats) => {
      if (err) {
        console.error('Chyba pri načítaní štatistík prijatých faktúr:', err);
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
    });
  });
});





// 4. VYDANÉ FAKTÚRY

// Získanie vydaných faktúr
router.get('/issued-invoices/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { status, date_from, date_to, limit = 50, offset = 0 } = req.query;
  
  console.log('🔍 Načítavam vydané faktúry pre company_id:', companyId);
  console.log('🔍 Používateľ:', req.user.email);
  
  let query = `
    SELECT * FROM issued_invoices 
    WHERE company_id = ?
  `;
  let params = [companyId];
  
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
  params.push(parseInt(limit), parseInt(offset));
  
  console.log('🔍 Query:', query);
  console.log('🔍 Params:', params);
  
  db.all(query, params, (err, invoices) => {
    if (err) {
      console.error('Chyba pri načítaní vydaných faktúr:', err);
      return res.status(500).json({ error: 'Chyba pri načítaní faktúr' });
    }
    
    console.log('🔍 Našiel som faktúr:', invoices.length);
    
    res.json(invoices);
  });
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
router.get('/received-invoices/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { status, date_from, date_to, limit = 50, offset = 0 } = req.query;
  
  let query = `
    SELECT * FROM received_invoices 
    WHERE company_id = ?
  `;
  let params = [companyId];
  
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
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, invoices) => {
    if (err) {
      console.error('Chyba pri načítaní prijatých faktúr:', err);
      return res.status(500).json({ error: 'Chyba pri načítaní faktúr' });
    }
    
    res.json(invoices);
  });
});

// 5. OBNOVENIE FAKTÚR Z MDB

// Obnovenie vydaných faktúr z MDB
router.post('/refresh-invoices/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  
  try {
    console.log('🔍 Params:', [companyId, 100, 0]);
    
    // Najprv nájdeme firmu a jej IČO
    db.get("SELECT ico, name FROM companies WHERE id = ?", [companyId], async (err, company) => {
      if (err) {
        console.error('Chyba pri hľadaní firmy:', err);
        return res.status(500).json({ error: 'Chyba pri načítaní firmy' });
      }
      
      if (!company) {
        return res.status(404).json({ error: 'Firma nenájdená' });
      }
      
      console.log('🔍 Firma:', company.name, 'ICO:', company.ico);
      
      // Vymazanie existujúcich faktúr
      db.run("DELETE FROM issued_invoices WHERE company_id = ?", [companyId], function(err) {
    if (err) {
          console.error('Chyba pri mazaní faktúr:', err);
          return res.status(500).json({ error: 'Chyba pri mazaní faktúr' });
        }
        
        console.log('🗑️ Vymazaných', this.changes, 'faktúr');
        
        // Pripojenie k MDB
        const ADODB = require('node-adodb');
        const currentYear = new Date().getFullYear();
        const mdbPath = path.join(__dirname, '..', 'zalohy', currentYear.toString(), `${company.ico}_${currentYear}`, `${company.ico}_${currentYear}.mdb`);
        
        console.log('📁 Obnovujem faktúry z:', mdbPath);
        
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
              console.log(`✅ Načítané ${data.length} faktúr z MDB`);
              
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
                    console.log(`✅ Importovaná faktúra ${row.Cislo}`);
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
    console.log('🔍 Obnovujem prijaté faktúry pre company_id:', companyId);
    
    // Najprv nájdeme firmu a jej IČO
    db.get("SELECT ico, name FROM companies WHERE id = ?", [companyId], async (err, company) => {
      if (err) {
        console.error('Chyba pri hľadaní firmy:', err);
        return res.status(500).json({ error: 'Chyba pri načítaní firmy' });
      }
      
      if (!company) {
        return res.status(404).json({ error: 'Firma nenájdená' });
      }
      
      console.log('🔍 Firma:', company.name, 'ICO:', company.ico);
      
      // Vymazanie existujúcich prijatých faktúr
      db.run("DELETE FROM received_invoices WHERE company_id = ?", [companyId], function(err) {
        if (err) {
          console.error('Chyba pri mazaní prijatých faktúr:', err);
          return res.status(500).json({ error: 'Chyba pri mazaní prijatých faktúr' });
        }
        
        console.log('🗑️ Vymazaných', this.changes, 'prijatých faktúr');
        
        // Pripojenie k MDB
        const ADODB = require('node-adodb');
        const currentYear = new Date().getFullYear();
        const mdbPath = path.join(__dirname, '..', 'zalohy', currentYear.toString(), `${company.ico}_${currentYear}`, `${company.ico}_${currentYear}.mdb`);
        
        console.log('📁 Obnovujem prijaté faktúry z:', mdbPath);
        
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
              console.log(`✅ Načítané ${data.length} prijatých faktúr z MDB`);
              
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
                    console.log(`✅ Importovaná prijatá faktúra ${row.Cislo}`);
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
  
  console.log('📊 Získavam DPH podania pre company_id:', companyId, 'rok:', year);
  console.log('🔍 Používateľ:', req.user.email);
  
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
    
    console.log('📁 Načítavam DPH dáta z:', mdbPath);
    
    if (!fs.existsSync(mdbPath)) {
      return res.status(404).json({ error: 'MDB súbor nebol nájdený' });
    }

    // Načítanie DPH dát z MDB
    const ADODB = require('node-adodb');
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    const selectedYear = year || new Date().getFullYear();
    
    const query = `
      SELECT 
        ID,
        Rok,
        RelObDPH,
        KcDan,
        KcOdpoc,
        ElOdeslano
      FROM DPH 
      WHERE Rok = ${selectedYear}
      ORDER BY RelObDPH ASC
    `;
    
    console.log('🔍 SQL query:', query);
    
    const data = await connection.query(query);
    
    console.log('📊 Nájdených DPH záznamov:', data.length);
    
    // Spracovanie dát
    const returns = data.map((row, index) => ({
      id: index + 1,
      rok: parseInt(row.Rok) || selectedYear,
      mesiac: parseInt(row.RelObDPH) || 0,
      povinnost: parseFloat(row.KcDan) || 0,
      odpočet: parseFloat(row.KcOdpoc) || 0,
      odoslané: row.ElOdeslano === true || row.ElOdeslano === 1 || row.ElOdeslano === 'True'
    }));
    
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
    
    console.log('✅ DPH dáta úspešne načítané');
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
  
  console.log('🏦 Získavam bankové účty pre company_id:', companyId);
  console.log('🔍 Používateľ:', req.user.email);
  
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
    
    console.log('🏢 Informácie o firme:', {
      id: company.id,
      name: company.name,
      ico: company.ico
    });
    
    const mdbPath = path.join(__dirname, '..', 'zalohy', '2025', `${company.ico}_2025`, `${company.ico}_2025.mdb`);
    
    console.log('📁 Načítavam bankové dáta z:', mdbPath);
    
    if (!fs.existsSync(mdbPath)) {
      console.log('❌ MDB súbor neexistuje:', mdbPath);
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

    // Načítanie bankových účtov z MDB
    const ADODB = require('node-adodb');
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // Najprv skontrolujeme, či tabuľky existujú
    try {
      const tablesQuery = "SELECT Name FROM MSysObjects WHERE Type=1 AND Flags=0";
      const tables = await connection.query(tablesQuery);
      console.log('📋 Dostupné tabuľky:', tables.map(t => t.Name));
    } catch (error) {
      console.log('⚠️ Nepodarilo sa získať zoznam tabuliek:', error.message);
    }
    
    // Získanie všetkých účtov z tabuľky sUcet a potom filtrovanie bankových účtov
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
    
    console.log('🔍 SQL query pre účty:', accountsQuery);
    
    const allAccountsData = await connection.query(accountsQuery);
    
    console.log('🏦 Nájdených účtov v sUcet (pred filtrovaním):', allAccountsData.length);
    console.log('🏦 Všetky účty v sUcet:', allAccountsData);
    
    const accounts = [];
    let totalBalance = 0;
    let totalCredit = 0;
    let totalDebit = 0;
    
    for (const account of allAccountsData) {
      let accountNumber = account.AUcet;
      let displayAccountNumber = account.SText; // Pre zobrazenie použijeme SText
      
      // Ak je SText prázdne, preskočíme tento účet úplne
      if (!displayAccountNumber || displayAccountNumber === '') {
        console.log(`🏦 Preskakujem účet s prázdnym SText: AUcet=${accountNumber}`);
        continue;
      }
      
      // Ak je RelJeUcet = 1, je to pokladňa, preskočíme
      if (account.RelJeUcet === 1) {
        console.log(`🏦 Preskakujem pokladňu (RelJeUcet=1): AUcet=${accountNumber}, SText=${displayAccountNumber}`);
        continue;
      }
      
      // Ak je AUcet prázdne, použijeme 221000 pre výpočty v pUD
      if (!accountNumber || accountNumber === '') {
        accountNumber = '221000'; // Pre výpočty v pUD
        console.log(`🏦 AUcet je prázdne, používam 221000 pre pUD výpočty, zobrazenie: ${displayAccountNumber}`);
      }
      
      // Filtrujeme iba bankové účty (221)
      if (!accountNumber.startsWith('221')) {
        continue; // Preskočíme tento účet, ak nie je 221
      }
      
      const accountName = displayAccountNumber; // Používame SText, ktorý už vieme že nie je prázdny
      const bankName = account.Banka || 'Neznáma banka';
      
      console.log(`🏦 Spracujem účet: ${accountNumber} (pUD), zobrazenie: ${displayAccountNumber}, názov: ${accountName}, banka: ${bankName}`);
      
      // Získanie kreditných pohybov (UMD) pre tento účet z pUD - používame účtovú osnovu
      const creditQuery = `
        SELECT 
          SUM(pUD.Kc) as credit_total,
          COUNT(*) as transaction_count
        FROM pUD 
        WHERE pUD.UMD = '${accountNumber}'
      `;
      
      // Získanie debetných pohybov (UD) pre tento účet z pUD - používame účtovú osnovu
      const debitQuery = `
        SELECT 
          SUM(pUD.Kc) as debit_total
        FROM pUD 
        WHERE pUD.UD = '${accountNumber}'
      `;
      
      console.log(`🔍 SQL query pre kredit účtu ${accountNumber}:`, creditQuery);
      console.log(`🔍 SQL query pre debet účtu ${accountNumber}:`, debitQuery);
      
      const creditData = await connection.query(creditQuery);
      const debitData = await connection.query(debitQuery);
      
      console.log(`🔍 Kredit pre účet ${accountNumber}:`, creditData);
      console.log(`🔍 Debet pre účet ${accountNumber}:`, debitData);
      
      const creditTotal = parseFloat(creditData[0]?.credit_total) || 0;
      const debitTotal = parseFloat(debitData[0]?.debit_total) || 0;
      const balance = creditTotal - debitTotal;
      const transactionCount = parseInt(creditData[0]?.transaction_count) || 0;
      
      accounts.push({
        id: account.ID || accounts.length + 1,
        accountNumber: displayAccountNumber, // Zobrazujeme SText, ktorý už vieme že nie je prázdny
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
      message: accounts.length === 0 ? 'Neboli nájdené žiadne bankové účty (221)' : undefined
    };
    
    console.log('✅ Bankové dáta úspešne načítané');
    res.json(response);
    
  } catch (error) {
    console.error('❌ Chyba pri načítaní bankových dát:', error);
    res.status(500).json({ error: 'Chyba pri načítaní bankových dát' });
  }
});

// 8. POKLADŇA

// Získanie pokladňových účtov z MDB
router.get('/cash-accounts/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  
  console.log('💰 Získavam pokladňové účty pre company_id:', companyId);
  console.log('🔍 Používateľ:', req.user.email);
  
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
    
    console.log('📁 Načítavam pokladňové dáta z:', mdbPath);
    
    if (!fs.existsSync(mdbPath)) {
      return res.status(404).json({ error: 'MDB súbor nebol nájdený' });
    }

    // Načítanie pokladňových účtov z MDB
    const ADODB = require('node-adodb');
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // Získanie pokladňových účtov z tabuľky sUcet (iba 211 - pokladňa)
    const accountsQuery = `
      SELECT 
        ID,
        AUcet,
        SText
      FROM sUcet 
      WHERE AUcet LIKE '211%'
      ORDER BY AUcet
    `;
    
    console.log('🔍 SQL query pre pokladňové účty:', accountsQuery);
    
    const accountsData = await connection.query(accountsQuery);
    
    console.log('💰 Nájdených pokladňových účtov:', accountsData.length);
    console.log('💰 Účty:', accountsData);
    
    // Spracovanie pokladňových účtov - použijeme rovnaký prístup ako pri banke
    const accounts = [];
    let totalBalance = 0;
    let totalCredit = 0;
    let totalDebit = 0;
    
    for (const account of accountsData) {
      const accountNumber = account.AUcet; // Iba 211 účty
      const accountName = account.SText || `Pokladňa ${accountNumber}`;
      
      // Získanie kreditných pohybov (UMD) pre tento účet z pUD
      const creditQuery = `
        SELECT 
          SUM(pUD.Kc) as credit_total,
          COUNT(*) as transaction_count
        FROM pUD 
        WHERE pUD.UMD = '${accountNumber}'
      `;
      
      // Získanie debetných pohybov (UD) pre tento účet z pUD
      const debitQuery = `
        SELECT 
          SUM(pUD.Kc) as debit_total
        FROM pUD 
        WHERE pUD.UD = '${accountNumber}'
      `;
      
      console.log(`🔍 SQL query pre kredit pokladne ${accountNumber}:`, creditQuery);
      console.log(`🔍 SQL query pre debet pokladne ${accountNumber}:`, debitQuery);
      
      const creditData = await connection.query(creditQuery);
      const debitData = await connection.query(debitQuery);
      
      console.log(`🔍 Kredit pre pokladňu ${accountNumber}:`, creditData);
      console.log(`🔍 Debet pre pokladňu ${accountNumber}:`, debitData);
      
      const creditTotal = parseFloat(creditData[0]?.credit_total) || 0;
      const debitTotal = parseFloat(debitData[0]?.debit_total) || 0;
      const balance = creditTotal - debitTotal;
      const transactionCount = parseInt(creditData[0]?.transaction_count) || 0;
      
      accounts.push({
        id: account.ID || accounts.length + 1,
        accountNumber: accountNumber,
        accountName: accountName,
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
      }
    };
    
    console.log('✅ Pokladňové dáta úspešne načítané');
    res.json(response);
    
  } catch (error) {
    console.error('❌ Chyba pri načítaní pokladňových dát:', error);
    res.status(500).json({ error: 'Chyba pri načítaní pokladňových dát' });
  }
});

// 9. BANKOVÉ TRANSAKCIE

// Získanie transakcií pre konkrétny bankový účet
router.get('/bank-transactions/:companyId/:accountNumber', authenticateToken, async (req, res) => {
  const { companyId, accountNumber } = req.params;
  
  console.log('🏦 Získavam transakcie pre company_id:', companyId, 'accountNumber:', accountNumber);
  console.log('🔍 Používateľ:', req.user.email);
  
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
    
    console.log('📁 Načítavam transakcie z:', mdbPath);
    
    if (!fs.existsSync(mdbPath)) {
      return res.status(404).json({ error: 'MDB súbor nebol nájdený' });
    }

    // Načítanie transakcií z MDB
    console.log('🔧 Načítavam ADODB...');
    const ADODB = require('node-adodb');
    console.log('🔧 Vytváram connection string...');
    const connectionString = `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`;
    console.log('🔧 Connection string:', connectionString);
    const connection = ADODB.open(connectionString);
    console.log('🔧 Connection vytvorená');
    
    // Najprv získame informácie o účte z sUcet
    const accountQuery = `
      SELECT 
        ID,
        AUcet,
        SText,
        Banka
      FROM sUcet 
      WHERE SText = '${accountNumber}' OR AUcet = '${accountNumber}'
    `;
    
    console.log('🔍 SQL query pre účet:', accountQuery);
    
    console.log('🔍 Vykonávam account query...');
    const accountData = await connection.query(accountQuery);
    console.log('🔍 Account query výsledok:', accountData);
    
    if (accountData.length === 0) {
      console.log('❌ Účet nebol nájdený pre:', accountNumber);
      return res.status(404).json({ error: 'Účet nebol nájdený' });
    }
    
    const account = accountData[0];
    const pudAccountNumber = account.AUcet || '221000'; // Pre výpočty v pUD používame účtovú osnovu
    
    console.log('🏦 Informácie o účte:', account);
    console.log('🏦 Používam pUD číslo účtu:', pudAccountNumber);
    
    // Získanie transakcií z pUD tabuľky
    const transactionsQuery = `
      SELECT 
        ID,
        Datum,
        Cislo,
        SText,
        Kc,
        UMD,
        UD,
        Firma
      FROM pUD 
      WHERE UMD = '${pudAccountNumber}' OR UD = '${pudAccountNumber}'
      ORDER BY Datum ASC
    `;
    
    console.log('🔍 SQL query pre transakcie:', transactionsQuery);
    
    console.log('🔍 Vykonávam transactions query...');
    const transactionsData = await connection.query(transactionsQuery);
    console.log('🔍 Transactions query výsledok:', transactionsData);
    
    console.log('🏦 Nájdených transakcií:', transactionsData.length);
    
    // Spracovanie transakcií
    const transactions = [];
    let totalCredit = 0;
    let totalDebit = 0;
    
    // Počiatočný stav účtu - ak je to prvý riadok k 1.1.2025, začneme s 0
    // a prvý zostatok bude hodnota prvej transakcie
    let runningBalance = 0;
    let isFirstTransaction = true;
    
    console.log('💰 Začínam s počiatočným stavom: 0');
    
    for (const transaction of transactionsData) {
      const isCredit = transaction.UMD === pudAccountNumber; // Ak je účet 221 na strane UMD, je to kredit
      const amount = parseFloat(transaction.Kc) || 0;
      
      if (isFirstTransaction) {
        // Prvá transakcia k 1.1.2025 - zostatok je hodnota transakcie
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
        // Ostatné transakcie - normálne sčítavanie/odčítavanie
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
    
    const response = {
      company: {
        id: company.id,
        name: company.name,
        ico: company.ico
      },
      account: {
        accountNumber: account.SText || account.AUcet,
        accountName: account.SText || `Bankový účet ${account.AUcet}`,
        bankName: account.Banka || 'Neznáma banka'
      },
      transactions: transactions,
      summary: {
        totalCredit: totalCredit,
        totalDebit: totalDebit,
        currentBalance: runningBalance,
        transactionCount: transactions.length
      }
    };
    
    console.log('✅ Transakcie úspešne načítané');
    res.json(response);
    
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

module.exports = router;
