const path = require('path');
const fs = require('fs');
const ADODB = require('node-adodb');
const sqlite3 = require('sqlite3').verbose();

async function testEndpointSimulation() {
  try {
    console.log('🧪 Simulujem backend endpoint pre company ID 3...');
    
    // 1. Získanie informácií o firme z portal.db
    const dbPath = path.join(__dirname, 'portal.db');
    const db = new sqlite3.Database(dbPath);
    
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [3], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!company) {
      console.log('❌ Company s ID 3 nebol nájdený');
      return;
    }
    
    console.log('✅ Company s ID 3:', company);
    console.log('ICO:', company.ico);
    
    // 2. Kontrola MDB súboru
    const mdbPath = path.join(__dirname, 'zalohy', '2025', `${company.ico}_2025`, `${company.ico}_2025.mdb`);
    
    if (!fs.existsSync(mdbPath)) {
      console.log('❌ MDB súbor neexistuje:', mdbPath);
      return;
    }
    
    console.log('✅ MDB súbor existuje:', mdbPath);
    
    // 3. Simulácia backend endpoint
    const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
    
    // Analýza nákladov (účty začínajúce 5)
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
    
    // Analýza výnosov (účty začínajúce 6)
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
    
    // Celkové súčty
    const totalExpensesQuery = `SELECT SUM(Kc) as total_expenses FROM pUD WHERE UMD LIKE '5%'`;
    const totalRevenueQuery = `SELECT SUM(Kc) as total_revenue FROM pUD WHERE UD LIKE '6%'`;
    
    // Vykonanie queries
    const expenses = await connection.query(expensesQuery);
    const revenue = await connection.query(revenueQuery);
    const totalExpenses = await connection.query(totalExpensesQuery);
    const totalRevenue = await connection.query(totalRevenueQuery);
    
    // Výpočet zisku/straty
    const totalExpensesAmount = totalExpenses[0]?.total_expenses || 0;
    const totalRevenueAmount = totalRevenue[0]?.total_revenue || 0;
    const profit = totalRevenueAmount - totalExpensesAmount;
    
    const analysis = {
      expenses: {
        total: totalExpensesAmount,
        count: expenses.length,
        details: expenses.map(item => ({
          account: item.account,
          account_name: item.account_name || `${item.account} (názov nenájdený)`,
          amount: item.total_amount || 0,
          count: item.transaction_count || 0
        }))
      },
      revenue: {
        total: totalRevenueAmount,
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
    
    console.log('\n✅ Simulovaný response:');
    console.log('Náklady details:', analysis.expenses.details.length, 'položiek');
    analysis.expenses.details.forEach(item => {
      console.log(`  ${item.account}: ${item.account_name} - ${item.amount}`);
    });
    
    console.log('Výnosy details:', analysis.revenue.details.length, 'položiek');
    analysis.revenue.details.forEach(item => {
      console.log(`  ${item.account}: ${item.account_name} - ${item.amount}`);
    });
    
    db.close();
    
  } catch (error) {
    console.error('❌ Chyba:', error);
  }
}

testEndpointSimulation();
