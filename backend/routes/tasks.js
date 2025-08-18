const express = require('express');
const { db } = require('../database');
const emailService = require('../services/emailService');

const router = express.Router();

// Získanie všetkých úloh (pre admin)
router.get('/', (req, res) => {
  db.all(`
    SELECT * FROM tasks 
    ORDER BY created_at DESC
  `, [], (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní úloh' });
    }
    res.json(tasks);
  });
});

// Získanie úloh pre firmu
router.get('/company/:companyId', (req, res) => {
  const { companyId } = req.params;

  db.all(`
    SELECT * FROM tasks 
    WHERE company_id = ?
    ORDER BY created_at DESC
  `, [companyId], (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní úloh' });
    }
    res.json(tasks);
  });
});

// Získanie úloh pre účtovníka
router.get('/accountant/:accountantEmail', (req, res) => {
  const { accountantEmail } = req.params;

  db.all(`
    SELECT * FROM tasks 
    WHERE assigned_to = ?
    ORDER BY created_at DESC
  `, [accountantEmail], (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní úloh' });
    }
    res.json(tasks);
  });
});

// Vytvorenie novej úlohy
router.post('/', (req, res) => {
  const {
    title, description, status, priority, assigned_to,
    company_id, company_name, created_by, due_date
  } = req.body;

  db.run(`
    INSERT INTO tasks (
      title, description, status, priority, assigned_to,
      company_id, company_name, created_by, due_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [title, description, status, priority, assigned_to,
      company_id, company_name, created_by, due_date],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri vytváraní úlohy' });
      }

      // Poslanie email notifikácie
      if (assigned_to && assigned_to !== created_by) {
        // Získanie mena priradeného používateľa
        db.get('SELECT name FROM users WHERE email = ?', [assigned_to], (err, user) => {
          if (!err && user) {
            emailService.sendTaskNotification(
              assigned_to,
              user.name,
              title,
              description || 'Bez popisu',
              company_name
            ).catch(error => {
              console.error('Email notification error:', error);
            });
          }
        });
      }

      res.json({ 
        message: 'Úloha vytvorená úspešne', 
        taskId: this.lastID 
      });
    }
  );
});

// Aktualizácia úlohy
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    title, description, status, priority, assigned_to, due_date
  } = req.body;

  db.run(`
    UPDATE tasks SET
      title = ?, description = ?, status = ?, priority = ?,
      assigned_to = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [title, description, status, priority, assigned_to, due_date, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri aktualizácii úlohy' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Úloha nebola nájdená' });
      }

      res.json({ message: 'Úloha aktualizovaná úspešne' });
    }
  );
});

// Aktualizácia statusu úlohy
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.run(`
    UPDATE tasks SET
      status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [status, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri aktualizácii statusu' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Úloha nebola nájdená' });
    }

    res.json({ message: 'Status úlohy aktualizovaný úspešne' });
  });
});

// Vymazanie úlohy
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri mazaní úlohy' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Úloha nebola nájdená' });
    }

    res.json({ message: 'Úloha vymazaná úspešne' });
  });
});

module.exports = router;
