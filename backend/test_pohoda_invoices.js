const axios = require('axios');
const xml2js = require('xml2js');

// Test POHODA faktúr
async function testPohodaInvoices() {
  const baseUrl = 'http://LAPTOP-1GG904CI:8080';
  const username = 'admin';
  const password = 'admin';
  const ico = '36255789';
  const year = '2024';
  
  console.log('🔍 Testujem POHODA faktúry...');
  console.log('URL:', baseUrl);
  console.log('Username:', username);
  console.log('ICO:', ico);
  console.log('Year:', year);
  
  try {
    // Test 1: Základné GET request
    console.log('\n📡 Test 1: Základné GET request');
    const response = await axios.get(baseUrl, {
      timeout: 5000,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      }
    });
    
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', response.data);
    
  } catch (error) {
    console.log('❌ Chyba:', error.message);
    
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📄 Response data:', error.response.data);
    }
  }
  
  try {
    // Test 2: XML request pre faktúry
    console.log('\n📡 Test 2: XML request pre faktúry');
    
    const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack version="2.0" ico="${ico}_${year}" application="Portal App" note="Test invoice request">
  <lst:listInvoiceRequest version="2.0">
    <lst:requestInvoice>
      <lst:filter>
        <lst:dateFrom>2024-01-01</lst:dateFrom>
        <lst:dateTo>2024-12-31</lst:dateTo>
        <lst:invoiceType>issued</lst:invoiceType>
        <lst:storno>false</lst:storno>
      </lst:filter>
    </lst:requestInvoice>
  </lst:listInvoiceRequest>
</dat:dataPack>`;
    
    console.log('📤 Posielam XML:', xmlData);
    
    const invoiceResponse = await axios.post(`${baseUrl}/invoice`, xmlData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      }
    });
    
    console.log('✅ Invoice request status:', invoiceResponse.status);
    console.log('📄 Invoice response:', invoiceResponse.data);
    
    // Parsovanie XML odpovede
    console.log('\n🔍 Parsovanie XML odpovede...');
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(invoiceResponse.data);
    
    console.log('📊 Parsed result:', JSON.stringify(result, null, 2));
    
    if (result['dat:dataPack'] && result['dat:dataPack']['lst:listInvoice']) {
      const invoices = result['dat:dataPack']['lst:listInvoice']['lst:invoice'];
      console.log('📋 Faktúry:', invoices);
    } else {
      console.log('⚠️ Žiadne faktúry nenájdené v odpovedi');
    }
    
  } catch (error) {
    console.log('❌ Invoice request chyba:', error.message);
    
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📄 Response data:', error.response.data);
    }
  }
}

// Spusti test
testPohodaInvoices().catch(console.error);
