const { db } = require('./database');

console.log('🔍 Kontrolujem firmu s ID 3...');

db.get('SELECT id, name, ico FROM companies WHERE id = ?', [3], (err, company) => {
  if (err) {
    console.error('❌ Chyba:', err);
    return;
  }
  
  if (!company) {
    console.log('❌ Firma s ID 3 nebola nájdená');
    return;
  }
  
  console.log('✅ Firma nájdená:');
  console.log('   ID:', company.id);
  console.log('   Názov:', company.name);
  console.log('   IČO:', company.ico);
  
  // Skontrolujme či existuje MDB súbor
  const path = require('path');
  const fs = require('fs');
  
  const mdbPath = path.join(__dirname, 'zalohy', '2025', `${company.ico}_2025`, `${company.ico}_2025.mdb`);
  
  console.log('📁 Hľadaná cesta k MDB:', mdbPath);
  console.log('📁 MDB súbor existuje:', fs.existsSync(mdbPath));
  
  process.exit(0);
});


