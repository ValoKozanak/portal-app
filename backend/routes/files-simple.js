const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database-simple');

const router = express.Router();

// Konfigurácia multer pre upload súborov
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Zachováme pôvodný názov súboru s diakritikou
    const originalName = file.originalname;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    
    // Vytvoríme bezpečný názov súboru pre disk, ale zachováme pôvodný názov
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, safeName + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload súboru
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Žiadny súbor nebol nahraný' });
  }

  const { user_id, category = 'other' } = req.body;
  const uploaded_by = req.body.uploaded_by || 'unknown';
  
  // Opravíme encoding pre diakritiku v originalname
  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

  db.run(`
    INSERT INTO files (filename, original_name, file_type, file_size, user_id, uploaded_by, file_path, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    req.file.filename,
    originalName,
    req.file.mimetype,
    req.file.size,
    user_id,
    uploaded_by,
    req.file.path,
    category
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri ukladaní súboru do databázy' });
    }

    // Vrátime kompletný objekt súboru
    const fileData = {
      id: this.lastID,
      filename: req.file.filename,
      original_name: originalName,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      user_id: user_id,
      uploaded_by: uploaded_by,
      file_path: req.file.path,
      category: category,
      created_at: new Date().toISOString()
    };
    
    res.json(fileData);
  });
});

// Získanie všetkých súborov pre firmu
router.get('/company/:companyId', (req, res) => {
  const { companyId } = req.params;

  db.all(`
    SELECT f.*, u.company_name 
    FROM files f
    LEFT JOIN users u ON f.user_id = u.id
    WHERE f.user_id = ? 
    ORDER BY f.created_at DESC
  `, [companyId], (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní súborov' });
    }

    res.json(files);
  });
});

// Stiahnutie súboru
router.get('/download/:fileId', (req, res) => {
  const { fileId } = req.params;

  db.get('SELECT * FROM files WHERE id = ?', [fileId], (err, file) => {
    if (err) {
      return res.status(500).json({ error: 'Databázová chyba' });
    }

    if (!file) {
      return res.status(404).json({ error: 'Súbor nenájdený' });
    }

    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ error: 'Súbor neexistuje na disku' });
    }

    // Opravíme encoding pre diakritiku pri sťahovaní
    const downloadName = file.original_name;
    res.download(file.file_path, downloadName);
  });
});

// Náhľad súboru
router.get('/preview/:fileId', (req, res) => {
  const { fileId } = req.params;

  db.get('SELECT * FROM files WHERE id = ?', [fileId], (err, file) => {
    if (err) {
      return res.status(500).json({ error: 'Databázová chyba' });
    }

    if (!file) {
      return res.status(404).json({ error: 'Súbor nenájdený' });
    }

    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ error: 'Súbor neexistuje na disku' });
    }

    // Nastavíme správne headers pre náhľad s diakritikou
    res.setHeader('Content-Type', file.file_type);
    res.setHeader('Content-Disposition', 'inline; filename*=UTF-8\'\'' + encodeURIComponent(file.original_name));
    
    // Streamujeme súbor
    const fileStream = fs.createReadStream(file.file_path);
    fileStream.pipe(res);
  });
});

// Vymazanie súboru
router.delete('/:fileId', (req, res) => {
  const { fileId } = req.params;

  db.get('SELECT * FROM files WHERE id = ?', [fileId], (err, file) => {
    if (err) {
      return res.status(500).json({ error: 'Databázová chyba' });
    }

    if (!file) {
      return res.status(404).json({ error: 'Súbor nenájdený' });
    }

    // Vymazanie súboru z disku
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    // Vymazanie záznamu z databázy
    db.run('DELETE FROM files WHERE id = ?', [fileId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri vymazaní súboru z databázy' });
      }

      res.json({ message: 'Súbor vymazaný úspešne' });
    });
  });
});

// Získanie všetkých súborov (pre admin)
router.get('/', (req, res) => {
  const query = `
    SELECT f.*, u.company_name 
    FROM files f
    LEFT JOIN users u ON f.user_id = u.id
    ORDER BY f.created_at DESC
  `;

  db.all(query, [], (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní súborov' });
    }

    res.json(files);
  });
});

// Admin endpoint pre získanie všetkých súborov
router.get('/admin/all', (req, res) => {
  const query = `
    SELECT f.*, u.company_name 
    FROM files f
    LEFT JOIN users u ON f.user_id = u.id
    ORDER BY f.created_at DESC
  `;

  db.all(query, [], (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní súborov' });
    }

    res.json(files);
  });
});

// Získanie súborov pre účtovníka
router.get('/accountant/:accountantEmail', (req, res) => {
  const { accountantEmail } = req.params;

  const query = `
    SELECT f.*, u.company_name 
    FROM files f
    LEFT JOIN users u ON f.user_id = u.id
    LEFT JOIN user_accountants ua ON u.id = ua.user_id
    WHERE ua.accountant_email = ?
    ORDER BY f.created_at DESC
  `;

  db.all(query, [accountantEmail], (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní súborov' });
    }

    res.json(files);
  });
});

module.exports = router;
