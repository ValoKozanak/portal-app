const path = require('path');
const fs = require('fs');
const ADODB = require('node-adodb');

async function checkPosTable() {
  try {
    console.log('🧪 Kontrolujem tabuľku pOS v MDB...');
    
    const mdbPath = path.join(__dirname, 'zalohy', '2025', '77777777_2025', '77777777_2025.mdb');
    
    if (!fs.existsSync(mdbPath)) {
      console.log('❌ MDB súbor nebol nájdený:', mdbPath);
      return;
    }
    
    console.log('📁 Načítavam dáta z:', mdbPath);
    
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // Test 1: Zobraziť všetky tabuľky v MDB
    console.log('\n🔍 Test 1: Všetky tabuľky v MDB:');
    try {
      const tables = await connection.query('SELECT name FROM MSysObjects WHERE type=1 AND flags=0');
      console.log('Tabuľky v MDB:');
      tables.forEach(table => {
        console.log(`  - ${table.name}`);
      });
    } catch (error) {
      console.log('❌ Chyba pri získavaní tabuliek:', error.message);
    }
    
    // Test 2: Skontrolovať či existuje tabuľka pOS
    console.log('\n🔍 Test 2: Kontrola tabuľky pOS:');
    try {
      const posData = await connection.query('SELECT TOP 5 * FROM pOS');
      console.log('✅ Tabuľka pOS existuje!');
      console.log('Prvých 5 záznamov z pOS:');
      posData.forEach(item => {
        console.log(`  ${item.Ucet}: ${item.Nazev}`);
      });
    } catch (error) {
      console.log('❌ Tabuľka pOS neexistuje:', error.message);
    }
    
    // Test 3: Skontrolovať tabuľku pUD
    console.log('\n🔍 Test 3: Kontrola tabuľky pUD:');
    try {
      const pudData = await connection.query('SELECT TOP 5 * FROM pUD');
      console.log('✅ Tabuľka pUD existuje!');
      console.log('Prvých 5 záznamov z pUD:');
      pudData.forEach(item => {
        console.log(`  UMD: ${item.UMD}, UD: ${item.UD}, Kc: ${item.Kc}`);
      });
    } catch (error) {
      console.log('❌ Tabuľka pUD neexistuje:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Chyba:', error);
  }
}

checkPosTable();
