const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const mainDbPath = path.join(__dirname, 'portal.db');
const zalohyDir = path.join(__dirname, 'zalohy', '2025');

console.log('📁 Vytváram zložky pre firmy v:', zalohyDir);

// Vytvorenie hlavného adresára ak neexistuje
if (!fs.existsSync(zalohyDir)) {
  fs.mkdirSync(zalohyDir, { recursive: true });
  console.log('✅ Vytvorený adresár:', zalohyDir);
}

const mainDb = new sqlite3.Database(mainDbPath);

mainDb.all("SELECT id, name, ico FROM companies WHERE ico IS NOT NULL AND ico != ''", (err, companies) => {
  if (err) {
    console.error('❌ Chyba pri čítaní firiem:', err);
    return;
  }
  
  console.log(`\n📊 Našiel som ${companies.length} firiem s IČO`);
  
  let createdCount = 0;
  let existingCount = 0;
  
  companies.forEach(company => {
    if (company.ico) {
      // Vytvorenie názvu zložky v formáte ICO_rok
      const currentYear = new Date().getFullYear();
      const folderName = `${company.ico}_${currentYear}`;
      const folderPath = path.join(zalohyDir, folderName);
      
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`✅ Vytvorená zložka: ${folderName} (${company.name})`);
        createdCount++;
      } else {
        console.log(`ℹ️  Zložka už existuje: ${folderName} (${company.name})`);
        existingCount++;
      }
    }
  });
  
  console.log(`\n📊 Súhrn:`);
  console.log(`   - Vytvorených zložiek: ${createdCount}`);
  console.log(`   - Existujúcich zložiek: ${existingCount}`);
  console.log(`   - Celkovo: ${createdCount + existingCount}`);
  
  mainDb.close();
});

