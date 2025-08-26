const axios = require('axios');

async function simpleTest() {
  try {
    console.log('🧪 Jednoduchý test backend servera...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health check úspešný:', healthResponse.data);
    
    // Test login
    console.log('🔐 Testujem prihlásenie...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'info@artprofit.sk',
      password: 'password123'
    });
    
    console.log('✅ Prihlásenie úspešné');
    console.log('Token:', loginResponse.data.token.substring(0, 20) + '...');
    
  } catch (error) {
    console.error('❌ Chyba:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

simpleTest();

