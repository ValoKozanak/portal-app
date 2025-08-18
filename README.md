# Webový Portál - Účtovníctvo a Správa Firiem

Moderný webový portál pre správu firiem, úloh a dokumentov s podporou pre účtovníkov, administrátorov a klientov.

## 🚀 Funkcie

### 👥 Používatelia
- **Admin** - Správa všetkých používateľov, firiem a systému
- **Účtovník** - Správa priradených firiem a ich dokumentov
- **Klient** - Prehľad vlastných firiem a úloh

### 🏢 Správa Firiem
- Vytváranie a správa firiem
- Priradenie účtovníkov k firmám
- Prehľad dokumentov a úloh pre každú firmu

### 📁 Správa Dokumentov
- Nahrávanie súborov s diakritikou
- Kategorizácia dokumentov (faktúry, zmluvy, správy, atď.)
- Vyhľadávanie a filtrovanie
- Stahovanie súborov s pôvodnými názvami

### 📋 Správa Úloh
- Vytváranie a priradenie úloh
- Sledovanie stavu a priority
- Termíny a notifikácie

## 🛠️ Technológie

### Frontend
- **React** 18.x
- **TypeScript**
- **Tailwind CSS**
- **Heroicons**
- **React Router**

### Backend
- **Node.js**
- **Express.js**
- **SQLite** (databáza)
- **Multer** (upload súborov)

## 📦 Inštalácia

### Požiadavky
- Node.js 16+ 
- npm alebo yarn

### Kroky inštalácie

1. **Klonovanie repository**
```bash
git clone https://github.com/ValoKozanak/portal-app.git
cd portal-app
```

2. **Inštalácia závislostí**
```bash
npm install
cd backend
npm install
cd ..
```

3. **Spustenie aplikácie**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm start
```

4. **Prístup k aplikácii**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔧 Konfigurácia

### Databáza
Aplikácia používa SQLite databázu, ktorá sa automaticky vytvorí pri prvom spustení.

### Upload súborov
Súbory sa ukladajú do `backend/uploads/` adresára.

## 👤 Prihlasovacie údaje

### Admin
- Email: `admin@portal.sk`
- Heslo: `admin123`

### Účtovník
- Email: `accountant@portal.sk`
- Heslo: `accountant123`

### Klient
- Email: `user@portal.sk`
- Heslo: `user123`

## 📁 Štruktúra projektu

```
portal-app/
├── src/                    # Frontend React aplikácia
│   ├── components/         # React komponenty
│   ├── pages/             # Stránky aplikácie
│   ├── services/          # API služby
│   └── ...
├── backend/               # Node.js backend
│   ├── routes/           # API routes
│   ├── database.js       # Databázová konfigurácia
│   ├── server.js         # Hlavný server súbor
│   └── uploads/          # Uploadované súbory
├── package.json
└── README.md
```

## 🔒 Bezpečnosť

- Autentifikácia cez JWT tokeny
- Validácia vstupov
- Bezpečné nahrávanie súborov
- Ochrana proti XSS a CSRF

## 🐛 Riešenie problémov

### Problém s diakritikou
Ak sa názvy súborov nezobrazujú správne s diakritikou:
1. Skontrolujte, či je backend spustený
2. Reštartujte backend server
3. Skontrolujte kódovanie súborov

### Problém s prihlásením
Ak sa nemôžete prihlásiť:
1. Skontrolujte, či bežia oba servery
2. Skontrolujte prihlasovacie údaje
3. Skontrolujte konzolu pre chyby

## 📝 Changelog

### v1.0.0 (Aktuálna verzia)
- ✅ Základná funkcionalita portálu
- ✅ Správa používateľov a firiem
- ✅ Upload a správa súborov s diakritikou
- ✅ Správa úloh
- ✅ Rôzne dashboardy pre rôzne typy používateľov
- ✅ Povinný výber firmy pri nahrávaní súborov

## 🤝 Príspevky

1. Fork repository
2. Vytvorte feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit zmeny (`git commit -m 'Add some AmazingFeature'`)
4. Push do branch (`git push origin feature/AmazingFeature`)
5. Otvorte Pull Request

## 📄 Licencia

Tento projekt je licencovaný pod MIT licenciou.

## 👨‍💻 Autor

**ValoKozanak**
- GitHub: [@ValoKozanak](https://github.com/ValoKozanak)

---

**Poznámka:** Toto je vývojová verzia aplikácie. Pre produkčné nasadenie odporúčame dodatočné bezpečnostné opatrenia.
