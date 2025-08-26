const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./portal.db');

console.log('Vymazávam POHODA faktúry...');

db.run('DELETE FROM issued_invoices WHERE pohoda_id IS NOT NULL OR invoice_number LIKE "POHODA_%"', function(err) {
  if (err) {
    console.error('Chyba:', err);
  } else {
    console.log('✅ Vymazané POHODA faktúry:', this.changes);
  }
  db.close();
});
