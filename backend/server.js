require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// --- Routes (importy) ---
const messagesRoutes   = require('./routes/messages');
const authRoutes       = require('./routes/auth');
const companiesRoutes  = require('./routes/companies');
const tasksRoutes      = require('./routes/tasks');
const filesRoutes      = require('./routes/files');
const documentsRoutes  = require('./routes/documents');
const cmsRoutes        = require('./routes/cms');
const dropboxRoutes    = require('./routes/dropbox');
const hrRoutes         = require('./routes/hr');
const payrollRoutes    = require('./routes/payroll');
const accountingRoutes = require('./routes/accounting');
const toolsRoutes      = require('./routes/tools.routes');
const healthpgRoutes   = require('./routes/healthpg');

// (ak SQLite veci potrebuješ len pre cron, môžu zostať v inom module)
// const db = require('./services/dbCompat');
// const { isWeekend, isHoliday } = require('./utils/dateUtils');

const app = express();

// ping – dôkaz, že beží správny súbor
app.get('/__pingtop', (_req,res)=>res.json({ok:true,where:'backend-staging/server.js'}));

// --- CORS ---
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: [
    'Content-Type','Authorization','x-amz-acl','x-amz-date',
    'x-amz-content-sha256','x-requested-with'
  ]
};
app.use(cors(corsOptions));
app.options('/:splat(.*)', cors(corsOptions)); // preflight

// --- Parsre a statika ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Mounty API (iba relatívne cesty) ---
app.use('/api/messages',   messagesRoutes);
app.use('/api/auth',       authRoutes);
app.use('/api/companies',  companiesRoutes);
app.use('/api/tasks',      tasksRoutes);
app.use('/api/files',      filesRoutes);
app.use('/api/documents',  documentsRoutes);
app.use('/api/cms',        cmsRoutes);
app.use('/api/dropbox',    dropboxRoutes);
app.use('/api/hr',         hrRoutes);
app.use('/api/payroll',    payrollRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/tools',      toolsRoutes);
app.use('/api/healthpg',   healthpgRoutes);

// --- Health (light) ---
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// >>> STAGING INVOICES (PG JSONB) <<<
// Pozor: na serveri máš symlink `backend-staging/routes -> ../routes`,
// ale nechceme riešiť relative/ symlinky. Použijeme ABSOLÚTNU cestu k routeru:
app.use('/api-staging/invoices',
  require('/var/www/html/portal-app/backend/routes/invoices')
);

// --- Error handler (pred 404) ---
app.use((err, _req, res, _next) => {
  console.error('❌ Error middleware:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- 404 LAST ---
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Štart (STAGING na 5001) ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server beží na porte ${PORT}`);
  console.log(`📊 API http://localhost:${PORT}/api`);
  console.log(`🔗 Health http://localhost:${PORT}/api/health`);
});

module.exports = app;
