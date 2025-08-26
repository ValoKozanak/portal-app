const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('portal.db');

console.log('🔍 Kontrolujem databázu...');

// Zoznam tabuliek
db.all('SELECT name FROM sqlite_master WHERE type="table"', (err, tables) => {
  if (err) {
    console.error('❌ Chyba pri získavaní tabuliek:', err);
  } else {
    console.log('📋 Tabulky v databáze:');
    tables.forEach(table => console.log(`  - ${table.name}`));
  }
  
  // Kontrola issued_invoices tabuľky
  db.all('SELECT COUNT(*) as count FROM issued_invoices', (err, result) => {
    if (err) {
      console.error('❌ Chyba pri kontrole issued_invoices:', err);
    } else {
      console.log(`📊 Počet faktúr v issued_invoices: ${result[0]?.count || 0}`);
    }
    
    // Kontrola issued_invoice_items tabuľky
    db.all('SELECT COUNT(*) as count FROM issued_invoice_items', (err, result) => {
      if (err) {
        console.error('❌ Chyba pri kontrole issued_invoice_items:', err);
      } else {
        console.log(`📊 Počet položiek v issued_invoice_items: ${result[0]?.count || 0}`);
      }
      
      db.close();
    });
  });
});

