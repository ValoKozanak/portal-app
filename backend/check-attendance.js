const { db } = require('./database');

console.log('Kontrola dochádzky pre zamestnancov...');

// Kontrola zamestnancov
db.all(`
  SELECT 
    e.id,
    e.first_name,
    e.last_name,
    e.email,
    e.company_id,
    er.attendance_mode,
    er.is_active
  FROM employees e
  LEFT JOIN employment_relations er ON e.id = er.employee_id AND er.is_active = 1
  WHERE e.email IN ('zuzka@striebro.sk', 'dezko@zlato.sk')
  ORDER BY e.email
`, [], (err, rows) => {
  if (err) {
    console.error('Chyba:', err);
  } else {
    console.log('Zamestnanci:');
    rows.forEach(row => {
      console.log(`${row.email}: attendance_mode = ${row.attendance_mode || 'NULL'}`);
    });
  }
  
  // Kontrola employment relations
  db.all(`
    SELECT 
      er.id,
      er.employee_id,
      er.company_id,
      er.attendance_mode,
      er.is_active,
      e.email
    FROM employment_relations er
    JOIN employees e ON er.employee_id = e.id
    WHERE e.email IN ('zuzka@striebro.sk', 'dezko@zlato.sk')
    ORDER BY e.email
  `, [], (err, rows) => {
    if (err) {
      console.error('Chyba pri employment relations:', err);
    } else {
      console.log('\nEmployment relations:');
      rows.forEach(row => {
        console.log(`${row.email}: attendance_mode = ${row.attendance_mode || 'NULL'}`);
      });
    }
    process.exit();
  });
});

