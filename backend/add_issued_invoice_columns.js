const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

console.log('Pridávam chýbajúce stĺpce do tabuľky issued_invoices...');

// Zoznam stĺpcov, ktoré potrebujeme pridať
const columns = [
  'kc0 DECIMAL(10,2) DEFAULT 0',
  'kc1 DECIMAL(10,2) DEFAULT 0',
  'kc2 DECIMAL(10,2) DEFAULT 0',
  'kc3 DECIMAL(10,2) DEFAULT 0',
  'kc_dph1 DECIMAL(10,2) DEFAULT 0',
  'kc_dph2 DECIMAL(10,2) DEFAULT 0',
  'kc_dph3 DECIMAL(10,2) DEFAULT 0',
  'kc_celkem DECIMAL(10,2) DEFAULT 0',
  'var_sym TEXT',
  's_text TEXT',
  'mdb_id INTEGER',
  'rel_tp_fak INTEGER',
  'datum DATE',
  'dat_splat DATE',
  'firma TEXT',
  'ico TEXT',
  'dic TEXT',
  'ulice TEXT',
  'psc TEXT',
  'obec TEXT',
  'mdb_cislo TEXT'
];

let addedCount = 0;
let errorCount = 0;

columns.forEach((column, index) => {
  db.run(`ALTER TABLE issued_invoices ADD COLUMN ${column}`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log(`✅ Stĺpec už existuje: ${column}`);
      } else {
        console.error(`❌ Chyba pri pridávaní stĺpca ${column}:`, err.message);
        errorCount++;
      }
    } else {
      console.log(`✅ Pridaný stĺpec: ${column}`);
      addedCount++;
    }
    
    // Ak sme spracovali všetky stĺpce, zatvoríme databázu
    if (index === columns.length - 1) {
      console.log(`\n📊 Súhrn:`);
      console.log(`✅ Pridané stĺpce: ${addedCount}`);
      console.log(`❌ Chyby: ${errorCount}`);
      console.log(`🎯 Celkovo stĺpcov: ${columns.length}`);
      
      db.close();
    }
  });
});


