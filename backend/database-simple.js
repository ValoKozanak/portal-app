const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Vytvorenie databázy
const dbPath = path.join(__dirname, 'portal-simple.db');
const db = new sqlite3.Database(dbPath);

// Inicializácia databázy
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabuľka používateľov (zlúčená s firmami)
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin', 'accountant', 'user')),
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
          phone TEXT,
          -- Firma informácie (pre user role)
          ico TEXT,
          company_name TEXT,
          address TEXT,
          business_registry TEXT,
          vat_id TEXT,
          tax_id TEXT,
          authorized_person TEXT,
          contact_email TEXT,
          contact_phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabuľka priradení účtovníkov k používateľom (firmám)
      db.run(`
        CREATE TABLE IF NOT EXISTS user_accountants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          accountant_email TEXT NOT NULL,
          assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(user_id, accountant_email)
        )
      `);

      // Tabuľka úloh
      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
          priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
          assigned_to TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          company_name TEXT NOT NULL,
          created_by TEXT NOT NULL,
          due_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Tabuľka súborov
      db.run(`
        CREATE TABLE IF NOT EXISTS files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          uploaded_by TEXT NOT NULL,
          file_path TEXT NOT NULL,
          category TEXT DEFAULT 'other',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Tabuľka správ
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          subject TEXT NOT NULL,
          content TEXT NOT NULL,
          sender_email TEXT NOT NULL,
          recipient_email TEXT NOT NULL,
          is_read BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_email) REFERENCES users (email),
          FOREIGN KEY (recipient_email) REFERENCES users (email)
        )
      `);

      // Vloženie predvolených používateľov (len Admin, demo User a demo Accountant)
      db.run(`
        INSERT OR IGNORE INTO users (email, password, name, role, status, ico, company_name, address, authorized_person, contact_email, contact_phone)
        VALUES 
          ('admin@portal.sk', '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE', 'Admin', 'admin', 'active', NULL, NULL, NULL, NULL, NULL, NULL),
          ('user@portal.sk', '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE', 'Demo Firma s.r.o.', 'user', 'active', '12345678', 'Demo Firma s.r.o.', 'Hlavná 123, 811 01 Bratislava', 'Ján Novák', 'user@portal.sk', '+421 2 1234 5678'),
          ('accountant@portal.sk', '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE', 'Demo Účtovník', 'accountant', 'active', NULL, NULL, NULL, NULL, NULL, NULL)
      `, (err) => {
        if (err) {
          console.error('Chyba pri vkladaní používateľov:', err);
        } else {
          console.log('✅ Používatelia pridaní úspešne');
        }
      });

      // Vloženie demo správ
      db.run(`
        INSERT OR IGNORE INTO messages (subject, content, sender_email, recipient_email, is_read)
        VALUES 
          ('Vitajte v portáli!', 'Vítame vás v našom portáli. Ak máte otázky, neváhajte nás kontaktovať.', 'admin@portal.sk', 'user@portal.sk', 0),
          ('Informácie o účtovníctve', 'Potrebujeme od vás dodatočné informácie pre účtovníctvo.', 'accountant@portal.sk', 'user@portal.sk', 0),
          ('Dokumenty pripravené', 'Všetky vaše dokumenty sú pripravené na stiahnutie.', 'admin@portal.sk', 'user@portal.sk', 1)
      `, (err) => {
        if (err) {
          console.error('Chyba pri vkladaní demo správ:', err);
        } else {
          console.log('✅ Demo správy pridané úspešne');
        }
      });

      console.log('✅ Jednoduchá databáza inicializovaná úspešne');
      resolve();
    });
  });
};

module.exports = { db, initDatabase };
