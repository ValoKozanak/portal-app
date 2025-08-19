const express = require('express');
const { db } = require('../database-simple');

const router = express.Router();

// Získanie všetkých úloh pre firmu
router.get('/company/:companyId', (req, res) => {
  const { companyId } = req.params;

  db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [companyId], (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní úloh' });
    }

    res.json(tasks);
  });
});

// Vytvorenie novej úlohy
router.post('/', (req, res) => {
  const { title, description, status, priority, assigned_to, user_id, company_name, created_by, due_date } = req.body;

  db.run(`
    INSERT INTO tasks (title, description, status, priority, assigned_to, user_id, company_name, created_by, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [title, description, status, priority, assigned_to, user_id, company_name, created_by, due_date],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri vytváraní úlohy' });
      }

      res.json({ message: 'Úloha vytvorená úspešne', taskId: this.lastID });
    }
  );
});

// Aktualizácia úlohy
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, assigned_to, due_date } = req.body;

  db.run(`
    UPDATE tasks 
    SET title = ?, description = ?, status = ?, priority = ?, assigned_to = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [title, description, status, priority, assigned_to, due_date, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri aktualizácii úlohy' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Úloha nenájdená' });
      }

      res.json({ message: 'Úloha aktualizovaná úspešne' });
    }
  );
});

// Vymazanie úlohy
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri vymazaní úlohy' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Úloha nenájdená' });
    }

    res.json({ message: 'Úloha vymazaná úspešne' });
  });
});

// Získanie všetkých úloh (pre admin)
router.get('/', (req, res) => {
  const query = `
    SELECT t.*, u.company_name as company_name
    FROM tasks t
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
  `;

  db.all(query, [], (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní úloh' });
    }

    res.json(tasks);
  });
});

// Získanie úloh pre účtovníka
router.get('/accountant/:accountantEmail', (req, res) => {
  const { accountantEmail } = req.params;

  const query = `
    SELECT t.*, u.company_name 
    FROM tasks t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN user_accountants ua ON u.id = ua.user_id
    WHERE ua.accountant_email = ?
    ORDER BY t.created_at DESC
  `;

  db.all(query, [accountantEmail], (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní úloh' });
    }

    res.json(tasks);
  });
});

// Aktualizácia statusu úlohy
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.run('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri aktualizácii statusu úlohy' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Úloha nenájdená' });
    }

    res.json({ message: 'Status úlohy aktualizovaný úspešne' });
  });
});

module.exports = router;
