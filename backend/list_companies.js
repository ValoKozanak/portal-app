const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

console.log('Všetky firmy v databáze:');

db.all("SELECT * FROM companies ORDER BY id", (err, rows) => {
  if (err) {
    console.error('Chyba:', err);
  } else {
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Názov: ${row.name}, ICO: ${row.ico}, DIC: ${row.dic}`);
    });
  }
  
  db.close();
});

