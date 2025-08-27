const path = require('path');
const fs = require('fs');
const ADODB = require('node-adodb');

async function testPosTable() {
  try {
    console.log('🧪 Testujem tabuľku pOS v MDB...');
    
    const mdbPath = path.join(__dirname, 'zalohy', '2025', '77777777_2025', '77777777_2025.mdb');
    
    if (!fs.existsSync(mdbPath)) {
      console.log('❌ MDB súbor nebol nájdený:', mdbPath);
      return;
    }
    
    console.log('📁 Načítavam dáta z:', mdbPath);
    
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // Test 1: Zobraziť prvých 10 záznamov z pOS
    console.log('\n🔍 Test 1: Prvých 10 záznamov z pOS:');
    const sampleData = await connection.query('SELECT TOP 10 * FROM pOS');
    console.log(sampleData);
    
    // Test 2: Počet záznamov v pOS
    console.log('\n🔍 Test 2: Počet záznamov v pOS:');
    const totalCount = await connection.query('SELECT COUNT(*) as total FROM pOS');
    console.log('Celkový počet účtov:', totalCount[0].total);
    
    // Test 3: Hľadanie konkrétnych účtov
    console.log('\n🔍 Test 3: Hľadanie konkrétnych účtov:');
    const specificAccounts = ['524000', '366000', '522000'];
    
    for (const account of specificAccounts) {
      const accountName = await connection.query(`SELECT * FROM pOS WHERE Cislo = '${account}'`);
      console.log(`${account}: ${accountName[0]?.Nazev || 'Nenájdené'}`);
    }
    
  } catch (error) {
    console.error('❌ Chyba:', error);
  }
}

testPosTable();
