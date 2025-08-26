const ADODB = require('node-adodb');
const path = require('path');

console.log('🔍 Testujem napojenie na MDB tabuľku pUD...');

const mdbPath = path.join(__dirname, 'zalohy', '2025', '77777777_2025', '77777777_2025.mdb');
console.log('📁 MDB cesta:', mdbPath);

const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);

async function testPudConnection() {
  try {
    console.log('🔍 Pripájam sa k MDB...');
    
    // Test 1: Načítanie prvých 5 záznamov z pUD
    console.log('\n1️⃣ Test 1: Načítanie prvých 5 záznamov z pUD...');
    
    const results = await connection.query('SELECT TOP 5 * FROM pUD');
    
    console.log('✅ Načítané', results.length, 'záznamov z pUD');
    
    if (results.length > 0) {
      console.log('\n📋 Prvý záznam:');
      console.log('   ID:', results[0].ID);
      console.log('   Datum:', results[0].Datum);
      console.log('   Kc:', results[0].Kc);
      console.log('   UMD:', results[0].UMD);
      console.log('   UD:', results[0].UD);
      console.log('   Popis:', results[0].Popis);
    }
    
    // Test 2: Počet záznamov v pUD
    console.log('\n2️⃣ Test 2: Počet záznamov v pUD...');
    
    const countResult = await connection.query('SELECT COUNT(*) as total FROM pUD');
    console.log('✅ Celkový počet záznamov v pUD:', countResult[0].total);
    
    // Test 3: Suma Kc pre účty začínajúce na 5 (náklady)
    console.log('\n3️⃣ Test 3: Suma Kc pre účty začínajúce na 5 (náklady)...');
    
    const expensesResult = await connection.query("SELECT SUM(Kc) as total_expenses, COUNT(*) as count FROM pUD WHERE UMD LIKE '5%'");
    console.log('✅ Náklady (účty 5):', expensesResult[0].total_expenses || 0, 'Kč, počet:', expensesResult[0].count || 0);
    
    // Test 4: Suma Kc pre účty začínajúce na 6 (výnosy)
    console.log('\n4️⃣ Test 4: Suma Kc pre účty začínajúce na 6 (výnosy)...');
    
    const revenueResult = await connection.query("SELECT SUM(Kc) as total_revenue, COUNT(*) as count FROM pUD WHERE UD LIKE '6%'");
    console.log('✅ Výnosy (účty 6):', revenueResult[0].total_revenue || 0, 'Kč, počet:', revenueResult[0].count || 0);
    
    // Test 5: Výpočet zisku/straty
    const expenses = expensesResult[0].total_expenses || 0;
    const revenue = revenueResult[0].total_revenue || 0;
    const profit = revenue - expenses;
    
    console.log('\n5️⃣ Test 5: Výpočet zisku/straty...');
    console.log('✅ Zisk/Strata:', profit, 'Kč');
    console.log('✅ Pomer náklady/výnosy:', revenue > 0 ? ((expenses / revenue) * 100).toFixed(2) : 0, '%');
    
    console.log('\n✅ Všetky testy úspešne dokončené!');
    
  } catch (error) {
    console.error('❌ Chyba:', error.message);
  }
}

testPudConnection().then(() => {
  console.log('\n✅ Test dokončený');
  process.exit(0);
}).catch(error => {
  console.error('❌ Chyba:', error);
  process.exit(1);
});
