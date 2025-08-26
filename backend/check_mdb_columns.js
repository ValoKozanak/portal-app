const ADODB = require('node-adodb');

async function checkMdbColumns() {
  try {
    console.log('🔍 Kontrolujem stĺpce v MDB tabuľke FA...');
    
    const currentYear = new Date().getFullYear();
    const mdbPath = `C:\\Users\\kozan\\Cursor\\backend\\zalohy\\${currentYear}\\77777777_${currentYear}\\77777777_${currentYear}.mdb`;
    
    console.log('📁 Cesta k MDB:', mdbPath);
    
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // Získanie všetkých stĺpcov z tabuľky FA
    const query = `
      SELECT TOP 1 * FROM [FA]
    `;
    
    const data = await connection.query(query);
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('📋 Stĺpce v MDB tabuľke FA:');
      console.log('=====================================');
      columns.forEach((column, index) => {
        console.log(`${index + 1}. ${column}`);
      });
      console.log('=====================================');
      console.log(`Celkovo stĺpcov: ${columns.length}`);
      
      // Zobrazenie prvej faktúry ako príklad
      console.log('\n📄 Príklad prvej faktúry:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('❌ Žiadne dáta v tabuľke FA');
    }
    
  } catch (error) {
    console.error('❌ Chyba pri čítaní MDB:', error);
  }
}

checkMdbColumns();

