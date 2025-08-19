// Test script pre mailové notifikácie
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:5000/api';

async function testEmailNotifications() {
  console.log('🧪 Testovanie mailových notifikácií...\n');

  const testEmail = 'test@example.com'; // Zmeňte na svoj email
  
  const emailTypes = [
    { type: 'welcome', name: 'Welcome Email' },
    { type: 'task', name: 'Task Notification' },
    { type: 'deadline', name: 'Deadline Reminder' },
    { type: 'document', name: 'Document Notification' }
  ];

  for (const emailType of emailTypes) {
    try {
      console.log(`📧 Testujem: ${emailType.name}`);
      
      const response = await fetch(`${API_BASE}/test/send-test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          type: emailType.type
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ ${emailType.name}: ${data.message}`);
      } else {
        console.log(`❌ ${emailType.name}: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ ${emailType.name}: Chyba - ${error.message}`);
    }
    
    console.log(''); // Prázdny riadok
  }

  console.log('🎯 Ako otestovať mailové notifikácie:');
  console.log('1. Zmeňte testEmail na svoj skutočný email');
  console.log('2. Spustite tento script: node test-email-notifications.js');
  console.log('3. Skontrolujte svoj email (aj spam priečinok)');
  console.log('4. Všetky 4 typy emailov by mali prísť');
  console.log('');
  console.log('📋 Pre testovanie z UI:');
  console.log('1. Otvorte http://localhost:3000');
  console.log('2. Prihláste sa do dashboardu');
  console.log('3. Kliknite na "Test Emailov" tlačidlo');
  console.log('4. Vyberte typ emailu a zadajte svoj email');
  console.log('5. Kliknite "Otestovať Email"');
  console.log('');
  console.log('📁 Pre testovanie pri nahrávaní súborov:');
  console.log('1. Nahrajte súbor cez FileUploadModal');
  console.log('2. Admin a všetci používatelia firmy dostanú notifikáciu');
  console.log('');
  console.log('📋 Pre testovanie pri vytváraní úloh:');
  console.log('1. Vytvorte novú úlohu cez TaskModal');
  console.log('2. Priradený používateľ a admin dostanú notifikáciu');
}

// Spustenie testu
testEmailNotifications().catch(console.error);
