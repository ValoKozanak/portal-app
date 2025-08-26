require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

// Import routes
const { router: authRoutes } = require('./routes/auth');
const companiesRoutes = require('./routes/companies');
const tasksRoutes = require('./routes/tasks');
const filesRoutes = require('./routes/files');
const documentsRoutes = require('./routes/documents');
const cmsRoutes = require('./routes/cms');
const testRoutes = require('./routes/test');
const messagesRoutes = require('./routes/messages');
const dropboxRoutes = require('./routes/dropbox');
const hrRoutes = require('./routes/hr');
const payrollRoutes = require('./routes/payroll');
const accountingRoutes = require('./routes/accounting');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statické súbory pre uploady
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/messages', messagesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/test', testRoutes);
app.use('/api/dropbox', dropboxRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/accounting', accountingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server beží' });
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Niečo sa pokazilo!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint nenájdený' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM prijatý, zatvaram server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT prijatý, zatvaram server...');
  process.exit(0);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('💥 Nezachytená výnimka:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Nezachytená Promise rejection:', reason);
  process.exit(1);
});

// Inicializácia databázy a spustenie servera
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server beží na porte ${PORT}`);
      console.log(`📊 API dostupné na http://localhost:${PORT}/api`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`⏰ Spustený: ${new Date().toISOString()}`);
    });
  })
  .catch((err) => {
    console.error('❌ Chyba pri inicializácii databázy:', err);
    process.exit(1);
  });
