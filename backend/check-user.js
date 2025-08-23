const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Použijeme rovnakú databázu ako backend
const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

const email = 'test.zamestnanec@demo.sk';

db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
  if (err) {
    console.error('Chyba pri hľadaní používateľa:', err);
    return;
  }

  if (user) {
    console.log('✅ Používateľ nájdený:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Meno:', user.name);
    console.log('Rola:', user.role);
    console.log('Status:', user.status);
    console.log('Heslo hash:', user.password);
  } else {
    console.log('❌ Používateľ nenájdený');
  }

  db.close();
});
