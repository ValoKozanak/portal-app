const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Kontrola obsahu databázy...\n');

// Kontrola tabuliek
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Chyba pri čítaní tabuliek:', err);
    return;
  }
  
  console.log('📋 Tabulky v databáze:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  
  console.log('\n👥 Používatelia:');
  db.all("SELECT id, email, name, role, status FROM users", (err, users) => {
    if (err) {
      console.error('Chyba pri čítaní používateľov:', err);
      return;
    }
    
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
    });
    
    console.log('\n🏢 Firmy:');
    db.all("SELECT id, name, ico, owner_email, created_at FROM companies", (err, companies) => {
      if (err) {
        console.error('Chyba pri čítaní firiem:', err);
        return;
      }
      
      if (companies.length === 0) {
        console.log('  - Žiadne firmy zatiaľ neboli vytvorené');
      } else {
        companies.forEach(company => {
          console.log(`  - ${company.name} (IČO: ${company.ico}) - Vlastník: ${company.owner_email}`);
        });
      }
      
      console.log('\n✅ Kontrola dokončená!');
      db.close();
    });
  });
});
