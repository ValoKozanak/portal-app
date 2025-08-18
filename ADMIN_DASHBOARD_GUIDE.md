# 🎛️ Admin Dashboard - Kompletný Sprievodca

## 📋 Prehľad

Admin Dashboard je centrálny panel pre správu celého systému s najvyššími oprávneniami. Poskytuje kompletnú kontrolu nad používateľmi, firmami, úlohami a dokumentmi.

## 🎯 Hlavné Funkcie

### 1. **Prehľad (Overview)**
- **Štatistiky v reálnom čase**
  - Celkový počet používateľov
  - Počet registrovaných firiem
  - Aktívne úlohy
  - Počet dokumentov
- **Rýchle akcie**
  - Pridanie nového používateľa
  - Pridanie novej firmy
  - Vytvorenie novej úlohy
- **Systémový stav**
  - API Server status
  - Databáza status
  - Backup status
- **Posledné aktivity**
  - Sledovanie systémových udalostí

### 2. **Správa Používateľov**
- **Zobrazenie všetkých používateľov**
  - Meno a email
  - Rola (Admin/Účtovník/Používateľ)
  - Status (Aktívny/Neaktívny)
  - Posledné prihlásenie
- **Akcie**
  - Zobrazenie detailov
  - Úprava používateľa
  - Vymazanie používateľa
- **Pridávanie nových používateľov**
  - Formulár s validáciou
  - Nastavenie role a statusu

### 3. **Správa Firiem**
- **Zobrazenie všetkých firiem**
  - Názov a IČO
  - Kontaktné informácie
  - Status firmy
  - Priradený účtovník
- **Akcie**
  - Zobrazenie detailov
  - Úprava firmy
  - Vymazanie firmy
- **Pridávanie nových firiem**
  - Kompletný formulár
  - Validácia údajov

### 4. **Správa Úloh**
- **Zobrazenie všetkých úloh**
  - Názov a popis
  - Priradená firma
  - Priradený používateľ
  - Termín splnenia
  - Priorita a status
- **Akcie**
  - Zobrazenie detailov
  - Úprava úlohy
  - Vymazanie úlohy
- **Vytváranie nových úloh**
  - Kompletný formulár
  - Výber firmy a používateľa

### 5. **Správa Dokumentov**
- **Zobrazenie všetkých dokumentov**
  - Názov a typ súboru
  - Veľkosť súboru
  - Priradená firma
  - Nahral používateľ
  - Dátum nahratia
- **Akcie**
  - Zobrazenie dokumentu
  - Stiahnutie dokumentu
  - Vymazanie dokumentu
- **Nahrávanie nových dokumentov**
  - Drag & drop podpora
  - Validácia typov súborov

### 6. **Systémové Nastavenia**
- **Všeobecné nastavenia**
  - Názov aplikácie
  - Maximálna veľkosť súboru
  - Cache TTL
- **Bezpečnosť**
  - Dvojfaktorová autentifikácia
  - Automatické zálohovanie
  - Audit log
- **Notifikácie**
  - Email notifikácie
  - Push notifikácie
  - SMS notifikácie
- **Systémové informácie**
  - Verzia aplikácie
  - Posledná aktualizácia
  - Status služieb

## 🎨 UI/UX Vlastnosti

### **Responsive Design**
- Optimalizované pre desktop, tablet a mobil
- Adaptívne layouty
- Touch-friendly interakcie

### **Moderný Design**
- Material Design princípy
- Konzistentné farby a typografia
- Intuitívne ikony a navigácia

### **Loading States**
- Skeleton loaders
- Progress indikátory
- Smooth transitions

### **Error Handling**
- User-friendly error messages
- Retry mechanisms
- Graceful degradation

## 🔧 Technické Detaily

### **Komponenty**
```typescript
// Hlavný container
AdminDashboardContainer.tsx

// Sekcie
- Overview (Prehľad)
- Users (Používatelia)
- Companies (Firmy)
- Tasks (Úlohy)
- Documents (Dokumenty)
- Settings (Nastavenia)
```

### **State Management**
```typescript
// Lokálny state
const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
const [selectedUser, setSelectedUser] = useState<any>(null);
const [showUserModal, setShowUserModal] = useState(false);

// API hooks s caching
const { data: users, loading: usersLoading, refetch: refetchUsers } = useApi(
  () => apiService.getAllUsers(),
  [],
  'admin-users',
  2 * 60 * 1000 // 2 minúty cache
);
```

### **API Integrácia**
- Centralizované API volania
- Automatické refresh dát
- Error handling
- Loading states

### **Performance Optimizácie**
- React.memo pre komponenty
- useCallback pre event handlers
- useMemo pre výpočty
- Lazy loading sekcií

## 🚀 Používanie

### **Navigácia**
1. Kliknite na požadovanú sekciu v hornom menu
2. Použite ikony pre rýchle rozpoznanie
3. Aktívna sekcia je zvýraznená

### **Pridávanie Záznamov**
1. Kliknite na tlačidlo "Pridať" v príslušnej sekcii
2. Vyplňte formulár
3. Kliknite na "Uložiť"

### **Úprava Záznamov**
1. Kliknite na ikonu "Upraviť" (tužka)
2. Upravte údaje v modálnom okne
3. Kliknite na "Uložiť"

### **Vymazanie Záznamov**
1. Kliknite na ikonu "Vymazať" (kôš)
2. Potvrďte akciu
3. Záznam sa vymaže

## 🔒 Bezpečnosť

### **Oprávnenia**
- Admin má prístup ku všetkým dátam
- Môže upravovať všetky záznamy
- Môže pridávať a vymazávať používateľov
- Môže spravovať firmy a úlohy

### **Validácia**
- Client-side validácia formulárov
- Server-side validácia API
- XSS protection
- CSRF protection

### **Audit Log**
- Sledovanie všetkých admin akcií
- Logovanie zmien
- Historické záznamy

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  /* Stacked layout */
  /* Smaller buttons */
  /* Touch-friendly interactions */
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Medium layout */
  /* Optimized spacing */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full layout */
  /* Hover effects */
  /* Advanced interactions */
}
```

## 🎯 Best Practices

### **Pre Admin Používateľov**
1. **Pravidelné kontroly** - Skontrolujte systémové štatistiky
2. **Backup** - Uistite sa, že zálohovanie funguje
3. **Monitoring** - Sledujte výkon a chyby
4. **Aktualizácie** - Udržiavajte systém aktuálny

### **Pre Vývojárov**
1. **TypeScript** - Používajte typy pre všetky props
2. **Error Boundaries** - Zachytávajte chyby
3. **Loading States** - Vždy zobrazujte loading
4. **Accessibility** - Dodržiavajte WCAG guidelines

## 🔄 Budúce Vylepšenia

### **Plánované Funkcie**
- [ ] Bulk operácie (hromadné akcie)
- [ ] Advanced filtering a search
- [ ] Export dát (CSV, PDF)
- [ ] Real-time notifikácie
- [ ] Advanced analytics
- [ ] Custom dashboard widgets

### **Performance Vylepšenia**
- [ ] Virtual scrolling pre veľké zoznamy
- [ ] Infinite scroll
- [ ] Optimistic updates
- [ ] Background sync

### **UX Vylepšenia**
- [ ] Keyboard shortcuts
- [ ] Drag & drop reordering
- [ ] Bulk selection
- [ ] Advanced search filters

---

## 📞 Podpora

Pre technickú podporu alebo otázky kontaktujte:
- **Email**: admin@accountingportal.com
- **Telefón**: +421 XXX XXX XXX
- **Dokumentácia**: /docs/admin-dashboard

---

*Posledná aktualizácia: 18.08.2025*
