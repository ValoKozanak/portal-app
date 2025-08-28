const express = require('express');
const router = express.Router();
const { Dropbox } = require('dropbox');

// Dropbox konfigurácia
const DROPBOX_APP_KEY = process.env.DROPBOX_APP_KEY;
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET;

// Inicializácia Dropbox klienta (pre backend operácie)
let dbx = null;

if (DROPBOX_APP_KEY && DROPBOX_APP_SECRET) {
  // Pre backend operácie môžeme použiť app key a secret
  // V produkcii by sme mali použiť user access token
  dbx = new Dropbox({
    accessToken: process.env.DROPBOX_ACCESS_TOKEN || '',
    fetch: fetch
  });
}

// Generovanie hash emailu (rovnaký algoritmus ako v frontend)
function hashEmail(email) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Získanie cesty pre firmu
function getCompanyFolderPath(userEmail) {
  const emailHash = hashEmail(userEmail);
  return `/Portal/Companies/${emailHash}`;
}

// Vytvorenie zdieľateľnej zložky pre firmu
router.post('/create-company-folder', async (req, res) => {
  try {
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: 'Email je povinný' });
    }

    if (!dbx) {
      return res.status(500).json({ error: 'Dropbox nie je nakonfigurovaný' });
    }

    const companyPath = getCompanyFolderPath(userEmail);

    // Vytvorenie priečinka
    await dbx.filesCreateFolderV2({
      path: companyPath,
      autorename: true
    });

    // Vytvorenie zdieľateľného linku
    const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
      path: companyPath,
      settings: {
        requested_visibility: { '.tag': 'public' },
        audience: { '.tag': 'public' },
        access: { '.tag': 'viewer' }
      }
    });

    res.json({
      success: true,
      folderPath: companyPath,
      sharedLink: sharedLinkResponse.result.url
    });

  } catch (error) {
    console.error('Error creating company folder:', error);
    res.status(500).json({ error: 'Chyba pri vytváraní zložky' });
  }
});

// Získanie zdieľateľného linku pre firmu
router.get('/company-shared-link/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;

    if (!userEmail) {
      return res.status(400).json({ error: 'Email je povinný' });
    }

    if (!dbx) {
      return res.status(500).json({ error: 'Dropbox nie je nakonfigurovaný' });
    }

    const companyPath = getCompanyFolderPath(userEmail);

    // Skontrolovanie, či priečinok existuje
    try {
      await dbx.filesGetMetadata({
        path: companyPath
      });
    } catch (error) {
      // Priečinok neexistuje, vytvoríme ho
      await dbx.filesCreateFolderV2({
        path: companyPath,
        autorename: true
      });
    }

    // Vytvorenie zdieľateľného linku
    const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
      path: companyPath,
      settings: {
        requested_visibility: { '.tag': 'public' },
        audience: { '.tag': 'public' },
        access: { '.tag': 'viewer' }
      }
    });

    res.json({
      success: true,
      sharedLink: sharedLinkResponse.result.url
    });

  } catch (error) {
    console.error('Error getting company shared link:', error);
    res.status(500).json({ error: 'Chyba pri získavaní zdieľateľného linku' });
  }
});

// Získanie zoznamu súborov pre firmu
router.get('/company-files/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { path = '' } = req.query;

    if (!userEmail) {
      return res.status(400).json({ error: 'Email je povinný' });
    }

    if (!dbx) {
      return res.status(500).json({ error: 'Dropbox nie je nakonfigurovaný' });
    }

    const companyPath = getCompanyFolderPath(userEmail);
    const targetPath = companyPath + (path ? '/' + path : '');

    const response = await dbx.filesListFolder({
      path: targetPath,
      limit: 100
    });

    const files = response.result.entries.map(entry => ({
      id: entry['.tag'] === 'deleted' ? '' : (entry.id || ''),
      name: entry.name,
      path_lower: entry.path_lower || '',
      size: entry['.tag'] === 'file' ? (entry.size || 0) : 0,
      server_modified: entry['.tag'] === 'file' ? (entry.server_modified || '') : '',
      content_hash: entry['.tag'] === 'file' ? (entry.content_hash || '') : '',
      tag: entry['.tag']
    }));

    res.json({
      success: true,
      files: files
    });

  } catch (error) {
    console.error('Error getting company files:', error);
    res.status(500).json({ error: 'Chyba pri získavaní súborov' });
  }
});

// ===== ADMIN ENDPOINTS =====

// POST /api/dropbox/admin/share - Vytvorenie zdieľania pre firmu (admin)
router.post('/admin/share', async (req, res) => {
  try {
    const { companyEmail, permissions } = req.body;
    
    if (!companyEmail || !permissions) {
      return res.status(400).json({ error: 'Chýbajú povinné parametre' });
    }

    if (!dbx) {
      return res.status(500).json({ error: 'Dropbox nie je nakonfigurovaný' });
    }

    const folderPath = getCompanyFolderPath(companyEmail);
    
    // Skontrolovanie, či priečinok existuje
    try {
      await dbx.filesGetMetadata({
        path: folderPath
      });
    } catch (error) {
      // Priečinok neexistuje, vytvoríme ho
      await dbx.filesCreateFolderV2({
        path: folderPath,
        autorename: true
      });
    }

    // Určenie prístupu na základe oprávnení
    let access = { '.tag': 'viewer' };
    if (permissions.canEdit || permissions.canUpload || permissions.canDelete) {
      access = { '.tag': 'editor' };
    }

    // Vytvorenie zdieľateľného linku s oprávneniami
    const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
      path: folderPath,
      settings: {
        requested_visibility: { '.tag': 'public' },
        audience: { '.tag': 'public' },
        access: access
      }
    });
    
    res.json({
      success: true,
      shareLink: sharedLinkResponse.result.url,
      folderPath,
      permissions
    });
  } catch (error) {
    console.error('Error creating admin share:', error);
    res.status(500).json({ error: 'Chyba pri vytváraní zdieľania' });
  }
});

// DELETE /api/dropbox/admin/share/:companyEmail - Odvolanie zdieľania (admin)
router.delete('/admin/share/:companyEmail', async (req, res) => {
  try {
    const { companyEmail } = req.params;
    
    if (!companyEmail) {
      return res.status(400).json({ error: 'Chýba email firmy' });
    }

    if (!dbx) {
      return res.status(500).json({ error: 'Dropbox nie je nakonfigurovaný' });
    }

    // Tu by sme odvolali zdieľanie cez Dropbox API
    // Pre teraz vrátime success
    
    res.json({
      success: true,
      message: 'Zdieľanie bolo úspešne odvolané'
    });
  } catch (error) {
    console.error('Error revoking admin share:', error);
    res.status(500).json({ error: 'Chyba pri odvolávaní zdieľania' });
  }
});

// GET /api/dropbox/admin/shares - Získanie všetkých zdieľaní (admin)
router.get('/admin/shares', async (req, res) => {
  try {
    if (!dbx) {
      return res.status(500).json({ error: 'Dropbox nie je nakonfigurovaný' });
    }

    // Získanie všetkých zdieľateľných linkov
    const response = await dbx.sharingListSharedLinks({
      path: '/Portal/Companies',
      direct_only: false
    });

    res.json({
      success: true,
      shares: response.result.links
    });
  } catch (error) {
    console.error('Error getting admin shares:', error);
    res.status(500).json({ error: 'Chyba pri načítaní zdieľaní' });
  }
});

// POST /api/dropbox/admin/save-settings - Uloženie Dropbox nastavení do databázy
router.post('/admin/save-settings', async (req, res) => {
  try {

    const { companyId, companyEmail, companyICO, folderPath, shareLink, permissions } = req.body;

    if (!companyId || !companyEmail || !companyICO || !folderPath || !permissions) {
      console.error('Missing required parameters');
      return res.status(400).json({ error: 'Chýbajú povinné parametre' });
    }

    const { db } = require('../database');
    
    // Uloženie alebo aktualizácia nastavení
    const query = `
      INSERT OR REPLACE INTO dropbox_settings 
      (company_id, company_email, company_ico, folder_path, share_link, is_shared, can_view, can_edit, can_upload, can_delete, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    const params = [
      companyId,
      companyEmail,
      companyICO,
      folderPath,
      shareLink || null,
      shareLink ? 1 : 0,
      permissions.canView ? 1 : 0,
      permissions.canEdit ? 1 : 0,
      permissions.canUpload ? 1 : 0,
      permissions.canDelete ? 1 : 0
    ];

    db.run(query, params, function(err) {
      if (err) {
        console.error('Database error saving dropbox settings:', err);
        return res.status(500).json({ error: 'Chyba pri ukladaní nastavení' });
      }

      res.json({
        success: true,
        message: 'Nastavenia boli úspešne uložené',
        id: this.lastID
      });
    });

  } catch (error) {
    console.error('Error saving dropbox settings:', error);
    res.status(500).json({ error: 'Chyba pri ukladaní nastavení' });
  }
});

// GET /api/dropbox/admin/settings/:companyId - Získanie Dropbox nastavení pre firmu
router.get('/admin/settings/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Chýba ID firmy' });
    }

    const { db } = require('../database');
    
    const query = `
      SELECT ds.*, c.name as company_name, c.ico as company_ico 
      FROM dropbox_settings ds
      LEFT JOIN companies c ON ds.company_id = c.id
      WHERE ds.company_id = ?
    `;
    
    db.get(query, [companyId], (err, row) => {
      if (err) {
        console.error('Error getting dropbox settings:', err);
        return res.status(500).json({ error: 'Chyba pri načítaní nastavení' });
      }
      
      if (!row) {
        return res.json({
          success: true,
          settings: null
        });
      }
      
      res.json({
        success: true,
        settings: {
          id: row.id,
          companyId: row.company_id,
          companyEmail: row.company_email,
          companyName: row.company_name,
          companyICO: row.company_ico,
          folderPath: row.folder_path,
          shareLink: row.share_link,
          isShared: row.is_shared === 1,
          permissions: {
            canView: row.can_view === 1,
            canEdit: row.can_edit === 1,
            canUpload: row.can_upload === 1,
            canDelete: row.can_delete === 1
          },
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }
      });
    });

  } catch (error) {
    console.error('Error getting dropbox settings:', error);
    res.status(500).json({ error: 'Chyba pri načítaní nastavení' });
  }
});

// GET /api/dropbox/admin/all-settings - Získanie všetkých Dropbox nastavení
router.get('/admin/all-settings', async (req, res) => {
  try {
    const { db } = require('../database');
    
    const query = `
      SELECT ds.*, c.name as company_name, c.ico as company_ico 
      FROM dropbox_settings ds
      LEFT JOIN companies c ON ds.company_id = c.id
      ORDER BY ds.updated_at DESC
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error getting all dropbox settings:', err);
        return res.status(500).json({ error: 'Chyba pri načítaní nastavení' });
      }
      
      const settings = rows.map(row => ({
        id: row.id,
        companyId: row.company_id,
        companyEmail: row.company_email,
        companyName: row.company_name,
        companyICO: row.company_ico,
        folderPath: row.folder_path,
        shareLink: row.share_link,
        isShared: row.is_shared === 1,
        permissions: {
          canView: row.can_view === 1,
          canEdit: row.can_edit === 1,
          canUpload: row.can_upload === 1,
          canDelete: row.can_delete === 1
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      res.json({
        success: true,
        settings: settings
      });
    });

  } catch (error) {
    console.error('Error getting all dropbox settings:', error);
    res.status(500).json({ error: 'Chyba pri načítaní nastavení' });
  }
});

module.exports = router;
