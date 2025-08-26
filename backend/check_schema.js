const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('portal.db');

db.all('PRAGMA table_info(issued_invoices)', (err, rows) => {
  if (err) {
    console.error('Chyba pri kontrole schémy:', err);
  } else {
    console.log('📋 Schéma tabuľky issued_invoices:');
    rows.forEach(row => {
      console.log(`  ${row.name} (${row.type})`);
    });
  }
  db.close();
});

