const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const emailService = require('../services/emailService');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware pre autentifikáciu
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Prístupový token je požadovaný' });
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

// Hierarchická štruktúra dokumentov pre firmy
const DOCUMENT_CATEGORIES = {
  'vykazy': {
    name: 'Výkazy',
    description: 'Finančné výkazy a reporty',
    allowedTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  },
  'zmluvy': {
    name: 'Zmluvy',
    description: 'Obchodné zmluvy a dohody',
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  'ostatne': {
    name: 'Ostatné',
    description: 'Všeobecné dokumenty',
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png']
  }
};

// Konfigurácia multer pre upload dokumentov
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'ostatne';
    const companyId = req.body.company_id;
    
    if (!companyId) {
      return cb(new Error('Chýba ID firmy'), null);
    }
    
    // Vytvoríme štruktúru: uploads/documents/[company_id]/[category]
    const uploadDir = path.join(__dirname, '../uploads/documents', companyId.toString(), category);
    
    // Vytvoríme štruktúru priečinkov
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
      if (originalName.includes('%')) {
        originalName = decodeURIComponent(originalName);
      }
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
    const category = req.body.category || 'ostatne';
    const categoryConfig = DOCUMENT_CATEGORIES[category];
    
    if (!categoryConfig) {
      return cb(new Error('Neplatná kategória dokumentu'), false);
    }
    
    if (categoryConfig.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Nepodporovaný typ súboru pre kategóriu ${categoryConfig.name}`), false);
    }
  }
});

// Získanie kategórií dokumentov
router.get('/categories', (req, res) => {
  res.json(DOCUMENT_CATEGORIES);
});

// Získanie všetkých dokumentov pre admin
router.get('/admin/all', (req, res) => {
  db.all(`
    SELECT d.*, c.name as company_name 
    FROM documents d
    LEFT JOIN companies c ON d.company_id = c.id
    ORDER BY d.created_at DESC
  `, [], (err, documents) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní dokumentov' });
    }
    res.json(documents);
  });
});

// Získanie dokumentov pre firmu
router.get('/company/:companyId', (req, res) => {
  const { companyId } = req.params;
  const { category } = req.query;

  let query = `
    SELECT d.*, c.name as company_name 
    FROM documents d
    LEFT JOIN companies c ON d.company_id = c.id
    WHERE d.company_id = ?
  `;
  
  let params = [companyId];
  
  if (category && category !== 'all') {
    query += ' AND d.category = ?';
    params.push(category);
  }
  
  query += ' ORDER BY d.created_at DESC';

  db.all(query, params, (err, documents) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní dokumentov' });
    }
    res.json(documents);
  });
});

// Získanie dokumentov pre accountant
router.get('/accountant/:accountantEmail', (req, res) => {
  const { accountantEmail } = req.params;
  const { category } = req.query;

  let query = `
    SELECT d.*, c.name as company_name 
    FROM documents d
    LEFT JOIN companies c ON d.company_id = c.id
    LEFT JOIN company_accountants ca ON c.id = ca.company_id
    LEFT JOIN users u ON ca.accountant_id = u.id
    WHERE u.email = ?
  `;
  
  let params = [accountantEmail];
  
  if (category && category !== 'all') {
    query += ' AND d.category = ?';
    params.push(category);
  }
  
  query += ' ORDER BY d.created_at DESC';

  db.all(query, params, (err, documents) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní dokumentov' });
    }
    res.json(documents);
  });
});

// Upload nového dokumentu
router.post('/upload', upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Žiadny súbor nebol nahraný' });
    }

    const { company_id, category, description } = req.body;
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    
    if (!company_id || !category) {
      return res.status(400).json({ error: 'Chýbajú povinné údaje' });
    }

    if (!DOCUMENT_CATEGORIES[category]) {
      return res.status(400).json({ error: 'Neplatná kategória dokumentu' });
    }

    const documentData = {
      original_name: originalName,
      file_name: req.file.filename,
      file_path: req.file.path,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      category: category,
      description: description || '',
      company_id: company_id,
      uploaded_by: req.body.uploaded_by || 'system'
    };

    db.run(`
      INSERT INTO documents (
        original_name, file_name, file_path, file_type, file_size, 
        category, description, company_id, uploaded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      documentData.original_name,
      documentData.file_name,
      documentData.file_path,
      documentData.file_type,
      documentData.file_size,
      documentData.category,
      documentData.description,
      documentData.company_id,
      documentData.uploaded_by
    ], function(err) {
      if (err) {
        console.error('Chyba pri ukladaní dokumentu:', err);
        return res.status(500).json({ error: 'Chyba pri ukladaní dokumentu' });
      }

      const documentId = this.lastID;
      
      // Získame údaje o firme pre notifikáciu
      db.get('SELECT name, email FROM companies WHERE id = ?', [company_id], (err, company) => {
        if (company) {
          // Notifikácia pre admin
          emailService.sendEmail({
            to: 'admin@portal.sk',
            subject: `Nový dokument: ${originalName}`,
            text: `Firma ${company.name} nahrala nový dokument: ${originalName} (${DOCUMENT_CATEGORIES[category].name})`
          });
        }
      });

      res.json({
        message: 'Dokument bol úspešne nahraný',
        documentId: documentId,
        document: {
          id: documentId,
          ...documentData
        }
      });
    });

  } catch (error) {
    console.error('Chyba pri upload dokumentu:', error);
    res.status(500).json({ error: 'Chyba pri upload dokumentu' });
  }
});

// Download dokumentu
router.get('/download/:documentId', (req, res) => {
  const { documentId } = req.params;

  db.get('SELECT * FROM documents WHERE id = ?', [documentId], (err, document) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní dokumentu' });
    }

    if (!document) {
      return res.status(404).json({ error: 'Dokument nenájdený' });
    }

    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ error: 'Súbor neexistuje na disku' });
    }

    res.download(document.file_path, document.original_name);
  });
});

// Preview dokumentu
router.get('/preview/:documentId', (req, res) => {
  const { documentId } = req.params;

  db.get('SELECT * FROM documents WHERE id = ?', [documentId], (err, document) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní dokumentu' });
    }

    if (!document) {
      return res.status(404).json({ error: 'Dokument nenájdený' });
    }

    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ error: 'Súbor neexistuje na disku' });
    }

    console.log('Preview request for document ID:', documentId);
    console.log('Document found:', document);

    // Nastavíme správne headers pre preview
    res.setHeader('Content-Type', document.file_type);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(document.original_name)}`);
    
    // Streamujeme súbor
    const fileStream = fs.createReadStream(document.file_path);
    fileStream.pipe(res);
  });
});

// Vymazanie dokumentu
router.delete('/:documentId', (req, res) => {
  const { documentId } = req.params;

  db.get('SELECT * FROM documents WHERE id = ?', [documentId], (err, document) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba pri načítaní dokumentu' });
    }

    if (!document) {
      return res.status(404).json({ error: 'Dokument nenájdený' });
    }

    // Vymazanie súboru z disku
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    // Vymazanie z databázy
    db.run('DELETE FROM documents WHERE id = ?', [documentId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Chyba pri vymazaní dokumentu' });
      }

      res.json({ message: 'Dokument bol úspešne vymazaný' });
    });
  });
});

module.exports = router;

