const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Middleware pre autentifikáciu
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Prístupový token je povinný' });
  }

  // Pre jednoduchosť akceptujeme akýkoľvek token
  // V produkcii by sa mal overovať JWT token
  next();
};

// Získanie mzdových období pre firmu
router.get('/periods/:companyId', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { year } = req.query;

  let query = `
    SELECT * FROM payroll_periods 
    WHERE company_id = ?
  `;
  let params = [companyId];

  if (year) {
    query += ' AND year = ?';
    params.push(year);
  }

  query += ' ORDER BY year DESC, month DESC';

  db.all(query, params, (err, periods) => {
    if (err) {
      console.error('Chyba pri získavaní mzdových období:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní mzdových období' });
    }
    
    res.json(periods);
  });
});

// Získanie aktuálneho neuzatvoreného obdobia
router.get('/periods/:companyId/current', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  db.get(`
    SELECT * FROM payroll_periods 
    WHERE company_id = ? AND year = ? AND month = ?
  `, [companyId, currentYear, currentMonth], (err, period) => {
    if (err) {
      console.error('Chyba pri získavaní aktuálneho obdobia:', err);
      return res.status(500).json({ error: 'Chyba pri získavaní aktuálneho obdobia' });
    }
    
    res.json(period);
  });
});

// Uzatvorenie mzdového obdobia
router.post('/periods/:companyId/close', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { year, month, closedBy } = req.body;

  // Kontrola či je možné uzatvoriť obdobie (len minulé mesiace)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  if (year > currentYear || (year === currentYear && month >= currentMonth)) {
    return res.status(400).json({ 
      error: 'Nie je možné uzatvoriť aktuálne alebo budúce obdobie' 
    });
  }

  db.run(`
    UPDATE payroll_periods 
    SET is_closed = 1, closed_at = CURRENT_TIMESTAMP, closed_by = ?, updated_at = CURRENT_TIMESTAMP
    WHERE company_id = ? AND year = ? AND month = ?
  `, [closedBy, companyId, year, month], function(err) {
    if (err) {
      console.error('Chyba pri uzatváraní mzdového obdobia:', err);
      return res.status(500).json({ error: 'Chyba pri uzatváraní mzdového obdobia' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Mzdové obdobie nebolo nájdené' });
    }
    
    res.json({ 
      message: 'Mzdové obdobie úspešne uzatvorené',
      changes: this.changes 
    });
  });
});

// Odomknutie mzdového obdobia
router.post('/periods/:companyId/open', authenticateToken, (req, res) => {
  const { companyId } = req.params;
  const { year, month } = req.body;

  db.run(`
    UPDATE payroll_periods 
    SET is_closed = 0, closed_at = NULL, closed_by = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE company_id = ? AND year = ? AND month = ?
  `, [companyId, year, month], function(err) {
    if (err) {
      console.error('Chyba pri odomknutí mzdového obdobia:', err);
      return res.status(500).json({ error: 'Chyba pri odomknutí mzdového obdobia' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Mzdové obdobie nebolo nájdené' });
    }
    
    res.json({ 
      message: 'Mzdové obdobie úspešne odomknuté',
      changes: this.changes 
    });
  });
});

// Kontrola či je obdobie uzatvorené
router.get('/periods/:companyId/check/:year/:month', authenticateToken, (req, res) => {
  const { companyId, year, month } = req.params;

  db.get(`
    SELECT is_closed FROM payroll_periods 
    WHERE company_id = ? AND year = ? AND month = ?
  `, [companyId, year, month], (err, period) => {
    if (err) {
      console.error('Chyba pri kontrole mzdového obdobia:', err);
      return res.status(500).json({ error: 'Chyba pri kontrole mzdového obdobia' });
    }
    
    res.json({ 
      isClosed: period ? period.is_closed === 1 : false 
    });
  });
});

module.exports = router;
