const path = require('path');
const fs = require('fs');
const ADODB = require('node-adodb');

async function testCompany3() {
  try {
    console.log('🧪 Testujem company ID 3...');
    
    // Hľadáme MDB súbor pre company ID 3
    const companiesDir = path.join(__dirname, 'zalohy', '2025');
    const companies = fs.readdirSync(companiesDir);
    
    console.log('Dostupné companies:', companies);
    
    // Hľadáme company s ID 3
    let mdbPath = null;
    for (const company of companies) {
      const companyPath = path.join(companiesDir, company);
      const companyMdbPath = path.join(companyPath, `${company}.mdb`);
      
      if (fs.existsSync(companyMdbPath)) {
        console.log(`Našiel som MDB pre company: ${company}`);
        mdbPath = companyMdbPath;
        break;
      }
    }
    
    if (!mdbPath) {
      console.log('❌ Nenašiel som MDB súbor pre company ID 3');
      return;
    }
    
    console.log('📁 Načítavam dáta z:', mdbPath);
    
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // Test 1: Náklady s názvami účtov
    console.log('\n🔍 Test 1: Náklady s názvami účtov:');
    const expensesQuery = `
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
    `;
    
    const expenses = await connection.query(expensesQuery);
    console.log('Náklady s názvami:');
    expenses.forEach(item => {
      console.log(`${item.account}: ${item.account_name || 'Názov nenájdený'} - ${item.total_amount}`);
    });
    
    // Test 2: Výnosy s názvami účtov
    console.log('\n🔍 Test 2: Výnosy s názvami účtov:');
    const revenueQuery = `
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
    `;
    
    const revenue = await connection.query(revenueQuery);
    console.log('Výnosy s názvami:');
    revenue.forEach(item => {
      console.log(`${item.account}: ${item.account_name || 'Názov nenájdený'} - ${item.total_amount}`);
    });
    
  } catch (error) {
    console.error('❌ Chyba:', error);
  }
}

testCompany3();
