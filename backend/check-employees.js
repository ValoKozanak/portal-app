const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Cesta k databáze
const dbPath = path.join(__dirname, 'portal.db');

// Pripojenie k databáze
const db = new sqlite3.Database(dbPath);

console.log('🔍 Kontrolujem existujúcich zamestnancov...');

// SQL príkaz na zobrazenie všetkých zamestnancov
const sql = 'SELECT * FROM employees';

db.all(sql, [], (err, rows) => {
  if (err) {
    console.error('❌ Chyba pri načítaní zamestnancov:', err.message);
  } else {
    console.log('✅ Existujúci zamestnanci:');
    rows.forEach(row => {
      console.log(`- ID: ${row.id}, Email: ${row.email}, Meno: ${row.first_name} ${row.last_name}, Firma: ${row.company_id}`);
    });
  }
  
  // Zatvorenie databázy
  db.close();
});
