const express = require('express');
const { db } = require('../database');
const emailService = require('../services/emailService');

const router = express.Router();

// Získanie všetkých aktívnych firiem (pre admin)
router.get('/', (req, res) => {
  const query = `
    SELECT u.id, u.email, u.name, u.role, u.status, u.ico, u.company_name, u.address, 
           u.business_registry, u.vat_id, u.tax_id, u.authorized_person, u.contact_email, 
           u.contact_phone, u.created_at, u.updated_at,
           GROUP_CONCAT(ua.accountant_email) as assigned_accountants
    FROM users u
    LEFT JOIN user_accountants ua ON u.id = ua.user_id
    WHERE u.role = 'user' AND u.status = 'active' AND u.company_name IS NOT NULL
    GROUP BY u.id
    ORDER BY u.created_at DESC
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


// Získanie firmy pre konkrétneho používateľa
router.get('/user/:userEmail', (req, res) => {
  const { userEmail } = req.params;

  const query = `
    SELECT u.id, u.email, u.name, u.role, u.status, u.ico, u.company_name, u.address, 
           u.business_registry, u.vat_id, u.tax_id, u.authorized_person, u.contact_email, 
           u.contact_phone, u.created_at, u.updated_at,
           GROUP_CONCAT(ua.accountant_email) as assigned_accountants
    FROM users u
    LEFT JOIN user_accountants ua ON u.id = ua.user_id
    WHERE u.email = ? AND u.role = 'user' AND u.status = 'active' AND u.company_name IS NOT NULL
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;

  db.all(query, [userEmail], (err, companies) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní firmy' });
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
    SELECT u.id, u.email, u.name, u.role, u.status, u.ico, u.company_name, u.address, 
           u.business_registry, u.vat_id, u.tax_id, u.authorized_person, u.contact_email, 
           u.contact_phone, u.created_at, u.updated_at,
           GROUP_CONCAT(ua.accountant_email) as assigned_accountants
    FROM users u
    INNER JOIN user_accountants ua ON u.id = ua.user_id
    WHERE ua.accountant_email = ? AND u.role = 'user' AND u.status = 'active' AND u.company_name IS NOT NULL
    GROUP BY u.id
    ORDER BY u.created_at DESC
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
    SELECT u.id, u.email, u.name, u.role, u.status, u.ico, u.company_name, u.address, 
           u.business_registry, u.vat_id, u.tax_id, u.authorized_person, u.contact_email, 
           u.contact_phone, u.created_at, u.updated_at,
           GROUP_CONCAT(ua.accountant_email) as assigned_accountants
    FROM users u
    LEFT JOIN user_accountants ua ON u.id = ua.user_id
    WHERE u.role = 'user' AND u.company_name IS NOT NULL
    GROUP BY u.id
    ORDER BY u.created_at DESC
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
    SELECT u.id, u.email, u.name, u.role, u.status, u.ico, u.company_name, u.address, 
           u.business_registry, u.vat_id, u.tax_id, u.authorized_person, u.contact_email, 
           u.contact_phone, u.created_at, u.updated_at,
           GROUP_CONCAT(ua.accountant_email) as assigned_accountants
    FROM users u
    LEFT JOIN user_accountants ua ON u.id = ua.user_id
    WHERE u.role = 'user' AND u.status = 'inactive' AND u.company_name IS NOT NULL
    GROUP BY u.id
    ORDER BY u.created_at DESC
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
    SELECT u.id, u.email, u.name, u.role, u.status, u.ico, u.company_name, u.address, 
           u.business_registry, u.vat_id, u.tax_id, u.authorized_person, u.contact_email, 
           u.contact_phone, u.created_at, u.updated_at,
           GROUP_CONCAT(ua.accountant_email) as assigned_accountants
    FROM users u
    LEFT JOIN user_accountants ua ON u.id = ua.user_id
    WHERE u.id = ? AND u.role = 'user' AND u.company_name IS NOT NULL
    GROUP BY u.id
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

// Vytvorenie novej firmy (aktualizácia existujúceho user účtu)
router.post('/', (req, res) => {
  const {
    ico, company_name, address, business_registry, vat_id, tax_id,
    authorized_person, contact_email, contact_phone, owner_email
  } = req.body;

  // Najprv skontrolujeme, či už existuje user s týmto emailom
  db.get('SELECT id FROM users WHERE email = ?', [owner_email], (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri kontrole používateľa' });
    }

    if (existingUser) {
      // Aktualizujeme existujúceho používateľa s firmou
      db.run(`
        UPDATE users SET
          ico = ?, company_name = ?, address = ?, business_registry = ?,
          vat_id = ?, tax_id = ?, authorized_person = ?,
          contact_email = ?, contact_phone = ?, updated_at = CURRENT_TIMESTAMP
        WHERE email = ?
      `, [ico, company_name, address, business_registry, vat_id, tax_id,
          authorized_person, contact_email, contact_phone, owner_email],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ error: 'Firma s týmto IČO už existuje' });
            }
            return res.status(500).json({ error: 'Chyba pri aktualizácii firmy' });
          }

          // Poslanie notifikácie pre admina o novej firme
          db.get(`
            SELECT email, name FROM users WHERE role = 'admin' LIMIT 1
          `, [], (err, admin) => {
            if (!err && admin) {
              emailService.sendCompanyNotification(
                admin.email,
                admin.name || 'Admin',
                company_name,
                owner_email,
                ico,
                contact_email
              ).catch(error => {
                console.error('Email notification error for admin:', error);
              });
            }
          });

          res.json({ 
            message: 'Firma vytvorená úspešne', 
            companyId: existingUser.id 
          });
        }
      );
    } else {
      return res.status(400).json({ error: 'Používateľ s týmto emailom neexistuje' });
    }
  });
});

// Aktualizácia firmy
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    ico, company_name, address, business_registry, vat_id, tax_id,
    authorized_person, contact_email, contact_phone
  } = req.body;

  db.run(`
    UPDATE users SET
      ico = ?, company_name = ?, address = ?, business_registry = ?,
      vat_id = ?, tax_id = ?, authorized_person = ?,
      contact_email = ?, contact_phone = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND role = 'user'
  `, [ico, company_name, address, business_registry, vat_id, tax_id,
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

  db.run('UPDATE users SET status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = "user"', [id], function(err) {
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

  db.run('UPDATE users SET status = "active", updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = "user"', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri aktivácii firmy' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Firma nebola nájdená' });
    }

    res.json({ message: 'Firma aktivovaná úspešne' });
  });
});

// Vymazanie firmy (iba admin) - vymazanie firmy z user účtu
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run(`
    UPDATE users SET 
      ico = NULL, company_name = NULL, address = NULL, business_registry = NULL,
      vat_id = NULL, tax_id = NULL, authorized_person = NULL,
      contact_email = NULL, contact_phone = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND role = 'user'
  `, [id], function(err) {
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
  db.run('DELETE FROM user_accountants WHERE user_id = ?', [id], (err) => {
    if (err) {
      db.run('ROLLBACK');
      return res.status(500).json({ error: 'Chyba pri priraďovaní účtovníkov' });
    }

    // Pridáme nové priradenia
    const insertPromises = accountantEmails.map(email => {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO user_accountants (user_id, accountant_email) VALUES (?, ?)',
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
