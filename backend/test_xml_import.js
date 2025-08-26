const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const xml2js = require('xml2js');

const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

// Test XML obsah
const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd" xmlns:inv="http://www.stormware.cz/schema/version_2/invoice.xsd" ico="36255789" application="POHODA" version="2.0" note="Test export">
  <dat:dataPackItem version="2.0" id="1">
    <inv:invoice version="2.0">
      <inv:invoiceHeader>
        <inv:invoiceType>issued</inv:invoiceType>
        <inv:date>2024-01-15</inv:date>
        <inv:dateDelivery>2024-01-15</inv:dateDelivery>
        <inv:partnerIdentity>
          <inv:address>
            <inv:company>Test Zákazník s.r.o.</inv:company>
            <inv:ico>12345678</inv:ico>
            <inv:dic>SK1234567890</inv:dic>
            <inv:street>Testovacia 123</inv:street>
            <inv:city>Bratislava</inv:city>
          </inv:address>
        </inv:partnerIdentity>
        <inv:currency>
          <inv:ids>EUR</inv:ids>
        </inv:currency>
        <inv:symVar>F2024001</inv:symVar>
        <inv:note>Test faktúra</inv:note>
      </inv:invoiceHeader>
      <inv:invoiceSummary>
        <inv:homeCurrency>
          <inv:priceHighSum>1000.00</inv:priceHighSum>
          <inv:priceHighSumVAT>200.00</inv:priceHighSumVAT>
        </inv:homeCurrency>
      </inv:invoiceSummary>
    </inv:invoice>
  </dat:dataPackItem>
</dat:dataPack>`;

async function testXmlImport() {
  console.log('🧪 Test XML import...\n');
  
  try {
    // Parsovanie XML
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(testXml);
    
    console.log('📄 Parsed XML structure:');
    console.log(JSON.stringify(result, null, 2));
    
    // Kontrola dataPack
    if (!result['dat:dataPack']) {
      console.log('❌ Chyba: Chýba dat:dataPack element');
      return;
    }
    
    const dataPack = result['dat:dataPack'];
    const ico = dataPack.$?.ico;
    console.log(`\n🏢 POHODA ICO: ${ico}`);
    
    // Kontrola faktúr
    if (dataPack['dat:dataPackItem']) {
      const items = Array.isArray(dataPack['dat:dataPackItem']) ? dataPack['dat:dataPackItem'] : [dataPack['dat:dataPackItem']];
      
      console.log(`\n📋 Počet dataPack items: ${items.length}`);
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const invoice = item['inv:invoice'];
        
        if (invoice) {
          console.log(`\n📄 Faktúra ${i + 1}:`);
          console.log(`   ID: ${item.$?.id}`);
          console.log(`   Číslo: ${invoice.invoiceHeader?.symVar}`);
          console.log(`   Zákazník: ${invoice.invoiceHeader?.partnerIdentity?.address?.company}`);
          console.log(`   IČO: ${invoice.invoiceHeader?.partnerIdentity?.address?.ico}`);
          console.log(`   Dátum: ${invoice.invoiceHeader?.date}`);
          console.log(`   Suma: ${invoice.invoiceSummary?.homeCurrency?.priceHighSum}`);
          
          // Test vloženia do databázy
          const companyId = 3; // Nový s.r.o.
          const pohodaId = item.$?.id || invoice.invoiceHeader?.symVar;
          
          console.log(`\n💾 Test vloženia do databázy:`);
          console.log(`   Company ID: ${companyId}`);
          console.log(`   POHODA ID: ${pohodaId}`);
          
          // Kontrola existujúcej faktúry
          db.get(`
            SELECT id FROM issued_invoices 
            WHERE company_id = ? AND pohoda_id = ?
          `, [companyId, pohodaId], (err, existingInvoice) => {
            if (err) {
              console.error('❌ Chyba pri kontrole existujúcej faktúry:', err);
              return;
            }
            
            if (existingInvoice) {
              console.log('   ✅ Faktúra už existuje v databáze');
            } else {
              console.log('   ➕ Faktúra neexistuje, vkladám...');
              
              // Vloženie novej faktúry
              db.run(`
                INSERT INTO issued_invoices (
                  company_id, invoice_number, customer_name, customer_ico, customer_dic,
                  customer_address, issue_date, due_date, total_amount, vat_amount,
                  currency, status, pohoda_id, notes, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                companyId,
                invoice.invoiceHeader?.symVar || '',
                invoice.invoiceHeader?.partnerIdentity?.address?.company || '',
                invoice.invoiceHeader?.partnerIdentity?.address?.ico || '',
                invoice.invoiceHeader?.partnerIdentity?.address?.dic || '',
                `${invoice.invoiceHeader?.partnerIdentity?.address?.street || ''}, ${invoice.invoiceHeader?.partnerIdentity?.address?.city || ''}`,
                invoice.invoiceHeader?.date || '',
                invoice.invoiceHeader?.dateDelivery || invoice.invoiceHeader?.date || '',
                invoice.invoiceSummary?.homeCurrency?.priceHighSum || 0,
                invoice.invoiceSummary?.homeCurrency?.priceHighSumVAT || 0,
                invoice.invoiceHeader?.currency?.ids || 'EUR',
                'sent',
                pohodaId,
                invoice.invoiceHeader?.note || '',
                'test@example.com'
              ], function(err) {
                if (err) {
                  console.error('❌ Chyba pri vkladaní faktúry:', err);
                } else {
                  console.log(`   ✅ Faktúra úspešne vložená s ID: ${this.lastID}`);
                }
              });
            }
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Chyba pri testovaní XML importu:', error);
  }
}

// Spustenie testu
testXmlImport().then(() => {
  setTimeout(() => {
    db.close();
    console.log('\n✅ Test dokončený');
  }, 2000);
});
