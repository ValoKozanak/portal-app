const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Cesta k databáze
const dbPath = path.join(__dirname, 'database.sqlite');

// Vytvorenie pripojenia k databáze
const db = new sqlite3.Database(dbPath);

console.log('Pridávam všetky stĺpce z MDB do tabuľky received_invoices...');

// Všetky stĺpce z MDB tabuľky FA, ktoré chceme pridať
const alterQueries = [
  // Základné informácie
  'ALTER TABLE received_invoices ADD COLUMN mdb_id INTEGER',
  'ALTER TABLE received_invoices ADD COLUMN rel_tp_fak INTEGER',
  'ALTER TABLE received_invoices ADD COLUMN datum DATE',
  'ALTER TABLE received_invoices ADD COLUMN dat_splat DATE',
  
  // Partner informácie
  'ALTER TABLE received_invoices ADD COLUMN firma TEXT',
  'ALTER TABLE received_invoices ADD COLUMN ico TEXT',
  'ALTER TABLE received_invoices ADD COLUMN dic TEXT',
  'ALTER TABLE received_invoices ADD COLUMN ulice TEXT',
  'ALTER TABLE received_invoices ADD COLUMN psc TEXT',
  'ALTER TABLE received_invoices ADD COLUMN obec TEXT',
  
  // Sumy - základy DPH
  'ALTER TABLE received_invoices ADD COLUMN kc0 DECIMAL(10,2) DEFAULT 0',
  'ALTER TABLE received_invoices ADD COLUMN kc1 DECIMAL(10,2) DEFAULT 0',
  'ALTER TABLE received_invoices ADD COLUMN kc2 DECIMAL(10,2) DEFAULT 0',
  'ALTER TABLE received_invoices ADD COLUMN kc3 DECIMAL(10,2) DEFAULT 0',
  
  // Sumy - DPH
  'ALTER TABLE received_invoices ADD COLUMN kc_dph1 DECIMAL(10,2) DEFAULT 0',
  'ALTER TABLE received_invoices ADD COLUMN kc_dph2 DECIMAL(10,2) DEFAULT 0',
  'ALTER TABLE received_invoices ADD COLUMN kc_dph3 DECIMAL(10,2) DEFAULT 0',
  
  // Celkové sumy
  'ALTER TABLE received_invoices ADD COLUMN kc_celkem DECIMAL(10,2) DEFAULT 0',
  
  // Ďalšie informácie
  'ALTER TABLE received_invoices ADD COLUMN var_sym TEXT',
  'ALTER TABLE received_invoices ADD COLUMN s_text TEXT',
  
  // Mapovanie na existujúce stĺpce (pre spätnú kompatibilitu)
  'ALTER TABLE received_invoices ADD COLUMN mdb_cislo TEXT'
];

// Spustenie všetkých ALTER príkazov
alterQueries.forEach((query, index) => {
  db.run(query, function(err) {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log(`✅ Stĺpec už existuje: ${query}`);
      } else {
        console.error(`❌ Chyba pri pridávaní stĺpca: ${err.message}`);
      }
    } else {
      console.log(`✅ Pridaný stĺpec: ${query}`);
    }
    
    // Ak sme spracovali všetky queries, zatvoríme databázu
    if (index === alterQueries.length - 1) {
      db.close((err) => {
        if (err) {
          console.error('Chyba pri zatváraní databázy:', err.message);
        } else {
          console.log('✅ Všetky stĺpce boli úspešne pridané!');
          console.log('Teraz môžete spustiť backend a importovať dáta s novými stĺpcami.');
        }
      });
    }
  });
});


