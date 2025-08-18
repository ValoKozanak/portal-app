const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Vytvorenie databázy
const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

// Inicializácia databázy
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabuľka používateľov
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin', 'accountant', 'user')),
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabuľka firiem
      db.run(`
        CREATE TABLE IF NOT EXISTS companies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ico TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          business_registry TEXT,
          vat_id TEXT,
          tax_id TEXT,
          authorized_person TEXT NOT NULL,
          contact_email TEXT,
          contact_phone TEXT,
          owner_email TEXT NOT NULL,
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabuľka priradení účtovníkov k firmám
      db.run(`
        CREATE TABLE IF NOT EXISTS company_accountants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          accountant_email TEXT NOT NULL,
          assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
          UNIQUE(company_id, accountant_email)
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
          company_id INTEGER NOT NULL,
          company_name TEXT NOT NULL,
          created_by TEXT NOT NULL,
          due_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
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
          company_id INTEGER NOT NULL,
          uploaded_by TEXT NOT NULL,
          file_path TEXT NOT NULL,
          category TEXT DEFAULT 'other',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
        )
      `);

      // Pridanie status stĺpca do companies tabuľky ak neexistuje
      db.run(`
        ALTER TABLE companies ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive'))
      `, (err) => {
        // Ignorujeme chybu ak stĺpec už existuje
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Chyba pri pridávaní status stĺpca:', err);
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

      // Aktualizácia existujúcich firiem na status 'active'
      db.run(`
        UPDATE companies SET status = 'active' WHERE status IS NULL
      `, (err) => {
        if (err) {
          console.error('Chyba pri aktualizácii status firiem:', err);
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

      // Vloženie predvolených používateľov
      db.run(`
        INSERT OR IGNORE INTO users (email, password, name, role, status)
        VALUES 
          ('admin@portal.sk', '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE', 'Admin', 'admin', 'active'),
          ('user@portal.sk', '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE', 'Používateľ', 'user', 'active'),
          ('accountant@portal.sk', '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE', 'Účtovník', 'accountant', 'active')
      `);

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

      console.log('✅ Databáza inicializovaná úspešne');
      resolve();
    });
  });
};

module.exports = { db, initDatabase };
