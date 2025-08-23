const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Použijeme rovnakú databázu ako backend
const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Kontrola databázy...');
console.log('Cesta k databáze:', dbPath);

// Kontrola, či existuje tabuľka users
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, result) => {
  if (err) {
    console.error('❌ Chyba pri kontrole tabuľky users:', err);
    return;
  }

  if (result) {
    console.log('✅ Tabuľka users existuje');
    
    // Kontrola počtu používateľov
    db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
      if (err) {
        console.error('❌ Chyba pri počítaní používateľov:', err);
        return;
      }
      
      console.log(`📊 Počet používateľov v databáze: ${result.count}`);
      
      // Zobrazenie všetkých používateľov
      db.all('SELECT id, email, name, role, status FROM users ORDER BY id', (err, users) => {
        if (err) {
          console.error('❌ Chyba pri načítaní používateľov:', err);
          return;
        }

        console.log('\n📋 Všetci používatelia:');
        console.log('=====================================');
        
        if (users.length === 0) {
          console.log('❌ Žiadni používatelia v databáze');
        } else {
          users.forEach(user => {
            console.log(`ID: ${user.id} | Email: ${user.email} | Meno: ${user.name} | Rola: ${user.role} | Status: ${user.status}`);
          });
        }

        db.close();
      });
    });
  } else {
    console.log('❌ Tabuľka users neexistuje');
    db.close();
  }
});
