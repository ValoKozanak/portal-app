const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'portal.db');

console.log('🔧 Pridávam stĺpec pohoda_database_path do tabuľky companies...');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Kontrola či stĺpec už existuje
  db.get("PRAGMA table_info(companies)", (err, rows) => {
    if (err) {
      console.error('❌ Chyba pri kontrole štruktúry tabuľky:', err);
      return;
    }
    
    // Pridanie stĺpca ak neexistuje
    db.run(`
      ALTER TABLE companies 
      ADD COLUMN pohoda_database_path TEXT
    `, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log('✅ Stĺpec pohoda_database_path už existuje');
        } else {
          console.error('❌ Chyba pri pridávaní stĺpca:', err.message);
        }
      } else {
        console.log('✅ Stĺpec pohoda_database_path úspešne pridaný');
      }
      
      db.close();
    });
  });
});

