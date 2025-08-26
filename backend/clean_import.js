const ADODB = require('node-adodb');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Pripojenie k SQLite databáze
const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

async function cleanImport() {
  try {
    console.log('🧹 Začínam čistý import všetkých údajov z MDB...');
    
    const currentYear = new Date().getFullYear();
    const mdbPath = `C:\\Users\\kozan\\Cursor\\backend\\zalohy\\${currentYear}\\77777777_${currentYear}\\77777777_${currentYear}.mdb`;
    
    console.log('📁 Cesta k MDB:', mdbPath);
    
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // 1. Vymazanie existujúcich faktúr
    console.log('🗑️ Vymazávam existujúce faktúry...');
    db.run("DELETE FROM issued_invoices WHERE company_id = 3", function(err) {
      if (err) {
        console.error('❌ Chyba pri mazaní:', err);
        return;
      }
      console.log(`✅ Vymazaných ${this.changes} faktúr`);
      
      // 2. Načítanie všetkých faktúr z MDB
      const query = `
        SELECT * FROM [FA] 
        WHERE RelTpFak = 1
        ORDER BY Datum DESC
      `;
      
      connection.query(query)
        .then(data => {
          console.log(`✅ Načítané ${data.length} faktúr z MDB`);
          
          // 3. Import všetkých údajov
          let importedCount = 0;
          let errorCount = 0;
          
          data.forEach((row, index) => {
            // Použijeme INSERT s * pre všetky stĺpce
            const insertQuery = `
              INSERT INTO issued_invoices (
                company_id, invoice_number, customer_name, customer_ico, customer_dic,
                customer_address, issue_date, due_date, total_amount, vat_amount,
                currency, status, pohoda_id, notes, created_by, created_at, updated_at,
                kc_dph1, kc_dph2, kc_dph3, var_sym, s_text, kc_celkem, kc0, dat_splat,
                firma, ico, dic, ulice, psc, obec, mdb_cislo, mdb_id, rel_tp_fak, datum,
                kc1, kc2, kc3
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
                         const values = [
               3, // company_id
               row.Cislo || '',
               row.Firma || '',
               row.ICO || '',
               row.DIC || '',
               `${row.Ulice || ''}, ${row.PSC || ''} ${row.Obec || ''}`.trim().replace(/^,\s*/, ''),
               row.Datum ? new Date(row.Datum).toISOString().split('T')[0] : '',
               row.DatSplat ? new Date(row.DatSplat).toISOString().split('T')[0] : '',
               (parseFloat(row.Kc0) || 0) + (parseFloat(row.Kc1) || 0) + (parseFloat(row.Kc2) || 0) + (parseFloat(row.Kc3) || 0),
               (parseFloat(row.KcDPH1) || 0) + (parseFloat(row.KcDPH2) || 0) + (parseFloat(row.KcDPH3) || 0),
               'EUR',
               'sent',
               null, // pohoda_id
               row.SText || '',
               'system@import.com',
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
               parseFloat(row.Kc3) || 0
             ];
            
            db.run(insertQuery, values, function(err) {
              if (err) {
                console.error(`❌ Chyba pri importe faktúry ${row.Cislo}:`, err);
                errorCount++;
              } else {
                importedCount++;
                console.log(`✅ Importovaná faktúra ${row.Cislo} (${importedCount}/${data.length})`);
              }
              
              // Ak sme spracovali všetky faktúry
              if (index === data.length - 1) {
                console.log('\n🎉 IMPORT DOKONČENÝ!');
                console.log(`✅ Úspešne importovaných: ${importedCount}`);
                console.log(`❌ Chyby: ${errorCount}`);
                console.log(`📊 Celkovo spracovaných: ${data.length}`);
                
                // Zatvorenie databázy
                db.close();
                process.exit(0);
              }
            });
          });
        })
        .catch(error => {
          console.error('❌ Chyba pri čítaní MDB:', error);
          db.close();
          process.exit(1);
        });
    });
    
  } catch (error) {
    console.error('❌ Chyba pri importe:', error);
    db.close();
    process.exit(1);
  }
}

cleanImport();
