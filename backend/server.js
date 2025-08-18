const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

// Import routes
const authRoutes = require('./routes/auth');
const companiesRoutes = require('./routes/companies');
const tasksRoutes = require('./routes/tasks');
const filesRoutes = require('./routes/files');
const cmsRoutes = require('./routes/cms');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statické súbory pre uploady
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/cms', cmsRoutes);

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

// Inicializácia databázy a spustenie servera
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server beží na porte ${PORT}`);
      console.log(`📊 API dostupné na http://localhost:${PORT}/api`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ Chyba pri inicializácii databázy:', err);
    process.exit(1);
  });
