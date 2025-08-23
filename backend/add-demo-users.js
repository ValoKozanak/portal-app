const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Použijeme rovnakú databázu ako backend
const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Pridávam demo zamestnancov do databázy...');

// Pridanie demo zamestnancov
const demoUsers = [
  {
    email: 'jan.novak@demo.sk',
    password: '$2b$10$Zg9JhaLmiM187enFXXSkkeVPCDWK9cvBilvIlPp81exB6phNJzkGW',
    name: 'Ján Novák',
    role: 'employee',
    status: 'active'
  },
  {
    email: 'maria.kovacova@demo.sk',
    password: '$2b$10$Zg9JhaLmiM187enFXXSkkeVPCDWK9cvBilvIlPp81exB6phNJzkGW',
    name: 'Mária Kováčová',
    role: 'employee',
    status: 'active'
  },
  {
    email: 'peter.svoboda@demo.sk',
    password: '$2b$10$Zg9JhaLmiM187enFXXSkkeVPCDWK9cvBilvIlPp81exB6phNJzkGW',
    name: 'Peter Svoboda',
    role: 'employee',
    status: 'active'
  }
];

let addedCount = 0;

demoUsers.forEach((user, index) => {
  db.run(`
    INSERT OR IGNORE INTO users (email, password, name, role, status)
    VALUES (?, ?, ?, ?, ?)
  `, [user.email, user.password, user.name, user.role, user.status], function(err) {
    if (err) {
      console.error(`❌ Chyba pri pridávaní ${user.email}:`, err);
    } else {
      if (this.changes > 0) {
        console.log(`✅ Pridaný: ${user.email}`);
        addedCount++;
      } else {
        console.log(`⚠️  Už existuje: ${user.email}`);
      }
    }
    
    // Ak sme spracovali všetkých používateľov, zobrazíme súhrn
    if (index === demoUsers.length - 1) {
      console.log(`\n📊 Celkovo pridaných: ${addedCount} nových používateľov`);
      
      // Zobrazíme všetkých používateľov
      db.all('SELECT id, email, name, role, status FROM users ORDER BY id', (err, users) => {
        if (err) {
          console.error('❌ Chyba pri načítaní používateľov:', err);
        } else {
          console.log('\n📋 Všetci používatelia v databáze:');
          console.log('=====================================');
          users.forEach(user => {
            console.log(`ID: ${user.id} | Email: ${user.email} | Meno: ${user.name} | Rola: ${user.role} | Status: ${user.status}`);
          });
        }
        db.close();
      });
    }
  });
});
