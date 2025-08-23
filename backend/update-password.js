const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Cesta k databáze
const dbPath = path.join(__dirname, 'portal.db');

// Pripojenie k databáze
const db = new sqlite3.Database(dbPath);

console.log('🔍 Mením heslo pre zam2@zam.sk...');

const email = 'zam2@zam.sk';
const newPassword = 'zam2123';

// Hashovanie nového hesla
bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
  if (err) {
    console.error('❌ Chyba pri hashovaní hesla:', err);
    db.close();
    return;
  }

  // Aktualizácia hesla v databáze
  const sql = 'UPDATE users SET password = ? WHERE email = ?';
  
  db.run(sql, [hashedPassword, email], function(err) {
    if (err) {
      console.error('❌ Chyba pri zmene hesla:', err.message);
    } else {
      if (this.changes > 0) {
        console.log('✅ Heslo úspešne zmenené pre:', email);
      } else {
        console.log('⚠️ Používateľ s emailom', email, 'nebol nájdený');
      }
    }
    
    // Zatvorenie databázy
    db.close();
  });
});
