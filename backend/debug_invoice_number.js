const xml2js = require('xml2js');
const iconv = require('iconv-lite');
const fs = require('fs');

async function debugInvoiceNumber() {
  try {
    // Načítanie XML súboru
    const xmlBuffer = fs.readFileSync('VydFaktury.xml');
    const decodedXml = iconv.decode(xmlBuffer, 'windows-1250');
    
    // Parsovanie XML
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true
    });
    
    const result = await parser.parseStringPromise(decodedXml);
    
    // Získanie prvej faktúry
    const dataPackItems = result['dat:dataPack']?.['dat:dataPackItem'] || [];
    const firstItem = Array.isArray(dataPackItems) ? dataPackItems[0] : dataPackItems;
    
    if (firstItem && firstItem['inv:invoice']) {
      const invoiceHeader = firstItem['inv:invoice']['inv:invoiceHeader'] || {};
      
      console.log('🔍 Debug invoice_number:');
      console.log('invoiceHeader:', JSON.stringify(invoiceHeader, null, 2));
      console.log('inv:number:', invoiceHeader['inv:number']);
      console.log('inv:symVar:', invoiceHeader['inv:symVar']);
      console.log('Type of inv:number:', typeof invoiceHeader['inv:number']);
      console.log('Type of inv:symVar:', typeof invoiceHeader['inv:symVar']);
      
      const invoiceNumber = String(invoiceHeader['inv:number'] || invoiceHeader['inv:symVar'] || 'FALLBACK');
      console.log('Final invoiceNumber:', invoiceNumber);
    }
    
  } catch (error) {
    console.error('Chyba:', error);
  }
}

debugInvoiceNumber();

