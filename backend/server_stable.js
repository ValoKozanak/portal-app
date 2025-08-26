const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statické súbory
app.use(express.static(path.join(__dirname, '../build')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Import routes
try {
  const authRoutes = require('./routes/auth');
  const companyRoutes = require('./routes/companies');
  const accountingRoutes = require('./routes/accounting');
  const hrRoutes = require('./routes/hr');
  const messagesRoutes = require('./routes/messages');
  const tasksRoutes = require('./routes/tasks');
  const payrollRoutes = require('./routes/payroll');

  app.use('/api/auth', authRoutes);
  app.use('/api/companies', companyRoutes);
  app.use('/api/accounting', accountingRoutes);
  app.use('/api/hr', hrRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/tasks', tasksRoutes);
  app.use('/api/payroll', payrollRoutes);

  console.log('✅ Všetky routes načítané úspešne');
} catch (error) {
  console.error('❌ Chyba pri načítaní routes:', error.message);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err);
  res.status(500).json({ 
    error: 'Interná chyba servera',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Niečo sa pokazilo'
  });
});

// 404 handler
app.use('*', (req, res) => {
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Stabilný server beží na porte ${PORT}`);
  console.log(`📊 API dostupné na http://localhost:${PORT}/api`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⏰ Spustený: ${new Date().toISOString()}`);
});
