const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Vytvorenie databázy
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'databases', 'portal.db');
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
          role TEXT NOT NULL CHECK(role IN ('admin', 'accountant', 'user', 'employee')),
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

      // Tabuľka dokumentov (organizované do folderov)
      db.run(`
        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          original_name TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          category TEXT NOT NULL,
          description TEXT,
          company_id INTEGER NOT NULL,
          uploaded_by TEXT NOT NULL,
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
          console.error('Error adding status column to companies:', err);
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

      // Poznámka: ALTER TABLE príkazy pre employees a attendance sa presunuli na koniec po CREATE TABLE príkazoch

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

      // Tabuľka Dropbox nastavení pre firmy
      db.run(`
        CREATE TABLE IF NOT EXISTS dropbox_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          company_email TEXT NOT NULL,
          company_ico TEXT NOT NULL,
          folder_path TEXT NOT NULL,
          share_link TEXT,
          is_shared BOOLEAN DEFAULT 0,
          can_view BOOLEAN DEFAULT 1,
          can_edit BOOLEAN DEFAULT 0,
          can_upload BOOLEAN DEFAULT 1,
          can_delete BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
          UNIQUE(company_id)
        )
      `);

      // Pridanie stĺpca company_ico ak neexistuje (migrácia)
      db.run(`ALTER TABLE dropbox_settings ADD COLUMN company_ico TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Chyba pri pridávaní stĺpca company_ico:', err);
        }
      });

      // Vloženie predvolených používateľov
      db.run(`
        INSERT OR IGNORE INTO users (email, password, name, role, status)
        VALUES 
          ('admin@portal.sk', '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE', 'Admin', 'admin', 'active'),
          ('user@portal.sk', '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE', 'Používateľ', 'user', 'active'),
          ('accountant@portal.sk', '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE', 'Účtovník', 'accountant', 'active'),
          ('jan.novak@demo.sk', '$2b$10$Zg9JhaLmiM187enFXXSkkeVPCDWK9cvBilvIlPp81exB6phNJzkGW', 'Ján Novák', 'employee', 'active'),
          ('maria.kovacova@demo.sk', '$2b$10$Zg9JhaLmiM187enFXXSkkeVPCDWK9cvBilvIlPp81exB6phNJzkGW', 'Mária Kováčová', 'employee', 'active'),
          ('peter.svoboda@demo.sk', '$2b$10$Zg9JhaLmiM187enFXXSkkeVPCDWK9cvBilvIlPp81exB6phNJzkGW', 'Peter Svoboda', 'employee', 'active')
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

      // Vytvorenie tabuľky pre správy
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sender_email TEXT NOT NULL,
          recipient_email TEXT NOT NULL,
          subject TEXT NOT NULL,
          content TEXT NOT NULL,
          company_id INTEGER,
          message_type TEXT DEFAULT 'general',
          read_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id)
        )
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Chyba pri vytváraní tabuľky messages:', err);
        }
      });

      // Vloženie demo správ - len jedna správa
      db.run(`
        INSERT OR IGNORE INTO messages (
          sender_email, recipient_email, subject, content, company_id, message_type, created_at
        ) VALUES 
          ('admin@portal.sk', 'user@portal.sk', 'Vitajte v portáli', 'Vítame vás v našom účtovníckom portáli! Ak máte otázky, neváhajte nás kontaktovať.', 1, 'welcome', CURRENT_TIMESTAMP)
      `, (err) => {
        if (err) {
          console.error('Chyba pri vkladaní demo správ:', err);
        }
      });

      // Vloženie demo úloh - len jedna úloha
      db.run(`
        INSERT OR IGNORE INTO tasks (
          title, description, status, priority, assigned_to, 
          company_id, company_name, created_by, due_date, created_at
        ) VALUES 
          ('Aktualizácia účtovníctva', 'Mesačná aktualizácia účtovníctva a kontrola dokladov', 'pending', 'medium', 'accountant@portal.sk', 1, 'Demo Firma s.r.o.', 'admin@portal.sk', '2024-02-15', CURRENT_TIMESTAMP)
      `, (err) => {
        if (err) {
          console.error('Chyba pri vkladaní demo úloh:', err);
        }
      });

      // HR a Dochádzkový systém - Tabuľka zamestnancov
      db.run(`
        CREATE TABLE IF NOT EXISTS employees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          employee_id TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          position TEXT NOT NULL,
          department TEXT,
          hire_date DATE NOT NULL,
          salary DECIMAL(10,2),
          employment_type TEXT DEFAULT 'full_time' CHECK(employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'terminated', 'on_leave')),
          termination_date DATE,
          termination_reason TEXT,
          manager_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
          FOREIGN KEY (manager_id) REFERENCES employees (id),
          UNIQUE(company_id, employee_id)
        )
      `);

      // Tabuľka dochádzky
      db.run(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          company_id INTEGER NOT NULL,
          date DATE NOT NULL,
          check_in DATETIME,
          check_out DATETIME,
          total_hours DECIMAL(4,2),
          break_minutes INTEGER DEFAULT 0,
          status TEXT DEFAULT 'present' CHECK(status IN ('present', 'absent', 'late', 'early_leave', 'sick_leave', 'vacation', 'holiday')),
          notes TEXT,
          attendance_type TEXT DEFAULT 'manual' CHECK(attendance_type IN ('manual', 'automatic')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
          UNIQUE(employee_id, date)
        )
      `);

      // Tabuľka dovoleniek
      db.run(`
        CREATE TABLE IF NOT EXISTS leave_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          company_id INTEGER NOT NULL,
          leave_type TEXT NOT NULL CHECK(leave_type IN ('vacation', 'sick_leave', 'personal_leave', 'maternity_leave', 'paternity_leave', 'unpaid_leave')),
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          total_days INTEGER NOT NULL,
          reason TEXT,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')),
          approved_by INTEGER,
          approved_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
          FOREIGN KEY (approved_by) REFERENCES employees (id)
        )
      `);

      // Tabuľka pracovných zmien
      db.run(`
        CREATE TABLE IF NOT EXISTS work_shifts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          shift_name TEXT NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          break_start TIME,
          break_end TIME,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
        )
      `);

      // Tabuľka pracovných pomerov s dochádzkovými nastaveniami
      db.run(`
        CREATE TABLE IF NOT EXISTS employment_relations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          company_id INTEGER NOT NULL,
          position TEXT NOT NULL,
          employment_type TEXT DEFAULT 'full_time' CHECK(employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
          employment_start_date DATE NOT NULL,
          employment_end_date DATE,
          salary DECIMAL(10,2),
          weekly_hours INTEGER DEFAULT 40,
          attendance_mode TEXT DEFAULT 'manual' CHECK(attendance_mode IN ('manual', 'automatic')),
          work_start_time TIME DEFAULT '08:00',
          work_end_time TIME DEFAULT '16:00',
          break_start_time TIME DEFAULT '12:00',
          break_end_time TIME DEFAULT '12:30',
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
        )
      `);

      // Tabuľka mzdových období
      db.run(`
        CREATE TABLE IF NOT EXISTS payroll_periods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          year INTEGER NOT NULL,
          month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
          is_closed INTEGER DEFAULT 0,
          closed_at DATETIME,
          closed_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
          UNIQUE(company_id, year, month)
        )
      `);

      // Tabuľka priradení zmien k zamestnancom
      db.run(`
        CREATE TABLE IF NOT EXISTS employee_shifts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          shift_id INTEGER NOT NULL,
          effective_date DATE NOT NULL,
          end_date DATE,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
          FOREIGN KEY (shift_id) REFERENCES work_shifts (id) ON DELETE CASCADE
        )
      `);

      // Tabuľka HR udalostí
      db.run(`
        CREATE TABLE IF NOT EXISTS hr_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          employee_id INTEGER,
          event_type TEXT NOT NULL CHECK(event_type IN ('hire', 'termination', 'promotion', 'salary_change', 'position_change', 'warning', 'recognition')),
          title TEXT NOT NULL,
          description TEXT,
          event_date DATE NOT NULL,
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
          FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES employees (id)
        )
      `);

      // Vloženie demo zamestnancov (ak existuje Demo Firma)
      db.run(`
        INSERT OR IGNORE INTO employees (
          company_id, employee_id, first_name, last_name, email, phone, position, department, hire_date, salary, employment_type
        ) VALUES 
          (1, 'EMP001', 'Ján', 'Novák', 'jan.novak@demo.sk', '+421901234567', 'Manažér', 'Vedenie', '2023-01-15', 2500.00, 'full_time')
      `, (err) => {
        if (err) {
          console.error('Chyba pri vkladaní demo zamestnancov:', err);
        }
      });

      // Vyčistenie nepriradených pracovných pomerov
      db.run(`
        DELETE FROM employment_relations 
        WHERE employee_id NOT IN (SELECT id FROM employees)
      `, (err) => {
        if (err) {
          console.error('Chyba pri vyčistení nepriradených pracovných pomerov:', err);
        }
      });

      // Vloženie demo pracovných zmien - len jedna zmena
      db.run(`
        INSERT OR IGNORE INTO work_shifts (
          company_id, shift_name, start_time, end_time, break_start, break_end
        ) VALUES 
          (1, 'Ranná zmena', '08:00', '16:00', '12:00', '12:30')
      `, (err) => {
        if (err) {
          console.error('Chyba pri vkladaní demo zmien:', err);
        }
      });

      // Vloženie demo pracovných pomerov - len jeden záznam
      db.run(`
        INSERT OR IGNORE INTO employment_relations (
          employee_id, company_id, position, employment_type, employment_start_date, salary, weekly_hours, 
          attendance_mode, work_start_time, work_end_time, break_start_time, break_end_time
        ) VALUES 
          (1, 1, 'Manažér', 'full_time', '2023-01-15', 2500.00, 40, 'automatic', '08:00', '16:00', '12:00', '12:30')
      `, (err) => {
        if (err) {
          console.error('Chyba pri vkladaní demo pracovných pomerov:', err);
        }
      });

      // Tabuľka zmien personálnych údajov zamestnancov
      db.run(`
        CREATE TABLE IF NOT EXISTS employee_changes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          company_id INTEGER NOT NULL,
          field_name TEXT NOT NULL,
          current_value TEXT,
          new_value TEXT NOT NULL,
          reason TEXT NOT NULL,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
          approved_by INTEGER,
          approved_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
          FOREIGN KEY (approved_by) REFERENCES employees (id)
        )
      `);

      // Vloženie demo dochádzky - len jeden záznam
      const today = new Date().toISOString().split('T')[0];
      
      db.run(`
        INSERT OR IGNORE INTO attendance (
          employee_id, company_id, date, check_in, check_out, total_hours, status
        ) VALUES 
          (1, 1, ?, '08:05:00', '16:02:00', 7.95, 'present')
      `, [today], (err) => {
        if (err) {
          console.error('Chyba pri vkladaní demo dochádzky:', err);
        }
      });

      // Funkcia na kontrolu či je deň víkend
      const isWeekend = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // 0 = nedeľa, 6 = sobota
      };

      // Funkcia na kontrolu či je deň sviatok (základné slovenské sviatky)
      const isHoliday = (date) => {
        const month = date.getMonth() + 1; // getMonth() vracia 0-11
        const day = date.getDate();
        
        // Základné slovenské sviatky
        const holidays = [
          { month: 1, day: 1 },   // 1. január - Deň vzniku Slovenskej republiky
          { month: 1, day: 6 },   // 6. január - Zjavenie Pána (Traja králi)
          { month: 5, day: 1 },   // 1. máj - Sviatok práce
          { month: 5, day: 8 },   // 8. máj - Deň víťazstva nad fašizmom
          { month: 7, day: 5 },   // 5. júl - Sviatok svätého Cyrila a Metoda
          { month: 8, day: 29 },  // 29. august - Výročie SNP
          { month: 9, day: 1 },   // 1. september - Deň Ústavy Slovenskej republiky
          { month: 9, day: 15 },  // 15. september - Sedembolestná Panna Mária
          { month: 11, day: 1 },  // 1. november - Sviatok všetkých svätých
          { month: 11, day: 17 }, // 17. november - Deň boja za slobodu a demokraciu
          { month: 12, day: 24 }, // 24. december - Štedrý deň
          { month: 12, day: 25 }, // 25. december - Prvý sviatok vianočný
          { month: 12, day: 26 }  // 26. december - Druhý sviatok vianočný
        ];
        
        return holidays.some(holiday => holiday.month === month && holiday.day === day);
      };

      // Funkcia na výpočet pracovných dní (bez víkendov a sviatkov)
      const calculateWorkingDays = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        let workingDays = 0;
        const current = new Date(start);
        
        // Iterujeme cez každý deň v rozsahu
        while (current <= end) {
          // Ak nie je víkend a nie je sviatok, počítame ako pracovný deň
          if (!isWeekend(current) && !isHoliday(current)) {
            workingDays++;
          }
          current.setDate(current.getDate() + 1);
        }
        
        return workingDays;
      };

      // Vloženie demo dovoleniek - len jedna dovolenka
      const leaveRequests = [
        { employee_id: 1, company_id: 1, leave_type: 'vacation', start_date: '2024-07-15', end_date: '2024-07-19', reason: 'Letná dovolenka', status: 'approved' }
      ];

      // Vložiť každú dovolenku s správnym počtom pracovných dní
      leaveRequests.forEach(request => {
        const workingDays = calculateWorkingDays(request.start_date, request.end_date);
        db.run(`
          INSERT OR IGNORE INTO leave_requests (
            employee_id, company_id, leave_type, start_date, end_date, total_days, reason, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [request.employee_id, request.company_id, request.leave_type, request.start_date, request.end_date, workingDays, request.reason, request.status], (err) => {
          if (err) {
            console.error('Chyba pri vkladaní demo dovolenky:', err);
          }
        });
      });
      // Demo mzdové obdobia - vytvoriť pre všetky existujúce firmy
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      // Najprv získame všetky firmy
      db.all('SELECT id FROM companies', [], (err, companies) => {
        if (err) {
          console.error('Chyba pri získavaní firiem:', err);
          return;
        }
        
        // Vytvoriť mzdové obdobia pre roky 2023, 2024 a aktuálny rok + budúci mesiac
        const years = [2023, 2024, currentYear];
        
        companies.forEach(company => {
          years.forEach(year => {
            // Pre aktuálny rok pridáme aj budúci mesiac
            const maxMonth = (year === currentYear) ? Math.min(12, currentMonth + 1) : 12;
            
            for (let month = 1; month <= maxMonth; month++) {
              let isClosed = false;
              let closedAt = null;
              let closedBy = null;
              
              if (year < currentYear) {
                // Minulé roky sú úplne uzatvorené
                isClosed = true;
                closedAt = new Date(year, month - 1, 1).toISOString();
                closedBy = 'admin@portal.sk';
              } else if (year === currentYear) {
                // Aktuálny rok - uzatvorené sú len minulé mesiace
                isClosed = month < currentMonth;
                if (isClosed) {
                  closedAt = new Date(year, month - 1, 1).toISOString();
                  closedBy = 'admin@portal.sk';
                }
              }
              
              db.run(`
                INSERT OR IGNORE INTO payroll_periods (
                  company_id, year, month, is_closed, closed_at, closed_by
                ) VALUES (?, ?, ?, ?, ?, ?)
              `, [
                company.id, // company_id - každá firma má svoje obdobia
                year,
                month,
                isClosed ? 1 : 0,
                closedAt,
                closedBy
              ], (err) => {
                if (err) {
                  console.error('Chyba pri vkladaní demo mzdového obdobia:', err);
                }
              });
            }
          });
        });
        
        });

      // ===== ÚČTOVNÍCTVO - NOVÉ TABUĽKY =====
      
      // Tabuľka nastavení účtovníctva pre firmy
      db.run(`
        CREATE TABLE IF NOT EXISTS accounting_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          pohoda_enabled BOOLEAN DEFAULT 0,
          pohoda_url TEXT,
          pohoda_username TEXT,
          pohoda_password TEXT,
          pohoda_ico TEXT,
          pohoda_year TEXT,
          auto_sync BOOLEAN DEFAULT 0,
          sync_frequency TEXT DEFAULT 'daily' CHECK(sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
          last_sync DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
          UNIQUE(company_id)
        )
      `);

      // Tabuľka práv pre účtovníctvo
      db.run(`
        CREATE TABLE IF NOT EXISTS accounting_permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_email TEXT NOT NULL,
          company_id INTEGER NOT NULL,
          can_view_invoices BOOLEAN DEFAULT 0,
          can_create_invoices BOOLEAN DEFAULT 0,
          can_edit_invoices BOOLEAN DEFAULT 0,
          can_delete_invoices BOOLEAN DEFAULT 0,
          can_view_bank BOOLEAN DEFAULT 0,
          can_edit_bank BOOLEAN DEFAULT 0,
          can_view_cash BOOLEAN DEFAULT 0,
          can_edit_cash BOOLEAN DEFAULT 0,
          can_view_reports BOOLEAN DEFAULT 0,
          can_export_data BOOLEAN DEFAULT 0,
          can_manage_settings BOOLEAN DEFAULT 0,
          granted_by TEXT NOT NULL,
          granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
          UNIQUE(user_email, company_id)
        )
      `);

      // Tabuľka vydaných faktúr
      db.run(`
        CREATE TABLE IF NOT EXISTS issued_invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          invoice_number TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          customer_ico TEXT,
          customer_dic TEXT,
          customer_address TEXT,
          issue_date DATE NOT NULL,
          due_date DATE NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          vat_amount DECIMAL(10,2) NOT NULL,
          
          -- MDB stĺpce - základy DPH
          kc0 DECIMAL(10,2) DEFAULT 0,
          kc1 DECIMAL(10,2) DEFAULT 0,
          kc2 DECIMAL(10,2) DEFAULT 0,
          kc3 DECIMAL(10,2) DEFAULT 0,
          
          -- MDB stĺpce - DPH
          kc_dph1 DECIMAL(10,2) DEFAULT 0,
          kc_dph2 DECIMAL(10,2) DEFAULT 0,
          kc_dph3 DECIMAL(10,2) DEFAULT 0,
          
          -- MDB stĺpce - celkové sumy
          kc_celkem DECIMAL(10,2) DEFAULT 0,
          
          -- MDB stĺpce - ďalšie informácie
          var_sym TEXT,
          s_text TEXT,
          mdb_id INTEGER,
          rel_tp_fak INTEGER,
          datum DATE,
          dat_splat DATE,
          firma TEXT,
          ico TEXT,
          dic TEXT,
          ulice TEXT,
          psc TEXT,
          obec TEXT,
          mdb_cislo TEXT,
          
          -- MDB stĺpce - likvidácia a platby
          kc_likv DECIMAL(10,2) DEFAULT 0,
          kc_zuplat DECIMAL(10,2) DEFAULT 0,
          dat_likv DATE,
          
          currency TEXT DEFAULT 'EUR',
          status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
          pohoda_id TEXT,
          notes TEXT,
          created_by TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
          UNIQUE(company_id, invoice_number)
        )
      `);

      // Tabuľka položiek vydaných faktúr
      db.run(`
        CREATE TABLE IF NOT EXISTS issued_invoice_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_id INTEGER NOT NULL,
          description TEXT NOT NULL,
          quantity DECIMAL(10,2) NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          vat_rate DECIMAL(5,2) NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          vat_amount DECIMAL(10,2) NOT NULL,
          unit TEXT DEFAULT 'ks',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (invoice_id) REFERENCES issued_invoices (id) ON DELETE CASCADE
        )
      `);

             // Tabuľka prijatých faktúr
       db.run(`
         CREATE TABLE IF NOT EXISTS received_invoices (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           company_id INTEGER NOT NULL,
           invoice_number TEXT NOT NULL,
           supplier_name TEXT NOT NULL,
           supplier_ico TEXT,
           supplier_dic TEXT,
           supplier_address TEXT,
           issue_date DATE NOT NULL,
           due_date DATE NOT NULL,
           total_amount DECIMAL(10,2) NOT NULL,
           vat_amount DECIMAL(10,2) NOT NULL,
           
           -- MDB stĺpce - základy DPH
           kc0 DECIMAL(10,2) DEFAULT 0,
           kc1 DECIMAL(10,2) DEFAULT 0,
           kc2 DECIMAL(10,2) DEFAULT 0,
           kc3 DECIMAL(10,2) DEFAULT 0,
           
           -- MDB stĺpce - DPH
           kc_dph1 DECIMAL(10,2) DEFAULT 0,
           kc_dph2 DECIMAL(10,2) DEFAULT 0,
           kc_dph3 DECIMAL(10,2) DEFAULT 0,
           
           -- MDB stĺpce - celkové sumy
           kc_celkem DECIMAL(10,2) DEFAULT 0,
           
           -- MDB stĺpce - ďalšie informácie
           var_sym TEXT,
           s_text TEXT,
           mdb_id INTEGER,
           rel_tp_fak INTEGER,
           datum DATE,
           dat_splat DATE,
           firma TEXT,
           ico TEXT,
           dic TEXT,
           ulice TEXT,
           psc TEXT,
           obec TEXT,
           mdb_cislo TEXT,
           
           -- MDB stĺpce - likvidácia a platby
           kc_likv DECIMAL(10,2) DEFAULT 0,
           kc_zuplat DECIMAL(10,2) DEFAULT 0,
           dat_likv DATE,
           
           currency TEXT DEFAULT 'EUR',
           status TEXT DEFAULT 'received' CHECK(status IN ('received', 'approved', 'paid', 'overdue', 'disputed')),
           pohoda_id TEXT,
           notes TEXT,
           created_by TEXT NOT NULL,
           created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
           updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
           FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
           UNIQUE(company_id, invoice_number)
         )
       `);

      // Tabuľka položiek prijatých faktúr
      db.run(`
        CREATE TABLE IF NOT EXISTS received_invoice_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_id INTEGER NOT NULL,
          description TEXT NOT NULL,
          quantity DECIMAL(10,2) NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          vat_rate DECIMAL(5,2) NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          vat_amount DECIMAL(10,2) NOT NULL,
          unit TEXT DEFAULT 'ks',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (invoice_id) REFERENCES received_invoices (id) ON DELETE CASCADE
        )
      `);

      // Tabuľka bankových transakcií
      db.run(`
        CREATE TABLE IF NOT EXISTS bank_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          transaction_date DATE NOT NULL,
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          currency TEXT DEFAULT 'EUR',
          type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
          category TEXT,
          bank_account TEXT,
          reference TEXT,
          pohoda_id TEXT,
          notes TEXT,
          created_by TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
        )
      `);

      // Tabuľka pokladničných transakcií
      db.run(`
        CREATE TABLE IF NOT EXISTS cash_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          transaction_date DATE NOT NULL,
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          currency TEXT DEFAULT 'EUR',
          type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
          category TEXT,
          receipt_number TEXT,
          pohoda_id TEXT,
          notes TEXT,
          created_by TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
        )
      `);

      // Tabuľka kategórií pre účtovníctvo
      db.run(`
        CREATE TABLE IF NOT EXISTS accounting_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
          description TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
          UNIQUE(company_id, name, type)
        )
      `);

      // Tabuľka synchronizácie s Pohoda
      db.run(`
        CREATE TABLE IF NOT EXISTS pohoda_sync_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          sync_type TEXT NOT NULL CHECK(sync_type IN ('invoices', 'bank', 'cash', 'full')),
          status TEXT NOT NULL CHECK(status IN ('success', 'error', 'partial')),
          records_processed INTEGER DEFAULT 0,
          records_synced INTEGER DEFAULT 0,
          error_message TEXT,
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
        )
      `);

             // ===== ALTER TABLE PRÍKAZY - SYNCHRONNÉ PO CREATE TABLE =====
       
       // Pridanie termination_date stĺpca do employees tabuľky ak neexistuje
      // db.run(`
//   ALTER TABLE employees ADD COLUMN termination_date DATE
// `, (err) => {
//   // Ignorujeme chybu ak stĺpec už existuje
//   if (err && !err.message.includes('duplicate column name')) {
//     console.error('Chyba pri pridávaní termination_date stĺpca:', err);
//   }
// });

       // Pridanie termination_reason stĺpca do employees tabuľky ak neexistuje
       // db.run(`
//   ALTER TABLE employees ADD COLUMN termination_reason TEXT
// `, (err) => {
//   // Ignorujeme chybu ak stĺpec už existuje
//   if (err && !err.message.includes('duplicate column name')) {
//     console.error('Chyba pri pridávaní termination_reason stĺpca:', err);
//   }
// });

       // Pridanie personálnych údajov stĺpcov
       const personalColumns = [
         'birth_name TEXT',
         'title_before TEXT',
         'title_after TEXT',
         'gender TEXT CHECK(gender IN ("muž", "žena"))',
         'birth_date DATE',
         'birth_number TEXT',
         'birth_place TEXT',
         'nationality TEXT',
         'citizenship TEXT',
         'education TEXT',
         'marital_status TEXT',
         'is_partner BOOLEAN DEFAULT 0',
         'is_statutory BOOLEAN DEFAULT 0',
         'employee_bonus BOOLEAN DEFAULT 0',
         'bonus_months INTEGER DEFAULT 0',
         'permanent_street TEXT',
         'permanent_number TEXT',
         'permanent_city TEXT',
         'permanent_zip TEXT',
         'permanent_country TEXT DEFAULT "Slovensko"',
         'contact_street TEXT',
         'contact_number TEXT',
         'contact_city TEXT',
         'contact_zip TEXT',
         'contact_country TEXT DEFAULT "Slovensko"',
         'is_foreigner BOOLEAN DEFAULT 0',
         'foreigner_country TEXT',
         'residence_permit_number TEXT',
         'social_insurance_sr TEXT',
         'social_insurance_foreign TEXT',
         'health_insurance_sr TEXT',
         'foreigner_without_permanent_residence BOOLEAN DEFAULT 0',
         'tax_identification_number TEXT'
       ];

       // Pridanie dochádzkových stĺpcov do attendance tabuľky
       const attendanceColumns = [
         'attendance_type TEXT DEFAULT "manual" CHECK(attendance_type IN ("manual", "automatic"))'
       ];

       attendanceColumns.forEach(column => {
         db.run(`ALTER TABLE attendance ADD COLUMN ${column}`, (err) => {
           if (err && !err.message.includes('duplicate column name')) {
             console.error(`Chyba pri pridávaní stĺpca ${column}:`, err);
           }
         });
       });

               // personalColumns.forEach(column => {
//   db.run(`ALTER TABLE employees ADD COLUMN ${column}`, (err) => {
//     if (err && !err.message.includes('duplicate column name')) {
//       console.error(`Chyba pri pridávaní stĺpca ${column}:`, err);
//     }
//   });
// });

        // Pridanie MDB stĺpcov do issued_invoices ak neexistujú
        const issuedInvoiceMdbColumns = [
          'kc0 DECIMAL(10,2) DEFAULT 0',
          'kc1 DECIMAL(10,2) DEFAULT 0',
          'kc2 DECIMAL(10,2) DEFAULT 0',
          'kc3 DECIMAL(10,2) DEFAULT 0',
          'kc_dph1 DECIMAL(10,2) DEFAULT 0',
          'kc_dph2 DECIMAL(10,2) DEFAULT 0',
          'kc_dph3 DECIMAL(10,2) DEFAULT 0',
          'kc_celkem DECIMAL(10,2) DEFAULT 0',
          'var_sym TEXT',
          's_text TEXT',
          'mdb_id INTEGER',
          'rel_tp_fak INTEGER',
          'datum DATE',
          'dat_splat DATE',
          'firma TEXT',
          'ico TEXT',
          'dic TEXT',
          'ulice TEXT',
          'psc TEXT',
          'obec TEXT',
          'mdb_cislo TEXT',
          'kc_likv DECIMAL(10,2) DEFAULT 0',
          'kc_zuplat DECIMAL(10,2) DEFAULT 0',
          'dat_likv DATE'
        ];

        issuedInvoiceMdbColumns.forEach(column => {
          db.run(`ALTER TABLE issued_invoices ADD COLUMN ${column}`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error(`Chyba pri pridávaní stĺpca ${column} do issued_invoices:`, err);
            }
          });
        });

        // Pridanie MDB stĺpcov do received_invoices ak neexistujú
        const receivedInvoiceMdbColumns = [
          'kc0 DECIMAL(10,2) DEFAULT 0',
          'kc1 DECIMAL(10,2) DEFAULT 0',
          'kc2 DECIMAL(10,2) DEFAULT 0',
          'kc3 DECIMAL(10,2) DEFAULT 0',
          'kc_dph1 DECIMAL(10,2) DEFAULT 0',
          'kc_dph2 DECIMAL(10,2) DEFAULT 0',
          'kc_dph3 DECIMAL(10,2) DEFAULT 0',
          'kc_celkem DECIMAL(10,2) DEFAULT 0',
          'var_sym TEXT',
          's_text TEXT',
          'mdb_id INTEGER',
          'rel_tp_fak INTEGER',
          'datum DATE',
          'dat_splat DATE',
          'firma TEXT',
          'ico TEXT',
          'dic TEXT',
          'ulice TEXT',
          'psc TEXT',
          'obec TEXT',
          'mdb_cislo TEXT',
          'kc_likv DECIMAL(10,2) DEFAULT 0',
          'kc_zuplat DECIMAL(10,2) DEFAULT 0',
          'dat_likv DATE'
        ];

        receivedInvoiceMdbColumns.forEach(column => {
          db.run(`ALTER TABLE received_invoices ADD COLUMN ${column}`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error(`Chyba pri pridávaní stĺpca ${column} do received_invoices:`, err);
            }
          });
        });
      });
    });
  });
};

// Export funkcií pre použitie v iných súboroch
const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = nedeľa, 6 = sobota
};

const isHoliday = (date) => {
  const month = date.getMonth() + 1; // getMonth() vracia 0-11
  const day = date.getDate();
  
  // Základné slovenské sviatky
  const holidays = [
    { month: 1, day: 1 },   // 1. január - Deň vzniku Slovenskej republiky
    { month: 1, day: 6 },   // 6. január - Zjavenie Pána (Traja králi)
    { month: 5, day: 1 },   // 1. máj - Sviatok práce
    { month: 5, day: 8 },   // 8. máj - Deň víťazstva nad fašizmom
    { month: 7, day: 5 },   // 5. júl - Sviatok svätého Cyrila a Metoda
    { month: 8, day: 29 },  // 29. august - Výročie SNP
    { month: 9, day: 1 },   // 1. september - Deň Ústavy Slovenskej republiky
    { month: 9, day: 15 },  // 15. september - Sedembolestná Panna Mária
    { month: 11, day: 1 },  // 1. november - Sviatok všetkých svätých
    { month: 11, day: 17 }, // 17. november - Deň boja za slobodu a demokraciu
    { month: 12, day: 24 }, // 24. december - Štedrý deň
    { month: 12, day: 25 }, // 25. december - Prvý sviatok vianočný
    { month: 12, day: 26 }  // 26. december - Druhý sviatok vianočný
  ];
  
  return holidays.some(holiday => holiday.month === month && holiday.day === day);
};

module.exports = { db, initDatabase, isWeekend, isHoliday };
