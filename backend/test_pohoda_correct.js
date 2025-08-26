const axios = require('axios');
const xml2js = require('xml2js');

// Test podľa oficiálnej POHODA mServer dokumentácie
async function testPohodaCorrect() {
  const baseUrl = 'http://LAPTOP-1GG904CI:8080';
  const username = 'admin';
  const password = 'admin';
  const ico = '36255789';
  const year = '2024';
  
  console.log('🔍 Testujem POHODA podľa oficiálnej dokumentácie...');
  console.log('URL:', baseUrl);
  console.log('Username:', username);
  console.log('ICO:', ico);
  console.log('Year:', year);
  
  // Test 1: Získanie informácií o mServer
  try {
    console.log('\n📡 Test 1: Informácie o mServer');
    const statusResponse = await axios.get(`${baseUrl}/status`, {
      timeout: 5000,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      }
    });
    
    console.log('✅ Status endpoint funguje');
    console.log('📄 Response:', statusResponse.data);
    
  } catch (error) {
    console.log('❌ Status endpoint chyba:', error.message);
  }
  
  // Test 2: Správny POHODA mServer endpoint pre faktúry
  // Podľa POHODA dokumentácie: /data
  try {
    console.log('\n📡 Test 2: Správny endpoint /data pre faktúry');
    
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
    
    console.log('📤 Posielam XML na /data endpoint:', xmlData);
    
    const response = await axios.post(`${baseUrl}/data`, xmlData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      }
    });
    
    console.log('✅ /data endpoint - Status:', response.status);
    console.log('📄 Response:', response.data);
    
    // Parsovanie XML odpovede
    console.log('\n🔍 Parsovanie XML odpovede...');
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);
    
    console.log('📊 Parsed result:', JSON.stringify(result, null, 2));
    
    if (result['dat:dataPack'] && result['dat:dataPack']['lst:listInvoice']) {
      const invoices = result['dat:dataPack']['lst:listInvoice']['lst:invoice'];
      console.log('📋 Faktúry:', invoices);
    } else {
      console.log('⚠️ Žiadne faktúry nenájdené v odpovedi');
    }
    
  } catch (error) {
    console.log('❌ /data endpoint chyba:', error.message);
    
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📄 Response data:', error.response.data);
    }
  }
  
  // Test 3: Alternatívny endpoint /api
  try {
    console.log('\n📡 Test 3: Alternatívny endpoint /api');
    
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
    
    const response = await axios.post(`${baseUrl}/api`, xmlData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      }
    });
    
    console.log('✅ /api endpoint - Status:', response.status);
    console.log('📄 Response:', response.data);
    
  } catch (error) {
    console.log('❌ /api endpoint chyba:', error.message);
    
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📄 Response data:', error.response.data);
    }
  }
  
  // Test 4: GET request na /data s query parametrami
  try {
    console.log('\n📡 Test 4: GET request na /data s query parametrami');
    
    const response = await axios.get(`${baseUrl}/data?type=invoice&action=list&ico=${ico}_${year}`, {
      timeout: 5000,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      }
    });
    
    console.log('✅ GET /data - Status:', response.status);
    console.log('📄 Response:', response.data);
    
  } catch (error) {
    console.log('❌ GET /data chyba:', error.message);
    
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📄 Response data:', error.response.data);
    }
  }
  
  // Test 5: Kontrola dostupných endpointov
  console.log('\n📡 Test 5: Kontrola dostupných endpointov');
  
  const testEndpoints = [
    '/data',
    '/api',
    '/rest',
    '/v1',
    '/v2',
    '/mserver',
    '/pohoda'
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`\n📡 Testujem ${endpoint}`);
      
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        timeout: 3000,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
        }
      });
      
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
      console.log(`📄 Response: ${response.data.substring(0, 200)}...`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint} - Status: ${error.response.status}`);
        if (error.response.status !== 404) {
          console.log(`📄 Response: ${error.response.data}`);
        }
      } else {
        console.log(`❌ ${endpoint} - Chyba: ${error.message}`);
      }
    }
  }
}

// Spusti test
testPohodaCorrect().catch(console.error);
