# Dropbox Integrácia - Návod na implementáciu

## 📋 Prehľad

Dropbox integrácia umožňuje používateľom sprístupniť a spravovať súbory priamo z Dropbox účtu v rámci portálu. Funkcia je dostupná pre všetky typy používateľov (admin, účtovník, firma).

## 🚀 Funkcie

### ✅ Už implementované:
- **OAuth 2.0 autentifikácia** - bezpečné pripojenie k Dropbox účtu
- **Prehliadač súborov** - navigácia cez Dropbox priečinky
- **Nahrávanie súborov** - nahrávanie súborov do Dropbox
- **Sťahovanie súborov** - sťahovanie súborov z Dropbox
- **Mazanie súborov** - mazanie súborov z Dropbox
- **Vytváranie priečinkov** - organizácia súborov
- **Zdieľateľné linky** - generovanie verejných linkov
- **Refresh token** - automatické obnovovanie prístupu
- **Progress tracking** - sledovanie priebehu nahrávania

### 🔄 Integrácia v aplikácii:
- **AdminDashboard** - Dropbox sekcia pre správu
- **CompanyDashboard** - Dropbox tab pre firmy
- **AccountantDashboard** - Dropbox sekcia pre účtovníkov

## ⚙️ Konfigurácia

### 1. Vytvorenie Dropbox aplikácie

1. Choďte na [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Kliknite "Create app"
3. Vyberte "Scoped access"
4. Vyberte "Full Dropbox" access
5. Zadajte názov aplikácie (napr. "Portal App")
6. V sekcii "Permissions" povolte:
   - `files.metadata.read`
   - `files.content.read`
   - `files.content.write`
   - `files.metadata.write`
   - `sharing.write`

### 2. Nastavenie environment premenných

Vytvorte `.env` súbor v root priečinku:

```env
# Dropbox Configuration
REACT_APP_DROPBOX_APP_KEY=your_dropbox_app_key_here
REACT_APP_DROPBOX_APP_SECRET=your_dropbox_app_secret_here
REACT_APP_DROPBOX_REDIRECT_URI=http://localhost:3000/dropbox-callback
```

### 3. Nastavenie OAuth redirect URI

V Dropbox App Console nastavte:
- **OAuth 2 redirect URIs**: `http://localhost:3000/dropbox-callback`
- Pre produkciu: `https://yourdomain.com/dropbox-callback`

## 📁 Štruktúra súborov

```
src/
├── components/
│   ├── DropboxIntegration.tsx    # Hlavný komponent
│   └── ...
├── services/
│   ├── dropboxService.ts         # Dropbox API service
│   └── ...
├── pages/
│   ├── DropboxCallback.tsx       # OAuth callback handler
│   └── ...
└── ...
```

## 🔧 Použitie

### Základné použitie komponentu:

```tsx
import DropboxIntegration from '../components/DropboxIntegration';

<DropboxIntegration
  companyId={123}
  onFileSelect={(file) => {
    console.log('Selected file:', file);
    // Implementácia logiky pre výber súboru
  }}
/>
```

### Props:

- `companyId?: number` - ID firmy pre organizáciu súborov
- `onFileSelect?: (file: DropboxFile) => void` - callback pre výber súboru

## 🔐 Bezpečnosť

### OAuth 2.0 Flow:
1. Používateľ klikne "Pripojiť Dropbox"
2. Presmeruje sa na Dropbox OAuth stránku
3. Používateľ autorizuje aplikáciu
4. Dropbox presmeruje späť s authorization code
5. Aplikácia vymení code za access token
6. Token sa uloží v localStorage (pre development)

### Token management:
- Access token sa automaticky obnovuje pomocou refresh token
- Tokens sa ukladajú v localStorage (v produkcii by mali byť v secure cookies)
- Logout vymaže všetky tokens

## 📊 API Endpoints

### DropboxService metódy:

```typescript
// Autentifikácia
getAuthUrl(): string
handleAuthCallback(code: string, state: string): Promise<DropboxAuthResult>
isAuthenticated(): boolean
logout(): void

// Správa súborov
listFiles(path?: string): Promise<DropboxFile[]>
uploadFile(file: File, path: string): Promise<DropboxUploadResult>
downloadFile(path: string): Promise<Blob>
deleteFile(path: string): Promise<void>
createFolder(path: string): Promise<void>
getSharedLink(path: string): Promise<string>

// Token management
refreshAccessToken(): Promise<string>
getAccountInfo(): Promise<any>
```

## 🎨 UI Komponenty

### DropboxIntegration komponent:
- **Login screen** - pre neprihlásených používateľov
- **File browser** - navigácia cez priečinky
- **Upload section** - nahrávanie súborov
- **File list** - zoznam súborov s akciami
- **Progress bars** - sledovanie priebehu

### Ikonky a štýly:
- Používa Heroicons
- Tailwind CSS pre štýlovanie
- Responsive design
- Loading states a error handling

## 🚀 Nasadenie

### Development:
```bash
npm install
npm start
```

### Produkcia:
1. Nastavte environment premenné
2. Zmeňte redirect URI na produkčnú doménu
3. Build aplikácie: `npm run build`
4. Deploy na hosting

## 🔧 Troubleshooting

### Časté problémy:

1. **"Invalid state parameter"**
   - Vymažte localStorage a skúste znova
   - Skontrolujte, či sa state správne ukladá

2. **"Failed to exchange code for token"**
   - Skontrolujte APP_KEY a APP_SECRET
   - Overte redirect URI v Dropbox App Console

3. **"Dropbox not initialized"**
   - Skontrolujte, či je access token uložený
   - Skúste refresh token

4. **CORS chyby**
   - Skontrolujte CORS nastavenia v backend
   - Overte, či je frontend na správnej doméne

## 📈 Budúce vylepšenia

### Plánované funkcie:
- [ ] **Synchronizácia s lokálnymi súbormi** - automatická synchronizácia
- [ ] **Batch operácie** - hromadné nahrávanie/sťahovanie
- [ ] **Verziovanie súborov** - sledovanie zmien
- [ ] **Komentáre k súborom** - pridávanie poznámok
- [ ] **Notifikácie** - upozornenia na zmeny
- [ ] **Offline mode** - práca bez internetu
- [ ] **Encryption** - šifrovanie citlivých súborov

### Optimalizácie:
- [ ] **Lazy loading** - načítavanie súborov na požiadanie
- [ ] **Caching** - cache často používaných súborov
- [ ] **Compression** - kompresia veľkých súborov
- [ ] **Resumable uploads** - pokračovanie prerušených nahrávaní

## 📞 Podpora

Pre technickú podporu kontaktujte:
- **Email**: support@portal.sk
- **Dokumentácia**: [Dropbox API Docs](https://www.dropbox.com/developers/documentation)
- **GitHub Issues**: [Repository Issues](https://github.com/your-repo/issues)

---

**Poznámka**: Táto integrácia je určená pre development a testovanie. Pre produkčné nasadenie odporúčame implementovať dodatočné bezpečnostné opatrenia.
