const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Pripojenie k SQLite databáze
const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

function checkReceivedColumns() {
  console.log('🔍 Kontrolujem stĺpce v received_invoices tabuľke...');
  
  db.all("PRAGMA table_info(received_invoices)", (err, rows) => {
    if (err) {
      console.error('❌ Chyba pri čítaní schémy:', err);
      db.close();
      return;
    }
    
    console.log('✅ Pripojené k databáze');
    console.log('');
    console.log('📋 Stĺpce v received_invoices tabuľke:');
    console.log('=====================================');
    
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name} (${row.type})`);
    });
    
    console.log('');
    console.log(`📊 Celkový počet stĺpcov: ${rows.length}`);
    console.log('✅ Databáza zatvorená');
    
    db.close();
  });
}

checkReceivedColumns();

