const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database');

const router = express.Router();

// Konfigurácia multer pre upload súborov
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Zachováme pôvodný názov súboru s diakritikou
    let originalName = file.originalname;
    
    // Pokus o opravu kódovania ak je potrebné
    try {
      // Ak názov obsahuje URL-encoded znaky, dekódujeme ich
      if (originalName.includes('%')) {
        originalName = decodeURIComponent(originalName);
      }
      // Ak názov obsahuje poškodené UTF-8 znaky, skúsime ich opraviť
      if (originalName.includes('Ã')) {
        const buffer = Buffer.from(originalName, 'latin1');
        originalName = buffer.toString('utf8');
      }
    } catch (error) {
      console.log('Nepodarilo sa opraviť kódovanie názvu:', originalName);
    }
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    
    // Vytvoríme bezpečný názov súboru s diakritikou
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9áäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ\s\-_\(\)]/g, '');
    const finalName = `${safeName}-${uniqueSuffix}${extension}`;
    
    cb(null, finalName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nepodporovaný typ súboru'), false);
    }
  }
});

// Získanie všetkých súborov v portáli (pre admin)
router.get('/admin/all', (req, res) => {
  db.all(`
    SELECT f.*, c.name as company_name 
    FROM files f
    LEFT JOIN companies c ON f.company_id = c.id
    ORDER BY f.created_at DESC
  `, [], (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní všetkých súborov' });
    }
    res.json(files);
  });
});

// Získanie súborov pre firmu
router.get('/company/:companyId', (req, res) => {
  const { companyId } = req.params;

  db.all(`
    SELECT f.*, c.name as company_name 
    FROM files f
    LEFT JOIN companies c ON f.company_id = c.id
    WHERE f.company_id = ?
    ORDER BY f.created_at DESC
  `, [companyId], (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní súborov' });
    }
    res.json(files);
  });
});

// Upload súboru
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Žiadny súbor nebol nahraný' });
  }

  const { company_id, uploaded_by, category } = req.body;
  const { filename, mimetype, size } = req.file;
  let originalname = req.file.originalname;
  
  // Pokus o opravu kódovania ak je potrebné
  try {
    // Ak názov obsahuje URL-encoded znaky, dekódujeme ich
    if (originalname.includes('%')) {
      originalname = decodeURIComponent(originalname);
    }
    // Ak názov obsahuje poškodené UTF-8 znaky, skúsime ich opraviť
    if (originalname.includes('Ã')) {
      const buffer = Buffer.from(originalname, 'latin1');
      originalname = buffer.toString('utf8');
    }
  } catch (error) {
    console.log('Nepodarilo sa opraviť kódovanie názvu:', originalname);
  }

  db.run(`
    INSERT INTO files (
      filename, original_name, file_type, file_size,
      company_id, uploaded_by, file_path, category
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [filename, originalname, mimetype, size, company_id, uploaded_by, req.file.path, category || 'other'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri ukladaní súboru do databázy' });
      }

      // Získame kompletný objekt súboru s informáciami o firme
      db.get(`
        SELECT f.*, c.name as company_name 
        FROM files f
        LEFT JOIN companies c ON f.company_id = c.id
        WHERE f.id = ?
      `, [this.lastID], (err, file) => {
        if (err) {
          return res.status(500).json({ error: 'Chyba pri načítaní nahraného súboru' });
        }
        
        res.json(file);
      });
    }
  );
});

// Stiahnutie súboru
router.get('/download/:fileId', (req, res) => {
  const { fileId } = req.params;

  db.get('SELECT * FROM files WHERE id = ?', [fileId], (err, file) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní súboru' });
    }

    if (!file) {
      return res.status(404).json({ error: 'Súbor nebol nájdený' });
    }

    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ error: 'Súbor neexistuje na disku' });
    }

    // Použijeme original_name pre zachovanie diakritiky
    const downloadName = file.original_name || file.filename;
    res.download(file.file_path, downloadName);
  });
});

// Náhľad súboru
router.get('/preview/:fileId', (req, res) => {
  const { fileId } = req.params;

  db.get('SELECT * FROM files WHERE id = ?', [fileId], (err, file) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní súboru' });
    }

    if (!file) {
      return res.status(404).json({ error: 'Súbor nebol nájdený' });
    }

    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ error: 'Súbor neexistuje na disku' });
    }

    // Pre obrázky a PDF súbory môžeme poslať priamo
    if (file.file_type.startsWith('image/') || file.file_type === 'application/pdf') {
      res.setHeader('Content-Type', file.file_type);
      const displayName = file.original_name || file.filename;
      res.setHeader('Content-Disposition', 'inline; filename="' + displayName + '"');
      fs.createReadStream(file.file_path).pipe(res);
    } else {
      // Pre ostatné súbory posielame download
      const downloadName = file.original_name || file.filename;
      res.download(file.file_path, downloadName);
    }
  });
});

// Vymazanie súboru
router.delete('/:fileId', (req, res) => {
  const { fileId } = req.params;

  db.get('SELECT * FROM files WHERE id = ?', [fileId], (err, file) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní súboru' });
    }

    if (!file) {
      return res.status(404).json({ error: 'Súbor nebol nájdený' });
    }

    // Vymažeme súbor z disku
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    // Vymažeme záznam z databázy
    db.run('DELETE FROM files WHERE id = ?', [fileId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri mazaní súboru z databázy' });
      }

      res.json({ message: 'Súbor vymazaný úspešne' });
    });
  });
});

module.exports = router;
