const axios = require('axios');
const xml2js = require('xml2js');

// Test pre demo verziu POHODA
async function testPohodaDemo() {
  const baseUrl = 'http://LAPTOP-1GG904CI:8080';
  const username = 'admin';
  const password = 'admin';
  const ico = '36255789';
  const year = '2024';
  
  console.log('🔍 Testujem POHODA demo verziu...');
  console.log('URL:', baseUrl);
  console.log('Username:', username);
  console.log('ICO:', ico);
  console.log('Year:', year);
  console.log('⚠️  Demo verzia môže mať obmedzenia!');
  
  // Test 1: Základné informácie o mServer
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
    
    // Parsovanie XML odpovede
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(statusResponse.data);
    
    console.log('📊 Parsed status:', JSON.stringify(result, null, 2));
    
    // Skontroluj, či je mServer v demo móde
    if (result.mServer && result.mServer.status) {
      console.log(`📋 mServer status: ${result.mServer.status}`);
      console.log(`📋 mServer name: ${result.mServer.name}`);
      console.log(`📋 Processing: ${result.mServer.processing}`);
    }
    
  } catch (error) {
    console.log('❌ Status endpoint chyba:', error.message);
  }
  
  // Test 2: Jednoduchý XML request bez agendy
  try {
    console.log('\n📡 Test 2: Jednoduchý XML request');
    
    const simpleXml = `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack version="2.0" ico="${ico}_${year}" application="Portal App" note="Demo test">
  <test:simpleRequest version="2.0">
    <test:message>Hello POHODA</test:message>
  </test:simpleRequest>
</dat:dataPack>`;
    
    const response = await axios.post(`${baseUrl}/test`, simpleXml, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      }
    });
    
    console.log('✅ Simple test - Status:', response.status);
    console.log('📄 Response:', response.data);
    
  } catch (error) {
    console.log('❌ Simple test chyba:', error.message);
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📄 Response data:', error.response.data);
    }
  }
  
  // Test 3: Kontrola dostupných endpointov v demo verzii
  console.log('\n📡 Test 3: Kontrola demo endpointov');
  
  const demoEndpoints = [
    '/',
    '/status',
    '/info',
    '/version',
    '/demo',
    '/test',
    '/help',
    '/docs',
    '/api',
    '/data'
  ];
  
  for (const endpoint of demoEndpoints) {
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
  
  // Test 4: Kontrola POHODA logov
  console.log('\n📡 Test 4: Kontrola POHODA logov');
  console.log('Skontroluj POHODA logy na: C:\\ProgramData\\STORMWARE\\POHODA SK\\Log\\HTTP\\client-portal.log');
  console.log('Demo verzia môže logovať chyby o nepodporovaných funkciách.');
  
  // Test 5: Informácie o demo obmedzeniach
  console.log('\n📋 Demo verzia obmedzenia:');
  console.log('- mServer môže byť vypnutý alebo obmedzený');
  console.log('- Agendy (faktúry) môžu byť nedostupné');
  console.log('- Endpointy môžu byť obmedzené');
  console.log('- Potrebuješ plnú licenciu pre mServer funkcionalitu');
  
  console.log('\n💡 Odporúčania:');
  console.log('1. Skontroluj POHODA nastavenia mServer');
  console.log('2. Skús s plnou verziou POHODA');
  console.log('3. Kontaktuj POHODA podporu pre demo obmedzenia');
  console.log('4. Skús alternatívny prístup k faktúram (napr. export/import súborov)');
}

// Spusti test
testPohodaDemo().catch(console.error);
