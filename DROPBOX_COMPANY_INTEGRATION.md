# Dropbox Integrácia pre Firmy - Dokumentácia

## 📋 Prehľad

Táto integrácia umožňuje každej firme mať vlastnú zdieľanú zložku v Dropboxe, ktorá je automaticky vytvorená na základe emailu firmy. Každá firma vidí iba svoje súbory a môže ich zdieľať cez verejný link.

## 🏗️ Architektúra

### Štruktúra zložiek v Dropboxe:
```
/Portal/
├── Companies/
│   ├── [hash_email_1]/     # Zložka pre firmu 1
│   ├── [hash_email_2]/     # Zložka pre firmu 2
│   └── [hash_email_3]/     # Zložka pre firmu 3
└── Shared/                 # Zdieľané súbory (pre admin/účtovníkov)
```

### Hash algoritmus:
- Email sa hashuje pomocou jednoduchého algoritmu
- Výsledok sa konvertuje na base36 string
- Príklad: `firma@example.com` → `abc123def`

## 🔧 Implementácia

### Frontend (React)

#### 1. DropboxService rozšírenia:

```typescript
// Generovanie cesty pre firmu
private getCompanyFolderPath(userEmail: string): string {
  const emailHash = this.hashEmail(userEmail);
  return `/Portal/Companies/${emailHash}`;
}

// Hash emailu
private hashEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
```

#### 2. Rozšírené metódy:

```typescript
// Získanie súborov pre firmu
async listFiles(path: string = '', userEmail?: string): Promise<DropboxFile[]>

// Nahrávanie súborov pre firmu
async uploadFile(file: File, path: string, userEmail?: string): Promise<DropboxUploadResult>

// Vytvorenie zdieľateľnej zložky
async createCompanyFolder(userEmail: string): Promise<string>

// Získanie zdieľateľného linku
async getCompanySharedLink(userEmail: string): Promise<string>
```

### Backend (Node.js)

#### 1. Dropbox Routes:

```javascript
// Vytvorenie zložky pre firmu
POST /api/dropbox/create-company-folder
Body: { userEmail: "firma@example.com" }

// Získanie zdieľateľného linku
GET /api/dropbox/company-shared-link/:userEmail

// Získanie súborov firmy
GET /api/dropbox/company-files/:userEmail?path=subfolder
```

#### 2. Automatické vytváranie zložiek:

```javascript
// Ak priečinok neexistuje, automaticky sa vytvorí
try {
  await dbx.filesGetMetadata({ path: companyPath });
} catch (error) {
  // Priečinok neexistuje, vytvoríme ho
  await dbx.filesCreateFolderV2({
    path: companyPath,
    autorename: true
  });
}
```

## 🎯 Použitie

### Pre Firmy:

1. **Prihlásenie**: Firma sa prihlási svojím emailom
2. **Dropbox Tab**: V CompanyDashboard sa zobrazí Dropbox sekcia
3. **Automatická zložka**: Systém automaticky vytvorí zložku `/Portal/Companies/[hash_email]`
4. **Správa súborov**: Firma môže nahrávať, sťahovať a mazať súbory
5. **Zdieľanie**: Tlačidlom "Zdieľať" sa vytvorí verejný link

### Pre Admin/Účtovníkov:

1. **Plný prístup**: Vidia všetky zložky firiem
2. **Správa**: Môžu spravovať súbory všetkých firiem
3. **Zdieľanie**: Môžu vytvárať zdieľateľné linky pre firmy

## 🔐 Bezpečnosť

### Izolácia firiem:
- Každá firma má vlastnú zložku
- Nemôže pristupovať k súborom iných firiem
- Hash emailu zabezpečuje unikátnosť

### Zdieľateľné linky:
- Verejné linky pre čítanie
- Možnosť nastavenia hesla (budúca funkcia)
- Expirácia linkov (budúca funkcia)

## 📊 API Endpoints

### Frontend API (DropboxService):

```typescript
// Získanie súborov
listFiles(path?: string, userEmail?: string): Promise<DropboxFile[]>

// Nahrávanie
uploadFile(file: File, path: string, userEmail?: string): Promise<DropboxUploadResult>

// Zdieľanie
getCompanySharedLink(userEmail: string): Promise<string>
```

### Backend API:

```javascript
// Vytvorenie zložky
POST /api/dropbox/create-company-folder
{
  "userEmail": "firma@example.com"
}

// Zdieľateľný link
GET /api/dropbox/company-shared-link/firma@example.com

// Súbory firmy
GET /api/dropbox/company-files/firma@example.com?path=documents
```

## 🚀 Nasadenie

### 1. Environment premenné:

```env
# Frontend
REACT_APP_DROPBOX_APP_KEY=your_app_key
REACT_APP_DROPBOX_APP_SECRET=your_app_secret
REACT_APP_DROPBOX_REDIRECT_URI=http://localhost:3000/dropbox-callback

# Backend
DROPBOX_APP_KEY=your_app_key
DROPBOX_APP_SECRET=your_app_secret
DROPBOX_ACCESS_TOKEN=your_access_token
```

### 2. Dropbox App nastavenia:

1. Vytvorte Dropbox App
2. Nastavte OAuth redirect URI
3. Povolte potrebné permissions:
   - `files.metadata.read`
   - `files.content.read`
   - `files.content.write`
   - `files.metadata.write`
   - `sharing.write`

### 3. Spustenie:

```bash
# Backend
cd backend && npm start

# Frontend
npm start
```

## 🔧 Troubleshooting

### Časté problémy:

1. **"Zložka neexistuje"**
   - Systém automaticky vytvorí zložku pri prvom prístupe
   - Skontrolujte, či je Dropbox správne nakonfigurovaný

2. **"Nemôžem nahrať súbor"**
   - Skontrolujte permissions v Dropbox App
   - Overte, či je userEmail správne predaný

3. **"Zdieľateľný link nefunguje"**
   - Link sa vytvára automaticky pri vytvorení zložky
   - Skontrolujte, či má Dropbox App sharing permissions

## 📈 Budúce vylepšenia

### Plánované funkcie:
- [ ] **Heslo pre zdieľateľné linky**
- [ ] **Expirácia linkov**
- [ ] **Notifikácie o zmenách**
- [ ] **Automatická synchronizácia**
- [ ] **Verziovanie súborov**
- [ ] **Komentáre k súborom**

### Optimalizácie:
- [ ] **Caching zdieľateľných linkov**
- [ ] **Batch operácie**
- [ ] **Progress tracking pre veľké súbory**
- [ ] **Offline mode**

## 📞 Podpora

Pre technickú podporu:
- **Email**: support@portal.sk
- **Dokumentácia**: [Dropbox API Docs](https://www.dropbox.com/developers/documentation)
- **GitHub Issues**: [Repository Issues](https://github.com/your-repo/issues)

---

**Poznámka**: Táto integrácia zabezpečuje, že každá firma má vlastnú izolovanú zložku v Dropboxe, čo zvyšuje bezpečnosť a organizáciu súborov.
