const axios = require('axios');

async function testCreateUser() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/create-user', {
      email: 'test.zamestnanec@demo.sk',
      password: 'password123',
      name: 'Test Zamestnanec',
      role: 'employee',
      status: 'active'
    });

    console.log('✅ Používateľ vytvorený úspešne:');
    console.log(response.data);
  } catch (error) {
    console.error('❌ Chyba pri vytváraní používateľa:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCreateUser();
