const https = require('https');

async function testEndpoint() {
  try {
    console.log('🧪 Testujem endpoint s dátumovými parametrami...');
    
    // Test 1: Bez dátumových filtrov
    console.log('\n📊 Test 1: Bez dátumových filtrov');
    const response1 = await fetch('http://localhost:5000/api/accounting/financial-analysis/3');
    const data1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Dáta:', {
      expenses: data1.expenses.total,
      revenue: data1.revenue.total,
      profit: data1.profit,
      filters: data1.filters
    });
    
    // Test 2: S dátumovými filtrami
    console.log('\n📊 Test 2: S dátumovými filtrami (2025-01-01 až 2025-01-31)');
    const response2 = await fetch('http://localhost:5000/api/accounting/financial-analysis/3?dateFrom=2025-01-01&dateTo=2025-01-31');
    const data2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Dáta:', {
      expenses: data2.expenses.total,
      revenue: data2.revenue.total,
      profit: data2.profit,
      filters: data2.filters
    });
    
    // Porovnanie
    console.log('\n📊 Porovnanie:');
    console.log('Bez filtru - Náklady:', data1.expenses.total, 'Výnosy:', data1.revenue.total);
    console.log('S filtrom - Náklady:', data2.expenses.total, 'Výnosy:', data2.revenue.total);
    
    if (data1.expenses.total !== data2.expenses.total) {
      console.log('✅ Náklady sa prepočítali!');
    } else {
      console.log('❌ Náklady sa neprepočítali!');
    }
    
    if (data1.revenue.total !== data2.revenue.total) {
      console.log('✅ Výnosy sa prepočítali!');
    } else {
      console.log('❌ Výnosy sa neprepočítali!');
    }
    
  } catch (error) {
    console.error('❌ Chyba:', error.message);
  }
}

testEndpoint();
