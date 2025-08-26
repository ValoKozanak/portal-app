const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Cesta k databáze
const dbPath = path.join(__dirname, 'portal.db');

console.log('🔍 Kontrolujem stĺpce v issued_invoices tabuľke...');

// Vytvorenie pripojenia k databáze
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Chyba pri pripojení k databáze:', err.message);
    return;
  }
  console.log('✅ Pripojené k databáze');
});

// Získanie informácií o stĺpcoch
db.all("PRAGMA table_info(issued_invoices)", (err, rows) => {
  if (err) {
    console.error('❌ Chyba pri získavaní informácií o tabuľke:', err);
    return;
  }
  
  console.log('\n📋 Stĺpce v issued_invoices tabuľke:');
  console.log('=====================================');
  
  rows.forEach((row, index) => {
    console.log(`${index + 1}. ${row.name} (${row.type})`);
  });
  
  console.log(`\n📊 Celkový počet stĺpcov: ${rows.length}`);
  
  // Zatvorenie databázy
  db.close((err) => {
    if (err) {
      console.error('❌ Chyba pri zatváraní databázy:', err.message);
    } else {
      console.log('✅ Databáza zatvorená');
    }
  });
});
