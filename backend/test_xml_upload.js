const fs = require('fs');
const FormData = require('form-data');

// Test XML upload
async function testXmlUpload() {
  const axios = require('axios');
  
  console.log('🧪 Testujem XML upload...');
  
  try {
    // Načítanie demo XML súboru
    const xmlContent = fs.readFileSync('demo_pohoda_invoices.xml', 'utf8');
    
    // Vytvorenie FormData
    const formData = new FormData();
    formData.append('xmlFile', Buffer.from(xmlContent), {
      filename: 'demo_pohoda_invoices.xml',
      contentType: 'application/xml'
    });
    
    console.log('📄 XML obsah:', xmlContent.substring(0, 200) + '...');
    
    // Test uploadu
    const response = await axios.post('http://localhost:5000/api/accounting/upload-pohoda-xml/3', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer test-token' // Budeme potrebovať skutočný token
      },
      timeout: 10000
    });
    
    console.log('✅ Upload úspešný:', response.data);
    
  } catch (error) {
    console.error('❌ Upload chyba:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Response:', error.response.data);
    }
  }
}

// Test pripojenia k backend
async function testBackendConnection() {
  const axios = require('axios');
  
  console.log('🔍 Testujem pripojenie k backend...');
  
  try {
    const response = await axios.get('http://localhost:5000/api/accounting/stats/3', {
      headers: {
        'Authorization': 'Bearer test-token'
      },
      timeout: 5000
    });
    
    console.log('✅ Backend pripojenie OK:', response.status);
    
  } catch (error) {
    console.error('❌ Backend pripojenie chyba:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
    }
  }
}

// Spusti testy
async function runTests() {
  console.log('🚀 Spúšťam testy XML upload...\n');
  
  await testBackendConnection();
  console.log('');
  await testXmlUpload();
}

runTests().catch(console.error);
