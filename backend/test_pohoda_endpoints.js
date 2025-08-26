const axios = require('axios');

// Test rôznych POHODA endpointov
async function testPohodaEndpoints() {
  const baseUrl = 'http://LAPTOP-1GG904CI:8080';
  const username = 'admin';
  const password = 'admin';
  
  console.log('🔍 Testujem POHODA endpointy...');
  console.log('URL:', baseUrl);
  console.log('Username:', username);
  
  const endpoints = [
    '/',
    '/invoice',
    '/invoices',
    '/factura',
    '/faktury',
    '/listInvoice',
    '/addressbook',
    '/contacts',
    '/kontakty',
    '/version',
    '/status',
    '/health'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testujem endpoint: ${endpoint}`);
      
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        timeout: 5000,
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
  
  // Test POST requestov na rôzne endpointy
  console.log('\n📡 Testujem POST requesty...');
  
  const postEndpoints = [
    '/invoice',
    '/invoices',
    '/factura',
    '/faktury',
    '/listInvoice'
  ];
  
  const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack version="2.0" ico="36255789_2024" application="Portal App" note="Test">
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
  
  for (const endpoint of postEndpoints) {
    try {
      console.log(`\n📡 POST test na: ${endpoint}`);
      
      const response = await axios.post(`${baseUrl}${endpoint}`, testXml, {
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

// Spusti test
testPohodaEndpoints().catch(console.error);
