const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Použijeme rovnakú databázu ako backend
const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT id, email, name, role, status FROM users ORDER BY id', (err, users) => {
  if (err) {
    console.error('Chyba pri načítaní používateľov:', err);
    return;
  }

  console.log('📋 Všetci používatelia v databáze:');
  console.log('=====================================');
  
  if (users.length === 0) {
    console.log('❌ Žiadni používatelia v databáze');
  } else {
    users.forEach(user => {
      console.log(`ID: ${user.id} | Email: ${user.email} | Meno: ${user.name} | Rola: ${user.role} | Status: ${user.status}`);
    });
  }

  console.log(`\nCelkovo používateľov: ${users.length}`);
  db.close();
});



