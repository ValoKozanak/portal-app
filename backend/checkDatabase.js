const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./portal.db');

console.log('Kontrola štruktúry databázy...\n');

// Získanie všetkých tabuliek
db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
  if (err) {
    console.error('Chyba pri získavaní tabuliek:', err);
    db.close();
    return;
  }

  console.log('Dostupné tabuľky:');
  tables.forEach(table => {
    console.log('- ' + table.name);
  });

  console.log('\nKontrola tabuľky files...');
  
  // Skontrolujeme, či existuje tabuľka files
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='files';", (err, row) => {
    if (err) {
      console.error('Chyba pri kontrole tabuľky files:', err);
    } else if (row) {
      console.log('✓ Tabuľka files existuje');
      
      // Získame štruktúru tabuľky files
      db.all("PRAGMA table_info(files);", (err, columns) => {
        if (err) {
          console.error('Chyba pri získavaní štruktúry tabuľky files:', err);
        } else {
          console.log('\nŠtruktúra tabuľky files:');
          columns.forEach(col => {
            console.log(`- ${col.name} (${col.type})`);
          });
          
          // Skontrolujeme počet záznamov
          db.get("SELECT COUNT(*) as count FROM files;", (err, result) => {
            if (err) {
              console.error('Chyba pri počítaní záznamov:', err);
            } else {
              console.log(`\nPočet záznamov v tabuľke files: ${result.count}`);
            }
            db.close();
          });
        }
      });
    } else {
      console.log('✗ Tabuľka files neexistuje!');
      db.close();
    }
  });
});
