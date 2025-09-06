const express = require('express');
const router = express.Router();
const { db, isWeekend, isHoliday } = require('../database');
const calendarService = require('../services/calendarService');
const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');

// Middleware pre overenie JWT tokenu
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Prístup zamietnutý - chýba token' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Neplatný token' });
    }
    req.user = user;
    next();
  });
};

// Pomocná kontrola oprávnení pre úpravu dochádzky (admin | priradený účtovník | majiteľ firmy)
async function canEditAttendance(db, user, companyId) {
  if (!user) return false;
  if (user.role === 'admin') return true;

  return await new Promise((resolve) => {
    // Skontrolovať, či je používateľ majiteľ firmy
    db.get(`SELECT 1 FROM companies WHERE id = ? AND owner_email = ?`, [companyId, user.email], (err, ownerRow) => {
      if (!err && ownerRow) {
        resolve(true);
        return;
      }
      // Skontrolovať, či je používateľ priradený účtovník k firme
      db.get(`SELECT 1 FROM company_accountants WHERE company_id = ? AND accountant_email = ?`, [companyId, user.email], (err2, accRow) => {
        if (!err2 && accRow) resolve(true); else resolve(false);
      });
    });
  });
}

// Získanie všetkých zamestnancov firmy
router.get('/employees/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  
  db.all(`
    SELECT DISTINCT e.*, 
           m.first_name as manager_first_name, 
           m.last_name as manager_last_name,
           er.employment_start_date,
           er.employment_end_date,
           er.attendance_mode
    FROM employees e
    LEFT JOIN employees m ON e.manager_id = m.id
    LEFT JOIN employment_relations er ON e.id = er.employee_id AND er.is_active = 1
    WHERE e.company_id = ?
    ORDER BY e.last_name, e.first_name
  `, [companyId], (err, employees) => {
    if (err) {
      console.error('Chyba pri získavaní zamestnancov:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní zamestnancov' });
    }
    
    // Kontrola a aktualizácia statusu zamestnancov s uplynutým dátumom ukončenia
    const today = new Date().toISOString().split('T')[0];
    const employeesToUpdate = employees.filter(emp => 
      emp.termination_date && 
      emp.termination_date <= today && 
      emp.status === 'terminated'
    );
    
    if (employeesToUpdate.length > 0) {
      const updatePromises = employeesToUpdate.map(emp => {
        return new Promise((resolve, reject) => {
          db.run(`
            UPDATE employees SET 
              status = 'inactive', 
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [emp.id], function(err) {
            if (err) {
              console.error('Chyba pri aktualizácii statusu zamestnanca:', err);
              reject(err);
            } else {
              // Aktualizuj status v response
              emp.status = 'inactive';
              resolve();
            }
          });
        });
      });
      
      Promise.all(updatePromises)
        .then(() => {
          res.json(employees);
        })
        .catch(error => {
          console.error('Chyba pri hromadnej aktualizácii:', error);
          res.json(employees); // Vráť pôvodné dáta aj pri chybe
        });
    } else {
      res.json(employees);
    }
  });
});

// Hľadanie zamestnanca podľa emailu
router.get('/employees/find/:email', authenticateToken, (req, res) => {
  const { email } = req.params;
  
  db.get(`
    SELECT e.*, 
           m.first_name as manager_first_name, 
           m.last_name as manager_last_name,
           er.employment_start_date,
           er.employment_end_date,
           er.attendance_mode
    FROM employees e
    LEFT JOIN employees m ON e.manager_id = m.id
    LEFT JOIN employment_relations er ON e.id = er.employee_id AND er.is_active = 1
    WHERE e.email = ?
  `, [email], (err, employee) => {
    if (err) {
      console.error('Chyba pri hľadaní zamestnanca:', err);
      return res.status(500).json({ error: 'Chyba pri hľadaní zamestnanca' });
    }
    if (!employee) {
      return res.status(404).json({ error: 'Zamestnanec nenájdený' });
    }
    res.json(employee);
  });
});

// Pridanie nového zamestnanca
router.post('/employees', authenticateToken, (req, res) => {
  const {
    company_id,
    employee_id,
    first_name,
    last_name,
    email,
    phone,
    position,
    department,
    hire_date,
    salary,
    employment_type,
    manager_id
  } = req.body;

  db.run(`
    INSERT INTO employees (
      company_id, employee_id, first_name, last_name, email, phone,
      position, department, hire_date, salary, employment_type, manager_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [company_id, employee_id, first_name, last_name, email, phone,
      position, department, hire_date, salary, employment_type, manager_id], function(err) {
    if (err) {
      console.error('Chyba pri pridávaní zamestnanca:', err);
      return res.status(500).json({ error: 'Chyba pri pridávaní zamestnanca' });
    }
    res.json({ id: this.lastID, message: 'Zamestnanec úspešne pridaný' });
  });
});

// Aktualizácia zamestnanca
router.put('/employees/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    first_name, last_name, email, phone, position, department, salary, employment_type, status,
    termination_date, termination_reason, manager_id, company_id,
    // Personálne údaje
    birth_name, title_before, title_after, gender, birth_date, birth_number, birth_place,
    nationality, citizenship, education, marital_status, is_partner, is_statutory,
    employee_bonus, bonus_months,
    // Adresy
    permanent_street, permanent_number, permanent_city, permanent_zip, permanent_country,
    contact_street, contact_number, contact_city, contact_zip, contact_country,
    // Cudzinecké údaje
    is_foreigner, foreigner_country, residence_permit_number, social_insurance_sr,
    social_insurance_foreign, health_insurance_sr, foreigner_without_permanent_residence,
    tax_identification_number
  } = req.body;

  let query = `
    UPDATE employees SET 
      first_name = ?, last_name = ?, email = ?, phone = ?,
      position = ?, department = ?, salary = ?, employment_type = ?,
      status = ?, manager_id = ?, updated_at = CURRENT_TIMESTAMP,
      birth_name = ?, title_before = ?, title_after = ?, gender = ?, birth_date = ?,
      birth_number = ?, birth_place = ?, nationality = ?, citizenship = ?, education = ?,
      marital_status = ?, is_partner = ?, is_statutory = ?, employee_bonus = ?, bonus_months = ?,
      permanent_street = ?, permanent_number = ?, permanent_city = ?, permanent_zip = ?, permanent_country = ?,
      contact_street = ?, contact_number = ?, contact_city = ?, contact_zip = ?, contact_country = ?,
      is_foreigner = ?, foreigner_country = ?, residence_permit_number = ?, social_insurance_sr = ?,
      social_insurance_foreign = ?, health_insurance_sr = ?, foreigner_without_permanent_residence = ?,
      tax_identification_number = ?
  `;
  
  let params = [
    first_name, last_name, email, phone, position, department, salary, employment_type, status, manager_id,
    birth_name, title_before, title_after, gender, birth_date, birth_number, birth_place, nationality, citizenship, education,
    marital_status, is_partner, is_statutory, employee_bonus, bonus_months,
    permanent_street, permanent_number, permanent_city, permanent_zip, permanent_country,
    contact_street, contact_number, contact_city, contact_zip, contact_country,
    is_foreigner, foreigner_country, residence_permit_number, social_insurance_sr,
    social_insurance_foreign, health_insurance_sr, foreigner_without_permanent_residence, tax_identification_number
  ];

  // Ak je zadané company_id, pridaj ho do query
  if (company_id !== undefined) {
    query += ', company_id = ?';
    params.push(company_id);
  }

  // Ak je zadané termination_date, pridaj ho do query
  if (termination_date !== undefined) {
    query += ', termination_date = ?';
    params.push(termination_date);
  }

  // Ak je zadané termination_reason, pridaj ho do query
  if (termination_reason !== undefined) {
    query += ', termination_reason = ?';
    params.push(termination_reason);
  }

  query += ' WHERE id = ?';
  params.push(id);

  db.run(query, params, function(err) {
    if (err) {
      console.error('Chyba pri aktualizácii zamestnanca:', err);
      return res.status(500).json({ error: 'Chyba pri aktualizácii zamestnanca' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Zamestnanec nenájdený' });
    }
    res.json({ message: 'Zamestnanec úspešne aktualizovaný' });
  });
});

// Vymazanie zamestnanca
router.delete('/employees/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM employees WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Chyba pri mazaní zamestnanca:', err);
      return res.status(500).json({ error: 'Chyba pri mazaní zamestnanca' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Zamestnanec nenájdený' });
    }
    res.json({ message: 'Zamestnanec vymazaný' });
  });
});

// Aktualizácia company_id zamestnanca
router.put('/employees/:id/company', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { company_id } = req.body;

  db.run(`
    UPDATE employees SET 
      company_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [company_id, id], function(err) {
    if (err) {
      console.error('Chyba pri aktualizácii firmy zamestnanca:', err);
      return res.status(500).json({ error: 'Chyba pri aktualizácii firmy zamestnanca' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Zamestnanec nenájdený' });
    }
    res.json({ message: 'Firma zamestnanca úspešne aktualizovaná' });
  });
});

// Kontrola duplicitných záznamov dochádzky
router.get('/attendance/check-duplicates/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { employeeId, startDate, endDate } = req.query;

  let query = `
    SELECT date, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM attendance 
    WHERE company_id = ?
  `;
  let params = [companyId];

  if (employeeId) {
    query += ' AND employee_id = ?';
    params.push(employeeId);
  }

  if (startDate && endDate) {
    query += ' AND date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  query += ' GROUP BY date HAVING COUNT(*) > 1';

  db.all(query, params, (err, duplicates) => {
    if (err) {
      console.error('Chyba pri kontrole duplicitných záznamov:', err);
      return res.status(500).json({ error: 'Chyba pri kontrole duplicitných záznamov' });
    }
    res.json({ duplicates });
  });
});

// Získanie dochádzky zamestnanca
router.get('/attendance/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { employeeId, startDate, endDate } = req.query;

  let query = `
    SELECT a.*, e.first_name, e.last_name, e.employee_id
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    WHERE a.company_id = ?
  `;
  let params = [companyId];

  if (employeeId) {
    query += ' AND a.employee_id = ?';
    params.push(employeeId);
  }

  if (startDate && endDate) {
    query += ' AND a.date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  query += ' ORDER BY a.date DESC, e.last_name, e.first_name';

  db.all(query, params, (err, attendance) => {
    if (err) {
      console.error('Chyba pri získavaní dochádzky:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní dochádzky' });
    }
    
    // Debug informácie
    console.log('Attendance Query Debug:', {
      query,
      params,
      attendanceLength: attendance.length,
      totalHours: attendance.reduce((sum, a) => sum + (a.total_hours || 0), 0),
      totalBreakMinutes: attendance.reduce((sum, a) => sum + (a.break_minutes || 0), 0),
      presentCount: attendance.filter(a => a.status === 'present').length,
      absentCount: attendance.filter(a => a.status === 'absent').length,
      lateCount: attendance.filter(a => a.status === 'late').length
    });
    
    res.json(attendance);
  });
});

// Pridanie dochádzky
router.post('/attendance', authenticateToken, (req, res) => {
  const {
    employee_id,
    company_id,
    date,
    check_in,
    check_out,
    total_hours,
    break_minutes,
    status,
    notes
  } = req.body;

  db.run(`
    INSERT OR REPLACE INTO attendance (
      employee_id, company_id, date, check_in, check_out,
      total_hours, break_minutes, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [employee_id, company_id, date, check_in, check_out,
      total_hours, break_minutes, status, notes], function(err) {
    if (err) {
      console.error('Chyba pri pridávaní dochádzky:', err);
      return res.status(500).json({ error: 'Chyba pri pridávaní dochádzky' });
    }
    res.json({ id: this.lastID, message: 'Dochádzka úspešne pridaná' });
  });
});

// Získanie dovoleniek
router.get('/leave-requests/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { status, employee_id } = req.query;

  let query = `
    SELECT lr.*, e.first_name, e.last_name, e.employee_id,
           a.first_name as approver_first_name, a.last_name as approver_last_name
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.id
    LEFT JOIN employees a ON lr.approved_by = a.id
    WHERE lr.company_id = ?
  `;
  let params = [companyId];

  if (status) {
    query += ' AND lr.status = ?';
    params.push(status);
  }

  if (employee_id) {
    query += ' AND lr.employee_id = ?';
    params.push(parseInt(employee_id));
  }

  query += ' ORDER BY lr.created_at DESC';

  db.all(query, params, (err, leaveRequests) => {
    if (err) {
      console.error('Chyba pri získavaní dovoleniek:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní dovoleniek' });
    }
    res.json(leaveRequests);
  });
});

// Pomocné funkcie pre prácu s dátumami (zachované pre kompatibilitu)

const calculateWorkingDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let workingDays = 0;
  const current = new Date(start);
  
  while (current <= end) {
    if (!isWeekend(current) && !isHoliday(current)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
};

// Funkcia na kontrolu, či má zamestnanec dovolenku, PN alebo iný typ neprítomnosti
const checkEmployeeAbsence = async (db, employeeId, date) => {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT leave_type, status 
      FROM leave_requests 
      WHERE employee_id = ? 
      AND start_date <= ? 
      AND end_date >= ? 
      AND status = 'approved'
    `, [employeeId, date, date], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Funkcia na vyčistenie dochádzky za víkendy a sviatky
const cleanupWeekendHolidayAttendance = async (db, companyId) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT id, employee_id, date, status 
      FROM attendance 
      WHERE company_id = ? 
      AND attendance_type = 'automatic'
    `, [companyId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      let deletedCount = 0;
      let processedCount = 0;

      rows.forEach(row => {
        const dateObj = new Date(row.date);
        if (isWeekend(dateObj) || isHoliday(dateObj)) {
          db.run(`DELETE FROM attendance WHERE id = ?`, [row.id], (err) => {
            if (!err) deletedCount++;
            processedCount++;
            
            if (processedCount === rows.length) {
              resolve({ deletedCount, totalProcessed: processedCount });
            }
          });
        } else {
          processedCount++;
          if (processedCount === rows.length) {
            resolve({ deletedCount, totalProcessed: processedCount });
          }
        }
      });

      if (rows.length === 0) {
        resolve({ deletedCount: 0, totalProcessed: 0 });
      }
    });
  });
};

// Funkcia na vyčistenie budúcich dochádzok
const cleanupFutureAttendance = async (db, companyId) => {
  return new Promise((resolve, reject) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    db.all(`
      SELECT id, employee_id, date, status 
      FROM attendance 
      WHERE company_id = ? 
      AND date > ?
    `, [companyId, todayStr], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      let deletedCount = 0;
      let processedCount = 0;

      if (rows.length === 0) {
        resolve({ deletedCount: 0, totalProcessed: 0 });
        return;
      }

      rows.forEach(row => {
        db.run(`DELETE FROM attendance WHERE id = ?`, [row.id], (err) => {
          if (!err) deletedCount++;
          processedCount++;
          
          if (processedCount === rows.length) {
            resolve({ deletedCount, totalProcessed: processedCount });
          }
        });
      });
    });
  });
};

// Pridanie žiadosti o dovolenku
router.post('/leave-requests', authenticateToken, async (req, res) => {
  const {
    employee_id,
    company_id,
    leave_type,
    start_date,
    end_date,
    total_days,
    reason
  } = req.body;

  try {
    // Použiť CalendarService pre presný výpočet pracovných dní
    const calculatedWorkingDays = await calendarService.calculateWorkingDays(start_date, end_date);

    db.run(`
      INSERT INTO leave_requests (
        employee_id, company_id, leave_type, start_date, end_date,
        total_days, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [employee_id, company_id, leave_type, start_date, end_date,
        calculatedWorkingDays, reason], function(err) {
      if (err) {
        console.error('Chyba pri pridávaní žiadosti o dovolenku:', err);
        return res.status(500).json({ error: 'Chyba pri pridávaní žiadosti o dovolenku' });
      }
      // Email notifikácie: zamestnanec + admin
      try {
        db.get(`SELECT first_name, last_name, email FROM employees WHERE id = ?`, [employee_id], (e1, emp) => {
          const employeeName = emp ? `${emp.first_name} ${emp.last_name}` : '';
          const employeeEmail = emp?.email;
          db.get(`SELECT name as company_name FROM companies WHERE id = ?`, [company_id], (e2, comp) => {
            const companyName = comp?.company_name || '';
            if (employeeEmail) {
              emailService.sendLeaveRequestSubmitted(employeeEmail, employeeName, leave_type, start_date, end_date, calculatedWorkingDays, reason, companyName).catch(() => {});
            }
            db.get(`SELECT email, name FROM users WHERE role = 'admin' LIMIT 1`, [], (e3, admin) => {
              if (admin?.email) {
                emailService.sendLeaveRequestPendingNotification(admin.email, admin.name || 'Admin', employeeName, leave_type, start_date, end_date, calculatedWorkingDays, reason, companyName).catch(() => {});
              }
            });
          });
        });
      } catch (_) {}

      res.json({ 
        id: this.lastID, 
        message: 'Žiadosť o dovolenku úspešne pridaná',
        calculated_days: calculatedWorkingDays
      });
    });
  } catch (error) {
    console.error('❌ Chyba pri výpočte pracovných dní:', error);
    
    // Fallback na základný výpočet
    const fallbackDays = calculateWorkingDays(start_date, end_date);
    
    db.run(`
      INSERT INTO leave_requests (
        employee_id, company_id, leave_type, start_date, end_date,
        total_days, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [employee_id, company_id, leave_type, start_date, end_date,
        fallbackDays, reason], function(err) {
      if (err) {
        console.error('Chyba pri pridávaní žiadosti o dovolenku:', err);
        return res.status(500).json({ error: 'Chyba pri pridávaní žiadosti o dovolenku' });
      }
      try {
        db.get(`SELECT first_name, last_name, email FROM employees WHERE id = ?`, [employee_id], (e1, emp) => {
          const employeeName = emp ? `${emp.first_name} ${emp.last_name}` : '';
          const employeeEmail = emp?.email;
          db.get(`SELECT name as company_name FROM companies WHERE id = ?`, [company_id], (e2, comp) => {
            const companyName = comp?.company_name || '';
            if (employeeEmail) {
              emailService.sendLeaveRequestSubmitted(employeeEmail, employeeName, leave_type, start_date, end_date, fallbackDays, reason, companyName).catch(() => {});
            }
            db.get(`SELECT email, name FROM users WHERE role = 'admin' LIMIT 1`, [], (e3, admin) => {
              if (admin?.email) {
                emailService.sendLeaveRequestPendingNotification(admin.email, admin.name || 'Admin', employeeName, leave_type, start_date, end_date, fallbackDays, reason, companyName).catch(() => {});
              }
            });
          });
        });
      } catch (_) {}

      res.json({ 
        id: this.lastID, 
        message: 'Žiadosť o dovolenku úspešne pridaná (použitý fallback)',
        calculated_days: fallbackDays
      });
    });
  }
});

// Schválenie/zamietnutie žiadosti o dovolenku
router.put('/leave-requests/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, approved_by } = req.body;

  const approved_at = status === 'approved' || status === 'rejected' ? new Date().toISOString() : null;

  db.run(`
    UPDATE leave_requests SET 
      status = ?, approved_by = ?, approved_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [status, approved_by, approved_at, id], function(err) {
    if (err) {
      console.error('Chyba pri aktualizácii žiadosti o dovolenku:', err);
      return res.status(500).json({ error: 'Chyba pri aktualizácii žiadosti o dovolenku' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Žiadosť o dovolenku nenájdená' });
    }
    // Email o zmene statusu
    try {
      db.get(`
        SELECT lr.leave_type, lr.start_date, lr.end_date, e.email, e.first_name, e.last_name, c.name as company_name, a.first_name as approver_first_name, a.last_name as approver_last_name
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
        LEFT JOIN employees a ON lr.approved_by = a.id
        JOIN companies c ON lr.company_id = c.id
        WHERE lr.id = ?
      `, [id], (e1, row) => {
        if (!e1 && row && row.email) {
          const approverName = row.approver_first_name || row.approver_last_name ? `${row.approver_first_name || ''} ${row.approver_last_name || ''}`.trim() : '';
          emailService
            .sendLeaveStatusChanged(row.email, `${row.first_name} ${row.last_name}`, row.leave_type, row.start_date, row.end_date, status, approverName, row.company_name)
            .catch(() => {});
        }
      });
    } catch (_) {}

    res.json({ message: 'Žiadosť o dovolenku úspešne aktualizovaná' });
  });
});

// Získanie pracovných zmien
router.get('/work-shifts/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;

  db.all(`
    SELECT * FROM work_shifts 
    WHERE company_id = ? AND is_active = 1
    ORDER BY start_time
  `, [companyId], (err, shifts) => {
    if (err) {
      console.error('Chyba pri získavaní zmien:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní zmien' });
    }
    res.json(shifts);
  });
});

// Pridanie pracovnej zmeny
router.post('/work-shifts', authenticateToken, (req, res) => {
  const {
    company_id,
    shift_name,
    start_time,
    end_time,
    break_start,
    break_end
  } = req.body;

  db.run(`
    INSERT INTO work_shifts (
      company_id, shift_name, start_time, end_time, break_start, break_end
    ) VALUES (?, ?, ?, ?, ?, ?)
  `, [company_id, shift_name, start_time, end_time, break_start, break_end], function(err) {
    if (err) {
      console.error('Chyba pri pridávaní zmeny:', err);
      return res.status(500).json({ error: 'Chyba pri pridávaní zmeny' });
    }
    res.json({ id: this.lastID, message: 'Pracovná zmena úspešne pridaná' });
  });
});

// Získanie pracovného kalendára pre rok
router.get('/work-calendar/:year', authenticateToken, async (req, res) => {
  const { year } = req.params;
  
  try {
    const calendar = await calendarService.getCachedWorkCalendar(parseInt(year));
    res.json({
      year: parseInt(year),
      holidays: calendar,
      source: 'google_calendar'
    });
  } catch (error) {
    console.error('❌ Chyba pri získavaní pracovného kalendára:', error);
    
    // Fallback na lokálny kalendár
    const localCalendar = calendarService.getLocalWorkCalendar(parseInt(year));
    res.json({
      year: parseInt(year),
      holidays: localCalendar,
      source: 'local_fallback'
    });
  }
});

// Získanie HR udalostí
router.get('/hr-events/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { event_type, employee_id } = req.query;

  let query = `
    SELECT he.*, e.first_name, e.last_name, e.employee_id,
           c.first_name as created_by_first_name, c.last_name as created_by_last_name
    FROM hr_events he
    LEFT JOIN employees e ON he.employee_id = e.id
    JOIN employees c ON he.created_by = c.id
    WHERE he.company_id = ?
  `;
  let params = [companyId];

  if (event_type) {
    query += ' AND he.event_type = ?';
    params.push(event_type);
  }

  if (employee_id) {
    query += ' AND he.employee_id = ?';
    params.push(employee_id);
  }

  query += ' ORDER BY he.event_date DESC, he.created_at DESC';

  db.all(query, params, (err, events) => {
    if (err) {
      console.error('Chyba pri získavaní HR udalostí:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní HR udalostí' });
    }
    res.json(events);
  });
});

// Pridanie HR udalosti
router.post('/hr-events', authenticateToken, (req, res) => {
  const {
    company_id,
    employee_id,
    event_type,
    title,
    description,
    event_date,
    created_by
  } = req.body;

  db.run(`
    INSERT INTO hr_events (
      company_id, employee_id, event_type, title, description, event_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [company_id, employee_id, event_type, title, description, event_date, created_by], function(err) {
    if (err) {
      console.error('Chyba pri pridávaní HR udalosti:', err);
      return res.status(500).json({ error: 'Chyba pri pridávaní HR udalosti' });
    }
    res.json({ id: this.lastID, message: 'HR udalosť úspešne pridaná' });
  });
});

// Štatistiky HR
router.get('/hr-stats/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;

  // Počet zamestnancov podľa statusu
  db.get(`
    SELECT 
      COUNT(*) as total_employees,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_employees,
      SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_employees,
      SUM(CASE WHEN status = 'terminated' THEN 1 ELSE 0 END) as terminated_employees,
      SUM(CASE WHEN status = 'on_leave' THEN 1 ELSE 0 END) as on_leave_employees
    FROM employees 
    WHERE company_id = ?
  `, [companyId], (err, employeeStats) => {
    if (err) {
      console.error('Chyba pri získavaní štatistík zamestnancov:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní štatistík' });
    }

    // Dochádzka za dnešný deň
    const today = new Date().toISOString().split('T')[0];
    db.get(`
      SELECT 
        COUNT(*) as total_attendance,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_today,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_today,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_today
      FROM attendance 
      WHERE company_id = ? AND date = ?
    `, [companyId, today], (err, attendanceStats) => {
      if (err) {
        console.error('Chyba pri získavaní štatistík dochádzky:', err);
        return res.status(500).json({ error: 'Chyba pri získavaní štatistík' });
      }

      // Čakajúce žiadosti o dovolenku
      db.get(`
        SELECT COUNT(*) as pending_leave_requests
        FROM leave_requests 
        WHERE company_id = ? AND status = 'pending'
      `, [companyId], (err, leaveStats) => {
        if (err) {
          console.error('Chyba pri získavaní štatistík dovoleniek:', err);
          return res.status(500).json({ error: 'Chyba pri získavaní štatistík' });
        }

        res.json({
          employees: employeeStats,
          attendance: attendanceStats,
          leave_requests: leaveStats
        });
      });
    });
  });
});

// Pridanie nových endpointov pre správu zmien personálnych údajov

// Vytvorenie požiadavky na zmenu personálnych údajov
router.post('/employee-changes', (req, res) => {
  const { employee_id, field_name, current_value, new_value, reason, company_id } = req.body;
  
  const sql = `
    INSERT INTO employee_changes 
    (employee_id, field_name, current_value, new_value, reason, company_id, status, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
  `;
  
  db.run(sql, [employee_id, field_name, current_value, new_value, reason, company_id], function(err) {
    if (err) {
      console.error('Chyba pri vytváraní požiadavky na zmenu:', err);
      return res.status(500).json({ error: 'Chyba pri vytváraní požiadavky na zmenu' });
    }
    
    res.json({ 
      id: this.lastID, 
      message: 'Požiadavka na zmenu bola úspešne vytvorená' 
    });
  });
});

// Získanie všetkých zmien pre zamestnanca
router.get('/employee-changes/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  
  const sql = `
    SELECT * FROM employee_changes 
    WHERE employee_id = ? 
    ORDER BY created_at DESC
  `;
  
  db.all(sql, [employeeId], (err, rows) => {
    if (err) {
      console.error('Chyba pri načítaní zmien:', err);
      return res.status(500).json({ error: 'Chyba pri načítaní zmien' });
    }
    
    res.json(rows);
  });
});

// Získanie všetkých zmien pre firmu
router.get('/company-changes/:companyId', (req, res) => {
  const { companyId } = req.params;
  
  const sql = `
    SELECT ec.*, e.first_name, e.last_name, e.email 
    FROM employee_changes ec
    JOIN employees e ON ec.employee_id = e.id
    WHERE ec.company_id = ? 
    ORDER BY ec.created_at DESC
  `;
  
  db.all(sql, [companyId], (err, rows) => {
    if (err) {
      console.error('Chyba pri načítaní zmien firmy:', err);
      return res.status(500).json({ error: 'Chyba pri načítaní zmien firmy' });
    }
    
    res.json(rows);
  });
});

// Schválenie/odmietnutie zmeny
router.patch('/employee-changes/:changeId', (req, res) => {
  const { changeId } = req.params;
  const { status, approved_by } = req.body; // status: 'approved' alebo 'rejected'
  
  const sql = `
    UPDATE employee_changes 
    SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(sql, [status, approved_by, changeId], function(err) {
    if (err) {
      console.error('Chyba pri aktualizácii zmeny:', err);
      return res.status(500).json({ error: 'Chyba pri aktualizácii zmeny' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Zmena nebola nájdená' });
    }
    
    res.json({ message: 'Zmena bola úspešne aktualizovaná' });
  });
});

// Aktualizácia personálnych údajov zamestnanca po schválení zmeny
router.patch('/employees/:employeeId/update-field', (req, res) => {
  const { employeeId } = req.params;
  const { field_name, new_value } = req.body;
  
  // Konverzia formátu pre dátumové polia
  let convertedValue = new_value;
  if (field_name === 'birth_date' && new_value) {
    // Konverzia zo slovenského formátu (DD.MM.YYYY) na ISO formát (YYYY-MM-DD)
    const dateParts = new_value.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (dateParts) {
      const day = dateParts[1].padStart(2, '0');
      const month = dateParts[2].padStart(2, '0');
      const year = dateParts[3];
      convertedValue = `${year}-${month}-${day}`;
    }
  }
  
  const sql = `UPDATE employees SET ${field_name} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  
  db.run(sql, [convertedValue, employeeId], function(err) {
    if (err) {
      console.error('Chyba pri aktualizácii údajov zamestnanca:', err);
      return res.status(500).json({ error: 'Chyba pri aktualizácii údajov zamestnanca' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Zamestnanec nebol nájdený' });
    }
    
    res.json({ message: 'Údaje zamestnanca boli úspešne aktualizované' });
  });
});

// Získanie dochádzkových nastavení zamestnanca
router.get('/attendance-settings/:employeeId', authenticateToken, (req, res) => {
  const { employeeId } = req.params;
  
  db.get(`
    SELECT er.*, e.first_name, e.last_name, e.email
    FROM employment_relations er
    JOIN employees e ON er.employee_id = e.id
    WHERE er.employee_id = ? AND er.is_active = 1
    ORDER BY er.employment_start_date DESC
    LIMIT 1
  `, [employeeId], (err, settings) => {
    if (err) {
      console.error('Chyba pri získavaní dochádzkových nastavení:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní dochádzkových nastavení' });
    }
    res.json(settings);
  });
});

// Automatické vytvorenie dochádzky na základe nastavení
router.post('/attendance/auto-create', authenticateToken, (req, res) => {
  const { companyId, date } = req.body;
  
  if (!companyId || !date) {
    return res.status(400).json({ error: 'Chýbajú povinné parametre' });
  }
  
  // Získanie všetkých aktívnych zamestnancov s automatickou dochádzkou
  db.all(`
    SELECT er.*, e.id as employee_id, e.first_name, e.last_name
    FROM employment_relations er
    JOIN employees e ON er.employee_id = e.id
    WHERE er.company_id = ? 
    AND er.is_active = 1 
    AND er.attendance_mode = 'automatic'
    AND er.employment_start_date <= ?
    AND (er.employment_end_date IS NULL OR er.employment_end_date >= ?)
  `, [companyId, date, date], (err, employees) => {
    if (err) {
      console.error('Chyba pri získavaní zamestnancov pre automatickú dochádzku:', err);
      return res.status(500).json({ error: 'Chyba pri automatickom vytváraní dochádzky' });
    }
    
    const results = [];
    let completed = 0;
    
    if (employees.length === 0) {
      return res.json({ 
        message: 'Žiadni zamestnanci s automatickou dochádzkou', 
        results: [] 
      });
    }
    
    employees.forEach(employee => {
      // Kontrola, či už existuje dochádzka pre daný dátum
      db.get(`
        SELECT id FROM attendance 
        WHERE employee_id = ? AND date = ?
      `, [employee.employee_id, date], (err, existing) => {
        if (err) {
          console.error('Chyba pri kontrole existujúcej dochádzky:', err);
          results.push({ employee_id: employee.employee_id, success: false, error: err.message });
          completed++;
          if (completed === employees.length) {
            res.json({ message: 'Automatická dochádzka vytvorená', results: results });
          }
          return;
        }
        
        if (!existing) {
          // Vytvorenie automatickej dochádzky
          const checkInTime = `${date}T${employee.work_start_time}:00`;
          const checkOutTime = `${date}T${employee.work_end_time}:00`;
          const breakMinutes = calculateBreakMinutes(employee.break_start_time, employee.break_end_time);
          const totalHours = calculateWorkHours(employee.work_start_time, employee.work_end_time, breakMinutes);
          
          db.run(`
            INSERT INTO attendance (
              employee_id, company_id, date, check_in, check_out, 
              total_hours, break_minutes, status, attendance_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'present', 'automatic')
          `, [
            employee.employee_id, companyId, date, checkInTime, checkOutTime, 
            totalHours, breakMinutes
          ], function(err) {
            if (err) {
              console.error('Chyba pri vytváraní automatickej dochádzky:', err);
              results.push({ employee_id: employee.employee_id, success: false, error: err.message });
            } else {
              results.push({ employee_id: employee.employee_id, success: true, id: this.lastID });
            }
            completed++;
            if (completed === employees.length) {
              res.json({ message: 'Automatická dochádzka vytvorená', results: results });
            }
          });
        } else {
          results.push({ employee_id: employee.employee_id, success: false, error: 'Dochádzka už existuje' });
          completed++;
          if (completed === employees.length) {
            res.json({ message: 'Automatická dochádzka vytvorená', results: results });
          }
        }
      });
    });
  });
});

// Pridanie pracovného pomeru
router.post('/employment-relations', authenticateToken, (req, res) => {
  const {
    employee_id,
    company_id,
    position,
    employment_type,
    employment_start_date,
    employment_end_date,
    salary,
    weekly_hours,
    attendance_mode,
    work_start_time,
    work_end_time,
    break_start_time,
    break_end_time,
    is_active
  } = req.body;

  if (!employee_id || !company_id || !position || !employment_start_date) {
    return res.status(400).json({ error: 'Chýbajú povinné parametre' });
  }

  db.run(`
    INSERT INTO employment_relations (
      employee_id, company_id, position, employment_type, employment_start_date, 
      employment_end_date, salary, weekly_hours, attendance_mode, work_start_time, 
      work_end_time, break_start_time, break_end_time, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    employee_id, company_id, position, employment_type || 'full_time', employment_start_date,
    employment_end_date || null, salary || 0, weekly_hours || 40, attendance_mode || 'manual',
    work_start_time || '08:00', work_end_time || '16:00', break_start_time || '12:00', break_end_time || '12:30',
    is_active !== undefined ? is_active : 1
  ], function(err) {
    if (err) {
      console.error('Chyba pri pridávaní pracovného pomeru:', err);
      return res.status(500).json({ error: 'Chyba pri pridávaní pracovného pomeru' });
    }
    
    res.json({ 
      message: 'Pracovný pomer úspešne pridaný',
      id: this.lastID 
    });
  });
});

// Aktualizácia pracovného pomeru
router.put('/employment-relations/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    position,
    employment_type,
    employment_start_date,
    employment_end_date,
    salary,
    weekly_hours,
    attendance_mode,
    work_start_time,
    work_end_time,
    break_start_time,
    break_end_time,
    is_active
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Chýba ID pracovného pomeru' });
  }

  db.run(`
    UPDATE employment_relations SET
      position = ?, employment_type = ?, employment_start_date = ?, employment_end_date = ?,
      salary = ?, weekly_hours = ?, attendance_mode = ?, work_start_time = ?, work_end_time = ?,
      break_start_time = ?, break_end_time = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    position, employment_type, employment_start_date, employment_end_date,
    salary, weekly_hours, attendance_mode, work_start_time, work_end_time,
    break_start_time, break_end_time, is_active, id
  ], function(err) {
    if (err) {
      console.error('Chyba pri aktualizácii pracovného pomeru:', err);
      return res.status(500).json({ error: 'Chyba pri aktualizácii pracovného pomeru' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Pracovný pomer nebol nájdený' });
    }
    
    res.json({ 
      message: 'Pracovný pomer úspešne aktualizovaný'
    });
  });
});

// Získanie všetkých pracovných pomerov pre firmu
router.get('/employment-relations/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;

  db.all(`
    SELECT er.*, e.first_name, e.last_name, e.email
    FROM employment_relations er
    JOIN employees e ON er.employee_id = e.id
    WHERE er.company_id = ?
    ORDER BY er.employment_start_date DESC
  `, [companyId], (err, relations) => {
    if (err) {
      console.error('Chyba pri získavaní pracovných pomerov:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní pracovných pomerov' });
    }
    res.json(relations);
  });
});

// Pomocné funkcie pre výpočty
function calculateBreakMinutes(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

function calculateWorkHours(startTime, endTime, breakMinutes) {
  if (!startTime || !endTime) return 0;
  
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  const workMinutes = totalMinutes - breakMinutes;
  
  return Math.round((workMinutes / 60) * 100) / 100;
}

// Získanie zamestnancov s automatickou dochádzkou
router.get('/employees/automatic-attendance/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;

  db.all(`
    SELECT 
      e.id,
      e.first_name,
      e.last_name,
      e.position,
      er.id as employment_relation_id,
      er.work_start_time,
      er.work_end_time,
      er.break_start_time,
      er.break_end_time,
      er.weekly_hours
    FROM employees e
    JOIN employment_relations er ON e.id = er.employee_id
    WHERE er.company_id = ? 
    AND er.is_active = 1 
    AND er.attendance_mode = 'automatic'
    AND er.employment_start_date <= date('now')
    AND (er.employment_end_date IS NULL OR er.employment_end_date >= date('now'))
    ORDER BY e.first_name, e.last_name
  `, [companyId], (err, employees) => {
    if (err) {
      console.error('Chyba pri získavaní zamestnancov s automatickou dochádzkou:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní zamestnancov' });
    }
    res.json(employees);
  });
});

// Spracovanie automatickej dochádzky pre obdobie
router.post('/attendance/process-automatic', authenticateToken, async (req, res) => {
  const { companyId, employeeIds, startDate, endDate } = req.body;

  if (!companyId || !employeeIds || !startDate || !endDate) {
    return res.status(400).json({ error: 'Chýbajú povinné parametre' });
  }

  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    return res.status(400).json({ error: 'Musí byť vybraný aspoň jeden zamestnanec' });
  }

  try {
    // Kontrola aktuálneho dátumu - výpočet môže prebehnúť len za dni pred aktuálnym dňom
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Nastaviť na začiatok dňa
    
    const endDateObj = new Date(endDate);
    endDateObj.setHours(0, 0, 0, 0);
    
    if (endDateObj >= today) {
      return res.status(400).json({ 
        error: 'Automatický výpočet dochádzky môže prebehnúť len za dni pred aktuálnym dňom. Vyberte obdobie, ktoré neobsahuje dnešný alebo budúci deň.' 
      });
    }

    // Kontrola či je mzdové obdobie uzatvorené
    const startDateObj = new Date(startDate);
    const year = startDateObj.getFullYear();
    const month = startDateObj.getMonth() + 1;
    
    const payrollPeriod = await new Promise((resolve, reject) => {
      db.get(`
        SELECT is_closed FROM payroll_periods 
        WHERE company_id = ? AND year = ? AND month = ?
      `, [companyId, year, month], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (payrollPeriod && payrollPeriod.is_closed === 1) {
      return res.status(400).json({ 
        error: `Mzdové obdobie ${month}/${year} je uzatvorené. Nie je možné spracovať dochádzku.` 
      });
    }

    // Získanie zamestnancov s ich nastaveniami
    const employees = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          e.id as employee_id,
          e.first_name,
          e.last_name,
          er.work_start_time,
          er.work_end_time,
          er.break_start_time,
          er.break_end_time,
          er.weekly_hours
        FROM employees e
        JOIN employment_relations er ON e.id = er.employee_id
        WHERE e.id IN (${employeeIds.map(() => '?').join(',')})
        AND er.company_id = ?
        AND er.is_active = 1
        AND er.attendance_mode = 'automatic'
      `, [...employeeIds, companyId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (employees.length === 0) {
      return res.json({ message: 'Žiadni zamestnanci s automatickou dochádzkou', results: [] });
    }

    const results = [];

    // Spracovanie každého zamestnanca
    for (const employee of employees) {
      // Generovanie všetkých dní v období
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dates = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }

      // Spracovanie každého dňa
      for (const date of dates) {
        const dateObj = new Date(date);
        
        // Kontrola, či je to pracovný deň (nie víkend a nie sviatok)
        if (isWeekend(dateObj) || isHoliday(dateObj)) {
          // Víkend alebo sviatok - preskočiť
          results.push({ 
            employee_id: employee.employee_id, 
            date: date,
            success: false, 
            error: isWeekend(dateObj) ? 'Víkend' : 'Sviatok',
            skipped: true
          });
          continue;
        }

        try {
          // Kontrola, či už existuje dochádzka pre daný dátum
          const existing = await new Promise((resolve, reject) => {
            db.get(`
              SELECT id FROM attendance 
              WHERE employee_id = ? AND date = ?
            `, [employee.employee_id, date], (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          });

          if (existing) {
            // Dochádzka už existuje - preskočiť
            results.push({ 
              employee_id: employee.employee_id, 
              date: date,
              success: false, 
              error: 'Dochádzka už existuje',
              skipped: true
            });
            continue;
          }

          // Kontrola, či má zamestnanec dovolenku, PN alebo iný typ neprítomnosti
          const absence = await checkEmployeeAbsence(db, employee.employee_id, date);
          
          if (absence) {
            // Zamestnanec má schválenú neprítomnosť - vytvoriť záznam s príslušným statusom
            let status = 'absent';
            let totalHours = 0;
            let breakMinutes = 0;
            let checkInTime = null;
            let checkOutTime = null;
            
            switch (absence.leave_type) {
              case 'vacation':
                status = 'vacation';
                break;
              case 'sick_leave':
                status = 'sick_leave';
                break;
              case 'personal_leave':
                status = 'personal_leave';
                break;
              case 'maternity_leave':
                status = 'maternity_leave';
                break;
              case 'paternity_leave':
                status = 'paternity_leave';
                break;
              case 'unpaid_leave':
                status = 'unpaid_leave';
                break;
              default:
                status = 'absent';
            }
            
            const result = await new Promise((resolve, reject) => {
              db.run(`
                INSERT INTO attendance (
                  employee_id, company_id, date, check_in, check_out, 
                  total_hours, break_minutes, status, attendance_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'automatic')
              `, [
                employee.employee_id, companyId, date, checkInTime, checkOutTime, 
                totalHours, breakMinutes, status
              ], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
              });
            });

            results.push({ 
              employee_id: employee.employee_id, 
              date: date,
              success: true, 
              id: result.id,
              status: status,
              note: `Automaticky vytvorené - ${absence.leave_type}`
            });
            
          } else {
            // Vytvorenie automatickej dochádzky pre pracovný deň
            const checkInTime = `${date}T${employee.work_start_time}:00`;
            const checkOutTime = `${date}T${employee.work_end_time}:00`;
            const breakMinutes = calculateBreakMinutes(employee.break_start_time, employee.break_end_time);
            const totalHours = calculateWorkHours(employee.work_start_time, employee.work_end_time, breakMinutes);
            
            const result = await new Promise((resolve, reject) => {
              db.run(`
                INSERT INTO attendance (
                  employee_id, company_id, date, check_in, check_out, 
                  total_hours, break_minutes, status, attendance_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'present', 'automatic')
              `, [
                employee.employee_id, companyId, date, checkInTime, checkOutTime, 
                totalHours, breakMinutes
              ], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
              });
            });

            results.push({ 
              employee_id: employee.employee_id, 
              date: date,
              success: true, 
              id: result.id,
              status: 'present',
              note: 'Automaticky vytvorené - pracovný deň'
            });
          }

        } catch (error) {
          console.error('Chyba pri spracovaní dochádzky:', error);
          results.push({ 
            employee_id: employee.employee_id, 
            date: date,
            success: false, 
            error: error.message 
          });
        }
      }
    }

    res.json({ message: 'Automatická dochádzka spracovaná', results: results });

  } catch (error) {
    console.error('Chyba pri spracovaní automatickej dochádzky:', error);
    res.status(500).json({ error: 'Chyba pri spracovaní dochádzky' });
  }
});

// Vyčistenie dochádzky za víkendy a sviatky
router.post('/attendance/cleanup-weekends-holidays', authenticateToken, async (req, res) => {
  const { companyId } = req.body;

  if (!companyId) {
    return res.status(400).json({ error: 'Chýba companyId' });
  }

  try {
    const result = await cleanupWeekendHolidayAttendance(db, companyId);
    
    res.json({ 
      message: 'Vyčistenie dochádzky dokončené', 
      deletedCount: result.deletedCount,
      totalProcessed: result.totalProcessed
    });
  } catch (error) {
    console.error('Chyba pri vyčistení dochádzky:', error);
    res.status(500).json({ error: 'Chyba pri vyčistení dochádzky' });
  }
});

// Vyčistenie budúcich dochádzok
router.post('/attendance/cleanup-future', authenticateToken, async (req, res) => {
  const { companyId } = req.body;

  if (!companyId) {
    return res.status(400).json({ error: 'Chýba companyId' });
  }

  try {
    const result = await cleanupFutureAttendance(db, companyId);
    
    res.json({ 
      message: 'Vyčistenie budúcich dochádzok dokončené', 
      deletedCount: result.deletedCount,
      totalProcessed: result.totalProcessed
    });
  } catch (error) {
    console.error('Chyba pri vyčistení budúcich dochádzok:', error);
    res.status(500).json({ error: 'Chyba pri vyčistení budúcich dochádzok' });
  }
});

// Získanie prítomných zamestnancov dnes
router.get('/attendance/present-today/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT a.*, e.first_name, e.last_name, e.employee_id, e.position, e.email
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    WHERE a.company_id = ? 
    AND a.date = ? 
    AND a.status IN ('present', 'late')
    ORDER BY e.last_name, e.first_name
  `;

  db.all(query, [companyId, today], (err, presentEmployees) => {
    if (err) {
      console.error('Chyba pri získavaní prítomných zamestnancov:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní prítomných zamestnancov' });
    }
    res.json(presentEmployees);
  });
});

// Získanie neprítomných zamestnancov dnes
router.get('/attendance/absent-today/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const today = new Date().toISOString().split('T')[0];

  // Najprv získame všetkých aktívnych zamestnancov
  const employeesQuery = `
    SELECT e.id, e.first_name, e.last_name, e.employee_id, e.position, e.email
    FROM employees e
    WHERE e.company_id = ? AND e.status = 'active'
    ORDER BY e.last_name, e.first_name
  `;

  db.all(employeesQuery, [companyId], (err, allEmployees) => {
    if (err) {
      console.error('Chyba pri získavaní zamestnancov:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní zamestnancov' });
    }

    // Potom získame prítomných zamestnancov dnes
    const presentQuery = `
      SELECT DISTINCT employee_id
      FROM attendance 
      WHERE company_id = ? AND date = ? AND status IN ('present', 'late')
    `;

    db.all(presentQuery, [companyId, today], (err, presentEmployeeIds) => {
      if (err) {
        console.error('Chyba pri získavaní prítomných zamestnancov:', err);
        return res.status(500).json({ error: 'Chyba pri získavaní prítomných zamestnancov' });
      }

      const presentIds = presentEmployeeIds.map(row => row.employee_id);
      
      // Filtrujeme neprítomných zamestnancov
      const absentEmployees = allEmployees.filter(emp => !presentIds.includes(emp.id));

      // Pre každého neprítomného zamestnanca skontrolujeme, či má aktívnu dovolenku
      const absentWithReasons = absentEmployees.map(emp => {
        // Kontrola aktívnych dovoleniek
        const leaveQuery = `
          SELECT lr.leave_type, lr.start_date, lr.end_date, lr.total_days
          FROM leave_requests lr
          WHERE lr.employee_id = ? 
          AND lr.status = 'approved'
          AND ? BETWEEN lr.start_date AND lr.end_date
          LIMIT 1
        `;

        return new Promise((resolve) => {
          // Kontrola víkendu
          const isWeekend = new Date(today).getDay() === 0 || new Date(today).getDay() === 6;
          
          // Kontrola sviatkov
          const isHolidayToday = isHoliday(new Date(today));
          
          if (isWeekend) {
            const dayNames = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];
            const dayName = dayNames[new Date(today).getDay()];
            resolve({
              ...emp,
              reason: 'Pracovný pokoj',
              period: dayName,
              leave_type: 'weekend',
              total_days: 1
            });
          } else if (isHolidayToday) {
            resolve({
              ...emp,
              reason: 'Pracovný pokoj',
              period: 'Sviatok',
              leave_type: 'holiday',
              total_days: 1
            });
          } else {
            // Kontrola dovoleniek a PN
            db.get(leaveQuery, [emp.id, today], (err, leaveRequest) => {
              if (err) {
                console.error('Chyba pri kontrole dovolenky:', err);
                resolve({
                  ...emp,
                  reason: 'Absencia',
                  period: null,
                  leave_type: null
                });
              } else if (leaveRequest) {
                const leaveTypeLabels = {
                  'vacation': 'Dovolenka',
                  'sick_leave': 'PN',
                  'personal_leave': 'Osobná dovolenka',
                  'maternity_leave': 'Materská dovolenka',
                  'paternity_leave': 'Otcovská dovolenka',
                  'unpaid_leave': 'Neplatená dovolenka'
                };
                
                resolve({
                  ...emp,
                  reason: leaveTypeLabels[leaveRequest.leave_type] || 'Dovolenka',
                  period: `${leaveRequest.start_date} - ${leaveRequest.end_date}`,
                  leave_type: leaveRequest.leave_type,
                  total_days: leaveRequest.total_days
                });
              } else {
                resolve({
                  ...emp,
                  reason: 'Absencia',
                  period: null,
                  leave_type: null
                });
              }
            });
          }
        });
      });

      Promise.all(absentWithReasons)
        .then(results => {
          res.json(results);
        })
        .catch(error => {
          console.error('Chyba pri spracovaní neprítomných zamestnancov:', error);
          res.status(500).json({ error: 'Chyba pri spracovaní neprítomných zamestnancov' });
        });
    });
  });
});

// Získanie všetkých aktívnych zamestnancov s informáciou o type dochádzky
router.get('/employees/attendance-status/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const today = new Date().toISOString().split('T')[0];

  try {
    // Najprv získame všetkých aktívnych zamestnancov
    const employees = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          e.id,
          e.first_name,
          e.last_name,
          e.position,
          e.email,
          e.status,
          er.attendance_mode,
          er.employment_start_date,
          er.employment_end_date,
          er.is_active,
          CASE 
            WHEN a.id IS NOT NULL THEN a.status
            ELSE 'absent'
          END as today_status,
          CASE 
            WHEN a.id IS NOT NULL THEN a.check_in
            ELSE NULL
          END as check_in,
          CASE 
            WHEN a.id IS NOT NULL THEN a.check_out
            ELSE NULL
          END as check_out
        FROM employees e
        LEFT JOIN employment_relations er ON e.id = er.employee_id AND er.is_active = 1
        LEFT JOIN attendance a ON e.id = a.employee_id AND a.date = ? AND a.company_id = ?
        WHERE e.company_id = ? 
        AND e.status = 'active'
        AND (er.employment_end_date IS NULL OR er.employment_end_date >= ?)
        ORDER BY e.last_name, e.first_name
      `, [today, companyId, companyId, today], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Pre každého zamestnanca skontrolujeme dovolenky a pracovný pokoj
    const employeesWithDetails = await Promise.all(employees.map(async (employee) => {
      // Kontrola schválených dovoleniek
      const leaveRequest = await new Promise((resolve) => {
        db.get(`
          SELECT lr.leave_type, lr.start_date, lr.end_date, lr.total_days, lr.reason
          FROM leave_requests lr
          WHERE lr.employee_id = ? 
          AND lr.status = 'approved'
          AND ? BETWEEN lr.start_date AND lr.end_date
          LIMIT 1
        `, [employee.id, today], (err, row) => {
          if (err) {
            console.error('Chyba pri kontrole dovolenky:', err);
            resolve(null);
          } else {
            resolve(row);
          }
        });
      });

      // Kontrola či je dnes pracovný pokoj (sobota, nedeľa alebo sviatok)
      const isWeekend = new Date(today).getDay() === 0 || new Date(today).getDay() === 6;
      
      // Kontrola sviatkov (použijeme existujúcu funkciu z database.js)
      const { isHoliday } = require('../database.js');
      const isHolidayToday = isHoliday(new Date(today));

      let statusDescription = '';
      let statusType = employee.today_status;

      if (leaveRequest) {
        // Zamestnanec má schválenú dovolenku
        const leaveTypeLabels = {
          'vacation': 'Dovolenka',
          'sick_leave': 'PN',
          'personal_leave': 'Osobná dovolenka',
          'maternity_leave': 'Materská dovolenka',
          'paternity_leave': 'Otcovská dovolenka',
          'unpaid_leave': 'Neplatená dovolenka'
        };
        
        statusDescription = `${leaveTypeLabels[leaveRequest.leave_type] || 'Dovolenka'} (${leaveRequest.start_date} - ${leaveRequest.end_date})`;
        if (leaveRequest.reason) {
          statusDescription += ` - ${leaveRequest.reason}`;
        }
        statusType = 'leave';
      } else if (isHolidayToday) {
        // Dnes je sviatok
        statusDescription = 'Pracovný pokoj - Sviatok';
        statusType = 'holiday';
      } else if (isWeekend) {
        // Dnes je víkend
        const dayNames = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];
        const dayName = dayNames[new Date(today).getDay()];
        statusDescription = `Pracovný pokoj - ${dayName}`;
        statusType = 'weekend';
      } else if (employee.today_status === 'absent') {
        // Zamestnanec je neprítomný bez dovolenky
        statusDescription = 'Absencia';
      } else if (employee.today_status === 'present') {
        statusDescription = 'Prítomný';
      } else if (employee.today_status === 'late') {
        statusDescription = 'Meškanie';
      }

      return {
        ...employee,
        status_type: statusType,
        status_description: statusDescription,
        is_weekend: isWeekend,
        is_holiday: isHolidayToday
      };
    }));

    res.json(employeesWithDetails);
  } catch (error) {
    console.error('Chyba pri získavaní zamestnancov s dochádzkou:', error);
    res.status(500).json({ error: 'Chyba pri získavaní zamestnancov' });
  }
});

// Získanie zamestnancov s chýbajúcou dochádzkou
router.get('/employees/missing-attendance/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const today = new Date().toISOString().split('T')[0];

  try {
    // Získame zamestnancov s manuálnou dochádzkou, ktorí nemajú zaznamenanú dochádzku
    const employees = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          e.id,
          e.first_name,
          e.last_name,
          e.email,
          e.position,
          er.attendance_mode,
          er.employment_start_date,
          er.employment_end_date,
          er.work_start_time,
          er.work_end_time,
          er.break_start_time,
          er.break_end_time,
          er.weekly_hours
        FROM employees e
        LEFT JOIN employment_relations er ON e.id = er.employee_id AND er.is_active = 1
        WHERE e.company_id = ? 
        AND e.status = 'active'
        AND er.attendance_mode = 'manual'
        AND (er.employment_end_date IS NULL OR er.employment_end_date >= ?)
        ORDER BY e.last_name, e.first_name
      `, [companyId, today], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Pre každého zamestnanca nájdeme chýbajúce dni
    const employeesWithMissingDates = await Promise.all(employees.map(async (employee) => {
      // Získame všetky dni za posledných 30 dní, kde zamestnanec nemá zaznamenanú dochádzku
      const missingDates = [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (let d = new Date(thirtyDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Preskočíme víkendy a sviatky
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const isHolidayToday = isHoliday(d);
        
        if (isWeekend || isHolidayToday) continue;

        // Skontrolujeme, či zamestnanec má zaznamenanú dochádzku pre tento deň
        const hasAttendance = await new Promise((resolve) => {
          db.get(`
            SELECT id FROM attendance 
            WHERE employee_id = ? AND company_id = ? AND date = ?
          `, [employee.id, companyId, dateStr], (err, row) => {
            if (err) {
              console.error('Chyba pri kontrole dochádzky:', err);
              resolve(false);
            } else {
              resolve(!!row);
            }
          });
        });

        // Skontrolujeme, či zamestnanec má schválenú dovolenku pre tento deň
        const hasLeave = await new Promise((resolve) => {
          db.get(`
            SELECT id FROM leave_requests 
            WHERE employee_id = ? AND status = 'approved' AND ? BETWEEN start_date AND end_date
          `, [employee.id, dateStr], (err, row) => {
            if (err) {
              console.error('Chyba pri kontrole dovolenky:', err);
              resolve(false);
            } else {
              resolve(!!row);
            }
          });
        });

        // Ak nemá dochádzku ani dovolenku, je to chýbajúci deň
        if (!hasAttendance && !hasLeave) {
          missingDates.push(dateStr);
        }
      }

      return {
        ...employee,
        missing_dates: missingDates
      };
    }));

    // Filtrujeme len zamestnancov s chýbajúcimi dňami
    const employeesWithMissingAttendance = employeesWithMissingDates.filter(emp => emp.missing_dates.length > 0);

    res.json(employeesWithMissingAttendance);
  } catch (error) {
    console.error('Chyba pri získavaní zamestnancov s chýbajúcou dochádzkou:', error);
    res.status(500).json({ error: 'Chyba pri získavaní zamestnancov s chýbajúcou dochádzkou' });
  }
});

// Zaznamenanie dochádzky
router.post('/attendance/record', authenticateToken, async (req, res) => {
  const {
    employee_id,
    company_id,
    date,
    attendance_type,
    start_time,
    end_time,
    break_minutes = 0,
    note,
    recorded_by
  } = req.body;

  try {
    // Validácia vstupných dát
    if (!employee_id || !company_id || !date || !attendance_type) {
      return res.status(400).json({ error: 'Chýbajú povinné údaje' });
    }

    // Skontrolujeme, či už existuje dochádzka pre tento deň
    const existingAttendance = await new Promise((resolve, reject) => {
      db.get(`
        SELECT id FROM attendance 
        WHERE employee_id = ? AND company_id = ? AND date = ?
      `, [employee_id, company_id, date], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingAttendance) {
      return res.status(400).json({ error: 'Dochádzka pre tento deň už existuje' });
    }

    // Vypočítame celkové hodiny ak je zamestnanec prítomný
    let totalHours = 0;
    let checkInISO = null;
    let checkOutISO = null;
    
    if (attendance_type === 'present' && start_time && end_time) {
      // Ukladáme lokálny čas bez konverzie do UTC
      checkInISO = `${date}T${start_time.length === 5 ? start_time + ':00' : start_time}`;
      checkOutISO = `${date}T${end_time.length === 5 ? end_time + ':00' : end_time}`;
      
      const start = new Date(`2000-01-01T${start_time}`);
      const end = new Date(`2000-01-01T${end_time}`);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      totalHours = Math.max(0, diffHours - (break_minutes / 60));
    }

    // Určíme status na základe typu dochádzky
    let status = 'present';
    if (attendance_type === 'absent') status = 'absent';
    else if (attendance_type === 'leave') status = 'vacation';
    else if (attendance_type === 'sick_leave') status = 'sick_leave';

    // Vložíme dochádzku
    const result = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO attendance (
          employee_id, company_id, date, check_in, check_out, 
          total_hours, break_minutes, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        employee_id, company_id, date, checkInISO, checkOutISO,
        totalHours, break_minutes, status, note
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });

    res.json({
      id: result.id,
      message: 'Dochádzka bola úspešne zaznamenaná'
    });

  } catch (error) {
    console.error('Chyba pri zaznamenávaní dochádzky:', error);
    res.status(500).json({ error: 'Chyba pri zaznamenávaní dochádzky' });
  }
});

// Upsert/úprava dochádzky pre konkrétny deň (len admin/accountant/majiteľ firmy)
router.put('/attendance/day', authenticateToken, async (req, res) => {
  const {
    employee_id,
    company_id,
    date,
    attendance_type, // 'present' | 'absent' | 'leave' | 'sick_leave'
    start_time,
    end_time,
    break_minutes = 0,
    note
  } = req.body;

  try {
    if (!employee_id || !company_id || !date || !attendance_type) {
      return res.status(400).json({ error: 'Chýbajú povinné údaje' });
    }

    // Oprávnenia
    const allowed = await canEditAttendance(db, req.user, company_id);
    if (!allowed) {
      return res.status(403).json({ error: 'Nemáte oprávnenie na úpravu dochádzky' });
    }

    // Uzatvorené mzdové obdobie
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const payroll = await new Promise((resolve, reject) => {
      db.get(`SELECT is_closed FROM payroll_periods WHERE company_id = ? AND year = ? AND month = ?`, [company_id, year, month], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
    if (payroll && payroll.is_closed === 1) {
      return res.status(400).json({ error: `Mzdové obdobie ${month}/${year} je uzatvorené. Úprava nie je povolená.` });
    }

    // Prepočty
    let totalHours = 0;
    let checkInISO = null;
    let checkOutISO = null;
    const normalizedBreak = Number(break_minutes) || 0;
    if (attendance_type === 'present' && start_time && end_time) {
      // Ukladáme lokálny čas bez konverzie do UTC
      checkInISO = `${date}T${start_time.length === 5 ? start_time + ':00' : start_time}`;
      checkOutISO = `${date}T${end_time.length === 5 ? end_time + ':00' : end_time}`;
      const start = new Date(`2000-01-01T${start_time}`);
      const end = new Date(`2000-01-01T${end_time}`);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      totalHours = Math.max(0, diffHours - (normalizedBreak / 60));
    }

    // Mapovanie typu na status
    let status = 'present';
    if (attendance_type === 'absent') status = 'absent';
    else if (attendance_type === 'leave') status = 'vacation';
    else if (attendance_type === 'sick_leave') status = 'sick_leave';

    // Upsert: ak existuje záznam pre deň, update, inak insert
    const existing = await new Promise((resolve, reject) => {
      db.get(`SELECT id FROM attendance WHERE employee_id = ? AND company_id = ? AND date = ?`, [employee_id, company_id, date], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });

    if (existing) {
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE attendance SET 
            check_in = ?,
            check_out = ?,
            total_hours = ?,
            break_minutes = ?,
            status = ?,
            notes = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [checkInISO, checkOutISO, totalHours, normalizedBreak, status, note || null, existing.id], function(err) {
          if (err) reject(err); else resolve();
        });
      });
      return res.json({ id: existing.id, message: 'Dochádzka upravená' });
    } else {
      const inserted = await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO attendance (
            employee_id, company_id, date, check_in, check_out,
            total_hours, break_minutes, status, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [employee_id, company_id, date, checkInISO, checkOutISO, totalHours, normalizedBreak, status, note || null], function(err) {
          if (err) reject(err); else resolve({ id: this.lastID });
        });
      });
      return res.json({ id: inserted.id, message: 'Dochádzka vytvorená' });
    }
  } catch (error) {
    console.error('Chyba pri upserte dochádzky:', error);
    return res.status(500).json({ error: 'Chyba pri ukladaní dochádzky' });
  }
});

module.exports = router;
