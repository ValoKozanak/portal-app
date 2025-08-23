const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Cesta k databáze
const dbPath = path.join(__dirname, 'backend', 'portal.db');

// Pripojenie k databáze
const db = new sqlite3.Database(dbPath);

console.log('🔍 Pridávam zamestnanca zam2@zam.sk...');

// Údaje zamestnanca
const employeeData = {
  company_id: 1, // ID prvej firmy
  employee_id: 'EMP002',
  first_name: 'Zamest2',
  last_name: 'Zamestnanec',
  email: 'zam2@zam.sk',
  phone: '+421903341460',
  position: 'Zamestnanec',
  department: 'IT',
  hire_date: '2024-01-15',
  salary: 2500,
  employment_type: 'full_time',
  status: 'active',
  manager_id: null
};

// SQL príkaz na vloženie zamestnanca
const sql = `
  INSERT INTO employees (
    company_id, employee_id, first_name, last_name, email, phone, 
    position, department, hire_date, salary, employment_type, status, manager_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

// Vykonanie príkazu
db.run(sql, [
  employeeData.company_id,
  employeeData.employee_id,
  employeeData.first_name,
  employeeData.last_name,
  employeeData.email,
  employeeData.phone,
  employeeData.position,
  employeeData.department,
  employeeData.hire_date,
  employeeData.salary,
  employeeData.employment_type,
  employeeData.status,
  employeeData.manager_id
], function(err) {
  if (err) {
    console.error('❌ Chyba pri pridávaní zamestnanca:', err.message);
  } else {
    console.log('✅ Zamestnanec úspešne pridaný s ID:', this.lastID);
  }
  
  // Zatvorenie databázy
  db.close();
});
