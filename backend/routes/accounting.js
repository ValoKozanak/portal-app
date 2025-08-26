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
        const mdbPath = `C:\\Users\\kozan\\Cursor\\backend\\zalohy\\${currentYear}\\${company.ico}_${currentYear}\\${company.ico}_${currentYear}.mdb`;
        
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
        const mdbPath = `C:\\Users\\kozan\\Cursor\\backend\\zalohy\\${currentYear}\\${company.ico}_${currentYear}\\${company.ico}_${currentYear}.mdb`;
        
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

module.exports = router;
