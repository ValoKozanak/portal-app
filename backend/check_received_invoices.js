const ADODB = require('node-adodb');

async function checkReceivedInvoices() {
  try {
    console.log('🔍 Kontrolujem prijaté faktúry v MDB tabuľke FA...');
    
    const currentYear = new Date().getFullYear();
    const mdbPath = `C:\\Users\\kozan\\Cursor\\backend\\zalohy\\${currentYear}\\77777777_${currentYear}\\77777777_${currentYear}.mdb`;
    
    console.log('📁 Cesta k MDB:', mdbPath);
    
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // Získanie prijatých faktúr (RelTpFak = 1)
    const query = `
      SELECT TOP 5 * FROM [FA] 
      WHERE RelTpFak = 1
      ORDER BY Datum DESC
    `;
    
    const data = await connection.query(query);
    
    if (data && data.length > 0) {
      console.log(`📋 Našiel som ${data.length} prijatých faktúr v MDB`);
      console.log('=====================================');
      
      data.forEach((row, index) => {
        console.log(`\n📄 Faktúra ${index + 1}:`);
        console.log(`   Číslo: ${row.Cislo}`);
        console.log(`   Firma: ${row.Firma}`);
        console.log(`   IČO: ${row.ICO}`);
        console.log(`   Dátum: ${row.Datum}`);
        console.log(`   Suma: ${row.KcCelkem}`);
        console.log(`   DPH: ${row.KcDPH1 + row.KcDPH2 + row.KcDPH3}`);
        console.log(`   RelTpFak: ${row.RelTpFak}`);
      });
      
      // Zobrazenie prvej faktúry ako príklad
      console.log('\n📄 Príklad prvej prijatej faktúry:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('❌ Žiadne prijaté faktúry v tabuľke FA');
    }
    
  } catch (error) {
    console.error('❌ Chyba pri čítaní MDB:', error);
  }
}

checkReceivedInvoices();

