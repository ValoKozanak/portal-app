const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Cesta k databáze
const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

async function resetDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log('🗑️  Vymazávam všetky existujúce dáta...');
      
      // Vymazanie všetkých tabuliek
      db.run('DELETE FROM files', (err) => {
        if (err) console.error('Chyba pri mazaní súborov:', err);
        else console.log('✅ Súbory vymazané');
      });
      
      db.run('DELETE FROM tasks', (err) => {
        if (err) console.error('Chyba pri mazaní úloh:', err);
        else console.log('✅ Úlohy vymazané');
      });
      
      db.run('DELETE FROM company_accountants', (err) => {
        if (err) console.error('Chyba pri mazaní priradení účtovníkov:', err);
        else console.log('✅ Priradenia účtovníkov vymazané');
      });
      
      db.run('DELETE FROM companies', (err) => {
        if (err) console.error('Chyba pri mazaní firiem:', err);
        else console.log('✅ Firmy vymazané');
      });
      
      db.run('DELETE FROM users', (err) => {
        if (err) console.error('Chyba pri mazaní používateľov:', err);
        else console.log('✅ Používatelia vymazaní');
      });

      // Vytvorenie demo používateľov
      console.log('\n👥 Vytváram demo používateľov...');
      
      const users = [
        {
          email: 'admin@portal.sk',
          password: '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE',
          name: 'Admin Portálu',
          role: 'admin',
          status: 'active',
          phone: '+421 901 234 567'
        },
        {
          email: 'user@portal.sk',
          password: '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE',
          name: 'Ján Novák',
          role: 'user',
          status: 'active',
          phone: '+421 902 345 678'
        },
        {
          email: 'user2@portal.sk',
          password: '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE',
          name: 'Mária Kováčová',
          role: 'user',
          status: 'active',
          phone: '+421 903 456 789'
        },
        {
          email: 'accountant@portal.sk',
          password: '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE',
          name: 'Peter Účtovník',
          role: 'accountant',
          status: 'active',
          phone: '+421 904 567 890'
        },
        {
          email: 'accountant2@portal.sk',
          password: '$2b$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE',
          name: 'Anna Účtovníková',
          role: 'accountant',
          status: 'active',
          phone: '+421 905 678 901'
        }
      ];

      users.forEach(user => {
        db.run(`
          INSERT INTO users (email, password, name, role, status, phone)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [user.email, user.password, user.name, user.role, user.status, user.phone], (err) => {
          if (err) console.error(`Chyba pri vytváraní používateľa ${user.email}:`, err);
          else console.log(`✅ Používateľ ${user.email} vytvorený`);
        });
      });

      // Vytvorenie demo firiem
      console.log('\n🏢 Vytváram demo firmy...');
      
      const companies = [
        {
          ico: '12345678',
          name: 'Tech Solutions s.r.o.',
          address: 'Hlavná 123, 81101 Bratislava',
          business_registry: '12345/A',
          vat_id: 'SK1234567890',
          tax_id: '1234567890',
          authorized_person: 'Ing. Ján Novák',
          contact_email: 'info@techsolutions.sk',
          contact_phone: '+421 2 123 456 78',
          owner_email: 'user@portal.sk'
        },
        {
          ico: '87654321',
          name: 'Green Energy a.s.',
          address: 'Námestie SNP 15, 81000 Bratislava',
          business_registry: '54321/B',
          vat_id: 'SK9876543210',
          tax_id: '0987654321',
          authorized_person: 'Mgr. Mária Kováčová',
          contact_email: 'kontakt@greenenergy.sk',
          contact_phone: '+421 2 987 654 32',
          owner_email: 'user2@portal.sk'
        },
        {
          ico: '11223344',
          name: 'Digital Marketing s.r.o.',
          address: 'Ventúrska 8, 81101 Bratislava',
          business_registry: '11223/C',
          vat_id: 'SK1122334455',
          tax_id: '1122334455',
          authorized_person: 'Bc. Peter Marketing',
          contact_email: 'hello@digitalmarketing.sk',
          contact_phone: '+421 2 111 222 33',
          owner_email: 'user@portal.sk'
        },
        {
          ico: '55667788',
          name: 'Logistics Plus s.r.o.',
          address: 'Prievozská 25, 82109 Bratislava',
          business_registry: '55667/D',
          vat_id: 'SK5566778899',
          tax_id: '5566778899',
          authorized_person: 'Ing. Anna Logistická',
          contact_email: 'info@logisticsplus.sk',
          contact_phone: '+421 2 555 666 77',
          owner_email: 'user2@portal.sk'
        }
      ];

      companies.forEach(company => {
        db.run(`
          INSERT INTO companies (ico, name, address, business_registry, vat_id, tax_id, authorized_person, contact_email, contact_phone, owner_email)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [company.ico, company.name, company.address, company.business_registry, company.vat_id, company.tax_id, company.authorized_person, company.contact_email, company.contact_phone, company.owner_email], function(err) {
          if (err) console.error(`Chyba pri vytváraní firmy ${company.name}:`, err);
          else console.log(`✅ Firma ${company.name} vytvorená (ID: ${this.lastID})`);
        });
      });

      // Priradenie účtovníkov k firmám
      console.log('\n👨‍💼 Priraďujem účtovníkov k firmám...');
      
      const assignments = [
        { company_id: 1, accountant_email: 'accountant@portal.sk' },
        { company_id: 2, accountant_email: 'accountant2@portal.sk' },
        { company_id: 3, accountant_email: 'accountant@portal.sk' },
        { company_id: 4, accountant_email: 'accountant2@portal.sk' }
      ];

      assignments.forEach(assignment => {
        db.run(`
          INSERT INTO company_accountants (company_id, accountant_email)
          VALUES (?, ?)
        `, [assignment.company_id, assignment.accountant_email], (err) => {
          if (err) console.error(`Chyba pri priradení účtovníka k firme ${assignment.company_id}:`, err);
          else console.log(`✅ Účtovník ${assignment.accountant_email} priradený k firme ${assignment.company_id}`);
        });
      });

      // Vytvorenie demo úloh
      console.log('\n📋 Vytváram demo úlohy...');
      
      const tasks = [
        {
          title: 'Aktualizácia účtovníctva',
          description: 'Potrebujeme aktualizovať účtovníctvo za Q1 2024',
          status: 'pending',
          priority: 'high',
          assigned_to: 'accountant@portal.sk',
          company_id: 1,
          company_name: 'Tech Solutions s.r.o.',
          created_by: 'user@portal.sk',
          due_date: '2024-04-30'
        },
        {
          title: 'Kontrola faktúr',
          description: 'Skontrolovať všetky faktúry za marec 2024',
          status: 'in_progress',
          priority: 'medium',
          assigned_to: 'accountant@portal.sk',
          company_id: 1,
          company_name: 'Tech Solutions s.r.o.',
          created_by: 'user@portal.sk',
          due_date: '2024-04-15'
        },
        {
          title: 'Daňové priznanie',
          description: 'Pripraviť daňové priznanie za rok 2023',
          status: 'completed',
          priority: 'urgent',
          assigned_to: 'accountant2@portal.sk',
          company_id: 2,
          company_name: 'Green Energy a.s.',
          created_by: 'user2@portal.sk',
          due_date: '2024-03-31'
        },
        {
          title: 'Audit účtovníctva',
          description: 'Ročný audit účtovníctva',
          status: 'pending',
          priority: 'high',
          assigned_to: 'accountant@portal.sk',
          company_id: 3,
          company_name: 'Digital Marketing s.r.o.',
          created_by: 'user@portal.sk',
          due_date: '2024-05-15'
        },
        {
          title: 'Kontrola DPH',
          description: 'Kontrola DPH priznania za Q1',
          status: 'in_progress',
          priority: 'medium',
          assigned_to: 'accountant2@portal.sk',
          company_id: 4,
          company_name: 'Logistics Plus s.r.o.',
          created_by: 'user2@portal.sk',
          due_date: '2024-04-20'
        },
        {
          title: 'Mesačná uzávierka',
          description: 'Uzávierka účtovníctva za marec 2024',
          status: 'completed',
          priority: 'medium',
          assigned_to: 'accountant@portal.sk',
          company_id: 1,
          company_name: 'Tech Solutions s.r.o.',
          created_by: 'user@portal.sk',
          due_date: '2024-04-10'
        }
      ];

      tasks.forEach(task => {
        db.run(`
          INSERT INTO tasks (title, description, status, priority, assigned_to, company_id, company_name, created_by, due_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [task.title, task.description, task.status, task.priority, task.assigned_to, task.company_id, task.company_name, task.created_by, task.due_date], (err) => {
          if (err) console.error(`Chyba pri vytváraní úlohy ${task.title}:`, err);
          else console.log(`✅ Úloha "${task.title}" vytvorená`);
        });
      });

      // Vytvorenie demo súborov
      console.log('\n📁 Vytváram demo súbory...');
      
      const files = [
        {
          filename: 'faktura_2024_001.pdf',
          original_name: 'Faktúra 2024-001.pdf',
          file_type: 'invoices',
          file_size: 245760,
          company_id: 1,
          uploaded_by: 'user@portal.sk',
          file_path: '/uploads/1/faktura_2024_001.pdf'
        },
        {
          filename: 'zmluva_zakazka_2024.docx',
          original_name: 'Zmluva zákazka 2024.docx',
          file_type: 'contracts',
          file_size: 512000,
          company_id: 1,
          uploaded_by: 'user@portal.sk',
          file_path: '/uploads/1/zmluva_zakazka_2024.docx'
        },
        {
          filename: 'vykaz_prace_2024.xlsx',
          original_name: 'Výkaz práce 2024.xlsx',
          file_type: 'reports',
          file_size: 128000,
          company_id: 2,
          uploaded_by: 'user2@portal.sk',
          file_path: '/uploads/2/vykaz_prace_2024.xlsx'
        },
        {
          filename: 'logo_firmy.png',
          original_name: 'Logo firmy.png',
          file_type: 'images',
          file_size: 102400,
          company_id: 3,
          uploaded_by: 'user@portal.sk',
          file_path: '/uploads/3/logo_firmy.png'
        },
        {
          filename: 'dph_priznanie_2024.pdf',
          original_name: 'DPH priznanie 2024.pdf',
          file_type: 'documents',
          file_size: 890000,
          company_id: 4,
          uploaded_by: 'user2@portal.sk',
          file_path: '/uploads/4/dph_priznanie_2024.pdf'
        },
        {
          filename: 'prezentacia_projekt.pdf',
          original_name: 'Prezentácia projektu.pdf',
          file_type: 'documents',
          file_size: 2048000,
          company_id: 1,
          uploaded_by: 'user@portal.sk',
          file_path: '/uploads/1/prezentacia_projekt.pdf'
        }
      ];

      files.forEach(file => {
        db.run(`
          INSERT INTO files (filename, original_name, file_type, file_size, company_id, uploaded_by, file_path)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [file.filename, file.original_name, file.file_type, file.file_size, file.company_id, file.uploaded_by, file.file_path], (err) => {
          if (err) console.error(`Chyba pri vytváraní súboru ${file.original_name}:`, err);
          else console.log(`✅ Súbor "${file.original_name}" vytvorený`);
        });
      });

      console.log('\n🎉 Demo dáta úspešne vytvorené!');
      console.log('\n📊 Prehľad vytvorených dát:');
      console.log('- 5 používateľov (1 admin, 2 user, 2 accountant)');
      console.log('- 4 firmy');
      console.log('- 4 priradenia účtovníkov');
      console.log('- 6 úloh');
      console.log('- 6 súborov');
      
      resolve();
    });
  });
}

// Spustenie resetu
resetDatabase()
  .then(() => {
    console.log('\n✅ Databáza úspešne resetovaná s demo dátami!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Chyba pri resete databázy:', error);
    process.exit(1);
  });
