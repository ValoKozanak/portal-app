const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { sendAttendanceNotification } = require('../services/emailService');

// GET - Získanie dochádzky pre zamestnanca
router.get('/employee/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  const { startDate, endDate } = req.query;

  let query = `
    SELECT a.*, e.first_name, e.last_name, e.email, e.position, e.employee_id
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    WHERE a.employee_id = ?
  `;
  let params = [employeeId];

  if (startDate && endDate) {
    query += ' AND a.date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  query += ' ORDER BY a.date DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Chyba pri získavaní dochádzky:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní dochádzky' });
    }
    res.json(rows);
  });
});

// GET - Získanie dochádzky pre firmu
router.get('/company/:companyId', (req, res) => {
  const { companyId } = req.params;
  const { startDate, endDate, employeeId } = req.query;

  let query = `
    SELECT a.*, e.first_name, e.last_name, e.email, e.position, e.employee_id
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    WHERE a.user_id = ?
  `;
  let params = [companyId];

  if (startDate && endDate) {
    query += ' AND a.date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  if (employeeId) {
    query += ' AND a.employee_id = ?';
    params.push(employeeId);
  }

  query += ' ORDER BY a.date DESC, e.last_name, e.first_name';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Chyba pri získavaní dochádzky firmy:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní dochádzky firmy' });
    }
    res.json(rows);
  });
});

// POST - Príchod zamestnanca
router.post('/clock-in', (req, res) => {
  const { employeeId, companyId, notes } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  // Kontrola, či už zamestnanec nemá záznam pre dnešný deň
  db.get(
    'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
    [employeeId, today],
    (err, existingRecord) => {
      if (err) {
        console.error('Chyba pri kontrole existujúceho záznamu:', err);
        return res.status(500).json({ error: 'Chyba pri zaznamenávaní príchodu' });
      }

      if (existingRecord) {
        return res.status(400).json({ error: 'Zamestnanec už má záznam pre dnešný deň' });
      }

      // Vloženie nového záznamu
      db.run(
        `INSERT INTO attendance (
          employee_id, user_id, date, clock_in, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'present', ?, ?, ?)`,
        [employeeId, companyId, today, now, notes || null, now, now],
        function(err) {
          if (err) {
            console.error('Chyba pri zaznamenávaní príchodu:', err);
            return res.status(500).json({ error: 'Chyba pri zaznamenávaní príchodu' });
          }

          // Získanie informácií o zamestnancovi pre notifikáciu
          db.get(
            'SELECT e.*, u.company_name FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = ?',
            [employeeId],
            (err, employee) => {
              if (!err && employee) {
                sendAttendanceNotification('clock_in', employee);
              }
            }
          );

          res.json({
            id: this.lastID,
            message: 'Príchod úspešne zaznamenaný',
            clockIn: now
          });
        }
      );
    }
  );
});

// POST - Odchod zamestnanca
router.post('/clock-out', (req, res) => {
  const { employeeId, notes } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  // Získanie existujúceho záznamu
  db.get(
    'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
    [employeeId, today],
    (err, record) => {
      if (err) {
        console.error('Chyba pri získavaní záznamu:', err);
        return res.status(500).json({ error: 'Chyba pri zaznamenávaní odchodu' });
      }

      if (!record) {
        return res.status(400).json({ error: 'Zamestnanec nemá záznam príchodu pre dnešný deň' });
      }

      if (record.clock_out) {
        return res.status(400).json({ error: 'Zamestnanec už má zaznamenaný odchod' });
      }

      // Výpočet odpracovaných hodín
      const clockIn = new Date(record.clock_in);
      const clockOut = new Date(now);
      const totalHours = ((clockOut - clockIn) / (1000 * 60 * 60)).toFixed(2);
      const overtimeHours = Math.max(0, totalHours - 8).toFixed(2);

      // Aktualizácia záznamu
      db.run(
        `UPDATE attendance SET 
          clock_out = ?, 
          total_hours = ?, 
          overtime_hours = ?, 
          notes = CASE WHEN notes IS NULL THEN ? ELSE notes || ' | ' || ? END,
          updated_at = ?
        WHERE id = ?`,
        [now, totalHours, overtimeHours, notes || null, notes || null, now, record.id],
        function(err) {
          if (err) {
            console.error('Chyba pri zaznamenávaní odchodu:', err);
            return res.status(500).json({ error: 'Chyba pri zaznamenávaní odchodu' });
          }

          // Získanie informácií o zamestnancovi pre notifikáciu
          db.get(
            'SELECT e.*, u.company_name FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = ?',
            [employeeId],
            (err, employee) => {
              if (!err && employee) {
                sendAttendanceNotification('clock_out', employee, { totalHours, overtimeHours });
              }
            }
          );

          res.json({
            message: 'Odchod úspešne zaznamenaný',
            clockOut: now,
            totalHours: parseFloat(totalHours),
            overtimeHours: parseFloat(overtimeHours)
          });
        }
      );
    }
  );
});

// GET - Získanie zamestnancov firmy
router.get('/employees/:companyId', (req, res) => {
  const { companyId } = req.params;

  db.all(
    'SELECT * FROM employees WHERE user_id = ? AND is_active = 1 ORDER BY last_name, first_name',
    [companyId],
    (err, rows) => {
      if (err) {
        console.error('Chyba pri získavaní zamestnancov:', err);
        return res.status(500).json({ error: 'Chyba pri získavaní zamestnancov' });
      }
      res.json(rows);
    }
  );
});

// POST - Pridanie nového zamestnanca
router.post('/employees', (req, res) => {
  const { companyId, firstName, lastName, email, position, employeeId, hireDate } = req.body;

  db.run(
    `INSERT INTO employees (
      user_id, first_name, last_name, email, position, employee_id, hire_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [companyId, firstName, lastName, email, position, employeeId, hireDate],
    function(err) {
      if (err) {
        console.error('Chyba pri pridávaní zamestnanca:', err);
        return res.status(500).json({ error: 'Chyba pri pridávaní zamestnanca' });
      }
      res.json({
        id: this.lastID,
        message: 'Zamestnanec úspešne pridaný'
      });
    }
  );
});

// PUT - Aktualizácia zamestnanca
router.put('/employees/:id', (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, position, employeeId, hireDate, isActive } = req.body;

  db.run(
    `UPDATE employees SET 
      first_name = ?, last_name = ?, email = ?, position = ?, 
      employee_id = ?, hire_date = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [firstName, lastName, email, position, employeeId, hireDate, isActive, id],
    function(err) {
      if (err) {
        console.error('Chyba pri aktualizácii zamestnanca:', err);
        return res.status(500).json({ error: 'Chyba pri aktualizácii zamestnanca' });
      }
      res.json({ message: 'Zamestnanec úspešne aktualizovaný' });
    }
  );
});

// GET - Export dochádzky do CSV
router.get('/export/:companyId', (req, res) => {
  const { companyId } = req.params;
  const { startDate, endDate, format = 'csv' } = req.query;

  let query = `
    SELECT 
      e.employee_id,
      e.first_name,
      e.last_name,
      e.position,
      a.date,
      a.clock_in,
      a.clock_out,
      a.total_hours,
      a.overtime_hours,
      a.status,
      a.notes
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    WHERE a.user_id = ?
  `;
  let params = [companyId];

  if (startDate && endDate) {
    query += ' AND a.date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  query += ' ORDER BY a.date DESC, e.last_name, e.first_name';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Chyba pri exporte dochádzky:', err);
      return res.status(500).json({ error: 'Chyba pri exporte dochádzky' });
    }

    if (format === 'csv') {
      // CSV export
      const csvHeader = 'Employee ID,First Name,Last Name,Position,Date,Clock In,Clock Out,Total Hours,Overtime Hours,Status,Notes\n';
      const csvData = rows.map(row => 
        `"${row.employee_id || ''}","${row.first_name || ''}","${row.last_name || ''}","${row.position || ''}","${row.date || ''}","${row.clock_in || ''}","${row.clock_out || ''}","${row.total_hours || ''}","${row.overtime_hours || ''}","${row.status || ''}","${row.notes || ''}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="dochadzka_${companyId}_${startDate || 'all'}_${endDate || 'all'}.csv"`);
      res.send(csvHeader + csvData);
    } else {
      // JSON export
      res.json(rows);
    }
  });
});

// GET - Štatistiky dochádzky
router.get('/stats/:companyId', (req, res) => {
  const { companyId } = req.params;
  const { startDate, endDate } = req.query;

  let dateFilter = '';
  let params = [companyId];

  if (startDate && endDate) {
    dateFilter = ' AND a.date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  const query = `
    SELECT 
      COUNT(DISTINCT a.employee_id) as total_employees,
      COUNT(a.id) as total_records,
      AVG(a.total_hours) as avg_hours,
      SUM(a.overtime_hours) as total_overtime,
      COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
      COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days
    FROM attendance a
    WHERE a.user_id = ? ${dateFilter}
  `;

  db.get(query, params, (err, stats) => {
    if (err) {
      console.error('Chyba pri získavaní štatistík:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní štatistík' });
    }
    res.json(stats);
  });
});

module.exports = router;
