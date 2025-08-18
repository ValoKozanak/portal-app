const express = require('express');
const { db } = require('../database');

const router = express.Router();

// Získanie všetkých aktívnych firiem (pre admin)
router.get('/', (req, res) => {
  const query = `
    SELECT c.*, 
           GROUP_CONCAT(ca.accountant_email) as assigned_accountants
    FROM companies c
    LEFT JOIN company_accountants ca ON c.id = ca.company_id
    WHERE c.status = 'active'
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;

  db.all(query, [], (err, companies) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní firiem' });
    }

    // Spracovanie assigned_accountants string na array
    const processedCompanies = companies.map(company => ({
      ...company,
      assignedToAccountants: company.assigned_accountants 
        ? company.assigned_accountants.split(',') 
        : []
    }));

    res.json(processedCompanies);
  });
});

// Získanie firiem pre konkrétneho používateľa
router.get('/user/:userEmail', (req, res) => {
  const { userEmail } = req.params;

  const query = `
    SELECT c.*, 
           GROUP_CONCAT(ca.accountant_email) as assigned_accountants
    FROM companies c
    LEFT JOIN company_accountants ca ON c.id = ca.company_id
    WHERE c.owner_email = ? AND c.status = 'active'
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;

  db.all(query, [userEmail], (err, companies) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní firiem' });
    }

    const processedCompanies = companies.map(company => ({
      ...company,
      assignedToAccountants: company.assigned_accountants 
        ? company.assigned_accountants.split(',') 
        : []
    }));

    res.json(processedCompanies);
  });
});

// Získanie firiem pre účtovníka
router.get('/accountant/:accountantEmail', (req, res) => {
  const { accountantEmail } = req.params;

  const query = `
    SELECT c.*, 
           GROUP_CONCAT(ca.accountant_email) as assigned_accountants
    FROM companies c
    INNER JOIN company_accountants ca ON c.id = ca.company_id
    WHERE ca.accountant_email = ? AND c.status = 'active'
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;

  db.all(query, [accountantEmail], (err, companies) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní firiem' });
    }

    const processedCompanies = companies.map(company => ({
      ...company,
      assignedToAccountants: company.assigned_accountants 
        ? company.assigned_accountants.split(',') 
        : []
    }));

    res.json(processedCompanies);
  });
});

// Získanie všetkých firiem (aktívnych aj neaktívnych) pre admin
router.get('/admin/all', (req, res) => {
  const query = `
    SELECT c.*, 
           GROUP_CONCAT(ca.accountant_email) as assigned_accountants
    FROM companies c
    LEFT JOIN company_accountants ca ON c.id = ca.company_id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;

  db.all(query, [], (err, companies) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní všetkých firiem' });
    }

    // Spracovanie assigned_accountants string na array
    const processedCompanies = companies.map(company => ({
      ...company,
      assignedToAccountants: company.assigned_accountants 
        ? company.assigned_accountants.split(',') 
        : []
    }));

    res.json(processedCompanies);
  });
});

// Získanie neaktívnych firiem
router.get('/inactive', (req, res) => {
  const query = `
    SELECT c.*, 
           GROUP_CONCAT(ca.accountant_email) as assigned_accountants
    FROM companies c
    LEFT JOIN company_accountants ca ON c.id = ca.company_id
    WHERE c.status = 'inactive'
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;

  db.all(query, [], (err, companies) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní neaktívnych firiem' });
    }

    const processedCompanies = companies.map(company => ({
      ...company,
      assignedToAccountants: company.assigned_accountants 
        ? company.assigned_accountants.split(',') 
        : []
    }));

    res.json(processedCompanies);
  });
});

// Získanie firmy podľa ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT c.*, 
           GROUP_CONCAT(ca.accountant_email) as assigned_accountants
    FROM companies c
    LEFT JOIN company_accountants ca ON c.id = ca.company_id
    WHERE c.id = ?
    GROUP BY c.id
  `;

  db.get(query, [id], (err, company) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní firmy' });
    }

    if (!company) {
      return res.status(404).json({ error: 'Firma nenájdená' });
    }

    const processedCompany = {
      ...company,
      assignedToAccountants: company.assigned_accountants 
        ? company.assigned_accountants.split(',') 
        : []
    };

    res.json(processedCompany);
  });
});

// Vytvorenie novej firmy
router.post('/', (req, res) => {
  const {
    ico, name, address, business_registry, vat_id, tax_id,
    authorized_person, contact_email, contact_phone, owner_email
  } = req.body;

  db.run(`
    INSERT INTO companies (
      ico, name, address, business_registry, vat_id, tax_id,
      authorized_person, contact_email, contact_phone, owner_email, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `, [ico, name, address, business_registry, vat_id, tax_id,
      authorized_person, contact_email, contact_phone, owner_email],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Firma s týmto IČO už existuje' });
        }
        return res.status(500).json({ error: 'Chyba pri vytváraní firmy' });
      }

      res.json({ 
        message: 'Firma vytvorená úspešne', 
        companyId: this.lastID 
      });
    }
  );
});

// Aktualizácia firmy
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    ico, name, address, business_registry, vat_id, tax_id,
    authorized_person, contact_email, contact_phone
  } = req.body;

  db.run(`
    UPDATE companies SET
      ico = ?, name = ?, address = ?, business_registry = ?,
      vat_id = ?, tax_id = ?, authorized_person = ?,
      contact_email = ?, contact_phone = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [ico, name, address, business_registry, vat_id, tax_id,
      authorized_person, contact_email, contact_phone, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri aktualizácii firmy' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Firma nebola nájdená' });
      }

      res.json({ message: 'Firma aktualizovaná úspešne' });
    }
  );
});

// Deaktivácia firmy (iba admin)
router.patch('/:id/deactivate', (req, res) => {
  const { id } = req.params;

  db.run('UPDATE companies SET status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri deaktivácii firmy' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }

    res.json({ message: 'Firma deaktivovaná úspešne' });
  });
});

// Aktivácia firmy (iba admin)
router.patch('/:id/activate', (req, res) => {
  const { id } = req.params;

  db.run('UPDATE companies SET status = "active", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri aktivácii firmy' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }

    res.json({ message: 'Firma aktivovaná úspešne' });
  });
});

// Vymazanie firmy (iba admin)
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM companies WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri mazaní firmy' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }

    res.json({ message: 'Firma vymazaná úspešne' });
  });
});

// Priradenie účtovníkov k firme
router.post('/:id/assign-accountants', (req, res) => {
  const { id } = req.params;
  const { accountantEmails } = req.body;

  db.run('BEGIN TRANSACTION');

  // Najprv vymažeme existujúce priradenia
  db.run('DELETE FROM company_accountants WHERE company_id = ?', [id], (err) => {
    if (err) {
      db.run('ROLLBACK');
      return res.status(500).json({ error: 'Chyba pri priraďovaní účtovníkov' });
    }

    // Pridáme nové priradenia
    const insertPromises = accountantEmails.map(email => {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO company_accountants (company_id, accountant_email) VALUES (?, ?)',
          [id, email],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    });

    Promise.all(insertPromises)
      .then(() => {
        db.run('COMMIT');
        res.json({ message: 'Účtovníci priradení úspešne' });
      })
      .catch((err) => {
        db.run('ROLLBACK');
        res.status(500).json({ error: 'Chyba pri priraďovaní účtovníkov' });
      });
  });
});

module.exports = router;
