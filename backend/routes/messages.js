const express = require('express');
const { db } = require('../database');

const router = express.Router();

console.log('Messages routes loaded successfully!');



// Vytvorenie novej správy
router.post('/', (req, res) => {
  const {
    sender_email,
    recipient_email,
    subject,
    content,
    user_id,
    message_type = 'general'
  } = req.body;

  if (!sender_email || !recipient_email || !subject || !content) {
    return res.status(400).json({ error: 'Všetky povinné polia musia byť vyplnené' });
  }

  db.run(`
    INSERT INTO messages (
      sender_email, recipient_email, subject, content, 
      user_id, message_type, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [sender_email, recipient_email, subject, content, user_id, message_type],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri vytváraní správy' });
      }

      res.json({
        message: 'Správa odoslaná úspešne',
        messageId: this.lastID
      });
    }
  );
});

// Získanie všetkých správ pre používateľa
router.get('/user/:userEmail', (req, res) => {
  const { userEmail } = req.params;

  const query = `
    SELECT m.*, 
           u1.name as sender_name,
           u2.name as recipient_name,
           c.name as company_name
    FROM messages m
    LEFT JOIN users u1 ON m.sender_email = u1.email
    LEFT JOIN users u2 ON m.recipient_email = u2.email
    LEFT JOIN users c ON m.user_id = c.id
    WHERE m.sender_email = ? OR m.recipient_email = ?
    ORDER BY m.created_at DESC
  `;

  db.all(query, [userEmail, userEmail], (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní správ' });
    }

    res.json(messages);
  });
});

// Získanie všetkých správ pre firmu
router.get('/company/:companyId', (req, res) => {
  const { companyId } = req.params;

  const query = `
    SELECT m.*, 
           u1.name as sender_name,
           u2.name as recipient_name,
           c.name as company_name
    FROM messages m
    LEFT JOIN users u1 ON m.sender_email = u1.email
    LEFT JOIN users u2 ON m.recipient_email = u2.email
    LEFT JOIN users c ON m.user_id = c.id
    WHERE m.user_id = ?
    ORDER BY m.created_at DESC
  `;

  db.all(query, [companyId], (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní správ' });
    }

    res.json(messages);
  });
});

// Získanie všetkých správ (pre admin)
router.get('/admin/all', (req, res) => {
  const query = `
    SELECT m.*, 
           u1.name as sender_name,
           u2.name as recipient_name,
           c.name as company_name
    FROM messages m
    LEFT JOIN users u1 ON m.sender_email = u1.email
    LEFT JOIN users u2 ON m.recipient_email = u2.email
    LEFT JOIN users c ON m.user_id = c.id
    ORDER BY m.created_at DESC
  `;

  db.all(query, [], (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní správ' });
    }

    res.json(messages);
  });
});

// Označenie správy ako prečítaná
router.patch('/:id/read', (req, res) => {
  const { id } = req.params;

  db.run('UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri označení správy ako prečítaná' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Správa nebola nájdená' });
    }

    res.json({ message: 'Správa označená ako prečítaná' });
  });
});

// Označenie správy ako neprečítaná
router.patch('/:id/unread', (req, res) => {
  const { id } = req.params;

  db.run('UPDATE messages SET read_at = NULL WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri označení správy ako neprečítaná' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Správa nebola nájdená' });
    }

    res.json({ message: 'Správa označená ako neprečítaná' });
  });
});

// Vymazanie správy
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM messages WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri vymazaní správy' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Správa nebola nájdená' });
    }

    res.json({ message: 'Správa vymazaná úspešne' });
  });
});

// Získanie počtu neprečítaných správ pre používateľa
router.get('/user/:userEmail/unread-count', (req, res) => {
  const { userEmail } = req.params;

  const query = `
    SELECT COUNT(*) as count
    FROM messages 
    WHERE recipient_email = ? AND read_at IS NULL
  `;

  db.get(query, [userEmail], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri získaní počtu neprečítaných správ' });
    }

    res.json({ unreadCount: result.count });
  });
});

module.exports = router;
