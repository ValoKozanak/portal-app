const path = require('path');
const fs = require('fs');
const ADODB = require('node-adodb');

async function testAccountNames() {
  try {
    console.log('🧪 Testujem zobrazenie názvov účtov...');
    
    const mdbPath = path.join(__dirname, 'zalohy', '2025', '77777777_2025', '77777777_2025.mdb');
    
    if (!fs.existsSync(mdbPath)) {
      console.log('❌ MDB súbor nebol nájdený:', mdbPath);
      return;
    }
    
    console.log('📁 Načítavam dáta z:', mdbPath);
    
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // Test 1: Náklady s názvami účtov
    console.log('\n🔍 Test 1: Náklady s názvami účtov:');
    const expensesWithNames = await connection.query(`
      SELECT 
        pUD.UMD as account,
        pOS.Nazev as account_name,
        SUM(pUD.Kc) as total_amount,
        COUNT(*) as transaction_count
      FROM pUD 
      LEFT JOIN pOS ON pUD.UMD = pOS.Ucet
      WHERE pUD.UMD LIKE '5%'
      GROUP BY pUD.UMD, pOS.Nazev
      ORDER BY pUD.UMD
    `);
    
    console.log('Náklady s názvami:');
    expensesWithNames.forEach(item => {
      console.log(`${item.account}: ${item.account_name || 'Názov nenájdený'} - ${item.total_amount}`);
    });
    
    // Test 2: Výnosy s názvami účtov
    console.log('\n🔍 Test 2: Výnosy s názvami účtov:');
    const revenueWithNames = await connection.query(`
      SELECT 
        pUD.UD as account,
        pOS.Nazev as account_name,
        SUM(pUD.Kc) as total_amount,
        COUNT(*) as transaction_count
      FROM pUD 
      LEFT JOIN pOS ON pUD.UD = pOS.Ucet
      WHERE pUD.UD LIKE '6%'
      GROUP BY pUD.UD, pOS.Nazev
      ORDER BY pUD.UD
    `);
    
    console.log('Výnosy s názvami:');
    revenueWithNames.forEach(item => {
      console.log(`${item.account}: ${item.account_name || 'Názov nenájdený'} - ${item.total_amount}`);
    });
    
  } catch (error) {
    console.error('❌ Chyba:', error);
  }
}

testAccountNames();
