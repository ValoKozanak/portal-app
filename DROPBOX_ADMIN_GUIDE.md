# Dropbox Admin Správa - Návod

## 📋 Prehľad

Admin má plnú kontrolu nad Dropbox integráciou a môže spravovať zdieľania a oprávnenia pre všetky firmy v systéme.

## 🔧 Funkcie admina

### ✅ Vytváranie zložiek
- Admin môže vytvoriť Dropbox zložku pre každú firmu
- Zložky sa vytvárajú automaticky na základe emailu firmy
- Štruktúra: `/Portal/Companies/[hash_email]`

### ✅ Nastavovanie zdieľaní
- Admin nastavuje, ktoré firmy majú prístup k Dropbox
- Každá firma má vlastnú zdieľanú zložku
- Zdieľania sa vytvárajú cez verejné linky

### ✅ Správa oprávnení
Admin môže nastaviť 4 typy oprávnení pre každú firmu:

1. **Zobraziť súbory** (`canView`)
   - Firma môže vidieť súbory v zložke
   - Základné oprávnenie pre všetky firmy

2. **Upraviť súbory** (`canEdit`)
   - Firma môže upravovať existujúce súbory
   - Vyžaduje editor prístup

3. **Nahrať súbory** (`canUpload`)
   - Firma môže nahrávať nové súbory
   - Základné oprávnenie pre aktívne firmy

4. **Vymazať súbory** (`canDelete`)
   - Firma môže mazať súbory
   - Vyžaduje editor prístup

## 🎯 Ako to funguje

### 1. Admin Dashboard
```
AdminDashboard → Dropbox sekcia → DropboxAdminPanel
```

### 2. Zoznam firiem
- Zobrazuje všetky firmy v systéme
- Pre každú firmu zobrazuje:
  - Názov firmy
  - Email firmy
  - Cestu k Dropbox zložke
  - Stav zdieľania (Zdieľané/Nezdieľané)
  - Aktuálne oprávnenia

### 3. Vytvorenie zložky
1. Admin klikne "Vytvoriť zložku" pre firmu
2. Systém vytvorí zložku `/Portal/Companies/[hash_email]`
3. Firma sa označí ako "Zdieľané"

### 4. Nastavenie zdieľania
1. Admin klikne "Zdieľať" pre firmu
2. Otvorí sa modal s nastaveniami oprávnení
3. Admin nastaví oprávnenia:
   - ✅ Zobraziť súbory (vždy povolené)
   - ⚪ Upraviť súbory (voliteľné)
   - ✅ Nahrať súbory (odporúčané)
   - ⚪ Vymazať súbory (voliteľné)
4. Systém vytvorí zdieľateľný link
5. Link sa zobrazí v admin paneli

### 5. Odvolanie prístupu
1. Admin klikne "Odobrať" pre firmu
2. Systém odvolá zdieľateľný link
3. Firma stratí prístup k Dropbox zložke

## 🔐 Bezpečnosť

### Izolácia firiem
- Každá firma má vlastnú zložku
- Firmy nemôžu vidieť súbory iných firiem
- Admin má prístup k všetkým zložkám

### Oprávnenia
- **Viewer**: Môže len zobraziť súbory
- **Editor**: Môže upravovať, nahrávať, mazať súbory
- Admin určuje úroveň prístupu pre každú firmu

### Zdieľateľné linky
- Linky sú verejné, ale chránené oprávneniami
- Každý link má nastavené oprávnenia
- Admin môže kedykoľvek odvolať prístup

## 📱 Používateľské rozhranie

### Admin Panel
```
┌─────────────────────────────────────┐
│ Dropbox správa                      │
│ Spravujte prístupy k Dropbox zložkám│
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Firma ABC s.r.o.              [🟢] │
│ firma@abc.sk                        │
│ /Portal/Companies/abc123def         │
│                                     │
│ [Vytvoriť zložku] [Zdieľať] [Odobrať]│
│                                     │
│ Oprávnenia:                         │
│ ✅ Zobraziť  ✅ Nahrať              │
│ ❌ Upraviť   ❌ Vymazať             │
│                                     │
│ Zdieľateľný link:                   │
│ https://dropbox.com/sh/... [Kopírovať]│
└─────────────────────────────────────┘
```

### Share Settings Modal
```
┌─────────────────────────────────────┐
│ Nastavenie zdieľania pre Firma ABC  │
│                                     │
│ Zobraziť súbory        [✅]         │
│ Upraviť súbory         [⚪]         │
│ Nahrať súbory          [✅]         │
│ Vymazať súbory         [⚪]         │
│                                     │
│ [Zrušiť] [Uložiť nastavenia]        │
└─────────────────────────────────────┘
```

## 🔄 Workflow

### Nová firma
1. Admin vytvorí firmu v systéme
2. Admin prejde do Dropbox sekcie
3. Admin klikne "Vytvoriť zložku" pre firmu
4. Admin nastaví oprávnenia a vytvorí zdieľanie
5. Firma dostane prístup k svojej Dropbox zložke

### Zmena oprávnení
1. Admin klikne "Zdieľať" pre existujúcu firmu
2. Admin upraví oprávnenia v modale
3. Systém aktualizuje zdieľateľný link
4. Firma má nové oprávnenia

### Odvolanie prístupu
1. Admin klikne "Odobrať" pre firmu
2. Systém odvolá zdieľateľný link
3. Firma stratí prístup k Dropbox zložke

## 🛠️ Technické detaily

### Backend API
```
POST /api/dropbox/admin/share
- Vytvorenie zdieľania pre firmu

DELETE /api/dropbox/admin/share/:companyEmail
- Odvolanie zdieľania

GET /api/dropbox/admin/shares
- Získanie všetkých zdieľaní
```

### Frontend komponenty
```
DropboxAdminPanel
├── Zoznam firiem s Dropbox nastaveniami
├── Tlačidlá pre správu zdieľaní
├── Zobrazenie oprávnení
└── ShareSettingsModal
    ├── Nastavenia oprávnení
    └── Uloženie nastavení
```

### Dropbox API volania
```javascript
// Vytvorenie zložky
dbx.filesCreateFolderV2({ path: folderPath })

// Vytvorenie zdieľania
dbx.sharingCreateSharedLinkWithSettings({
  path: folderPath,
  settings: { access: 'viewer' | 'editor' }
})

// Odvolanie zdieľania
dbx.sharingRevokeSharedLink({ url: shareLink })
```

## 📋 Checklist pre admin

### Pri vytváraní novej firmy:
- [ ] Vytvoriť firmu v systéme
- [ ] Vytvoriť Dropbox zložku
- [ ] Nastaviť oprávnenia
- [ ] Vytvoriť zdieľateľný link
- [ ] Otestovať prístup firmy

### Pri úprave existujúcej firmy:
- [ ] Skontrolovať aktuálne oprávnenia
- [ ] Upraviť oprávnenia ak potrebné
- [ ] Aktualizovať zdieľateľný link
- [ ] Informovať firmu o zmenách

### Pri odvolávaní prístupu:
- [ ] Potvrdiť odvolanie prístupu
- [ ] Odvolať zdieľateľný link
- [ ] Informovať firmu o odvolaní
- [ ] Skontrolovať, či prístup bol odvolaný

## 🚨 Troubleshooting

### Firma nemôže pristupovať k súborom
1. Skontrolovať, či je zložka vytvorená
2. Skontrolovať, či je zdieľanie aktívne
3. Skontrolovať oprávnenia
4. Otestovať zdieľateľný link

### Chyba pri vytváraní zložky
1. Skontrolovať Dropbox API prístup
2. Skontrolovať, či zložka už neexistuje
3. Skontrolovať oprávnenia admin účtu

### Zdieľateľný link nefunguje
1. Skontrolovať, či link nie je odvolaný
2. Skontrolovať oprávnenia linku
3. Vytvoriť nový zdieľateľný link

## 📞 Podpora

Pre technické problémy kontaktujte:
- Email: support@portal.sk
- Telefón: +421 XXX XXX XXX
- Dokumentácia: https://docs.portal.sk/dropbox-admin
