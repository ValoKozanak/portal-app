const { exec } = require('child_process');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Cesty k súborom
const psScriptPath = path.join(__dirname, 'read_companies.ps1');
const mainDbPath = path.join(__dirname, 'portal.db');

console.log('🚀 Import z POHODA Access databázy do Client-portal');
console.log('PowerShell script:', psScriptPath);
console.log('Main SQLite DB:', mainDbPath);

// Funkcia na vytvorenie SQLite databázy pre firmu
function createCompanyDatabase(companyId, companyName) {
  const companyDbPath = path.join(__dirname, 'company_databases', `company_${companyId}.db`);
  
  // Vytvorenie adresára ak neexistuje
  const companyDbDir = path.dirname(companyDbPath);
  if (!fs.existsSync(companyDbDir)) {
    fs.mkdirSync(companyDbDir, { recursive: true });
  }
  
  const db = new sqlite3.Database(companyDbPath);
  
  // Vytvorenie tabuliek pre firmu
  db.serialize(() => {
    // Tabulka vydaných faktúr
    db.run(`
      CREATE TABLE IF NOT EXISTS issued_invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT,
        variable_symbol TEXT,
        issue_date TEXT,
        due_date TEXT,
        tax_liability TEXT,
        description TEXT,
        amount_0 DECIMAL(10,2),
        amount_reduced DECIMAL(10,2),
        vat_reduced DECIMAL(10,2),
        amount_basic DECIMAL(10,2),
        vat_basic DECIMAL(10,2),
        amount_2_reduced DECIMAL(10,2),
        vat_2_reduced DECIMAL(10,2),
        advance DECIMAL(10,2),
        liquidation DECIMAL(10,2),
        foreign_currency TEXT,
        exchange_rate DECIMAL(10,4),
        foreign_amount DECIMAL(10,2),
        company_name TEXT,
        total_amount DECIMAL(10,2),
        to_liquidation DECIMAL(10,2),
        ico TEXT,
        storno BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'Odoslaná',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabulka položiek faktúr
    db.run(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER,
        item_name TEXT,
        quantity DECIMAL(10,2),
        unit_price DECIMAL(10,2),
        vat_rate DECIMAL(5,2),
        total_price DECIMAL(10,2),
        vat_amount DECIMAL(10,2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES issued_invoices (id)
      )
    `);
    
    // Tabulka úhrad
    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER,
        payment_date TEXT,
        amount DECIMAL(10,2),
        payment_method TEXT,
        reference TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES issued_invoices (id)
      )
    `);
    
    // Tabulka poznámok
    db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER,
        note_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES issued_invoices (id)
      )
    `);
  });
  
  return companyDbPath;
}

// Spustenie PowerShell scriptu
exec(`powershell -ExecutionPolicy Bypass -File "${psScriptPath}"`, async (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Chyba pri čítaní Access databázy:', error);
    return;
  }
  
  if (stderr) {
    console.error('⚠️ PowerShell stderr:', stderr);
  }
  
  try {
    // Parsovanie JSON dát
    const companiesMatch = stdout.match(/COMPANIES_DATA_START\r?\n([\s\S]*?)\r?\nCOMPANIES_DATA_END/);
    if (!companiesMatch) {
      console.error('❌ Nepodarilo sa nájsť dáta o firmách');
      return;
    }
    
    const companiesData = JSON.parse(companiesMatch[1]);
    console.log(`✅ Načítané ${companiesData.length} firiem z POHODA`);
    
    // Pripojenie k hlavnej SQLite databáze
    const mainDb = new sqlite3.Database(mainDbPath);
    
    // Import firiem do hlavnej databázy a vytvorenie ich vlastných databáz
    console.log('📝 Importujem firmy do hlavnej databázy...');
    
    let importedCount = 0;
    let errorCount = 0;
    
    for (const company of companiesData) {
      try {
        await new Promise((resolve, reject) => {
          mainDb.run(`
            INSERT OR REPLACE INTO companies (
              name, ico, dic, address, city, postal_code, 
              phone, email, bank_account, bank_code,
              pohoda_database_path, authorized_person, owner_email,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `, [
            company.name || '',
            company.ico || '',
            company.dic || '',
            company.address || '',
            company.city || '',
            company.psc || '',
            company.phone || '',
            company.email || '',
            company.account || '',
            company.bank_code || '',
            `company_databases/company_${company.id}.db`,
            company.name || 'Import z POHODA', // Použijeme názov firmy ako authorized_person
            company.email || 'import@pohoda.sk' // Použijeme email firmy alebo default
          ], function(err) {
            if (err) {
              console.error(`❌ Chyba pri importe firmy ${company.name}:`, err.message);
              errorCount++;
              reject(err);
            } else {
              // Vytvorenie databázy pre firmu
              const companyDbPath = createCompanyDatabase(company.id, company.name);
              console.log(`✅ Importovaná firma: ${company.name} (DB: ${companyDbPath})`);
              importedCount++;
              resolve();
            }
          });
        });
      } catch (err) {
        errorCount++;
      }
    }
    
    console.log(`\n📊 Import dokončený:`);
    console.log(`   - Importované: ${importedCount} firiem`);
    console.log(`   - Chyby: ${errorCount}`);
    console.log(`   - Vytvorené databázy: company_databases/`);
    
    // Zatvorenie hlavnej databázy
    mainDb.close();
    
  } catch (error) {
    console.error('❌ Chyba pri spracovaní dát:', error);
  }
});
