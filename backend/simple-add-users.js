const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

console.log('Pridávam demo zamestnancov...');

// Jednoduché pridanie demo zamestnancov
db.run(`
  INSERT OR IGNORE INTO users (email, password, name, role, status)
  VALUES ('jan.novak@demo.sk', '$2b$10$Zg9JhaLmiM187enFXXSkkeVPCDWK9cvBilvIlPp81exB6phNJzkGW', 'Ján Novák', 'employee', 'active')
`, function(err) {
  if (err) {
    console.error('Chyba:', err);
  } else {
    console.log('Ján Novák pridaný');
  }
  
  db.run(`
    INSERT OR IGNORE INTO users (email, password, name, role, status)
    VALUES ('maria.kovacova@demo.sk', '$2b$10$Zg9JhaLmiM187enFXXSkkeVPCDWK9cvBilvIlPp81exB6phNJzkGW', 'Mária Kováčová', 'employee', 'active')
  `, function(err) {
    if (err) {
      console.error('Chyba:', err);
    } else {
      console.log('Mária Kováčová pridaná');
    }
    
    db.run(`
      INSERT OR IGNORE INTO users (email, password, name, role, status)
      VALUES ('peter.svoboda@demo.sk', '$2b$10$Zg9JhaLmiM187enFXXSkkeVPCDWK9cvBilvIlPp81exB6phNJzkGW', 'Peter Svoboda', 'employee', 'active')
    `, function(err) {
      if (err) {
        console.error('Chyba:', err);
      } else {
        console.log('Peter Svoboda pridaný');
      }
      
      // Zobrazenie všetkých používateľov
      db.all('SELECT * FROM users', (err, users) => {
        if (err) {
          console.error('Chyba pri načítaní:', err);
        } else {
          console.log('\nVšetci používatelia:');
          users.forEach(user => {
            console.log(`${user.id}: ${user.email} - ${user.role}`);
          });
        }
        db.close();
      });
    });
  });
});
