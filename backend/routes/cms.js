const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('jsonwebtoken');

// Databázové pripojenie
const dbPath = path.join(__dirname, '..', 'portal.db');
const db = new sqlite3.Database(dbPath);

// Middleware pre autentifikáciu
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Prístupový token je požadovaný' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Neplatný token' });
    }
    req.user = user;
    next();
  });
};

// Middleware pre kontrolu admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Prístup zamietnutý - požadovaná admin rola' });
  }
  next();
};

// GET /api/cms/content - Získanie všetkého aktívneho obsahu
router.get('/content', async (req, res) => {
  try {
    db.all(`
      SELECT section, field, value, version, updated_at
      FROM cms_content 
      WHERE is_active = 1
      ORDER BY section, field
    `, [], (err, rows) => {
      if (err) {
        console.error('Chyba pri načítaní CMS obsahu:', err);
        return res.status(500).json({ error: 'Chyba pri načítaní obsahu' });
      }

      // Zoskupenie obsahu podľa sekcií
      const content = {};
      rows.forEach(row => {
        if (!content[row.section]) {
          content[row.section] = {};
        }
        content[row.section][row.field] = row.value;
      });

      res.json({ content });
    });
  } catch (error) {
    console.error('Chyba pri načítaní CMS obsahu:', error);
    res.status(500).json({ error: 'Chyba pri načítaní obsahu' });
  }
});

// GET /api/cms/content/:section - Získanie obsahu pre konkrétnu sekciu
router.get('/content/:section', async (req, res) => {
  try {
    const { section } = req.params;
    
    db.all(`
      SELECT field, value, version, updated_at
      FROM cms_content 
      WHERE section = ? AND is_active = 1
      ORDER BY field
    `, [section], (err, rows) => {
      if (err) {
        console.error('Chyba pri načítaní sekcie:', err);
        return res.status(500).json({ error: 'Chyba pri načítaní sekcie' });
      }

      const sectionContent = {};
      rows.forEach(row => {
        sectionContent[row.field] = row.value;
      });

      res.json({ content: sectionContent });
    });
  } catch (error) {
    console.error('Chyba pri načítaní sekcie:', error);
    res.status(500).json({ error: 'Chyba pri načítaní sekcie' });
  }
});

// PUT /api/cms/content - Aktualizácia obsahu
router.put('/content', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { section, field, value } = req.body;
    const { email } = req.user;

    if (!section || !field || value === undefined) {
      return res.status(400).json({ error: 'Chýbajú povinné parametre' });
    }

    // Získanie aktuálnej verzie
    db.get(`
      SELECT MAX(version) as maxVersion
      FROM cms_content 
      WHERE section = ? AND field = ?
    `, [section, field], (err, row) => {
      if (err) {
        console.error('Chyba pri získaní verzie:', err);
        return res.status(500).json({ error: 'Chyba pri aktualizácii obsahu' });
      }

      const newVersion = (row?.maxVersion || 0) + 1;

      // Deaktivácia predchádzajúcej verzie
      db.run(`
        UPDATE cms_content 
        SET is_active = 0 
        WHERE section = ? AND field = ?
      `, [section, field], (err) => {
        if (err) {
          console.error('Chyba pri deaktivácii predchádzajúcej verzie:', err);
          return res.status(500).json({ error: 'Chyba pri aktualizácii obsahu' });
        }

        // Vloženie novej verzie
        db.run(`
          INSERT INTO cms_content (section, field, value, version, created_by)
          VALUES (?, ?, ?, ?, ?)
        `, [section, field, value, newVersion, email], function(err) {
          if (err) {
            console.error('Chyba pri vložení novej verzie:', err);
            return res.status(500).json({ error: 'Chyba pri aktualizácii obsahu' });
          }

          res.json({ 
            message: 'Obsah bol úspešne aktualizovaný',
            id: this.lastID,
            version: newVersion
          });
        });
      });
    });
  } catch (error) {
    console.error('Chyba pri aktualizácii obsahu:', error);
    res.status(500).json({ error: 'Chyba pri aktualizácii obsahu' });
  }
});

// POST /api/cms/content/batch - Hromadná aktualizácia obsahu
router.post('/content/batch', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { updates } = req.body;
    const { email } = req.user;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Chýbajú aktualizácie' });
    }

    const results = [];
    
    for (const update of updates) {
      const { section, field, value } = update;
      
      if (!section || !field || value === undefined) {
        results.push({ section, field, success: false, error: 'Chýbajú povinné parametre' });
        continue;
      }

      // Získanie aktuálnej verzie
      const maxVersion = await new Promise((resolve, reject) => {
        db.get(`
          SELECT MAX(version) as maxVersion
          FROM cms_content 
          WHERE section = ? AND field = ?
        `, [section, field], (err, row) => {
          if (err) reject(err);
          else resolve(row?.maxVersion || 0);
        });
      });

      const newVersion = maxVersion + 1;

      // Deaktivácia predchádzajúcej verzie
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE cms_content 
          SET is_active = 0 
          WHERE section = ? AND field = ?
        `, [section, field], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Vloženie novej verzie
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO cms_content (section, field, value, version, created_by)
          VALUES (?, ?, ?, ?, ?)
        `, [section, field, value, newVersion, email], function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, version: newVersion });
        });
      });

      results.push({ section, field, success: true, version: newVersion });
    }

    res.json({ 
      message: 'Hromadná aktualizácia dokončená',
      results 
    });
  } catch (error) {
    console.error('Chyba pri hromadnej aktualizácii:', error);
    res.status(500).json({ error: 'Chyba pri hromadnej aktualizácii' });
  }
});

// GET /api/cms/versions - Získanie všetkých verzií
router.get('/versions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    db.all(`
      SELECT id, version_name, description, created_by, created_at, is_active
      FROM cms_versions 
      ORDER BY created_at DESC
    `, [], (err, rows) => {
      if (err) {
        console.error('Chyba pri načítaní verzií:', err);
        return res.status(500).json({ error: 'Chyba pri načítaní verzií' });
      }

      res.json({ versions: rows });
    });
  } catch (error) {
    console.error('Chyba pri načítaní verzií:', error);
    res.status(500).json({ error: 'Chyba pri načítaní verzií' });
  }
});

// POST /api/cms/versions - Vytvorenie novej verzie
router.post('/versions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { version_name, description } = req.body;
    const { email } = req.user;

    if (!version_name) {
      return res.status(400).json({ error: 'Názov verzie je povinný' });
    }

    // Deaktivácia všetkých predchádzajúcich verzií
    db.run(`
      UPDATE cms_versions 
      SET is_active = 0
    `, [], (err) => {
      if (err) {
        console.error('Chyba pri deaktivácii verzií:', err);
        return res.status(500).json({ error: 'Chyba pri vytvorení verzie' });
      }

      // Vytvorenie novej verzie
      db.run(`
        INSERT INTO cms_versions (version_name, description, created_by, is_active)
        VALUES (?, ?, ?, 1)
      `, [version_name, description, email], function(err) {
        if (err) {
          console.error('Chyba pri vytvorení verzie:', err);
          return res.status(500).json({ error: 'Chyba pri vytvorení verzie' });
        }

        res.json({ 
          message: 'Verzia bola úspešne vytvorená',
          id: this.lastID,
          version_name,
          description
        });
      });
    });
  } catch (error) {
    console.error('Chyba pri vytvorení verzie:', error);
    res.status(500).json({ error: 'Chyba pri vytvorení verzie' });
  }
});

// GET /api/cms/history/:section/:field - História zmien pre konkrétne pole
router.get('/history/:section/:field', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { section, field } = req.params;
    
    db.all(`
      SELECT id, value, version, created_by, created_at
      FROM cms_content 
      WHERE section = ? AND field = ?
      ORDER BY version DESC
    `, [section, field], (err, rows) => {
      if (err) {
        console.error('Chyba pri načítaní histórie:', err);
        return res.status(500).json({ error: 'Chyba pri načítaní histórie' });
      }

      res.json({ history: rows });
    });
  } catch (error) {
    console.error('Chyba pri načítaní histórie:', error);
    res.status(500).json({ error: 'Chyba pri načítaní histórie' });
  }
});

// POST /api/cms/restore/:id - Obnovenie predchádzajúcej verzie
router.post('/restore/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.user;

    // Získanie obsahu pre obnovenie
    db.get(`
      SELECT section, field, value, version
      FROM cms_content 
      WHERE id = ?
    `, [id], (err, row) => {
      if (err) {
        console.error('Chyba pri získaní obsahu:', err);
        return res.status(500).json({ error: 'Chyba pri obnovení verzie' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Obsah nebol nájdený' });
      }

      const newVersion = row.version + 1;

      // Deaktivácia aktuálnej verzie
      db.run(`
        UPDATE cms_content 
        SET is_active = 0 
        WHERE section = ? AND field = ?
      `, [row.section, row.field], (err) => {
        if (err) {
          console.error('Chyba pri deaktivácii aktuálnej verzie:', err);
          return res.status(500).json({ error: 'Chyba pri obnovení verzie' });
        }

        // Vloženie obnovenej verzie
        db.run(`
          INSERT INTO cms_content (section, field, value, version, created_by)
          VALUES (?, ?, ?, ?, ?)
        `, [row.section, row.field, row.value, newVersion, email], function(err) {
          if (err) {
            console.error('Chyba pri vložení obnovenej verzie:', err);
            return res.status(500).json({ error: 'Chyba pri obnovení verzie' });
          }

          res.json({ 
            message: 'Verzia bola úspešne obnovená',
            id: this.lastID,
            version: newVersion
          });
        });
      });
    });
  } catch (error) {
    console.error('Chyba pri obnovení verzie:', error);
    res.status(500).json({ error: 'Chyba pri obnovení verzie' });
  }
});

module.exports = router;
