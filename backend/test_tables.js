const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function testTables() {
  try {
    console.log('🧪 Testujem dostupné tabuľky...');
    
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new sqlite3.Database(dbPath);
    
    // Získame všetky tabuľky
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('❌ Chyba pri získavaní tabuliek:', err);
        return;
      }
      
      console.log('✅ Dostupné tabuľky:');
      tables.forEach(table => {
        console.log(`  - ${table.name}`);
      });
      
      db.close();
    });
    
  } catch (error) {
    console.error('❌ Chyba:', error);
  }
}

testTables();
