const axios = require('axios');

// Test alternatívnych prístupov k POHODA
async function testPohodaAlternative() {
  const baseUrl = 'http://LAPTOP-1GG904CI:8080';
  const username = 'admin';
  const password = 'admin';
  
  console.log('🔍 Testujem alternatívne prístupy k POHODA...');
  
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
  
  // Test 2: Rôzne XML formáty pre faktúry
  const xmlFormats = [
    // Formát 1: Jednoduchý list request
    `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack version="2.0" ico="36255789_2024" application="Portal App">
  <lst:listInvoiceRequest version="2.0">
    <lst:requestInvoice>
      <lst:filter>
        <lst:dateFrom>2024-01-01</lst:dateFrom>
        <lst:dateTo>2024-12-31</lst:dateTo>
        <lst:invoiceType>issued</lst:invoiceType>
      </lst:filter>
    </lst:requestInvoice>
  </lst:listInvoiceRequest>
</dat:dataPack>`,
    
    // Formát 2: Bez filtrov
    `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack version="2.0" ico="36255789_2024" application="Portal App">
  <lst:listInvoiceRequest version="2.0">
    <lst:requestInvoice>
    </lst:requestInvoice>
  </lst:listInvoiceRequest>
</dat:dataPack>`,
    
    // Formát 3: Iný názov elementu
    `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack version="2.0" ico="36255789_2024" application="Portal App">
  <inv:listInvoiceRequest version="2.0">
    <inv:requestInvoice>
      <inv:filter>
        <inv:dateFrom>2024-01-01</inv:dateFrom>
        <inv:dateTo>2024-12-31</inv:dateTo>
        <inv:invoiceType>issued</inv:invoiceType>
      </inv:filter>
    </inv:requestInvoice>
  </inv:listInvoiceRequest>
</dat:dataPack>`
  ];
  
  const endpoints = ['/invoice', '/invoices', '/data', '/api', '/rest'];
  
  for (let i = 0; i < xmlFormats.length; i++) {
    const xmlData = xmlFormats[i];
    console.log(`\n📡 Test XML formát ${i + 1}:`);
    console.log('XML:', xmlData.substring(0, 200) + '...');
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n📡 POST na ${endpoint} s formátom ${i + 1}`);
        
        const response = await axios.post(`${baseUrl}${endpoint}`, xmlData, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/xml',
            'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
          }
        });
        
        console.log(`✅ POST ${endpoint} - Status: ${response.status}`);
        console.log(`📄 Response: ${response.data.substring(0, 200)}...`);
        
      } catch (error) {
        if (error.response) {
          console.log(`❌ POST ${endpoint} - Status: ${error.response.status}`);
          if (error.response.status !== 404) {
            console.log(`📄 Response: ${error.response.data}`);
          }
        } else {
          console.log(`❌ POST ${endpoint} - Chyba: ${error.message}`);
        }
      }
    }
  }
  
  // Test 3: GET request s query parametrami
  console.log('\n📡 Test GET requestov s query parametrami...');
  
  const getEndpoints = [
    '/invoice?action=list',
    '/invoices?action=list',
    '/data?type=invoice',
    '/api/invoice',
    '/rest/invoice'
  ];
  
  for (const endpoint of getEndpoints) {
    try {
      console.log(`\n📡 GET ${endpoint}`);
      
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        timeout: 5000,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
        }
      });
      
      console.log(`✅ GET ${endpoint} - Status: ${response.status}`);
      console.log(`📄 Response: ${response.data.substring(0, 200)}...`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ GET ${endpoint} - Status: ${error.response.status}`);
        if (error.response.status !== 404) {
          console.log(`📄 Response: ${error.response.data}`);
        }
      } else {
        console.log(`❌ GET ${endpoint} - Chyba: ${error.message}`);
      }
    }
  }
}

// Spusti test
testPohodaAlternative().catch(console.error);
