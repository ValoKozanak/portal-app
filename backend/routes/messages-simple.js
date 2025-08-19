const express = require('express');
const { db } = require('../database-simple');

const router = express.Router();

// Získanie všetkých správ pre používateľa
router.get('/user/:userEmail', (req, res) => {
  const { userEmail } = req.params;
  
  db.all(`
    SELECT m.*, 
           s.name as sender_name,
           r.name as recipient_name
    FROM messages m
    LEFT JOIN users s ON m.sender_email = s.email
    LEFT JOIN users r ON m.recipient_email = r.email
    WHERE m.recipient_email = ?
    ORDER BY m.created_at DESC
  `, [userEmail], (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní správ' });
    }
    res.json(messages);
  });
});

// Získanie všetkých správ pre firmu
router.get('/company/:companyId', (req, res) => {
  const { companyId } = req.params;
  
  // Najprv zistíme email firmy
  db.get('SELECT email FROM users WHERE id = ?', [companyId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní firmy' });
    }
    if (!user) {
      return res.status(404).json({ error: 'Firma nenájdená' });
    }
    
    // Získame správy pre email firmy
    db.all(`
      SELECT m.*, 
             s.name as sender_name,
             r.name as recipient_name
      FROM messages m
      LEFT JOIN users s ON m.sender_email = s.email
      LEFT JOIN users r ON m.recipient_email = r.email
      WHERE m.recipient_email = ?
      ORDER BY m.created_at DESC
    `, [user.email], (err, messages) => {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri načítaní správ' });
      }
      res.json(messages);
    });
  });
});

// Získanie všetkých správ (pre admin)
router.get('/admin/all', (req, res) => {
  db.all(`
    SELECT m.*, 
           s.name as sender_name,
           r.name as recipient_name
    FROM messages m
    LEFT JOIN users s ON m.sender_email = s.email
    LEFT JOIN users r ON m.recipient_email = r.email
    ORDER BY m.created_at DESC
  `, [], (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní správ' });
    }
    res.json(messages);
  });
});

// Vytvorenie novej správy
router.post('/', (req, res) => {
  const { subject, content, sender_email, recipient_email } = req.body;
  
  console.log('Prijatá správa:', { subject, content, sender_email, recipient_email });
  
  if (!subject || !content || !sender_email || !recipient_email) {
    console.log('Chýbajúce polia:', { subject: !!subject, content: !!content, sender_email: !!sender_email, recipient_email: !!recipient_email });
    return res.status(400).json({ error: 'Všetky polia sú povinné' });
  }
  
  db.run(`
    INSERT INTO messages (subject, content, sender_email, recipient_email)
    VALUES (?, ?, ?, ?)
  `, [subject, content, sender_email, recipient_email], function(err) {
    if (err) {
      console.error('Chyba pri vkladaní správy:', err);
      return res.status(500).json({ error: 'Chyba pri odosielaní správy' });
    }
    
    console.log('Správa úspešne vložená, ID:', this.lastID);
    res.json({ 
      message: 'Správa odoslaná úspešne', 
      messageId: this.lastID 
    });
  });
});

// Označenie správy ako prečítaná
router.patch('/:id/read', (req, res) => {
  const { id } = req.params;
  
  db.run('UPDATE messages SET is_read = 1 WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri označení správy' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Správa nenájdená' });
    }
    res.json({ message: 'Správa označená ako prečítaná' });
  });
});

// Označenie správy ako neprečítaná
router.patch('/:id/unread', (req, res) => {
  const { id } = req.params;
  
  db.run('UPDATE messages SET is_read = 0 WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri označení správy' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Správa nenájdená' });
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
      return res.status(404).json({ error: 'Správa nenájdená' });
    }
    res.json({ message: 'Správa vymazaná úspešne' });
  });
});

// Získanie počtu neprečítaných správ
router.get('/unread-count/:userEmail', (req, res) => {
  const { userEmail } = req.params;
  
  db.get('SELECT COUNT(*) as count FROM messages WHERE recipient_email = ? AND is_read = 0', [userEmail], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri počítaní správ' });
    }
    res.json({ count: result.count });
  });
});

module.exports = router;
