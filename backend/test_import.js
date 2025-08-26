const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testImport() {
  try {
    console.log('🧪 Testujem import XML súboru...');
    
    // Najprv sa prihlásim
    console.log('🔐 Prihlasujem sa...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@portal.sk',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Prihlásenie úspešné, token:', token.substring(0, 20) + '...');
    
    // Vytvorím FormData s XML súborom
    const formData = new FormData();
    formData.append('file', fs.createReadStream('VydFaktury.xml'));
    
    // Test import endpointu
    console.log('📤 Importujem XML súbor...');
    const importResponse = await axios.post('http://localhost:5000/api/accounting/upload-pohoda-xml/3', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Import úspešný:', importResponse.data);
    
  } catch (error) {
    console.error('❌ Chyba pri importe:');
    console.error('Message:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error:', error);
    }
  }
}

testImport();

