const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Cesta k databáze
const dbPath = path.join(__dirname, 'portal.db');

// Pripojenie k databáze
const db = new sqlite3.Database(dbPath);

console.log('🔍 Kontrolujem zamestnanca zam2@zam.sk...');

// SQL príkaz na zobrazenie zamestnanca
const sql = 'SELECT * FROM employees WHERE email = ?';

db.get(sql, ['zam2@zam.sk'], (err, row) => {
  if (err) {
    console.error('❌ Chyba pri načítaní zamestnanca:', err.message);
  } else if (row) {
    console.log('✅ Zamestnanec nájdený:');
    console.log(`- ID: ${row.id}`);
    console.log(`- Email: ${row.email}`);
    console.log(`- Meno: ${row.first_name} ${row.last_name}`);
    console.log(`- Firma ID: ${row.company_id}`);
    console.log(`- Pozícia: ${row.position}`);
    console.log(`- Status: ${row.status}`);
  } else {
    console.log('❌ Zamestnanec zam2@zam.sk nebol nájdený');
  }
  
  // Zatvorenie databázy
  db.close();
});
