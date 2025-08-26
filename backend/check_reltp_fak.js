const ADODB = require('node-adodb');

async function checkRelTpFak() {
  try {
    console.log('🔍 Kontrolujem rôzne typy RelTpFak v MDB tabuľke FA...');
    
    const currentYear = new Date().getFullYear();
    const mdbPath = `C:\\Users\\kozan\\Cursor\\backend\\zalohy\\${currentYear}\\77777777_${currentYear}\\77777777_${currentYear}.mdb`;
    
    console.log('📁 Cesta k MDB:', mdbPath);
    
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // Získanie všetkých rôznych hodnôt RelTpFak
    const query = `
      SELECT DISTINCT RelTpFak, COUNT(*) as pocet
      FROM [FA] 
      GROUP BY RelTpFak
      ORDER BY RelTpFak
    `;
    
    const data = await connection.query(query);
    
    console.log('📋 Rôzne typy RelTpFak v MDB:');
    console.log('=====================================');
    
    data.forEach((row, index) => {
      console.log(`${index + 1}. RelTpFak = ${row.RelTpFak} (${row.pocet} faktúr)`);
    });
    
    console.log('\n📋 Príklady faktúr pre každý typ:');
    console.log('=====================================');
    
    for (const row of data) {
      const exampleQuery = `
        SELECT TOP 1 ID, Cislo, Firma, RelTpFak, Datum, KcCelkem, KcLikv, KcZUplat
        FROM [FA] 
        WHERE RelTpFak = ${row.RelTpFak}
        ORDER BY Datum DESC
      `;
      
      const example = await connection.query(exampleQuery);
      if (example && example.length > 0) {
        const fact = example[0];
        console.log(`\n🔸 RelTpFak = ${row.RelTpFak}:`);
        console.log(`   Číslo: ${fact.Cislo}`);
        console.log(`   Firma: ${fact.Firma}`);
        console.log(`   Dátum: ${fact.Datum}`);
        console.log(`   Celkom: ${fact.KcCelkem}`);
        console.log(`   Likvidované: ${fact.KcLikv}`);
        console.log(`   Zostatok: ${fact.KcZUplat}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Chyba pri čítaní MDB:', error);
  }
}

checkRelTpFak();

