const axios = require('axios');
const xml2js = require('xml2js');

// Test alternatívnych prístupov k POHODA faktúram
async function testPohodaAlternativeApproach() {
  const baseUrl = 'http://LAPTOP-1GG904CI:8080';
  const username = 'admin';
  const password = 'admin';
  const ico = '36255789';
  const year = '2024';
  
  console.log('🔍 Testujem alternatívne prístupy k POHODA faktúram...');
  console.log('URL:', baseUrl);
  console.log('Username:', username);
  console.log('ICO:', ico);
  console.log('Year:', year);
  
  // Test 1: SOAP protokol (možno POHODA používa SOAP)
  try {
    console.log('\n📡 Test 1: SOAP protokol');
    
    const soapXml = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header/>
  <soap:Body>
    <dat:dataPack version="2.0" ico="${ico}_${year}" application="Portal App">
      <lst:listInvoiceRequest version="2.0">
        <lst:requestInvoice>
          <lst:filter>
            <lst:dateFrom>2024-01-01</lst:dateFrom>
            <lst:dateTo>2024-12-31</lst:dateTo>
            <lst:invoiceType>issued</lst:invoiceType>
          </lst:filter>
        </lst:requestInvoice>
      </lst:listInvoiceRequest>
    </dat:dataPack>
  </soap:Body>
</soap:Envelope>`;
    
    const response = await axios.post(`${baseUrl}/soap`, soapXml, {
      timeout: 10000,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'listInvoice',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      }
    });
    
    console.log('✅ SOAP endpoint - Status:', response.status);
    console.log('📄 Response:', response.data);
    
  } catch (error) {
    console.log('❌ SOAP endpoint chyba:', error.message);
    if (error.response) {
      console.log('📊 Status:', error.response.status);
    }
  }
  
  // Test 2: JSON formát (možno POHODA podporuje JSON)
  try {
    console.log('\n📡 Test 2: JSON formát');
    
    const jsonData = {
      ico: `${ico}_${year}`,
      application: "Portal App",
      action: "listInvoice",
      filter: {
        dateFrom: "2024-01-01",
        dateTo: "2024-12-31",
        invoiceType: "issued"
      }
    };
    
    const response = await axios.post(`${baseUrl}/json`, jsonData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      }
    });
    
    console.log('✅ JSON endpoint - Status:', response.status);
    console.log('📄 Response:', response.data);
    
  } catch (error) {
    console.log('❌ JSON endpoint chyba:', error.message);
    if (error.response) {
      console.log('📊 Status:', error.response.status);
    }
  }
  
  // Test 3: Rôzne Content-Type hlavičky
  try {
    console.log('\n📡 Test 3: Rôzne Content-Type hlavičky');
    
    const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack version="2.0" ico="${ico}_${year}" application="Portal App">
  <lst:listInvoiceRequest version="2.0">
    <lst:requestInvoice>
      <lst:filter>
        <lst:dateFrom>2024-01-01</lst:dateFrom>
        <lst:dateTo>2024-12-31</lst:dateTo>
        <lst:invoiceType>issued</lst:invoiceType>
      </lst:filter>
    </lst:requestInvoice>
  </lst:listInvoiceRequest>
</dat:dataPack>`;
    
    const contentTypes = [
      'application/xml',
      'text/xml',
      'text/xml; charset=utf-8',
      'application/xml; charset=utf-8',
      'text/plain'
    ];
    
    for (const contentType of contentTypes) {
      try {
        console.log(`\n📡 Testujem Content-Type: ${contentType}`);
        
        const response = await axios.post(`${baseUrl}/data`, xmlData, {
          timeout: 5000,
          headers: {
            'Content-Type': contentType,
            'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
          }
        });
        
        console.log(`✅ ${contentType} - Status: ${response.status}`);
        console.log(`📄 Response: ${response.data.substring(0, 200)}...`);
        
      } catch (error) {
        if (error.response) {
          console.log(`❌ ${contentType} - Status: ${error.response.status}`);
        } else {
          console.log(`❌ ${contentType} - Chyba: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Content-Type test chyba:', error.message);
  }
  
  // Test 4: Rôzne HTTP metódy
  try {
    console.log('\n📡 Test 4: Rôzne HTTP metódy');
    
    const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack version="2.0" ico="${ico}_${year}" application="Portal App">
  <lst:listInvoiceRequest version="2.0">
    <lst:requestInvoice>
      <lst:filter>
        <lst:dateFrom>2024-01-01</lst:dateFrom>
        <lst:dateTo>2024-12-31</lst:dateTo>
        <lst:invoiceType>issued</lst:invoiceType>
      </lst:filter>
    </lst:requestInvoice>
  </lst:listInvoiceRequest>
</dat:dataPack>`;
    
    const methods = ['GET', 'POST', 'PUT', 'PATCH'];
    
    for (const method of methods) {
      try {
        console.log(`\n📡 Testujem HTTP metódu: ${method}`);
        
        let response;
        if (method === 'GET') {
          response = await axios.get(`${baseUrl}/data?xml=${encodeURIComponent(xmlData)}`, {
            timeout: 5000,
            headers: {
              'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
            }
          });
        } else {
          response = await axios({
            method: method.toLowerCase(),
            url: `${baseUrl}/data`,
            data: xmlData,
            timeout: 5000,
            headers: {
              'Content-Type': 'application/xml',
              'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
            }
          });
        }
        
        console.log(`✅ ${method} - Status: ${response.status}`);
        console.log(`📄 Response: ${response.data.substring(0, 200)}...`);
        
      } catch (error) {
        if (error.response) {
          console.log(`❌ ${method} - Status: ${error.response.status}`);
        } else {
          console.log(`❌ ${method} - Chyba: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ HTTP metódy test chyba:', error.message);
  }
  
  // Test 5: Rôzne endpointy s rôznymi cestami
  try {
    console.log('\n📡 Test 5: Rôzne endpointy s rôznymi cestami');
    
    const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack version="2.0" ico="${ico}_${year}" application="Portal App">
  <lst:listInvoiceRequest version="2.0">
    <lst:requestInvoice>
      <lst:filter>
        <lst:dateFrom>2024-01-01</lst:dateFrom>
        <lst:dateTo>2024-12-31</lst:dateTo>
        <lst:invoiceType>issued</lst:invoiceType>
      </lst:filter>
    </lst:requestInvoice>
  </lst:listInvoiceRequest>
</dat:dataPack>`;
    
    const endpoints = [
      '/invoice/list',
      '/invoices/list',
      '/data/invoice',
      '/api/invoice/list',
      '/rest/invoice/list',
      '/mserver/invoice',
      '/pohoda/invoice',
      '/v1/invoice',
      '/v2/invoice',
      '/invoice',
      '/invoices',
      '/data',
      '/api',
      '/rest'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n📡 Testujem endpoint: ${endpoint}`);
        
        const response = await axios.post(`${baseUrl}${endpoint}`, xmlData, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/xml',
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
    
  } catch (error) {
    console.log('❌ Endpointy test chyba:', error.message);
  }
  
  // Test 6: Kontrola POHODA logov
  console.log('\n📡 Test 6: Kontrola POHODA logov');
  console.log('Skontroluj POHODA logy na: C:\\ProgramData\\STORMWARE\\POHODA SK\\Log\\HTTP\\client-portal.log');
  console.log('Možno tam nájdeš informácie o tom, prečo endpointy nefungujú.');
}

// Spusti test
testPohodaAlternativeApproach().catch(console.error);
