const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function testCompanyLookup() {
  try {
    console.log('🧪 Testujem lookup company ID 3...');
    
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new sqlite3.Database(dbPath);
    
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
    
  } catch (error) {
    console.error('❌ Chyba:', error);
  }
}

testCompanyLookup();
