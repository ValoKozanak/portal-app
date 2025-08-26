const jwt = require('jsonwebtoken');

// Test token
function testToken() {
  console.log('🔍 Testujem JWT token...');
  
  // Vytvorenie test tokenu
  const testUser = {
    email: 'info@artprofit.sk',
    role: 'user'
  };
  
  const token = jwt.sign(testUser, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
  
  console.log('✅ Test token vytvorený:', token.substring(0, 50) + '...');
  
  // Dekódovanie tokenu
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token dekódovaný:', decoded);
  } catch (error) {
    console.error('❌ Chyba pri dekódovaní tokenu:', error.message);
  }
  
  return token;
}

// Test XML upload s tokenom
async function testXmlUploadWithToken() {
  const axios = require('axios');
  const fs = require('fs');
  const FormData = require('form-data');
  
  const token = testToken();
  
  console.log('\n🧪 Testujem XML upload s tokenom...');
  
  try {
    // Načítanie demo XML súboru
    const xmlContent = fs.readFileSync('demo_pohoda_invoices.xml', 'utf8');
    
    // Vytvorenie FormData
    const formData = new FormData();
    formData.append('xmlFile', Buffer.from(xmlContent), {
      filename: 'demo_pohoda_invoices.xml',
      contentType: 'application/xml'
    });
    
    // Test uploadu s tokenom
    const response = await axios.post('http://localhost:5000/api/accounting/upload-pohoda-xml/3', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
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

// Spusti test
testXmlUploadWithToken().catch(console.error);
