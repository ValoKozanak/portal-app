# Portal App - Správa firiem a úloh

## 🚀 Nasadenie na web

### Možnosti nasadenia:

#### 1. Vercel (Najjednoduchšie - BEZPLATNÉ)
```bash
# Frontend
npm install -g vercel
vercel --prod

# Backend - Vercel Functions
# Vytvoriť api/ folder a presunúť backend kód
```

#### 2. Netlify + Railway (BEZPLATNÉ)
```bash
# Frontend na Netlify
npm run build
# Upload build/ folder

# Backend na Railway
# Connect GitHub repo
```

#### 3. DigitalOcean Droplet ($5-10/mesiac)
```bash
# VPS s Ubuntu
sudo apt update
sudo apt install nodejs npm nginx sqlite3
npm install -g pm2

# Nginx config
sudo nano /etc/nginx/sites-available/portal
sudo ln -s /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# PM2
pm2 start backend/server.js
pm2 startup
pm2 save
```

### Environment Variables:
```env
NODE_ENV=production
PORT=5000
DB_PATH=./database.sqlite
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://yourdomain.com
```

### Build Commands:
```bash
# Frontend
npm run build

# Backend
npm install
node server.js
```

## 📁 Štruktúra projektu:
```
portal-app/
├── frontend/          # React app
├── backend/           # Node.js API
├── database.sqlite    # SQLite databáza
└── uploads/           # Uploadované súbory
```

## 🔧 Konfigurácia pre produkciu:
1. Zmeniť `localhost` na `yourdomain.com` v API calls
2. Nastaviť CORS pre doménu
3. Konfigurovať SSL certifikát
4. Nastaviť environment variables
5. Backup databázy

