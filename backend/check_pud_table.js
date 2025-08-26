const ADODB = require('node-adodb');
const path = require('path');

console.log('🔍 Kontrolujem tabuľku pUD v MDB...');

const mdbPath = path.join(__dirname, 'zalohy', '2025', '77777777_2025', '77777777_2025.mdb');
console.log('📁 MDB cesta:', mdbPath);

const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);

async function checkPudTable() {
  try {
    // 1. Skontrolujme či tabuľka pUD existuje
    console.log('\n1️⃣ Kontrolujem či tabuľka pUD existuje...');
    
    const tables = await connection.query(`
      SELECT Name FROM MSysObjects 
      WHERE Type=1 AND Flags=0 AND Name='pUD'
    `);
    
    if (tables.length === 0) {
      console.log('❌ Tabuľka pUD neexistuje!');
      
      // Pozrime si aké tabuľky existujú
      const allTables = await connection.query(`
        SELECT Name FROM MSysObjects 
        WHERE Type=1 AND Flags=0
        ORDER BY Name
      `);
      
      console.log('📋 Dostupné tabuľky:');
      allTables.forEach(table => {
        console.log('   -', table.Name);
      });
      
      return;
    }
    
    console.log('✅ Tabuľka pUD existuje!');
    
    // 2. Pozrime si štruktúru tabuľky pUD
    console.log('\n2️⃣ Kontrolujem štruktúru tabuľky pUD...');
    
    const structure = await connection.query(`
      SELECT TOP 1 * FROM pUD
    `);
    
    if (structure.length === 0) {
      console.log('❌ Tabuľka pUD je prázdna!');
      return;
    }
    
    console.log('📋 Stĺpce v tabuľke pUD:');
    const columns = Object.keys(structure[0]);
    columns.forEach(col => {
      console.log('   -', col);
    });
    
    // 3. Skontrolujme či existujú stĺpce Kc, UMD, UD
    console.log('\n3️⃣ Kontrolujem stĺpce Kc, UMD, UD...');
    
    const hasKc = columns.includes('Kc');
    const hasUMD = columns.includes('UMD');
    const hasUD = columns.includes('UD');
    
    console.log('   Kc:', hasKc ? '✅' : '❌');
    console.log('   UMD:', hasUMD ? '✅' : '❌');
    console.log('   UD:', hasUD ? '✅' : '❌');
    
    // 4. Pozrime si prvých 5 záznamov
    console.log('\n4️⃣ Prvých 5 záznamov z pUD:');
    
    const sampleData = await connection.query(`
      SELECT TOP 5 * FROM pUD
    `);
    
    sampleData.forEach((row, index) => {
      console.log(`\n   Záznam ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    });
    
    // 5. Skontrolujme či sú nejaké záznamy s UMD začínajúcim na 5
    console.log('\n5️⃣ Kontrolujem záznamy s UMD začínajúcim na 5...');
    
    if (hasUMD) {
      const umd5Data = await connection.query(`
        SELECT TOP 5 Kc, UMD, UD FROM pUD 
        WHERE UMD LIKE '5%'
      `);
      
      console.log(`   Našiel som ${umd5Data.length} záznamov s UMD začínajúcim na 5:`);
      umd5Data.forEach((row, index) => {
        console.log(`     ${index + 1}. Kc: ${row.Kc}, UMD: ${row.UMD}, UD: ${row.UD}`);
      });
    }
    
    // 6. Skontrolujme či sú nejaké záznamy s UD začínajúcim na 6
    console.log('\n6️⃣ Kontrolujem záznamy s UD začínajúcim na 6...');
    
    if (hasUD) {
      const ud6Data = await connection.query(`
        SELECT TOP 5 Kc, UMD, UD FROM pUD 
        WHERE UD LIKE '6%'
      `);
      
      console.log(`   Našiel som ${ud6Data.length} záznamov s UD začínajúcim na 6:`);
      ud6Data.forEach((row, index) => {
        console.log(`     ${index + 1}. Kc: ${row.Kc}, UMD: ${row.UMD}, UD: ${row.UD}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Chyba:', error.message);
  }
}

checkPudTable().then(() => {
  console.log('\n✅ Kontrola dokončená');
  process.exit(0);
}).catch(error => {
  console.error('❌ Chyba:', error);
  process.exit(1);
});
