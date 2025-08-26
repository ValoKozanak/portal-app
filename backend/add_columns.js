const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Cesta k databáze
const dbPath = path.join(__dirname, 'database.sqlite');

// Vytvorenie pripojenia k databáze
const db = new sqlite3.Database(dbPath);

console.log('Pridávam nové stĺpce do tabuľky received_invoices...');

// Pridanie nových stĺpcov
const alterQueries = [
  'ALTER TABLE received_invoices ADD COLUMN base_0 DECIMAL(10,2) DEFAULT 0',
  'ALTER TABLE received_invoices ADD COLUMN base_1 DECIMAL(10,2) DEFAULT 0',
  'ALTER TABLE received_invoices ADD COLUMN base_2 DECIMAL(10,2) DEFAULT 0',
  'ALTER TABLE received_invoices ADD COLUMN base_3 DECIMAL(10,2) DEFAULT 0',
  'ALTER TABLE received_invoices ADD COLUMN vat_0 DECIMAL(10,2) DEFAULT 0',
  'ALTER TABLE received_invoices ADD COLUMN vat_1 DECIMAL(10,2) DEFAULT 0',
  'ALTER TABLE received_invoices ADD COLUMN vat_2 DECIMAL(10,2) DEFAULT 0',
  'ALTER TABLE received_invoices ADD COLUMN vat_3 DECIMAL(10,2) DEFAULT 0',
  'ALTER TABLE received_invoices ADD COLUMN varsym TEXT'
];

// Spustenie všetkých ALTER príkazov
alterQueries.forEach((query, index) => {
  db.run(query, function(err) {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log(`Stĺpec už existuje: ${query}`);
      } else {
        console.error(`Chyba pri pridávaní stĺpca: ${err.message}`);
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
        }
      });
    }
  });
});


