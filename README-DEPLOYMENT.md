# 🚀 Rýchle nasadenie Client Portal

## ⚡ **Najrýchlejší spôsob: Vercel + Railway**

### **1. Príprava (5 minút)**

```bash
# 1. Pushnite kód na GitHub
git add .
git commit -m "Pripravené pre nasadenie"
git push origin main

# 2. Skontrolujte súbory
ls -la vercel.json backend/railway.json Dockerfile docker-compose.yml
```

### **2. Backend na Railway (10 minút)**

1. **Zaregistrujte sa na [Railway.app](https://railway.app)**
2. **Kliknite "New Project" → "Deploy from GitHub repo"**
3. **Vyberte váš repozitár a `backend` adresár**
4. **Nastavte environment premenné:**
   ```env
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   ```
5. **Deploy a skopírujte URL: `https://your-app.railway.app`**

### **3. Frontend na Vercel (5 minút)**

1. **Zaregistrujte sa na [Vercel.com](https://vercel.com)**
2. **Kliknite "New Project" → Import GitHub repo**
3. **Framework: Create React App, Root: `./`**
4. **Nastavte environment premenné:**
   ```env
   REACT_APP_API_URL=https://your-app.railway.app
   ```
5. **Deploy a skopírujte URL: `https://your-app.vercel.app`**

### **4. Aktualizácia CORS (2 minúty)**

1. **V Railway:**
   - Settings → Variables → `CORS_ORIGIN` = vaša Vercel URL

2. **V Vercel:**
   - Settings → Environment Variables → `REACT_APP_API_URL` = vaša Railway URL

### **5. Testovanie**

- ✅ Frontend: `https://your-app.vercel.app`
- ✅ Backend: `https://your-app.railway.app/api/health`

---

## 🐳 **Lokálne testovanie s Docker**

```bash
# 1. Nainštalujte Docker Desktop
# 2. Spustite
docker-compose up --build

# 3. Prístup
Frontend: http://localhost:3000
Backend: http://localhost:5000
```

---

## 📋 **Potrebné súbory**

✅ `vercel.json` - Vercel konfigurácia  
✅ `backend/railway.json` - Railway konfigurácia  
✅ `Dockerfile` - Frontend Docker  
✅ `backend/Dockerfile` - Backend Docker  
✅ `docker-compose.yml` - Lokálne spustenie  
✅ `deploy.sh` - Linux/Mac deployment script  
✅ `deploy.ps1` - Windows deployment script  

---

## 🔧 **Automatické nasadenie**

### **Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh docker    # Lokálne Docker
./deploy.sh vercel    # Frontend na Vercel
./deploy.sh railway   # Backend na Railway
./deploy.sh all       # Kompletné nasadenie
```

### **Windows:**
```powershell
.\deploy.ps1 docker    # Lokálne Docker
.\deploy.ps1 vercel    # Frontend na Vercel
.\deploy.ps1 railway   # Backend na Railway
.\deploy.ps1 all       # Kompletné nasadenie
```

---

## 🔒 **Bezpečnosť**

### **Povinné nastavenia:**
1. **Silný JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Environment premenné:**
   - Nikdy necommitnite `.env` súbory
   - Používajte platformové secrets

3. **CORS nastavenia:**
   - Obmedzte na vašu doménu

---

## 🚨 **Troubleshooting**

### **Časté problémy:**

1. **CORS chyby:**
   - Skontrolujte `CORS_ORIGIN` v Railway
   - Skontrolujte `REACT_APP_API_URL` v Vercel

2. **Build chyby:**
   - Skontrolujte Node.js verziu (18+)
   - Skontrolujte dependencies

3. **API nedostupné:**
   - Skontrolujte Railway logs
   - Testujte `/api/health` endpoint

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

**Celkový čas: ~20 minút** 🚀
