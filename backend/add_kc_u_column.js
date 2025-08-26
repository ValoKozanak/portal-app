const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Pripojenie k SQLite databáze
const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

async function addKcUColumn() {
  try {
    console.log('🔧 Pridávam stĺpec kc_u do tabuľky issued_invoices...');
    
    // Pridanie stĺpca kc_u
    db.run(`ALTER TABLE issued_invoices ADD COLUMN kc_u DECIMAL(10,2) DEFAULT 0`, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log(`✅ Stĺpec kc_u už existuje`);
        } else {
          console.error(`❌ Chyba pri pridávaní stĺpca kc_u:`, err.message);
        }
      } else {
        console.log(`✅ Pridaný stĺpec kc_u`);
      }
    });
    
    // Kontrola finálnej štruktúry
    setTimeout(() => {
      db.all("PRAGMA table_info(issued_invoices)", (err, rows) => {
        if (err) {
          console.error('❌ Chyba pri čítaní schémy:', err);
          db.close();
          return;
        }
        
        console.log('\n📊 Finálna štruktúra tabuľky issued_invoices:');
        console.log('=====================================');
        rows.forEach((row, index) => {
          console.log(`${index + 1}. ${row.name} (${row.type})`);
        });
        console.log(`\n📊 Celkový počet stĺpcov: ${rows.length}`);
        
        // Kontrola nového stĺpca
        const kcUColumn = rows.find(row => row.name === 'kc_u');
        if (kcUColumn) {
          console.log('\n✅ Stĺpec kc_u bol úspešne pridaný!');
        } else {
          console.log('\n⚠️ Stĺpec kc_u chýba');
        }
        
        db.close();
      });
    }, 1000);
    
  } catch (error) {
    console.error('❌ Chyba pri pridávaní stĺpca:', error);
    db.close();
  }
}

addKcUColumn();

