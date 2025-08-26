const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('portal.db');

db.all(`
  SELECT 
    id, 
    invoice_number, 
    customer_name, 
    issue_date, 
    total_amount,
    varsym,
    company_id
  FROM issued_invoices 
  ORDER BY id DESC
  LIMIT 10
`, (err, rows) => {
  if (err) {
    console.error('Chyba pri načítaní faktúr:', err);
  } else {
    console.log('📋 Posledných 10 faktúr v databáze:');
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id} | Číslo: ${row.invoice_number} | Firma: ${row.customer_name} | Dátum: ${row.issue_date} | Suma: ${row.total_amount} | Varsym: ${row.varsym} | Company ID: ${row.company_id}`);
    });
  }
  db.close();
});

