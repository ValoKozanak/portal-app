# 🔧 Nastavenie Google Calendar API

## Prečo Google Calendar API?

Systém potrebuje aktuálny pracovný kalendár pre presný výpočet dovolenky:
- **Aktuálne sviatky** - štátne sviatky sa môžu meniť
- **Kompenzačné dni** - pracovné dni sa môžu meniť
- **Presnosť** - Google Calendar je vždy aktuálny

## 📋 Kroky na nastavenie

### 1. Vytvorenie Google Cloud Project

1. Choďte na [Google Cloud Console](https://console.cloud.google.com/)
2. Vytvorte nový projekt alebo vyberte existujúci
3. Povoľte Google Calendar API

### 2. Vytvorenie Service Account

1. V Google Cloud Console choďte na **IAM & Admin** > **Service Accounts**
2. Kliknite **Create Service Account**
3. Zadajte názov: `calendar-service`
4. Kliknite **Create and Continue**
5. Pridajte rolu: **Calendar API > Calendar Reader**
6. Kliknite **Done**

### 3. Stiahnutie kľúča

1. Kliknite na vytvorený service account
2. Choďte na **Keys** tab
3. Kliknite **Add Key** > **Create new key**
4. Vyberte **JSON**
5. Stiahnite súbor a premenujte na `google-service-account.json`
6. Umiestnite do `backend/` priečinka

### 4. Nastavenie environment variables

V `.env` súbore pridajte:

```env
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./google-service-account.json
```

### 5. Testovanie

Restartujte backend server a skontrolujte logy:

```bash
cd backend && node server.js
```

Mali by ste vidieť:
```
✅ Google Calendar autentifikácia úspešná
```

## 🔄 Ako to funguje

### Automatické získavanie kalendára
- Systém automaticky získava slovenský štátny kalendár z Google Calendar
- Cache na 24 hodín pre optimalizáciu
- Fallback na lokálny kalendár ak API zlyhá

### Presný výpočet dovolenky
- Vylúči víkendy (sobota, nedeľa)
- Vylúči štátne sviatky z aktuálneho kalendára
- Počíta len pracovné dni

### Príklad
```
Dovolenka: 15.7.2024 - 19.7.2024
Kalendárne dni: 5
Pracovné dni: 5 (pondelok-piatok, žiadne sviatky)

Dovolenka: 24.12.2024 - 26.12.2024  
Kalendárne dni: 3
Pracovné dni: 0 (všetky sviatky)
```

## 🛠️ Troubleshooting

### Chyba: "Google Calendar autentifikácia zlyhala"
1. Skontrolujte či je `google-service-account.json` v správnom priečinku
2. Overte či má service account správne oprávnenia
3. Skontrolujte či je Google Calendar API povolené

### Chyba: "Chyba pri získavaní pracovného kalendára"
- Systém automaticky použije lokálny fallback kalendár
- Skontrolujte internetové pripojenie
- Overte či je Google Calendar API dostupné

### Fallback na lokálny kalendár
Ak Google Calendar API zlyhá, systém použije základné slovenské sviatky:
- 1.1., 6.1., 1.5., 8.5., 5.7., 29.8., 1.9., 15.9., 1.11., 17.11., 24.12., 25.12., 26.12.

## 📊 Výhody

✅ **Aktuálnosť** - vždy najnovšie sviatky  
✅ **Presnosť** - správny výpočet dovolenky  
✅ **Automatizácia** - žiadne manuálne aktualizácie  
✅ **Spoľahlivosť** - fallback na lokálny kalendár  
✅ **Optimalizácia** - cache na 24 hodín  

## 🔮 Budúce vylepšenia

- Podpora pre rôzne krajiny
- Kompenzačné dni
- Špecifické firemné sviatky
- Integrácia s ďalšími kalendárovými službami

