const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./portal.db');

console.log('Kontrolujem tabuľky v databáze...');

db.all("SELECT name FROM sqlite_master WHERE type='table'", function(err, tables) {
  if (err) {
    console.error('Chyba:', err);
  } else {
    console.log('✅ Existujúce tabuľky:');
    tables.forEach(table => {
      console.log('-', table.name);
    });
  }
  db.close();
});
