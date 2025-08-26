const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const mainDbPath = path.join(__dirname, 'portal.db');
const companyDbDir = path.join(__dirname, 'company_databases');

console.log('🔍 Kontrola importu firiem z POHODA');
console.log('Hlavná databáza:', mainDbPath);
console.log('Adresár firiemých databáz:', companyDbDir);

// Kontrola hlavnej databázy
const mainDb = new sqlite3.Database(mainDbPath);

mainDb.all("SELECT id, name, ico, dic, pohoda_database_path FROM companies ORDER BY id LIMIT 10", (err, rows) => {
  if (err) {
    console.error('❌ Chyba pri čítaní firiem:', err);
    return;
  }
  
  console.log('\n📊 Prvých 10 importovaných firiem:');
  rows.forEach(row => {
    console.log(`   ${row.id}. ${row.name} (IČO: ${row.ico}, DIČ: ${row.dic})`);
    console.log(`      DB: ${row.pohoda_database_path}`);
  });
  
  // Celkový počet firiem
  mainDb.get("SELECT COUNT(*) as count FROM companies", (err, row) => {
    if (err) {
      console.error('❌ Chyba pri počítaní firiem:', err);
    } else {
      console.log(`\n📈 Celkovo importovaných firiem: ${row.count}`);
    }
    
    // Kontrola vytvorených databáz
    if (fs.existsSync(companyDbDir)) {
      const files = fs.readdirSync(companyDbDir);
      const dbFiles = files.filter(file => file.endsWith('.db'));
      console.log(`📁 Vytvorených databáz: ${dbFiles.length}`);
      
      if (dbFiles.length > 0) {
        console.log('\n📋 Vytvorené databázy:');
        dbFiles.slice(0, 5).forEach(file => {
          console.log(`   - ${file}`);
        });
        if (dbFiles.length > 5) {
          console.log(`   ... a ďalších ${dbFiles.length - 5}`);
        }
      }
    } else {
      console.log('❌ Adresár company_databases neexistuje');
    }
    
    mainDb.close();
  });
});

