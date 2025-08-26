# Admin práva v účtovníckom module - Návod

## 🔐 Prehľad admin práv

V účtovníckom module má **Admin** exkluzívne práva na:

1. **POHODA E1 integráciu** - nastavenie a konfigurácia
2. **Správu práv** - pridávanie a upravovanie práv pre používateľov
3. **Všeobecné nastavenia** - konfigurácia modulu

## 👤 Kto je Admin?

Admin je používateľ s rolou `admin` v systéme. Táto rola sa nastavuje pri registrácii alebo môže byť zmenená v administrácii systému.

## 🎯 Admin funkcie

### 1. POHODA E1 Nastavenia

**Dostupné len pre Admina:**

- ✅ Konfigurácia POHODA mServer URL
- ✅ Nastavenie prihlasovacích údajov
- ✅ Konfigurácia IČO firmy
- ✅ Testovanie spojenia
- ✅ Nastavenie automatickej synchronizácie
- ✅ Výber frekvencie synchronizácie

**Ako pristúpiť:**
1. Prihláste sa ako Admin
2. Prejdite do účtovníckého modulu
3. Kliknite na záložku "Nastavenia"
4. Kliknite na "POHODA nastavenia"

### 2. Správa práv

**Dostupné len pre Admina:**

- ✅ Pridávanie práv pre používateľov
- ✅ Upravovanie existujúcich práv
- ✅ Odoberanie práv
- ✅ Prehľad všetkých práv v systéme

**Typy práv, ktoré môže Admin udeľovať:**

| Právo | Popis |
|-------|-------|
| `can_view_invoices` | Zobrazenie faktúr |
| `can_create_invoices` | Vytváranie nových faktúr |
| `can_edit_invoices` | Úprava existujúcich faktúr |
| `can_delete_invoices` | Mazanie faktúr |
| `can_view_bank` | Zobrazenie bankových transakcií |
| `can_edit_bank` | Úprava bankových transakcií |
| `can_view_cash` | Zobrazenie pokladničných transakcií |
| `can_edit_cash` | Úprava pokladničných transakcií |
| `can_view_reports` | Zobrazenie reportov |
| `can_export_data` | Export dát |
| `can_manage_settings` | Správa nastavení (okrem POHODA) |

**Ako pristúpiť:**
1. Prihláste sa ako Admin
2. Prejdite do účtovníckého modulu
3. Kliknite na záložku "Práva"
4. Kliknite na "Pridať práva"

### 3. Všeobecné nastavenia

**Dostupné len pre Admina:**

- ✅ Konfigurácia modulu
- ✅ Nastavenie predvolených hodnôt
- ✅ Správa kategórií
- ✅ Konfigurácia notifikácií

## 🔒 Bezpečnosť

### Backend ochrana

Všetky admin endpointy sú chránené kontrolou role:

```javascript
// Kontrola, či je používateľ admin
if (req.user.role !== 'admin') {
  return res.status(403).json({ 
    error: 'Prístup zamietnutý. Len admin môže spravovať nastavenia.' 
  });
}
```

### Frontend ochrana

UI komponenty sa zobrazujú len pre Admina:

```typescript
{userRole === 'admin' && (
  <button onClick={() => setShowPohodaSettingsModal(true)}>
    POHODA nastavenia
  </button>
)}
```

## 📋 Workflow pre Admina

### 1. Počiatočné nastavenie

1. **Nastavenie POHODA integrácie**
   - Konfigurácia mServer URL
   - Zadanie prihlasovacích údajov
   - Testovanie spojenia

2. **Udelovanie práv**
   - Pridanie práv pre účtovníkov
   - Pridanie práv pre manažérov
   - Pridanie práv pre zamestnancov

3. **Konfigurácia modulu**
   - Nastavenie predvolených hodnôt
   - Konfigurácia kategórií

### 2. Denná správa

1. **Monitoring**
   - Kontrola POHODA synchronizácie
   - Prehľad práv používateľov
   - Kontrola logov

2. **Údržba**
   - Aktualizácia práv podľa potreby
   - Riešenie problémov s integráciou
   - Zálohovanie nastavení

## 🚨 Dôležité poznámky

### Pre Admina:

- **Zálohovanie**: Pravidelne zálohujte POHODA nastavenia
- **Bezpečnosť**: Nezdieľajte prihlasovacie údaje k POHODA
- **Monitoring**: Sledujte logy synchronizácie
- **Práva**: Udeľujte práva podľa princípu najmenšieho privilégia

### Pre používateľov:

- **Prístup**: Kontaktujte Admina pre získanie práv
- **Problémy**: Nahláste problémy Adminovi
- **Bezpečnosť**: Nepokúšajte sa obísť práva

## 🔧 Technické detaily

### Databázové tabuľky

```sql
-- Nastavenia účtovníctva (len admin)
CREATE TABLE accounting_settings (
  id INTEGER PRIMARY KEY,
  company_id INTEGER,
  pohoda_enabled BOOLEAN,
  pohoda_url TEXT,
  pohoda_username TEXT,
  pohoda_password TEXT,
  pohoda_ico TEXT,
  auto_sync BOOLEAN,
  sync_frequency TEXT
);

-- Práva používateľov (spravuje admin)
CREATE TABLE accounting_permissions (
  id INTEGER PRIMARY KEY,
  user_email TEXT,
  company_id INTEGER,
  can_view_invoices BOOLEAN,
  can_create_invoices BOOLEAN,
  -- ... ďalšie práva
  granted_by TEXT,
  granted_at DATETIME
);
```

### API Endpointy

```
POST /api/accounting/settings/:companyId     # Len admin
POST /api/accounting/test-pohoda-connection  # Len admin
POST /api/accounting/permissions/:companyId  # Len admin
```

## 📞 Podpora

Ak máte otázky ohľadom admin práv:

1. **Dokumentácia**: Pozrite si `POHODA_INTEGRATION_GUIDE.md`
2. **Logy**: Skontrolujte logy v `pohoda_sync_log` tabuľke
3. **Kontakt**: Obráťte sa na technickú podporu

---

**Dôležité**: Admin práva sú kritická pre bezpečnosť systému. Vždy overte identitu osoby, ktorej udelujete admin práva.
