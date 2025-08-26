# Client Portal - HR Verzia

Toto je rozšírená verzia Client Portal s implementovanými HR (Human Resources) modulmi pre správu zamestnancov, dochádzky a miezd.

## 🆕 Nové funkcionality

### 👥 Správa zamestnancov
- **Pridávanie a editácia zamestnancov** - Kompletné CRUD operácie
- **Pracovné pomery** - Správa pracovných vzťahov s dátumom nástupu/ukončenia
- **Priradenie zamestnancov k firmám** - Jeden zamestnanec môže pracovať pre viacero firiem
- **Zamestnanecké karty** - Detailné informácie o zamestnancoch

### ⏰ Dochádzka
- **Manuálna dochádzka** - Zamestnanci si môžu zaznamenať príchod/odchod
- **Automatická dochádzka** - Výpočet dochádzky na základe pracovných parametrov
- **Hybridný systém** - Možnosť nastaviť manuálny alebo automatický režim per zamestnanec
- **Oprava dochádzky** - HR manažéri môžu opraviť chyby v dochádzke
- **Prehľad dochádzky** - Štatistiky a reporty

### 💰 Mzdy a mzdové obdobia
- **Mzdové obdobia** - Správa mesačných období (otvorené/uzavreté)
- **Uzavieranie období** - Admin/Accountant môže uzavrieť minulé mesiace
- **Automatické vytváranie** - Nové mesiace sa automaticky vytvárajú
- **Blokovanie úprav** - Po uzavretí obdobia sa nedajú meniť dochádzky

### 🏢 Rozšírené správy firiem
- **Priradenie účtovníkov** - Jeden účtovník môže mať viacero firiem
- **Správa účtovníkov** - Admin môže priradiť/odobrať účtovníkov z firiem
- **Rozšírené dashboardy** - Špecifické pre každú rolu (Admin, Accountant, HR, Employee)

### 📅 Kalendár a dovolenky
- **Správa dovoleniek** - Žiadosti o dovolenku, schvaľovanie
- **PN a absencie** - Rôzne typy neprítomnosti
- **Google Calendar integrácia** - Sťahovanie sviatkov (s lokálnym fallbackom)
- **Výpočet pracovných dní** - Bezpečne počítané bez víkendov a sviatkov

### 🔧 Technické vylepšenia
- **TypeScript typy** - Kompletné typovanie pre HR moduly
- **API rozšírenia** - Nové endpointy pre HR funkcionality
- **Databázové schémy** - Rozšírené tabuľky pre zamestnancov, dochádzku, mzdy
- **Middleware** - Autentifikácia a autorizácia pre HR moduly

## 🚀 Spustenie aplikácie

### Backend (port 5000)
```bash
cd backend
npm install
npm start
```

### Frontend (port 3000)
```bash
npm install
npm start
```

## 👤 Demo účty

### Admin
- Email: `admin@portal.sk`
- Heslo: `[DEMO_HESLO]`

### Účtovník
- Email: `accountant@portal.sk`
- Heslo: `[DEMO_HESLO]`

### Zamestnanec
- Email: `jozo@jozo.sk`
- Heslo: `[DEMO_HESLO]`

## 📊 Databázové schémy

### Nové tabuľky
- `employees` - Zamestnanci
- `employment_relations` - Pracovné pomery
- `attendance` - Dochádzka
- `leave_requests` - Žiadosti o dovolenku
- `work_shifts` - Pracovné zmeny
- `payroll_periods` - Mzdové obdobia
- `company_accountants` - Priradenie účtovníkov k firmám

## 🔄 Rozdiely oproti základnej verzii

Táto HR verzia obsahuje všetky funkcionality základnej verzie plus:
- Kompletné HR moduly
- Správa zamestnancov a dochádzky
- Mzdové obdobia a ich správa
- Rozšírené API endpointy
- Nové komponenty a stránky
- Rozšírené dashboardy

## 📝 Poznámky

- Všetky demo dáta sú vyčistené na minimum (1 záznam per modul)
- Google Calendar API vyžaduje konfiguráciu pre sviatky
- Mzdové obdobia sa automaticky vytvárajú pre aktuálny rok
- Dochádzka sa počítá len za dni pred aktuálnym dňom

## 🔗 GitHub

- **Základná verzia**: `master` branch
- **HR verzia**: `hr-version` branch

---

*Vytvorené ako rozšírenie základného Client Portal systému*
