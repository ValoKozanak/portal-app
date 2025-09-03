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

const app = express();

// --- CORS ---
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// (voliteľné) log základných info o requeste
app.use((req, _res, next) => {
  // komentované, aby to nerušilo: odkomentuj pri debugingu
  // console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// --- Parsre a statika ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Mounty API (iba relatívne cesty! žiadne plné URL) ---
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

// --- Healthcheck ---
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// --- Error handler ---
app.use((err, _req, res, _next) => {
  console.error('❌ Error middleware:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- 404 ---
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Štart ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server beží na porte ${PORT}`);
  console.log(`📊 API dostupné na http://localhost:${PORT}/api`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Export pre testy (nevadí v produkcii)
module.exports = app;
