async function testCreateCompany() {
  try {
    const response = await fetch('http://localhost:5000/api/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Firma 2',
        ico: '87654321',
        address: 'Test Adresa 2',
        business_registry: '54321/B',
        authorized_person: 'Test Osoba 2',
        owner_email: 'user@portal.sk'
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testCreateCompany();
