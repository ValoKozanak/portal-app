const path = require('path');
const fs = require('fs');
const ADODB = require('node-adodb');

async function testDateFilter() {
  try {
    const mdbPath = path.join(__dirname, 'zalohy', '2025', '77777777_2025', '77777777_2025.mdb');
    
    if (!fs.existsSync(mdbPath)) {
      console.log('❌ MDB súbor nebol nájdený:', mdbPath);
      return;
    }
    
    console.log('📁 Načítavam dáta z:', mdbPath);
    
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // Test 1: Zobraziť prvých 5 záznamov s dátumom
    console.log('\n🔍 Test 1: Prvých 5 záznamov s dátumom:');
    const sampleData = await connection.query('SELECT TOP 5 Datum, UMD, UD, Kc FROM pUD WHERE Datum IS NOT NULL');
    console.log(sampleData);
    
    // Test 2: Počet záznamov bez filtru
    console.log('\n🔍 Test 2: Počet záznamov bez filtru:');
    const totalCount = await connection.query('SELECT COUNT(*) as total FROM pUD');
    console.log('Celkový počet záznamov:', totalCount[0].total);
    
    // Test 3: Počet záznamov s dátumovým filtrom (nový formát)
    console.log('\n🔍 Test 3: Počet záznamov s dátumovým filtrom (2025-01-01 až 2025-01-31):');
    const dateFrom = '2025-01-01';
    const dateTo = '2025-01-31';
    console.log('Dátumové filtre:', { dateFrom, dateTo });
    
    const filteredCount = await connection.query(`SELECT COUNT(*) as filtered FROM pUD WHERE CDate(Datum) BETWEEN CDate('${dateFrom}') AND CDate('${dateTo}')`);
    console.log('Počet záznamov s filtrom:', filteredCount[0].filtered);
    
    // Test 4: Náklady bez filtru
    console.log('\n🔍 Test 4: Náklady bez filtru:');
    const expensesNoFilter = await connection.query("SELECT SUM(Kc) as total FROM pUD WHERE UMD LIKE '5%'");
    console.log('Náklady bez filtru:', expensesNoFilter[0].total);
    
    // Test 5: Náklady s dátumovým filtrom
    console.log('\n🔍 Test 5: Náklady s dátumovým filtrom:');
    const expensesWithFilter = await connection.query(`SELECT SUM(Kc) as total FROM pUD WHERE UMD LIKE '5%' AND CDate(Datum) BETWEEN CDate('${dateFrom}') AND CDate('${dateTo}')`);
    console.log('Náklady s filtrom:', expensesWithFilter[0].total);
    
    // Test 6: Výnosy bez filtru
    console.log('\n🔍 Test 6: Výnosy bez filtru:');
    const revenueNoFilter = await connection.query("SELECT SUM(Kc) as total FROM pUD WHERE UD LIKE '6%'");
    console.log('Výnosy bez filtru:', revenueNoFilter[0].total);
    
    // Test 7: Výnosy s dátumovým filtrom
    console.log('\n🔍 Test 7: Výnosy s dátumovým filtrom:');
    const revenueWithFilter = await connection.query(`SELECT SUM(Kc) as total FROM pUD WHERE UD LIKE '6%' AND CDate(Datum) BETWEEN CDate('${dateFrom}') AND CDate('${dateTo}')`);
    console.log('Výnosy s filtrom:', revenueWithFilter[0].total);
    
  } catch (error) {
    console.error('❌ Chyba:', error);
  }
}

testDateFilter();
