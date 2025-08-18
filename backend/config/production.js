module.exports = {
  // Produkčné nastavenia
  NODE_ENV: 'production',
  PORT: process.env.PORT || 5000,
  
  // Databáza
  DB_PATH: process.env.DB_PATH || './database.sqlite',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-production-secret-key',
  JWT_EXPIRES_IN: '24h',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://yourdomain.com',
  CORS_CREDENTIALS: true,
  
  // File upload
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // SSL (ak používate vlastný certifikát)
  SSL_KEY: process.env.SSL_KEY,
  SSL_CERT: process.env.SSL_CERT,
  
  // Logging
  LOG_LEVEL: 'info',
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minút
  RATE_LIMIT_MAX: 100 // max 100 requestov za 15 minút
};
