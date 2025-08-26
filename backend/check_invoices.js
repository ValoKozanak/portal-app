const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Kontrola vydaných faktúr v databáze...\n');

// Kontrola počtu faktúr
db.get("SELECT COUNT(*) as count FROM issued_invoices", (err, result) => {
  if (err) {
    console.error('❌ Chyba pri kontrole počtu faktúr:', err);
    return;
  }
  
  console.log(`📊 Celkový počet vydaných faktúr: ${result.count}`);
  
  if (result.count > 0) {
    // Zobrazenie detailov faktúr
    db.all("SELECT id, company_id, invoice_number, customer_name, issue_date, total_amount, status, pohoda_id FROM issued_invoices ORDER BY issue_date DESC LIMIT 10", (err, invoices) => {
      if (err) {
        console.error('❌ Chyba pri načítaní faktúr:', err);
        return;
      }
      
      console.log('\n📋 Posledných 10 faktúr:');
      console.log('ID | Company ID | Číslo faktúry | Zákazník | Dátum | Suma | Stav | POHODA ID');
      console.log('---|------------|---------------|----------|-------|------|------|----------');
      
      invoices.forEach(invoice => {
        console.log(`${invoice.id} | ${invoice.company_id} | ${invoice.invoice_number || 'N/A'} | ${invoice.customer_name || 'N/A'} | ${invoice.issue_date || 'N/A'} | ${invoice.total_amount || 0} | ${invoice.status || 'N/A'} | ${invoice.pohoda_id || 'N/A'}`);
      });
    });
  } else {
    console.log('📭 Žiadne vydané faktúry v databáze');
  }
});

// Kontrola firiem
db.all("SELECT id, name, ico FROM companies", (err, companies) => {
  if (err) {
    console.error('❌ Chyba pri načítaní firiem:', err);
    return;
  }
  
  console.log('\n🏢 Firmy v systéme:');
  companies.forEach(company => {
    console.log(`ID: ${company.id} | Názov: ${company.name} | IČO: ${company.ico}`);
  });
});

// Kontrola POHODA sync log
db.all("SELECT * FROM pohoda_sync_log ORDER BY started_at DESC LIMIT 5", (err, logs) => {
  if (err) {
    console.error('❌ Chyba pri načítaní POHODA logov:', err);
    return;
  }
  
  console.log('\n📝 Posledných 5 POHODA sync logov:');
  logs.forEach(log => {
    console.log(`ID: ${log.id} | Company: ${log.company_id} | Type: ${log.sync_type} | Status: ${log.status} | Started: ${log.started_at}`);
  });
});

setTimeout(() => {
  db.close();
  console.log('\n✅ Kontrola dokončená');
}, 2000);
