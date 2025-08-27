const path = require('path');
const fs = require('fs');
const ADODB = require('node-adodb');

async function testFinancialAnalysis() {
  try {
    console.log('🧪 Testujem financial analysis endpoint...');
    
    const mdbPath = path.join(__dirname, 'zalohy', '2025', '77777777_2025', '77777777_2025.mdb');
    
    if (!fs.existsSync(mdbPath)) {
      console.log('❌ MDB súbor nebol nájdený:', mdbPath);
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
    
    // Test 3: Simulácia response objektu
    console.log('\n🔍 Test 3: Simulácia response objektu:');
    const totalExpenses = expenses.reduce((sum, item) => sum + (item.total_amount || 0), 0);
    const totalRevenue = revenue.reduce((sum, item) => sum + (item.total_amount || 0), 0);
    const profit = totalRevenue - totalExpenses;
    
    const analysis = {
      expenses: {
        total: totalExpenses,
        count: expenses.length,
        details: expenses.map(item => ({
          account: item.account,
          account_name: item.account_name || `${item.account} (názov nenájdený)`,
          amount: item.total_amount || 0,
          count: item.transaction_count || 0
        }))
      },
      revenue: {
        total: totalRevenue,
        count: revenue.length,
        details: revenue.map(item => ({
          account: item.account,
          account_name: item.account_name || `${item.account} (názov nenájdený)`,
          amount: item.total_amount || 0,
          count: item.transaction_count || 0
        }))
      },
      profit: profit,
      isProfit: profit >= 0
    };
    
    console.log('✅ Response objekt:');
    console.log('Náklady details:', analysis.expenses.details.length, 'položiek');
    analysis.expenses.details.forEach(item => {
      console.log(`  ${item.account}: ${item.account_name} - ${item.amount}`);
    });
    
    console.log('Výnosy details:', analysis.revenue.details.length, 'položiek');
    analysis.revenue.details.forEach(item => {
      console.log(`  ${item.account}: ${item.account_name} - ${item.amount}`);
    });
    
  } catch (error) {
    console.error('❌ Chyba:', error);
  }
}

testFinancialAnalysis();
