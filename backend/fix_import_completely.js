const sqlite3 = require('sqlite3').verbose();
const xml2js = require('xml2js');
const iconv = require('iconv-lite');
const fs = require('fs');

const db = new sqlite3.Database('portal.db');

async function importPohodaXml(filePath, companyId) {
  try {
    console.log('📤 Importujem XML súbor:', filePath);
    
    // Načítanie XML súboru
    const xmlBuffer = fs.readFileSync(filePath);
    console.log('✅ XML súbor načítaný, veľkosť:', xmlBuffer.length, 'bajtov');
    
    // Dekódovanie z Windows-1250
    const decodedXml = iconv.decode(xmlBuffer, 'windows-1250');
    console.log('✅ XML dekódovaný s win1250');
    
    // Parsovanie XML
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true
    });
    
    const result = await parser.parseStringPromise(decodedXml);
    console.log('✅ XML úspešne sparsovaný');
    
    // Kontrola IČO
    const xmlIco = result['dat:dataPack']?.['ico'] || result['ico'];
    console.log('🔍 XML IČO:', xmlIco);
    
    // Získanie faktúr
    const dataPackItems = result['dat:dataPack']?.['dat:dataPackItem'] || [];
    const invoices = Array.isArray(dataPackItems) ? dataPackItems : [dataPackItems];
    
    console.log('✅ Nájdených', invoices.length, 'faktúr');
    
    let importedCount = 0;
    const errors = [];
    
    for (const item of invoices) {
      try {
        const invoice = item['inv:invoice'];
        if (!invoice) continue;
        
        const invoiceHeader = invoice['inv:invoiceHeader'] || {};
        const invoiceSummary = invoice['inv:invoiceSummary'] || {};
        
        // Základné údaje
        const invoiceNumber = String(
          invoiceHeader['inv:number']?.['typ:numberRequested'] || 
          invoiceHeader['inv:symVar'] || 
          `POHODA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        );
        const customerName = invoiceHeader['inv:partnerIdentity']?.['typ:address']?.['typ:company'] || '';
        const customerIco = invoiceHeader['inv:partnerIdentity']?.['typ:address']?.['typ:ico'] || '';
        const customerDic = invoiceHeader['inv:partnerIdentity']?.['typ:address']?.['typ:dic'] || '';
        const customerAddress = `${invoiceHeader['inv:partnerIdentity']?.['typ:address']?.['typ:street'] || ''}, ${invoiceHeader['inv:partnerIdentity']?.['typ:address']?.['typ:city'] || ''}`;
        const issueDate = invoiceHeader['inv:date'] || '';
        const dueDate = invoiceHeader['inv:dateDue'] || invoiceHeader['inv:date'] || '';
        const totalAmount = invoiceSummary?.homeCurrency?.priceHighSum || 0;
        const vatAmount = invoiceSummary?.homeCurrency?.priceHighSumVAT || 0;
        const text = invoiceHeader['inv:text'] || '';
        
        // POHODA špecifické polia
        const varsym = invoiceHeader['inv:symVar'] || '';
        const dueDateOriginal = invoiceHeader['inv:dateDue'] || '';
        const taxLiability = invoiceHeader['inv:dateTax'] || '';
        const amount0 = invoiceSummary?.homeCurrency?.priceLowSum || 0;
        const amountReduced = invoiceSummary?.homeCurrency?.priceLowSumVAT || 0;
        const vatReduced = invoiceSummary?.homeCurrency?.priceLowVAT || 0;
        const amountBasic = invoiceSummary?.homeCurrency?.priceHigh || 0;
        const vatBasic = invoiceSummary?.homeCurrency?.priceHighVAT || 0;
        const amount2Reduced = invoiceSummary?.homeCurrency?.priceLow2Sum || 0;
        const vat2Reduced = invoiceSummary?.homeCurrency?.priceLow2VAT || 0;
        const advance = invoiceSummary?.homeCurrency?.priceAdvance || 0;
        const liquidation = 0; // Likvidácia je 0, nie celková suma
        const foreignCurrency = 'EUR';
        const exchangeRate = 1;
        const foreignAmount = invoiceSummary?.['inv:foreignCurrency']?.['typ:priceHighSum'] || 0;
        const toLiquidation = 0; // K likvidácii je 0
        const cancelled = false;
        
        // Kontrola, či faktúra už existuje
        const existingInvoice = await new Promise((resolve, reject) => {
          db.get(`
            SELECT id FROM issued_invoices 
            WHERE company_id = ? AND invoice_number = ?
          `, [companyId, invoiceNumber], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        
        if (existingInvoice) {
          // Aktualizácia existujúcej faktúry
          await new Promise((resolve, reject) => {
            db.run(`
              UPDATE issued_invoices SET
                customer_name = ?,
                customer_ico = ?,
                customer_dic = ?,
                customer_address = ?,
                issue_date = ?,
                due_date = ?,
                total_amount = ?,
                vat_amount = ?,
                notes = ?,
                updated_at = CURRENT_TIMESTAMP,
                varsym = ?,
                due_date_original = ?,
                tax_liability = ?,
                text = ?,
                amount_0 = ?,
                amount_reduced = ?,
                vat_reduced = ?,
                amount_basic = ?,
                vat_basic = ?,
                amount_2_reduced = ?,
                vat_2_reduced = ?,
                advance = ?,
                liquidation = ?,
                foreign_currency = ?,
                exchange_rate = ?,
                foreign_amount = ?,
                to_liquidation = ?,
                company_name = ?,
                cancelled = ?
              WHERE id = ?
            `, [
              customerName, customerIco, customerDic, customerAddress,
              issueDate, dueDate, totalAmount, vatAmount, text,
              varsym, dueDateOriginal, taxLiability, text,
              amount0, amountReduced, vatReduced, amountBasic, vatBasic,
              amount2Reduced, vat2Reduced, advance, liquidation,
              foreignCurrency, exchangeRate, foreignAmount, toLiquidation,
              customerName, cancelled, existingInvoice.id
            ], function(err) {
              if (err) reject(err);
              else resolve();
            });
          });
        } else {
          // Vytvorenie novej faktúry
          await new Promise((resolve, reject) => {
            db.run(`
              INSERT INTO issued_invoices (
                company_id, invoice_number, customer_name, customer_ico, customer_dic,
                customer_address, issue_date, due_date, total_amount, vat_amount,
                currency, status, pohoda_id, notes, created_by,
                varsym, due_date_original, tax_liability, text,
                amount_0, amount_reduced, vat_reduced, amount_basic, vat_basic,
                amount_2_reduced, vat_2_reduced, advance, liquidation,
                foreign_currency, exchange_rate, foreign_amount,
                to_liquidation, company_name, cancelled
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              companyId, invoiceNumber, customerName, customerIco, customerDic,
              customerAddress, issueDate, dueDate, totalAmount, vatAmount,
              'EUR', 'sent', item.$?.id || varsym, text, 'admin@portal.sk',
              varsym, dueDateOriginal, taxLiability, text,
              amount0, amountReduced, vatReduced, amountBasic, vatBasic,
              amount2Reduced, vat2Reduced, advance, liquidation,
              foreignCurrency, exchangeRate, foreignAmount,
              toLiquidation, customerName, cancelled
            ], function(err) {
              if (err) reject(err);
              else resolve();
            });
          });
        }
        
        importedCount++;
        console.log(`✅ Importovaná faktúra: ${invoiceNumber} - ${customerName}`);
        
      } catch (error) {
        console.error('❌ Chyba pri spracovaní faktúry:', error);
        errors.push(`Faktúra ${item.$?.id || 'unknown'}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Import dokončený:`);
    console.log(`✅ Importované: ${importedCount} faktúr`);
    console.log(`❌ Chyby: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n📋 Chyby:');
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    return { importedCount, errors };
    
  } catch (error) {
    console.error('❌ Chyba pri importe:', error);
    throw error;
  }
}

// Test importu
importPohodaXml('VydFaktury.xml', 3)
  .then(result => {
    console.log('\n🎉 Import úspešne dokončený!');
    db.close();
  })
  .catch(error => {
    console.error('💥 Import zlyhal:', error);
    db.close();
  });
