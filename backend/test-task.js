const fetch = require('node-fetch');

async function testCreateTask() {
  try {
    console.log('🧪 Testovanie vytvorenia úlohy...\n');

    const taskData = {
      title: 'Testovacia úloha',
      description: 'Toto je testovacia úloha pre overenie API',
      status: 'pending',
      priority: 'medium',
      assigned_to: 'accountant@portal.sk',
      company_id: 1,
      company_name: 'Test Company',
      created_by: 'admin@portal.sk',
      due_date: '2024-12-31'
    };

    const response = await fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Úloha vytvorená úspešne!');
      console.log('📋 ID úlohy:', result.taskId);
      console.log('📝 Názov:', taskData.title);
      console.log('👤 Priradená:', taskData.assigned_to);
    } else {
      console.log('❌ Chyba pri vytváraní úlohy:');
      console.log(result);
    }

    // Získanie všetkých úloh
    console.log('\n📋 Získanie všetkých úloh...');
    const tasksResponse = await fetch('http://localhost:5000/api/tasks');
    const tasks = await tasksResponse.json();
    
    console.log('📊 Počet úloh:', tasks.length);
    tasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.title} (${task.status}) - Priradená: ${task.assigned_to}`);
    });

  } catch (error) {
    console.error('❌ Chyba:', error.message);
  }
}

testCreateTask();
