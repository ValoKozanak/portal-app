const path = require('path');
const fs = require('fs');
const ADODB = require('node-adodb');

async function testDirect() {
  try {
    console.log('🧪 Testujem priamo backend funkciu...');
    
    const mdbPath = path.join(__dirname, 'zalohy', '2025', '77777777_2025', '77777777_2025.mdb');
    
    if (!fs.existsSync(mdbPath)) {
      console.log('❌ MDB súbor nebol nájdený:', mdbPath);
      return;
    }
    
    console.log('📁 Načítavam dáta z:', mdbPath);
    
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // Test 1: Bez dátumových filtrov
    console.log('\n📊 Test 1: Bez dátumových filtrov');
    const expensesNoFilter = await connection.query("SELECT SUM(Kc) as total FROM pUD WHERE UMD LIKE '5%'");
    const revenueNoFilter = await connection.query("SELECT SUM(Kc) as total FROM pUD WHERE UD LIKE '6%'");
    
    console.log('Náklady bez filtru:', expensesNoFilter[0].total);
    console.log('Výnosy bez filtru:', revenueNoFilter[0].total);
    
    // Test 2: S dátumovými filtrami
    console.log('\n📊 Test 2: S dátumovými filtrami (2025-01-01 až 2025-01-31)');
    const expensesWithFilter = await connection.query("SELECT SUM(Kc) as total FROM pUD WHERE UMD LIKE '5%' AND CDate(Datum) BETWEEN CDate('2025-01-01') AND CDate('2025-01-31')");
    const revenueWithFilter = await connection.query("SELECT SUM(Kc) as total FROM pUD WHERE UD LIKE '6%' AND CDate(Datum) BETWEEN CDate('2025-01-01') AND CDate('2025-01-31')");
    
    console.log('Náklady s filtrom:', expensesWithFilter[0].total);
    console.log('Výnosy s filtrom:', revenueWithFilter[0].total);
    
    // Porovnanie
    console.log('\n📊 Porovnanie:');
    if (expensesNoFilter[0].total !== expensesWithFilter[0].total) {
      console.log('✅ Náklady sa prepočítali!');
    } else {
      console.log('❌ Náklady sa neprepočítali!');
    }
    
    if (revenueNoFilter[0].total !== revenueWithFilter[0].total) {
      console.log('✅ Výnosy sa prepočítali!');
    } else {
      console.log('❌ Výnosy sa neprepočítali!');
    }
    
  } catch (error) {
    console.error('❌ Chyba:', error);
  }
}

testDirect();
