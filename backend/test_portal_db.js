const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function testPortalDb() {
  try {
    console.log('🧪 Testujem portal.db...');
    
    const dbPath = path.join(__dirname, 'portal.db');
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
      
      // Hľadáme company s ID 3
      db.get('SELECT * FROM companies WHERE id = ?', [3], (err, company) => {
        if (err) {
          console.error('❌ Chyba pri hľadaní company:', err);
          return;
        }
        
        if (!company) {
          console.log('❌ Company s ID 3 nebol nájdený');
          return;
        }
        
        console.log('✅ Company s ID 3:', company);
        console.log('ICO:', company.ico);
        console.log('Názov:', company.name);
        
        // Kontrolujeme či existuje MDB súbor
        const mdbPath = path.join(__dirname, 'zalohy', '2025', `${company.ico}_2025`, `${company.ico}_2025.mdb`);
        const fs = require('fs');
        
        if (fs.existsSync(mdbPath)) {
          console.log('✅ MDB súbor existuje:', mdbPath);
        } else {
          console.log('❌ MDB súbor neexistuje:', mdbPath);
        }
        
        db.close();
      });
    });
    
  } catch (error) {
    console.error('❌ Chyba:', error);
  }
}

testPortalDb();
