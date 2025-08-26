const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Pripojenie k databáze
const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Rozširujem tabuľku issued_invoices o POHODA polia...\n');

// Polia z POHODA, ktoré treba pridať
const pohodaFields = [
  // Základné polia
  'varsym TEXT',                    // Varsym (symbol variabilný)
  'due_date_original DATE',         // Splatné (pôvodný dátum splatnosti)
  'tax_liability DATE',             // Daňpovin (daňová povinnosť)
  'text TEXT',                      // Text (poznámka)
  
  // Sumy bez DPH
  'amount_0 DECIMAL(10,2) DEFAULT 0',           // € 0 (suma bez DPH)
  'amount_reduced DECIMAL(10,2) DEFAULT 0',     // € znížená (suma so zníženou sadzbou DPH)
  'amount_basic DECIMAL(10,2) DEFAULT 0',       // € základná (suma so základnou sadzbou DPH)
  'amount_2_reduced DECIMAL(10,2) DEFAULT 0',   // € 2 znížená (suma s 2. zníženou sadzbou DPH)
  
  // DPH
  'vat_reduced DECIMAL(10,2) DEFAULT 0',        // DPH znížená
  'vat_basic DECIMAL(10,2) DEFAULT 0',          // DPH základná
  'vat_2_reduced DECIMAL(10,2) DEFAULT 0',      // DPH 2 znížená
  
  // Zálohy a likvidácia
  'advance DECIMAL(10,2) DEFAULT 0',            // Záloha
  'liquidation DECIMAL(10,2) DEFAULT 0',        // Likv (likvidácia)
  
  // Cudzia mena
  'foreign_currency TEXT',                      // Cudzia mena
  'exchange_rate DECIMAL(10,4) DEFAULT 1',      // CM kurz (kurz cudzej meny)
  'foreign_amount DECIMAL(10,2) DEFAULT 0',     // CM čiastka (čiastka v cudzej mene)
  'total_amount_foreign DECIMAL(10,2) DEFAULT 0', // Celkom (celková suma v cudzej mene)
  'liquidation_amount DECIMAL(10,2) DEFAULT 0', // K likvidácii
  
  // Firma a identifikácia
  'company_name TEXT',                          // Firma (názov firmy)
  'customer_ico TEXT',                          // IČO (IČO zákazníka)
  'cancelled BOOLEAN DEFAULT 0',                // Storno
  
  // Platba
  'payment_method TEXT',                        // Spôsob platby
  'account_number TEXT',                        // Číslo účtu
  'iban TEXT',                                  // IBAN
  'swift TEXT',                                 // SWIFT
  
  // Dodanie
  'delivery_address TEXT',                      // Dodacia adresa
  'delivery_city TEXT',                         // Dodacie mesto
  'delivery_zip TEXT',                          // Dodacie PSČ
  'delivery_country TEXT',                      // Dodacia krajina
  
  // Objednávka
  'order_number TEXT',                          // Číslo objednávky
  'order_date DATE',                            // Dátum objednávky
  'delivery_date DATE',                         // Dátum dodania
  
  // Platobné podmienky
  'payment_terms TEXT',                         // Platobné podmienky
  
  // DPH nastavenia
  'vat_payer BOOLEAN DEFAULT 1',                // Plátca DPH
  'vat_mode TEXT',                              // Režim DPH
  
  // Zaokrúhľovanie
  'rounding_method TEXT',                       // Spôsob zaokrúhľovania
  
  // Jazyk a šablóna
  'language TEXT DEFAULT "sk"',                 // Jazyk
  'template TEXT',                              // Šablóna
  
  // Účtovanie
  'accounting_period TEXT',                     // Účtovné obdobie
  'fiscal_year INTEGER',                        // Fiškálny rok
  
  // Dokument
  'document_type TEXT',                         // Typ dokumentu
  'document_status TEXT',                       // Stav dokumentu
  
  // Schválenie
  'approval_status TEXT',                       // Stav schválenia
  'approval_date DATETIME',                     // Dátum schválenia
  'approval_user TEXT',                         // Používateľ schválenia
  
  // Tlač a email
  'print_count INTEGER DEFAULT 0',              // Počet tlačí
  'last_print_date DATETIME',                   // Posledná tlač
  'email_sent BOOLEAN DEFAULT 0',               // Email odoslaný
  'email_sent_date DATETIME',                   // Dátum odoslania emailu
  'email_recipients TEXT',                      // Príjemcovia emailu
  
  // Poznámky a tagy
  'notes_internal TEXT',                        // Interné poznámky
  'tags TEXT',                                  // Tagy
  'custom_fields TEXT',                         // Vlastné polia (JSON)
  
  // Synchronizácia
  'sync_status TEXT DEFAULT "pending"',         // Stav synchronizácie
  'sync_date DATETIME',                         // Dátum synchronizácie
  'sync_errors TEXT'                            // Chyby synchronizácie
];

// Pridanie polí do tabuľky
console.log('📋 Pridávam POHODA polia do tabuľky issued_invoices...');

pohodaFields.forEach((field, index) => {
  const [fieldName, fieldType] = field.split(' ');
  
  db.run(`ALTER TABLE issued_invoices ADD COLUMN ${fieldName} ${fieldType}`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log(`✅ Stĺpec ${fieldName} už existuje`);
      } else {
        console.error(`❌ Chyba pri pridávaní stĺpca ${fieldName}:`, err.message);
      }
    } else {
      console.log(`✅ Pridaný stĺpec: ${fieldName} (${fieldType})`);
    }
    
    // Kontrola či sme pridali všetky polia
    if (index === pohodaFields.length - 1) {
      console.log('\n🎉 Všetky POHODA polia boli pridané!');
      
      // Zobrazenie finálnej štruktúry tabuľky
      db.all("PRAGMA table_info(issued_invoices)", (err, columns) => {
        if (err) {
          console.error('❌ Chyba pri získavaní štruktúry tabuľky:', err);
        } else {
          console.log('\n📊 Finálna štruktúra tabuľky issued_invoices:');
          console.log('Stĺpec | Typ | Null | Default | Primary Key');
          console.log('-------|-----|------|---------|-------------');
          
          columns.forEach(col => {
            console.log(`${col.name} | ${col.type} | ${col.notnull ? 'NOT NULL' : 'NULL'} | ${col.dflt_value || 'NULL'} | ${col.pk ? 'YES' : 'NO'}`);
          });
        }
        
        db.close();
      });
    }
  });
});

console.log('\n⏳ Pridávam polia... (môže to trvať chvíľku)');
