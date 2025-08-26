const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

console.log('Kontrolujem firmy v databáze...');

db.all("SELECT id, name, ico, dic FROM companies ORDER BY id", (err, rows) => {
  if (err) {
    console.error('Chyba:', err);
  } else {
    console.log('Všetky firmy:');
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Názov: ${row.name}, ICO: ${row.ico}, DIC: ${row.dic}`);
    });
    
    // Hľadám firmu s ICO 11111111
    const targetCompany = rows.find(row => row.ico === '11111111');
    if (targetCompany) {
      console.log(`\n✅ Firma s ICO 11111111 má ID: ${targetCompany.id}`);
    } else {
      console.log('\n❌ Firma s ICO 11111111 nebola nájdená');
    }
  }

  db.close();
});


