# 🚀 Návod na nasadenie Client Portal

## 📋 Prehľad možností nasadenia

### 1. **Vercel + Railway (Odporúčané)**
- Frontend: Vercel (bezplatné)
- Backend: Railway (bezplatné tier)
- Databáza: SQLite (v Railway)

### 2. **Heroku**
- Frontend: Heroku Static Buildpack
- Backend: Heroku Node.js Buildpack
- Databáza: Heroku Postgres

### 3. **DigitalOcean App Platform**
- Frontend + Backend v jednom
- Automatické SSL
- Škálovanie

### 4. **VPS (Vlastný server)**
- Docker deployment
- Nginx reverse proxy
- SSL certifikát

---

## 🎯 **Postup: Vercel + Railway**

### **Krok 1: Príprava GitHub repozitára**

1. **Pushnite kód na GitHub:**
```bash
git add .
git commit -m "Pripravené pre nasadenie"
git push origin main
```

2. **Skontrolujte, či máte všetky súbory:**
- ✅ `vercel.json`
- ✅ `backend/railway.json`
- ✅ `Dockerfile`
- ✅ `backend/Dockerfile`
- ✅ `docker-compose.yml`

### **Krok 2: Nasadenie Backendu na Railway**

1. **Zaregistrujte sa na [Railway.app](https://railway.app)**
2. **Pripojte GitHub repozitár**
3. **Vytvorte nový projekt:**
   - Kliknite "New Project"
   - Vyberte "Deploy from GitHub repo"
   - Vyberte váš repozitár
   - Vyberte `backend` adresár

4. **Nastavte environment premenné:**
```env
NODE_ENV=production
PORT=5000
DB_PATH=./database.sqlite
JWT_SECRET=your-super-secure-jwt-secret-key-here
CORS_ORIGIN=https://your-frontend-url.vercel.app
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=noreply@yourdomain.com
```

5. **Deploy a získajte URL:**
   - Railway vám poskytne URL ako: `https://your-app-name.railway.app`

### **Krok 3: Nasadenie Frontendu na Vercel**

1. **Zaregistrujte sa na [Vercel.com](https://vercel.com)**
2. **Pripojte GitHub repozitár**
3. **Importujte projekt:**
   - Kliknite "New Project"
   - Vyberte váš repozitár
   - Framework Preset: `Create React App`
   - Root Directory: `./` (root)

4. **Nastavte environment premenné:**
```env
REACT_APP_API_URL=https://your-backend-url.railway.app
REACT_APP_DROPBOX_APP_KEY=your_dropbox_app_key_here
REACT_APP_DROPBOX_APP_SECRET=your_dropbox_app_secret_here
REACT_APP_DROPBOX_REDIRECT_URI=https://your-frontend-url.vercel.app/dropbox-callback
```

5. **Deploy a získajte URL:**
   - Vercel vám poskytne URL ako: `https://your-app-name.vercel.app`

### **Krok 4: Aktualizácia CORS a Redirect URI**

1. **V Railway (Backend):**
   - Aktualizujte `CORS_ORIGIN` na vašu Vercel URL

2. **V Dropbox Developer Console:**
   - Aktualizujte `Redirect URI` na vašu Vercel URL

3. **V Vercel (Frontend):**
   - Aktualizujte `REACT_APP_DROPBOX_REDIRECT_URI`

### **Krok 5: Testovanie**

1. **Otestujte API:**
   - `https://your-backend-url.railway.app/api/health`

2. **Otestujte Frontend:**
   - `https://your-frontend-url.vercel.app`

---

## 🐳 **Postup: Docker Deployment**

### **Lokálne testovanie:**
```bash
# Build a spustenie
docker-compose up --build

# Prístup
Frontend: http://localhost:3000
Backend: http://localhost:5000
```

### **Na VPS:**
```bash
# 1. Nainštalujte Docker a Docker Compose
# 2. Naklonujte repozitár
git clone https://github.com/your-username/portal-app.git
cd portal-app

# 3. Vytvorte .env súbor
cp env.production.example .env
# Upravte .env súbor

# 4. Spustite
docker-compose up -d

# 5. Nastavte Nginx reverse proxy
# 6. Nastavte SSL certifikát (Let's Encrypt)
```

---

## 🔧 **Konfigurácia domény**

### **Vercel:**
1. V Settings → Domains
2. Pridajte vašu doménu
3. Nastavte DNS záznamy

### **Railway:**
1. V Settings → Domains
2. Pridajte custom doménu
3. Nastavte DNS záznamy

---

## 🔒 **Bezpečnosť**

### **Povinné nastavenia:**
1. **Silný JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **HTTPS všade:**
   - Vercel: automatické
   - Railway: automatické

3. **Environment premenné:**
   - Nikdy necommitnite `.env` súbory
   - Používajte platformové secrets

4. **CORS nastavenia:**
   - Obmedzte na vašu doménu

---

## 📊 **Monitoring a Logy**

### **Vercel:**
- Analytics v dashboard
- Function logs
- Performance metrics

### **Railway:**
- Real-time logs
- Resource usage
- Health checks

---

## 🚨 **Troubleshooting**

### **Časté problémy:**

1. **CORS chyby:**
   - Skontrolujte `CORS_ORIGIN` v backend
   - Skontrolujte `REACT_APP_API_URL` v frontend

2. **Build chyby:**
   - Skontrolujte Node.js verziu
   - Skontrolujte dependencies

3. **API nedostupné:**
   - Skontrolujte Railway logs
   - Skontrolujte health check endpoint

4. **Databáza problémy:**
   - Skontrolujte `DB_PATH`
   - Skontrolujte permissions

---

## 📞 **Podpora**

Ak máte problémy:
1. Skontrolujte logy v Railway/Vercel
2. Otestujte lokálne s Docker
3. Skontrolujte environment premenné
4. Otestujte API endpoints

---

## 🎉 **Úspešné nasadenie!**

Po úspešnom nasadení budete mať:
- ✅ Frontend dostupný na `https://your-app.vercel.app`
- ✅ Backend API na `https://your-app.railway.app`
- ✅ Automatické SSL certifikáty
- ✅ CDN pre rýchle načítanie
- ✅ Automatické nasadenie z GitHub
