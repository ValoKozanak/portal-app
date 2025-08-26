const { db } = require('./database');

// Test dochádzky pre oboch zamestnancov
db.all(`
  SELECT 
    e.id,
    e.first_name,
    e.last_name,
    e.email,
    e.company_id,
    er.id as er_id,
    er.attendance_mode,
    er.is_active,
    er.employment_start_date,
    er.employment_end_date
  FROM employees e
  LEFT JOIN employment_relations er ON e.id = er.employee_id AND er.is_active = 1
  WHERE e.email IN ('zuzka@striebro.sk', 'dezko@zlato.sk')
  ORDER BY e.email
`, [], (err, rows) => {
  if (err) {
    console.error('Chyba:', err);
  } else {
    console.log('Zamestnanci:');
    console.log(JSON.stringify(rows, null, 2));
  }
  
  // Test všetkých employment relations
  db.all(`
    SELECT 
      er.id,
      er.employee_id,
      er.company_id,
      er.attendance_mode,
      er.is_active,
      e.first_name,
      e.last_name,
      e.email
    FROM employment_relations er
    JOIN employees e ON er.employee_id = e.id
    WHERE e.email IN ('zuzka@striebro.sk', 'dezko@zlato.sk')
    ORDER BY e.email
  `, [], (err, rows) => {
    if (err) {
      console.error('Chyba pri načítaní employment relations:', err);
    } else {
      console.log('\nEmployment relations:');
      console.log(JSON.stringify(rows, null, 2));
    }
    process.exit();
  });
});
