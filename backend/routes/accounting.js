const express = require('express');
const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const crypto = require('crypto');
const multer = require('multer');

const router = Router();

// === External deps from your project
const { authenticateToken } = require('./auth');
const db = require('../services/dbCompat');
const dropboxService = require('../services/dropboxService'); // expect: upload({buffer, key, contentType}), remove(key), list(prefix)
$1
// PostgreSQL (raw view access)
const pg = require('../services/pgService');
// expect: upload({buffer, key, contentType, acl?}), remove(key), list(prefix)

// ===========================
// Config
// ===========================
const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_ROOT || 'uploads');
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE || 25 * 1024 * 1024); // 25 MB default
const ACCEPTED_MIME = (process.env.ACCEPTED_MIME || [
  'application/pdf',
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'text/plain', 'text/csv', 'application/xml', 'text/xml',
  'application/zip', 'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]).map(String.toLowerCase);

// Ensure base dir exists (best-effort)
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

// ===========================
// Helpers
// ===========================
function ensureAdmin(req, res, next) {
  try {
    if (req.user && (req.user.role === 'admin' || req.user.isAdmin === true)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  } catch {
    return res.status(403).json({ error: 'Forbidden' });
  }
}

function assertCompanyId(companyId) {
  const id = String(companyId || '').trim();
  if (!/^\d+$/.test(id)) {
    const err = new Error('Invalid companyId');
    err.status = 400;
    throw err;
  }
  return id;
}

function companyDir(companyId) {
  const id = assertCompanyId(companyId);
  const safe = path.join(UPLOAD_ROOT, id);
  const resolved = path.resolve(safe);
  if (!resolved.startsWith(UPLOAD_ROOT)) {
    const err = new Error('Path validation failed');
    err.status = 400;
    throw err;
  }
  return resolved;
}

function slugifyFilename(name) {
  // remove path, normalize, keep unicode letters/digits/._- and collapse spaces
  const base = path.basename(name || 'file');
  const normalized = base.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const safe = normalized.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
  return safe || `file-${Date.now()}`;
}

function hashedKey(companyId, fname) {
  const ts = new Date().toISOString().replace(/[:.]/g, '');
  const rand = crypto.randomBytes(6).toString('hex');
  return `${assertCompanyId(companyId)}/${ts}-${rand}-${slugifyFilename(fname)}`;
}

// ===========================
// Multer setup (disk to temp folder)
// ===========================
const TEMP_DIR = path.join(UPLOAD_ROOT, '.tmp');
fs.mkdirSync(TEMP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${slugifyFilename(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 20 },
  fileFilter: (req, file, cb) => {
    const ct = String(file.mimetype || '').toLowerCase();
    if (!ct || !ACCEPTED_MIME.includes(ct)) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', `Unsupported MIME: ${ct}`));
    }
    cb(null, true);
  }
});

// ===========================
// Storage adapters
// ===========================
async function pushToStorage({ provider, buffer, key, contentType }) {
  if (provider === 'spaces') {
    return spacesService.upload({ buffer, key, contentType, acl: 'private' });
  }
  if (provider === 'dropbox') {
    return dropboxService.upload({ buffer, key, contentType });
  }
  // local fallback: write to company dir
  const outPath = path.join(companyDir(key.split('/')[0]), key.split('/').slice(1).join('/'));
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  await fs.promises.writeFile(outPath, buffer);
  return { key, localPath: outPath };
}

async function removeFromStorage({ provider, key }) {
  if (provider === 'spaces') return spacesService.remove(key);
  if (provider === 'dropbox') return dropboxService.remove(key);
  const localPath = path.join(UPLOAD_ROOT, key);
  await fsp.rm(localPath, { force: true });
}

async function listFromStorage({ provider, prefix }) {
  if (provider === 'spaces') return spacesService.list(prefix);
  if (provider === 'dropbox') return dropboxService.list(prefix);
  // local list
  const dir = path.join(UPLOAD_ROOT, prefix);
  const res = [];
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isFile()) res.push({ key: `${prefix}/${ent.name}` });
    }
  } catch {}
  return res;
}

// ===========================
// Routes
// ===========================
router.use(authenticateToken);

// Upload (single or multiple)
router.post('/:companyId/upload', upload.array('files', 20), async (req, res) => {
  try {
    const companyId = assertCompanyId(req.params.companyId);
    const provider = (req.query.storage || req.body.storage || 'spaces').toString().toLowerCase();

    const results = [];
    for (const file of req.files || []) {
      const key = hashedKey(companyId, file.originalname);
      const buffer = await fsp.readFile(file.path);
      const contentType = file.mimetype || 'application/octet-stream';
      const meta = await pushToStorage({ provider, buffer, key, contentType });
      results.push({ key, size: file.size, contentType, meta });
      // best-effort cleanup
      fsp.rm(file.path, { force: true }).catch(() => {});
    }

    return res.json({ ok: true, count: results.length, items: results });
  } catch (err) {
    console.error('[upload]', err);
    return res.status(err.status || 500).json({ error: err.message || 'Upload failed' });
  }
});

// List files for a company
router.get('/:companyId/files', async (req, res) => {
  try {
    const companyId = assertCompanyId(req.params.companyId);
    const provider = (req.query.storage || 'spaces').toString().toLowerCase();
    const prefix = `${companyId}`; // optionally allow folder param
    const list = await listFromStorage({ provider, prefix });
    return res.json({ ok: true, items: list });
  } catch (err) {
    console.error('[list]', err);
    return res.status(err.status || 500).json({ error: err.message || 'List failed' });
  }
});

// Delete by key (admin only)
router.delete('/:companyId/files', ensureAdmin, async (req, res) => {
  try {
    const companyId = assertCompanyId(req.params.companyId);
    const { key } = req.body || {};
    if (!key || !key.toString().startsWith(`${companyId}/`)) {
      return res.status(400).json({ error: 'Invalid key' });
    }
    const provider = (req.query.storage || 'spaces').toString().toLowerCase();
    await removeFromStorage({ provider, key });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[delete]', err);
    return res.status(err.status || 500).json({ error: err.message || 'Delete failed' });
  }
});

$1

// ===========================
// FAST: vydané faktúry z mdb_v_fa (DB view) – bez MDB čítania
// ===========================
router.get('/issued-invoices-raw/:companyId', authenticateToken, async (req, res) => {
  try {
    const companyId = Number(req.params.companyId);
    if (!Number.isFinite(companyId)) return res.status(400).json({ error: 'Neplatné companyId' });

    const { q = '', limit = 100, offset = 0, date_from = null, date_to = null } = req.query;

    const sql = `
      SELECT
        id,
        invoice_number,
        varsym,
        issue_date,
        due_date,
        customer_name,
        total_amount,
        COALESCE(unpaid_amount, 0) AS unpaid_amount,
        _company_id,
        _period,
        _import_id,
        _loaded_at
      FROM mdb_v_fa
      WHERE _company_id = $1
        AND ($2::text = '' OR invoice_number ILIKE '%'||$2||'%' OR varsym ILIKE '%'||$2||'%' OR COALESCE(customer_name,'') ILIKE '%'||$2||'%')
        AND ($3::date IS NULL OR issue_date >= $3::date)
        AND ($4::date IS NULL OR issue_date <= $4::date)
      ORDER BY issue_date DESC NULLS LAST, invoice_number DESC
      LIMIT $5 OFFSET $6
    `;

    const params = [companyId, String(q), date_from ? String(date_from) : null, date_to ? String(date_to) : null, Math.min(Number(limit)||100, 1000), Number(offset)||0];

    const r = await pg.query(sql, params);
    return res.json(r.rows || []);
  } catch (e) {
    console.error('issued-invoices-raw error:', e);
    return res.status(500).json({ error: 'Chyba pri načítaní z mdb_v_fa' });
  }
});

module.exports = router;
