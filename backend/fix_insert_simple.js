const fs = require('fs');
const path = require('path');

// Cesta k súboru
const filePath = path.join(__dirname, 'routes', 'accounting.js');

// Prečítanie súboru
let content = fs.readFileSync(filePath, 'utf8');

// Nahradenie komplikovaného INSERT statement jednoduchým s *
const oldInsert = `                // Vloženie novej faktúry - jednoduchý INSERT s *
                db.run(\`
                  INSERT INTO issued_invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'),
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                \`, [`;

const newInsert = `                // Vloženie novej faktúry - jednoduchý INSERT s *
                db.run(\`
                  INSERT INTO issued_invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'),
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                \`, [`;

// Nahradenie
content = content.replace(oldInsert, newInsert);

// Zápis späť do súboru
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ INSERT statement opravený s *!');
