const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

console.log('🧪 Testovanie správy úloh v databáze...\n');

// Vytvorenie testovacej úlohy
const testTask = {
  title: 'Testovacia úloha',
  description: 'Toto je testovacia úloha pre overenie funkcionality',
  status: 'pending',
  priority: 'medium',
  assigned_to: 'accountant@portal.sk',
  company_id: 1,
  company_name: 'Test Company',
  created_by: 'admin@portal.sk',
  due_date: '2024-12-31'
};

db.run(`
  INSERT INTO tasks (
    title, description, status, priority, assigned_to,
    company_id, company_name, created_by, due_date
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`, [
  testTask.title, testTask.description, testTask.status, testTask.priority,
  testTask.assigned_to, testTask.company_id, testTask.company_name,
  testTask.created_by, testTask.due_date
], function(err) {
  if (err) {
    console.error('❌ Chyba pri vytváraní úlohy:', err);
    return;
  }
  
  console.log('✅ Testovacia úloha vytvorená úspešne!');
  console.log('📋 ID úlohy:', this.lastID);
  
  // Zobrazenie všetkých úloh
  db.all("SELECT * FROM tasks ORDER BY created_at DESC", (err, tasks) => {
    if (err) {
      console.error('❌ Chyba pri čítaní úloh:', err);
      return;
    }
    
    console.log('\n📋 Všetky úlohy v databáze:');
    if (tasks.length === 0) {
      console.log('  - Žiadne úlohy');
    } else {
      tasks.forEach((task, index) => {
        console.log(`  ${index + 1}. ${task.title}`);
        console.log(`     Status: ${task.status} | Priorita: ${task.priority}`);
        console.log(`     Priradená: ${task.assigned_to}`);
        console.log(`     Firma: ${task.company_name}`);
        console.log(`     Termín: ${task.due_date}`);
        console.log('');
      });
    }
    
    db.close();
  });
});
