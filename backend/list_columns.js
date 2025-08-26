const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('portal.db');

db.all('PRAGMA table_info(issued_invoices)', (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Všetky stĺpce v issued_invoices:');
    rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.name}`);
    });
    console.log(`\nCelkovo: ${rows.length} stĺpcov`);
  }
  db.close();
});
