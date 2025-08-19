const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Vytvorenie databázy
const dbPath = path.join(__dirname, 'portal.db');
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
          ico TEXT UNIQUE,
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

      // Pridanie status stĺpca do users tabuľky ak neexistuje
      db.run(`
        ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive'))
      `, (err) => {
        // Ignorujeme chybu ak stĺpec už existuje
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding status column to users:', err);
        }
      });

      // Pridanie reset_token stĺpcov do users tabuľky ak neexistujú
      db.run(`
        ALTER TABLE users ADD COLUMN reset_token TEXT
      `, (err) => {
        // Ignorujeme chybu ak stĺpec už existuje
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding reset_token column to users:', err);
        }
      });

      db.run(`
        ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME
      `, (err) => {
        // Ignorujeme chybu ak stĺpec už existuje
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding reset_token_expiry column to users:', err);
        }
      });

      // Pridanie category stĺpca do files tabuľky ak neexistuje
      db.run(`
        ALTER TABLE files ADD COLUMN category TEXT DEFAULT 'other'
      `, (err) => {
        // Ignorujeme chybu ak stĺpec už existuje
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Chyba pri pridávaní category stĺpca:', err);
        }
      });

      // Pridanie firmy stĺpcov do users tabuľky ak neexistujú
      db.run(`
        ALTER TABLE users ADD COLUMN ico TEXT
      `, (err) => {
        // Ignorujeme chybu ak stĺpec už existuje
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding ico column to users:', err);
        }
      });

      db.run(`
        ALTER TABLE users ADD COLUMN company_name TEXT
      `, (err) => {
        // Ignorujeme chybu ak stĺpec už existuje
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding company_name column to users:', err);
        }
      });

      db.run(`
        ALTER TABLE users ADD COLUMN address TEXT
      `, (err) => {
        // Ignorujeme chybu ak stĺpec už existuje
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding address column to users:', err);
        }
      });

      db.run(`
        ALTER TABLE users ADD COLUMN business_registry TEXT
      `, (err) => {
        // Ignorujeme chybu ak stĺpec už existuje
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding business_registry column to users:', err);
        }
      });

      db.run(`
        ALTER TABLE users ADD COLUMN vat_id TEXT
      `, (err) => {
        // Ignorujeme chybu ak stĺpec už existuje
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding vat_id column to users:', err);
        }
      });

      db.run(`
        ALTER TABLE users ADD COLUMN tax_id TEXT
      `, (err) => {
        // Ignorujeme chybu ak stĺpec už existuje
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding tax_id column to users:', err);
        }
      });

      db.run(`
        ALTER TABLE users ADD COLUMN authorized_person TEXT
      `, (err) => {
        // Ignorujeme chybu ak stĺpec už existuje
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding authorized_person column to users:', err);
        }
      });

      db.run(`
        ALTER TABLE users ADD COLUMN contact_email TEXT
      `, (err) => {
        // Ignorujeme chybu ak stĺpec už existuje
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding contact_email column to users:', err);
        }
      });

      db.run(`
        ALTER TABLE users ADD COLUMN contact_phone TEXT
      `, (err) => {
        // Ignorujeme chybu ak stĺpec už existuje
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding contact_phone column to users:', err);
        }
      });

      // Aktualizácia existujúcich používateľov na status 'active'
      db.run(`
        UPDATE users SET status = 'active' WHERE status IS NULL
      `, (err) => {
        if (err) {
          console.error('Chyba pri aktualizácii status používateľov:', err);
        }
      });

      // Tabuľka CMS obsahu
      db.run(`
        CREATE TABLE IF NOT EXISTS cms_content (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          section TEXT NOT NULL,
          field TEXT NOT NULL,
          value TEXT NOT NULL,
          version INTEGER DEFAULT 1,
          is_active BOOLEAN DEFAULT 1,
          created_by TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(section, field, version)
        )
      `);

      // Tabuľka verzií CMS obsahu
      db.run(`
        CREATE TABLE IF NOT EXISTS cms_versions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version_name TEXT NOT NULL,
          description TEXT,
          created_by TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 0
        )
      `);

      // Vloženie predvolených používateľov (len Admin, demo User a demo Accountant)
      db.run(`
        INSERT OR IGNORE INTO users (email, password, name, role, status, ico, company_name, address, authorized_person, contact_email, contact_phone)
        VALUES 
          ('admin@portal.sk', '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE', 'Admin', 'admin', 'active', NULL, NULL, NULL, NULL, NULL, NULL),
          ('user@portal.sk', '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE', 'Demo Firma s.r.o.', 'user', 'active', '12345678', 'Demo Firma s.r.o.', 'Hlavná 123, 811 01 Bratislava', 'Ján Novák', 'user@portal.sk', '+421 2 1234 5678'),
          ('accountant@portal.sk', '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE', 'Demo Účtovník', 'accountant', 'active', NULL, NULL, NULL, NULL, NULL, NULL)
      `);

      // Vyčistenie všetkých ostatných dát
      db.run(`DELETE FROM users WHERE email NOT IN ('admin@portal.sk', 'user@portal.sk', 'accountant@portal.sk')`);
      db.run(`DELETE FROM user_accountants`);
      db.run(`DELETE FROM tasks`);
      db.run(`DELETE FROM files`);
      db.run(`DELETE FROM messages`);
      db.run(`DELETE FROM employees`);
      db.run(`DELETE FROM attendance`);
      db.run(`DELETE FROM work_schedules`);

      // Vloženie predvoleného CMS obsahu
      const defaultCmsContent = [
        // Hlavná stránka
        ['home', 'heroTitle', 'Vaše účtovníctvo – naša starosť', 'admin@portal.sk'],
        ['home', 'heroSubtitle', 'Profesionálne účtovníctvo a daňové poradenstvo pre vašu firmu. Poskytujeme kompletný servis s dôrazom na spoľahlivosť, presnosť a moderné riešenia.', 'admin@portal.sk'],
        ['home', 'heroButton1', 'Stať sa klientom', 'admin@portal.sk'],
        ['home', 'heroButton2', 'Kontaktovať účtovníka', 'admin@portal.sk'],
        
        // O nás
        ['about', 'companyName', 'Účtovníctvo.sk', 'admin@portal.sk'],
        ['about', 'description', 'Sme renomovaná účtovnícka kancelária s viac ako 15-ročnou praxou v oblasti účtovníctva a daňového poradenstva.', 'admin@portal.sk'],
        ['about', 'mission', 'Našou misiou je poskytovať našim klientom spoľahlivé a presné účtovníctvo s dôrazom na moderné riešenia a individuálny prístup.', 'admin@portal.sk'],
        ['about', 'vision', 'Chceme byť vaším spoľahlivým partnerom v oblasti účtovníctva a daňového poradenstva.', 'admin@portal.sk'],
        
        // Služby
        ['services', 'basicAccounting_name', 'Základné účtovníctvo', 'admin@portal.sk'],
        ['services', 'basicAccounting_price', 'od 50 €/mesiac', 'admin@portal.sk'],
        ['services', 'basicAccounting_description', 'Kompletná správa účtovníctva pre malé a stredné firmy', 'admin@portal.sk'],
        ['services', 'taxAdvisory_name', 'Daňové poradenstvo', 'admin@portal.sk'],
        ['services', 'taxAdvisory_price', 'od 80 €/hodina', 'admin@portal.sk'],
        ['services', 'taxAdvisory_description', 'Odborné poradenstvo v oblasti daní a optimalizácie', 'admin@portal.sk'],
        ['services', 'audit_name', 'Audit a kontrola', 'admin@portal.sk'],
        ['services', 'audit_price', 'od 200 €/mesiac', 'admin@portal.sk'],
        ['services', 'audit_description', 'Kontrola a overenie správnosti účtovníctva', 'admin@portal.sk'],
        
        // Kontakt
        ['contact', 'address', 'Hlavná 123, 811 01 Bratislava', 'admin@portal.sk'],
        ['contact', 'phone', '+421 2 1234 5678', 'admin@portal.sk'],
        ['contact', 'email', 'info@uctovnictvo.sk', 'admin@portal.sk'],
        ['contact', 'workingHours', 'Pondelok - Piatok: 8:00 - 17:00', 'admin@portal.sk']
      ];

      defaultCmsContent.forEach(([section, field, value, created_by]) => {
        db.run(`
          INSERT OR IGNORE INTO cms_content (section, field, value, created_by)
          VALUES (?, ?, ?, ?)
        `, [section, field, value, created_by]);
      });

      // Vloženie predvolenej verzie
      db.run(`
        INSERT OR IGNORE INTO cms_versions (version_name, description, created_by, is_active)
        VALUES ('Počiatočná verzia', 'Predvolený obsah webu', 'admin@portal.sk', 1)
      `);

      // Vytvorenie tabuľky pre správy
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sender_email TEXT NOT NULL,
          recipient_email TEXT NOT NULL,
          subject TEXT NOT NULL,
          content TEXT NOT NULL,
          user_id INTEGER,
          message_type TEXT DEFAULT 'general',
          read_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Chyba pri vytváraní tabuľky messages:', err);
        } else {
          console.log('✅ Tabuľka messages vytvorená úspešne');
        }
      });

      // Demo dáta sa už nevkladajú - databáza je čistá pre testovanie

      // Vytvorenie tabuľky employees (zamestnanci)
      db.run(`
        CREATE TABLE IF NOT EXISTS employees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          position TEXT,
          employee_id TEXT UNIQUE,
          hire_date DATE,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Chyba pri vytváraní tabuľky employees:', err);
        } else {
          console.log('✅ Tabuľka employees vytvorená úspešne');
        }
      });

      // Vytvorenie tabuľky attendance (dochádzka)
      db.run(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          date DATE NOT NULL,
          clock_in DATETIME,
          clock_out DATETIME,
          total_hours DECIMAL(5,2),
          overtime_hours DECIMAL(5,2) DEFAULT 0,
          break_minutes INTEGER DEFAULT 0,
          status TEXT DEFAULT 'present',
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (employee_id) REFERENCES employees (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(employee_id, date)
        )
      `, (err) => {
        if (err) {
          console.error('Chyba pri vytváraní tabuľky attendance:', err);
        } else {
          console.log('✅ Tabuľka attendance vytvorená úspešne');
        }
      });

      // Vytvorenie tabuľky work_schedules (pracovné rozvrhy)
      db.run(`
        CREATE TABLE IF NOT EXISTS work_schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          break_start TIME,
          break_end TIME,
          is_default INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Chyba pri vytváraní tabuľky work_schedules:', err);
        } else {
          console.log('✅ Tabuľka work_schedules vytvorená úspešne');
        }
      });

      // Demo dáta pre zamestnancov, dochádzku a rozvrhy sa už nevkladajú - databáza je čistá pre testovanie

      console.log('✅ Databáza inicializovaná úspešne');
      resolve();
    });
  });
};

module.exports = { db, initDatabase };
