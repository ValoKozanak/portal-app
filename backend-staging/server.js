require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// middlewares
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ping (istota, že beží správny server.js)
app.get('/__pingtop', (_req, res) =>
  res.json({ ok: true, where: 'staging/server.js' })
);

// health
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, now: new Date().toISOString() })
);

// invoices router – ABSOLÚTNA cesta (obchádza symlink)
try {
  app.use(
    '/api-staging/invoices',
    require('/var/www/html/portal-app/backend/routes/invoices')
  );
  console.log('[staging] invoices router mounted');
} catch (e) {
  console.error(
    '[staging] invoices router failed:',
    e && e.message ? e.message : e
  );
}

// 404 last
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// start (staging 5001)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log('STAGING listening on', PORT));

module.exports = app;
