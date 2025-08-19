# 🚀 Optimalizácia Kódu - Príručka

## Prehľad Optimalizácií

Tento dokument popisuje implementované optimalizácie pre zlepšenie výkonu a štruktúry kódu.

## 📊 Implementované Optimalizácie

### 1. **Custom Hooks**

#### `useApi` Hook
- **Súbor**: `src/hooks/useApi.ts`
- **Funkcia**: Centralizované API volania s caching a error handling
- **Výhody**:
  - Automatické caching dát
  - Abort controller pre zrušenie volaní
  - Centralizovaný error handling
  - Konfigurovateľný TTL pre cache

```typescript
const { data, loading, error, refetch } = useApi(
  () => apiService.getAllUsers(),
  [],
  'users-cache',
  2 * 60 * 1000 // 2 minúty cache
);
```

#### `useLocalStorage` Hook
- **Súbor**: `src/hooks/useLocalStorage.ts`
- **Funkcia**: Typovo bezpečná práca s localStorage
- **Výhody**:
  - Automatická synchronizácia
  - Error handling
  - TypeScript podpora

#### `useDebounce` Hook
- **Súbor**: `src/hooks/useDebounce.ts`
- **Funkcia**: Debounced hodnoty pre search
- **Výhody**:
  - Zníženie API volaní pri písaní
  - Lepší UX

### 2. **Optimalizované Komponenty**

#### `ErrorBoundary`
- **Súbor**: `src/components/ErrorBoundary.tsx`
- **Funkcia**: Zachytávanie a zobrazovanie chýb
- **Výhody**:
  - Prevencia pádu aplikácie
  - Uživateľsky priateľské error správy

#### `LoadingSpinner`
- **Súbor**: `src/components/LoadingSpinner.tsx`
- **Funkcia**: Reusable loading komponent
- **Výhody**:
  - Konzistentný loading UI
  - Konfigurovateľné veľkosti a farby

#### `VirtualizedList`
- **Súbor**: `src/components/VirtualizedList.tsx`
- **Funkcia**: Virtualizované zoznamy pre veľké datasets
- **Výhody**:
  - Výrazné zlepšenie výkonu pri veľkých zoznamoch
  - Používa react-window

#### `OptimizedTable`
- **Súbor**: `src/components/OptimizedTable.tsx`
- **Funkcia**: Optimalizované tabuľky s memoizáciou
- **Výhody**:
  - Sortovanie
  - Virtualizácia
  - Memoizované renderovanie

#### `SearchInput`
- **Súbor**: `src/components/SearchInput.tsx`
- **Funkcia**: Debounced search input
- **Výhody**:
  - Automatický debounce
  - Clear button
  - Konfigurovateľné

#### `LazyLoad`
- **Súbor**: `src/components/LazyLoad.tsx`
- **Funkcia**: Lazy loading s Intersection Observer
- **Výhody**:
  - Načítanie len viditeľných komponentov
  - Lepší UX

### 3. **App.tsx Optimalizácie**

#### Memoizácia
- `React.memo` pre AutoRedirect komponent
- `useCallback` pre event handlers
- `useMemo` pre dashboard element

#### localStorage Integrácia
- Perzistentné dáta používateľa
- Automatická synchronizácia

#### Error Boundary
- Obalenie celej aplikácie

### 4. **AdminDashboard Refaktoring**

#### Rozdelenie na Menšie Komponenty
- `AdminDashboardContainer` - hlavný container
- Samostatné komponenty pre každú sekciu
- Lepšia separation of concerns

#### API Caching
- Rôzne TTL pre rôzne typy dát
- Automatické refetch

#### Memoizované Filtrovanie
- Efektívne filtrovanie veľkých datasets
- Debounced search

## 🎯 Výkonnostné Vylepšenia

### 1. **Zníženie Re-renderov**
- `React.memo` pre komponenty
- `useCallback` pre funkcie
- `useMemo` pre výpočty

### 2. **API Optimalizácie**
- Caching s TTL
- Abort controller
- Debounced search

### 3. **Virtualizácia**
- Pre veľké zoznamy
- Lepší výkon pri 1000+ položkách

### 4. **Lazy Loading**
- Intersection Observer
- Načítanie len potrebných komponentov

## 📦 Nové Závislosti

```json
{
  "react-window": "^1.8.8",
  "react-virtualized-auto-sizer": "^1.0.20"
}
```

## 🔧 Použitie

### 1. **API Hook**
```typescript
const { data, loading, error, refetch } = useApi(
  () => apiService.getData(),
  [dependency],
  'cache-key',
  60000 // TTL v ms
);
```

### 2. **Virtualized List**
```typescript
<VirtualizedList
  items={largeDataset}
  height={400}
  itemHeight={60}
  renderItem={(item) => <ListItem item={item} />}
/>
```

### 3. **Optimized Table**
```typescript
<OptimizedTable
  data={data}
  columns={columns}
  sortBy="name"
  sortDirection="asc"
  onSort={handleSort}
/>
```

### 4. **Search Input**
```typescript
<SearchInput
  value={searchTerm}
  onChange={setSearchTerm}
  debounceMs={300}
/>
```

## 📈 Očakávané Výhody

1. **Výkon**: 50-80% zlepšenie pri veľkých datasets
2. **UX**: Plynulejšie interakcie
3. **Pamäť**: Nižšia spotreba RAM
4. **Škálovateľnosť**: Lepšia podpora veľkých množstiev dát
5. **Údržba**: Lepšia štruktúra kódu

## 🚀 Ďalšie Optimalizácie

### Plánované Vylepšenia

1. **Code Splitting**
   - React.lazy() pre komponenty
   - Route-based splitting

2. **Service Worker**
   - Offline podpora
   - Cache stratégie

3. **Bundle Analyzer**
   - Identifikácia veľkých balíkov
   - Tree shaking optimalizácie

4. **Performance Monitoring**
   - React DevTools Profiler
   - Lighthouse skóre

## 📝 Best Practices

1. **Vždy používajte memoizáciu** pre nákladné výpočty
2. **Implementujte error boundaries** pre každú hlavnú sekciu
3. **Používajte virtualizáciu** pre zoznamy s 100+ položkami
4. **Cache API volania** s vhodným TTL
5. **Debounce user input** pre lepší UX

## 🔍 Monitoring

Pre sledovanie výkonu odporúčame:

1. **React DevTools Profiler**
2. **Chrome DevTools Performance**
3. **Lighthouse audits**
4. **Bundle analyzer**

---

*Táto príručka sa bude aktualizovať s novými optimalizáciami.*




