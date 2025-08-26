const fs = require('fs');
const path = require('path');

// Test XML upload
const testXmlUpload = async () => {
  try {
    console.log('🧪 Testujem XML upload...');
    
    // Kontrola, či existuje XML súbor
    const xmlPath = path.join(__dirname, 'VydFaktury.xml');
    if (!fs.existsSync(xmlPath)) {
      console.error('❌ XML súbor neexistuje:', xmlPath);
      return;
    }
    
    console.log('✅ XML súbor existuje:', xmlPath);
    
    // Načítanie XML súboru
    const buffer = fs.readFileSync(xmlPath);
    console.log('✅ XML súbor načítaný, veľkosť:', buffer.length, 'bajtov');
    
    // Test kódovania
    const iconv = require('iconv-lite');
    const xmlContent = iconv.decode(buffer, 'win1250');
    console.log('✅ XML dekódovaný s win1250');
    console.log('🔍 Prvých 200 znakov:', xmlContent.substring(0, 200));
    
    // Test parsovania
    const xml2js = require('xml2js');
    const parser = new xml2js.Parser({ 
      explicitArray: false,
      normalize: true,
      normalizeTags: false,
      attrNameProcessors: [],
      tagNameProcessors: [],
      explicitRoot: false,
      mergeAttrs: true,
      valueProcessors: [xml2js.processors.parseNumbers, xml2js.processors.parseBooleans]
    });
    
    const result = await parser.parseStringPromise(xmlContent);
    console.log('✅ XML úspešne sparsovaný');
    
    console.log('🔍 Všetky kľúče v result:', Object.keys(result));
    
    // Kontrola dataPack - skúsime rôzne možnosti
    let dataPack = null;
    let xmlIco = null;
    
    if (result['dat:dataPack']) {
      dataPack = result['dat:dataPack'];
      xmlIco = dataPack.$?.ico;
      console.log('✅ Našiel som dat:dataPack');
    } else if (result.ico) {
      // Možno je IČO priamo v root elemente
      xmlIco = result.ico;
      console.log('✅ Našiel som IČO priamo v root:', xmlIco);
      
      // Skúsime nájsť dataPackItem
      if (result['dat:dataPackItem']) {
        dataPack = { 'dat:dataPackItem': result['dat:dataPackItem'] };
        console.log('✅ Našiel som dat:dataPackItem priamo');
      }
    }
    
    if (!dataPack) {
      console.error('❌ Nepodarilo sa nájsť dataPack');
      return;
    }
    
    console.log('🔍 XML IČO:', xmlIco);
    
    // Kontrola dataPackItem
    if (!dataPack['dat:dataPackItem']) {
      console.error('❌ Chýba dat:dataPackItem');
      return;
    }
    
    const items = Array.isArray(dataPack['dat:dataPackItem']) ? dataPack['dat:dataPackItem'] : [dataPack['dat:dataPackItem']];
    console.log('✅ Nájdených', items.length, 'dataPackItem');
    
    // Kontrola prvej faktúry
    if (items.length > 0) {
      const firstItem = items[0];
      const invoice = firstItem['inv:invoice'];
      
      if (invoice && invoice['inv:invoiceHeader']) {
        const header = invoice['inv:invoiceHeader'];
        console.log('✅ Prvá faktúra:');
        console.log('  - symVar:', header['inv:symVar']);
        console.log('  - date:', header['inv:date']);
        console.log('  - text:', header['inv:text']?.substring(0, 50));
      }
    }
    
  } catch (error) {
    console.error('❌ Chyba pri teste:', error.message);
    console.error(error.stack);
  }
};

testXmlUpload();
