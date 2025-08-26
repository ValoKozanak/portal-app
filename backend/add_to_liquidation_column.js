const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('portal.db');

console.log('🔧 Pridávam stĺpec to_liquidation do tabuľky issued_invoices...');

db.run(`
  ALTER TABLE issued_invoices 
  ADD COLUMN to_liquidation DECIMAL(10,2) DEFAULT 0
`, function(err) {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✅ Stĺpec to_liquidation už existuje');
    } else {
      console.error('❌ Chyba pri pridávaní stĺpca:', err);
    }
  } else {
    console.log('✅ Stĺpec to_liquidation úspešne pridaný');
  }
  
  // Skontrolujem schému
  db.all('PRAGMA table_info(issued_invoices)', (err, rows) => {
    if (err) {
      console.error('Chyba pri kontrole schémy:', err);
    } else {
      const hasToLiquidation = rows.some(row => row.name === 'to_liquidation');
      console.log('📋 Stĺpec to_liquidation existuje:', hasToLiquidation);
    }
    db.close();
  });
});

