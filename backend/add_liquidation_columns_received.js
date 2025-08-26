const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Pripojenie k SQLite databáze
const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

async function addLiquidationColumnsReceived() {
  try {
    console.log('🔧 Pridávam stĺpce pre likvidáciu do tabuľky received_invoices...');
    
    // Pridanie stĺpcov pre likvidáciu
    const columns = [
      { name: 'kc_likv', type: 'DECIMAL(10,2) DEFAULT 0' },
      { name: 'kc_zuplat', type: 'DECIMAL(10,2) DEFAULT 0' },
      { name: 'dat_likv', type: 'DATE' }
    ];
    
    for (const column of columns) {
      db.run(`ALTER TABLE received_invoices ADD COLUMN ${column.name} ${column.type}`, (err) => {
        if (err) {
          if (err.message.includes('duplicate column name')) {
            console.log(`✅ Stĺpec ${column.name} už existuje`);
          } else {
            console.error(`❌ Chyba pri pridávaní stĺpca ${column.name}:`, err.message);
          }
        } else {
          console.log(`✅ Pridaný stĺpec ${column.name}`);
        }
      });
    }
    
    // Kontrola finálnej štruktúry
    setTimeout(() => {
      db.all("PRAGMA table_info(received_invoices)", (err, rows) => {
        if (err) {
          console.error('❌ Chyba pri čítaní schémy:', err);
          db.close();
          return;
        }
        
        console.log('\n📊 Finálna štruktúra tabuľky received_invoices:');
        console.log('=====================================');
        rows.forEach((row, index) => {
          console.log(`${index + 1}. ${row.name} (${row.type})`);
        });
        console.log(`\n📊 Celkový počet stĺpcov: ${rows.length}`);
        
        // Kontrola nových stĺpcov
        const newColumns = rows.filter(row => 
          row.name === 'kc_likv' || 
          row.name === 'kc_zuplat' || 
          row.name === 'dat_likv'
        );
        
        if (newColumns.length === 3) {
          console.log('\n✅ Všetky stĺpce pre likvidáciu boli úspešne pridané!');
        } else {
          console.log('\n⚠️ Niektoré stĺpce pre likvidáciu chýbajú');
        }
        
        db.close();
      });
    }, 1000);
    
  } catch (error) {
    console.error('❌ Chyba pri pridávaní stĺpcov:', error);
    db.close();
  }
}

addLiquidationColumnsReceived();

