const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

console.log('Messages routes loaded successfully!');

// Middleware pre autentifikáciu
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Prístupový token je vyžadovaný' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Neplatný token' });
    }
    req.user = user;
    next();
  });
};

// Aplikujeme autentifikáciu na všetky routes
router.use(authenticateToken);

// Vytvorenie novej správy
router.post('/', (req, res) => {
  const {
    sender_email,
    recipient_email,
    subject,
    content,
    company_id,
    message_type = 'general'
  } = req.body;

  if (!sender_email || !recipient_email || !subject || !content) {
    return res.status(400).json({ error: 'Všetky povinné polia musia byť vyplnené' });
  }

  db.run(`
    INSERT INTO messages (
      sender_email, recipient_email, subject, content, 
      company_id, message_type, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [sender_email, recipient_email, subject, content, company_id, message_type],
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
    LEFT JOIN companies c ON m.company_id = c.id
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
    LEFT JOIN companies c ON m.company_id = c.id
    WHERE m.company_id = ?
    AND (
      -- Správy od Admin
      u1.role = 'admin'
      -- Správy od Accountant
      OR u1.role = 'accountant'
      -- Správy od zamestnancov vlastnej firmy
      OR EXISTS (
        SELECT 1 FROM employment_relations er 
        WHERE er.employee_id = u1.id 
        AND er.company_id = ?
        AND er.is_active = 1
      )
      -- Správy od vlastnej firmy (company owner)
      OR m.sender_email = (SELECT owner_email FROM companies WHERE id = ?)
    )
    ORDER BY m.created_at DESC
  `;

  db.all(query, [companyId, companyId, companyId], (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní správ' });
    }

    res.json(messages);
  });
});

// Získanie všetkých správ pre zamestnanca
router.get('/employee/:employeeEmail', (req, res) => {
  const { employeeEmail } = req.params;

  const query = `
    SELECT m.*, 
           u1.name as sender_name,
           u2.name as recipient_name,
           c.name as company_name
    FROM messages m
    LEFT JOIN users u1 ON m.sender_email = u1.email
    LEFT JOIN users u2 ON m.recipient_email = u2.email
    LEFT JOIN companies c ON m.company_id = c.id
    WHERE m.sender_email = ? OR m.recipient_email = ?
    ORDER BY m.created_at DESC
  `;

  db.all(query, [employeeEmail, employeeEmail], (err, messages) => {
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
    LEFT JOIN companies c ON m.company_id = c.id
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

// Získanie neprečítaných správ pre používateľa a jeho firmy
router.get('/user/:userEmail/unread', (req, res) => {
  const { userEmail } = req.params;

  const query = `
    SELECT m.*, 
           u1.name as sender_name,
           u2.name as recipient_name,
           c.name as company_name
    FROM messages m
    LEFT JOIN users u1 ON m.sender_email = u1.email
    LEFT JOIN users u2 ON m.recipient_email = u2.email
    LEFT JOIN companies c ON m.company_id = c.id
    WHERE (m.recipient_email = ? OR c.owner_email = ?) AND m.read_at IS NULL
    ORDER BY m.created_at DESC
  `;

  db.all(query, [userEmail, userEmail], (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní neprečítaných správ' });
    }

    res.json(messages);
  });
});

// Získanie počtu neprečítaných správ pre používateľa a jeho firmy
router.get('/user/:userEmail/unread-count', (req, res) => {
  const { userEmail } = req.params;

  const query = `
    SELECT COUNT(*) as count
    FROM messages m
    LEFT JOIN companies c ON m.company_id = c.id
    WHERE (m.recipient_email = ? OR c.owner_email = ?) AND m.read_at IS NULL
  `;

  db.get(query, [userEmail, userEmail], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri získaní počtu neprečítaných správ' });
    }

    res.json({ unreadCount: result.count });
  });
});

// Získanie počtu neprečítaných správ pre konkrétnu firmu
router.get('/company/:companyId/unread-count', (req, res) => {
  const { companyId } = req.params;

  const query = `
    SELECT COUNT(*) as count
    FROM messages m
    LEFT JOIN users u1 ON m.sender_email = u1.email
    WHERE m.company_id = ? 
    AND m.read_at IS NULL
    AND (
      -- Správy od Admin
      u1.role = 'admin'
      -- Správy od Accountant
      OR u1.role = 'accountant'
      -- Správy od zamestnancov vlastnej firmy
      OR EXISTS (
        SELECT 1 FROM employment_relations er 
        WHERE er.employee_id = u1.id 
        AND er.company_id = ?
        AND er.is_active = 1
      )
      -- Správy od vlastnej firmy (company owner)
      OR m.sender_email = (SELECT owner_email FROM companies WHERE id = ?)
    )
  `;

  db.get(query, [companyId, companyId, companyId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri získaní počtu neprečítaných správ pre firmu' });
    }

    res.json({ unreadCount: result.count });
  });
});

// Získanie rozlíšeného počtu neprečítaných správ (prijaté vs čakajúce na odpoveď)
router.get('/user/:userEmail/unread-counts', (req, res) => {
  const { userEmail } = req.params;

  // Počet prijatých neprečítaných správ (kde je používateľ príjemcom)
  const receivedQuery = `
    SELECT COUNT(*) as count
    FROM messages m
    LEFT JOIN companies c ON m.company_id = c.id
    WHERE (m.recipient_email = ? OR c.owner_email = ?) AND m.read_at IS NULL
  `;

  // Počet odoslaných správ, ktoré príjemca ešte neprečítal (čakajúce na odpoveď)
  const pendingQuery = `
    SELECT COUNT(*) as count
    FROM messages m
    WHERE m.sender_email = ? AND m.read_at IS NULL AND m.recipient_email != ?
  `;

  db.get(receivedQuery, [userEmail, userEmail], (err, receivedResult) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri získaní počtu prijatých neprečítaných správ' });
    }

    db.get(pendingQuery, [userEmail, userEmail], (err, pendingResult) => {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri získaní počtu správ čakajúcich na odpoveď' });
      }

      const receivedUnreadCount = receivedResult.count;
      const pendingCount = pendingResult.count;
      const totalUnreadCount = receivedUnreadCount + pendingCount;

      res.json({ 
        receivedUnreadCount, 
        sentUnreadCount: pendingCount, // Zachovávame kompatibilitu s frontend
        totalUnreadCount 
      });
    });
  });
});

// Získanie rozlíšeného počtu neprečítaných správ pre konkrétnu firmu
router.get('/company/:companyId/unread-counts', (req, res) => {
  const { companyId } = req.params;

  // Počet prijatých neprečítaných správ pre firmu (len od autorizovaných odosielateľov)
  const receivedQuery = `
    SELECT COUNT(*) as count
    FROM messages m
    LEFT JOIN users u1 ON m.sender_email = u1.email
    WHERE m.company_id = ? 
    AND m.read_at IS NULL
    AND (
      -- Správy od Admin
      u1.role = 'admin'
      -- Správy od Accountant
      OR u1.role = 'accountant'
      -- Správy od zamestnancov vlastnej firmy
      OR EXISTS (
        SELECT 1 FROM employment_relations er 
        WHERE er.employee_id = u1.id 
        AND er.company_id = ?
        AND er.is_active = 1
      )
      -- Správy od vlastnej firmy (company owner)
      OR m.sender_email = (SELECT owner_email FROM companies WHERE id = ?)
    )
  `;

  db.get(receivedQuery, [companyId, companyId, companyId], (err, receivedResult) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri získaní počtu neprečítaných správ pre firmu' });
    }

    const receivedUnreadCount = receivedResult.count;
    const totalUnreadCount = receivedUnreadCount;

    res.json({ 
      receivedUnreadCount, 
      sentUnreadCount: 0, // Pre firmu nepočítame odoslané správy
      totalUnreadCount 
    });
  });
});

// Označenie správy ako prečítaná
router.patch('/:messageId/read', (req, res) => {
  const { messageId } = req.params;

  db.run(`
    UPDATE messages 
    SET read_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `, [messageId], function(err) {
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
router.patch('/:messageId/unread', (req, res) => {
  const { messageId } = req.params;

  db.run(`
    UPDATE messages 
    SET read_at = NULL 
    WHERE id = ?
  `, [messageId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri označení správy ako neprečítaná' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Správa nebola nájdená' });
    }

    res.json({ message: 'Správa označená ako neprečítaná' });
  });
});

module.exports = router;
