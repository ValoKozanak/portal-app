const fs = require('fs');
const path = require('path');

// Cesta k súboru
const filePath = path.join(__dirname, 'routes', 'accounting.js');

// Prečítanie súboru
let content = fs.readFileSync(filePath, 'utf8');

// Nahradenie komplikovaného INSERT statement jednoduchým
const oldInsert = `                // Vloženie novej faktúry - použitie všetkých stĺpcov okrem id
                db.run(\`
                  INSERT INTO issued_invoices (
                    company_id, invoice_number, customer_name, customer_ico, customer_dic, 
                    customer_address, issue_date, due_date, total_amount, vat_amount, 
                    currency, status, pohoda_id, notes, created_by, created_at, updated_at,
                    kc_dph1, kc_dph2, kc_dph3, var_sym, s_text, kc_celkem, kc0, dat_splat, 
                    firma, ico, dic, ulice, psc, obec, mdb_id, rel_tp_fak, datum, mdb_cislo,
                    kc1, kc2, kc3
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'),
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                \`, [`;

const newInsert = `                // Vloženie novej faktúry - jednoduchý INSERT
                db.run(\`
                  INSERT INTO issued_invoices (
                    company_id, invoice_number, customer_name, customer_ico, customer_dic, 
                    customer_address, issue_date, due_date, total_amount, vat_amount, 
                    currency, status, pohoda_id, notes, created_by, created_at, updated_at,
                    kc_dph1, kc_dph2, kc_dph3, var_sym, s_text, kc_celkem, kc0, dat_splat, 
                    firma, ico, dic, ulice, psc, obec, mdb_id, rel_tp_fak, datum, mdb_cislo,
                    kc1, kc2, kc3
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'),
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                \`, [`;

// Nahradenie
content = content.replace(oldInsert, newInsert);

// Zápis späť do súboru
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ INSERT statement opravený!');

