const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'portal.db');

console.log('🔧 Pridávam chýbajúce stĺpce do tabuľky companies...');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Zoznam stĺpcov ktoré potrebujeme pridať
  const columnsToAdd = [
    'dic TEXT',
    'address TEXT', 
    'city TEXT',
    'postal_code TEXT',
    'phone TEXT',
    'email TEXT',
    'bank_account TEXT',
    'bank_code TEXT',
    'pohoda_database_path TEXT'
  ];
  
  let addedCount = 0;
  
  columnsToAdd.forEach((columnDef) => {
    const columnName = columnDef.split(' ')[0];
    
    db.run(`ALTER TABLE companies ADD COLUMN ${columnDef}`, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log(`✅ Stĺpec ${columnName} už existuje`);
        } else {
          console.error(`❌ Chyba pri pridávaní stĺpca ${columnName}:`, err.message);
        }
      } else {
        console.log(`✅ Stĺpec ${columnName} úspešne pridaný`);
        addedCount++;
      }
    });
  });
  
  // Počkáme chvíľu aby sa všetky ALTER TABLE príkazy dokončili
  setTimeout(() => {
    console.log(`\n📊 Pridané stĺpce: ${addedCount}`);
    db.close();
  }, 1000);
});

