const { db } = require('./database');

console.log('🔍 Kontrola firiem v databáze...\n');

// Kontrola všetkých firiem
db.all("SELECT id, name, ico, owner_email, status, created_at FROM companies ORDER BY created_at DESC", [], (err, companies) => {
  if (err) {
    console.error('❌ Chyba pri načítaní firiem:', err);
    return;
  }

  console.log(`📊 Celkový počet firiem: ${companies.length}\n`);
  
  if (companies.length === 0) {
    console.log('❌ Žiadne firmy v databáze');
    return;
  }

  console.log('📋 Zoznam všetkých firiem:');
  companies.forEach((company, index) => {
    console.log(`${index + 1}. ID: ${company.id} | Názov: ${company.name} | IČO: ${company.ico} | Vlastník: ${company.owner_email} | Status: ${company.status} | Vytvorené: ${company.created_at}`);
  });

  // Kontrola firiem s "X-pokus"
  db.all("SELECT * FROM companies WHERE name LIKE '%X-pokus%' OR ico LIKE '%X-pokus%'", [], (err, xPokusCompanies) => {
    if (err) {
      console.error('❌ Chyba pri hľadaní X-pokus firiem:', err);
      return;
    }

    console.log(`\n🔍 Firma "X-pokus": ${xPokusCompanies.length} nájdených`);
    xPokusCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ID: ${company.id} | Názov: ${company.name} | IČO: ${company.ico} | Status: ${company.status}`);
    });
  });

  // Kontrola aktívnych firiem
  db.all("SELECT COUNT(*) as count FROM companies WHERE status = 'active'", [], (err, activeResult) => {
    if (err) {
      console.error('❌ Chyba pri počítaní aktívnych firiem:', err);
      return;
    }
    console.log(`\n✅ Aktívnych firiem: ${activeResult[0].count}`);
  });

  // Kontrola neaktívnych firiem
  db.all("SELECT COUNT(*) as count FROM companies WHERE status = 'inactive'", [], (err, inactiveResult) => {
    if (err) {
      console.error('❌ Chyba pri počítaní neaktívnych firiem:', err);
      return;
    }
    console.log(`❌ Neaktívnych firiem: ${inactiveResult[0].count}`);
  });
});

