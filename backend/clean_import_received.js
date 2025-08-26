const ADODB = require('node-adodb');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Pripojenie k SQLite databáze
const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

async function cleanImportReceived() {
  try {
    console.log('🧹 Začínam čistý import prijatých faktúr z MDB...');
    
    const currentYear = new Date().getFullYear();
    const mdbPath = `C:\\Users\\kozan\\Cursor\\backend\\zalohy\\${currentYear}\\77777777_${currentYear}\\77777777_${currentYear}.mdb`;
    
    console.log('📁 Cesta k MDB:', mdbPath);
    
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // 1. Vymazanie existujúcich prijatých faktúr
    console.log('🗑️ Vymazávam existujúce prijaté faktúry...');
    db.run("DELETE FROM received_invoices WHERE company_id = 3", function(err) {
      if (err) {
        console.error('❌ Chyba pri mazaní:', err);
        return;
      }
      console.log(`✅ Vymazaných ${this.changes} prijatých faktúr`);
      
      // 2. Načítanie všetkých prijatých faktúr z MDB
      const query = `
        SELECT * FROM [FA] 
        WHERE RelTpFak = 11
        ORDER BY Datum DESC
      `;
      
      connection.query(query)
        .then(data => {
          console.log(`✅ Načítané ${data.length} prijatých faktúr z MDB`);
          
          // 3. Import všetkých údajov
          let importedCount = 0;
          let errorCount = 0;
          
          data.forEach((row, index) => {
            // Použijeme INSERT s opraveným počtom stĺpcov
            const insertQuery = `
              INSERT INTO received_invoices (
                company_id, invoice_number, supplier_name, supplier_ico, supplier_dic,
                supplier_address, issue_date, due_date, total_amount, vat_amount,
                kc0, kc1, kc2, kc3, kc_dph1, kc_dph2, kc_dph3, kc_celkem, var_sym, s_text,
                mdb_id, rel_tp_fak, datum, dat_splat, firma, ico, dic, ulice, psc, obec,
                mdb_cislo, base_0, base_1, base_2, base_3, vat_0, vat_1, vat_2, vat_3,
                varsym, currency, status, pohoda_id, notes, created_by, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
              'system@import.com',
              new Date().toISOString(),
              new Date().toISOString()
            ];
            
            db.run(insertQuery, values, function(err) {
              if (err) {
                console.error(`❌ Chyba pri importe prijatej faktúry ${row.Cislo}:`, err);
                errorCount++;
              } else {
                importedCount++;
                console.log(`✅ Importovaná prijatá faktúra ${row.Cislo} (${importedCount}/${data.length})`);
              }
              
              // Ak sme spracovali všetky faktúry
              if (index === data.length - 1) {
                console.log('\n🎉 IMPORT PRIJATÝCH FAKTÚR DOKONČENÝ!');
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

cleanImportReceived();
