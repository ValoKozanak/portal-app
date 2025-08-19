const express = require('express');
const { db } = require('../database-simple');

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

// Vytvorenie novej firmy (vytvorenie nového používateľa)
router.post('/', (req, res) => {
  const { email, name, ico, company_name, address, business_registry, vat_id, tax_id, authorized_person, contact_email, contact_phone, password = 'password123' } = req.body;

  // Najprv vytvoríme nového používateľa
  const bcrypt = require('bcryptjs');
  
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri hashovaní hesla' });
    }

    db.run(`
      INSERT INTO users (email, password, name, role, status, phone, ico, company_name, address, business_registry, vat_id, tax_id, authorized_person, contact_email, contact_phone)
      VALUES (?, ?, ?, 'user', 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [email, hashedPassword, name, contact_phone, ico, company_name, address, business_registry, vat_id, tax_id, authorized_person, contact_email, contact_phone],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Používateľ s týmto emailom už existuje' });
          }
          return res.status(500).json({ error: 'Chyba pri vytváraní firmy' });
        }

        res.json({ message: 'Firma vytvorená úspešne', companyId: this.lastID });
      }
    );
  });
});

// Registrácia novej firmy (vytvorenie neaktívneho používateľa)
router.post('/register', (req, res) => {
  const { email, name, ico, company_name, address, business_registry, vat_id, tax_id, authorized_person, contact_email, contact_phone, password } = req.body;

  // Validácia povinných polí
  if (!email || !name || !ico || !company_name || !address || !authorized_person || !contact_email || !contact_phone || !password) {
    return res.status(400).json({ error: 'Všetky povinné polia musia byť vyplnené' });
  }

  // Validácia emailu
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Neplatný formát emailu' });
  }

  // Validácia hesla
  if (password.length < 6) {
    return res.status(400).json({ error: 'Heslo musí mať aspoň 6 znakov' });
  }

  // Najprv vytvoríme nového používateľa s neaktívnym statusom
  const bcrypt = require('bcryptjs');
  
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri hashovaní hesla' });
    }

    db.run(`
      INSERT INTO users (email, password, name, role, status, phone, ico, company_name, address, business_registry, vat_id, tax_id, authorized_person, contact_email, contact_phone)
      VALUES (?, ?, ?, 'user', 'inactive', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [email, hashedPassword, company_name, contact_phone, ico, company_name, address, business_registry, vat_id, tax_id, authorized_person, email, contact_phone],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Používateľ s týmto emailom už existuje' });
          }
          return res.status(500).json({ error: 'Chyba pri registrácii firmy' });
        }

        // Tu by sa mal odoslať email administrátorovi o novej registrácii
        // a email používateľovi s potvrdením registrácie
        
        res.json({ 
          message: 'Registrácia firmy bola úspešná. Vaša firma čaká na schválenie administrátorom.',
          companyId: this.lastID 
        });
      }
    );
  });
});

// Aktualizácia firmy
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { ico, company_name, address, business_registry, vat_id, tax_id, authorized_person, contact_email, contact_phone } = req.body;

  db.run(`
    UPDATE users 
    SET ico = ?, company_name = ?, address = ?, business_registry = ?, 
        vat_id = ?, tax_id = ?, authorized_person = ?, contact_email = ?, contact_phone = ?
    WHERE id = ? AND role = 'user'
  `, [ico, company_name, address, business_registry, vat_id, tax_id, authorized_person, contact_email, contact_phone, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri aktualizácii firmy' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Firma nenájdená' });
      }

      res.json({ message: 'Firma aktualizovaná úspešne' });
    }
  );
});

// Deaktivácia firmy
router.patch('/:id/deactivate', (req, res) => {
  const { id } = req.params;

  db.run('UPDATE users SET status = "inactive" WHERE id = ? AND role = "user"', [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri deaktivácii firmy' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Firma nenájdená' });
      }

      res.json({ message: 'Firma deaktivovaná úspešne' });
    }
  );
});

// Aktivácia firmy
router.patch('/:id/activate', (req, res) => {
  const { id } = req.params;

  db.run('UPDATE users SET status = "active" WHERE id = ? AND role = "user"', [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri aktivácii firmy' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Firma nenájdená' });
      }

      res.json({ message: 'Firma aktivovaná úspešne' });
    }
  );
});

// Vymazanie firmy (vymazanie údajov firmy z používateľa)
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run(`
    UPDATE users 
    SET ico = NULL, company_name = NULL, address = NULL, business_registry = NULL, 
        vat_id = NULL, tax_id = NULL, authorized_person = NULL, contact_email = NULL, contact_phone = NULL
    WHERE id = ? AND role = 'user'
  `, [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri vymazaní firmy' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Firma nenájdená' });
      }

      res.json({ message: 'Firma vymazaná úspešne' });
    }
  );
});

// Priradenie účtovníkov k firme
router.post('/:id/assign-accountants', (req, res) => {
  const { id } = req.params;
  const { accountantEmails } = req.body;

  if (!Array.isArray(accountantEmails)) {
    return res.status(400).json({ error: 'accountantEmails musí byť pole' });
  }

  db.run('DELETE FROM user_accountants WHERE user_id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri odstránení existujúcich priradení' });
    }

    if (accountantEmails.length === 0) {
      return res.json({ message: 'Účtovníci odstránení úspešne' });
    }

    const placeholders = accountantEmails.map(() => '(?, ?)').join(',');
    const values = accountantEmails.flatMap(email => [id, email]);

    db.run(`INSERT INTO user_accountants (user_id, accountant_email) VALUES ${placeholders}`, values,
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Chyba pri priradení účtovníkov' });
        }

        res.json({ message: 'Účtovníci priradení úspešne' });
      }
    );
  });
});

// Admin endpoint pre získanie všetkých firiem
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
    WHERE u.id = ? AND u.role = 'user'
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

module.exports = router;
