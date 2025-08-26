# POHODA Integrácia - Návod

## 🎯 **Prehľad integrácie**

POHODA integrácia má **dve verzie**:

### **1. POHODA Nastavenia - mServer**
- **Automatická synchronizácia** faktúr cez POHODA mServer API
- **Real-time komunikácia** s POHODA E1
- **Vyžaduje plnú licenciu** POHODA E1
- **Automatické procesy** - synchronizácia podľa nastavenej frekvencie

### **2. POHODA Nastavenia - XML**
- **Manuálny import/export** faktúr cez XML súbory
- **Funguje s demo verziou** POHODA
- **Kontrolovaný proces** - používateľ nahráva XML súbory
- **Flexibilné** - môžete exportovať/importovať podľa potreby

---

## 🔧 **POHODA Nastavenia - mServer**

### **Konfigurácia:**
1. **POHODA URL:** `http://LAPTOP-1GG904CI:8080` (alebo server URL)
2. **Používateľ:** `admin`
3. **Heslo:** `admin`
4. **IČO:** `36255789`
5. **Rok:** `2024`

### **Funkcie:**
- ✅ **Testovať spojenie** - kontroluje pripojenie k mServer
- ✅ **Testovať faktúry** - testuje získanie faktúr z POHODA
- ✅ **Synchronizovať faktúry** - importuje faktúry do aplikácie
- ✅ **Automatická synchronizácia** - nastaviteľná frekvencia

### **Obmedzenia demo verzie:**
- ❌ **mServer endpointy** sú obmedzené
- ❌ **Agendy (faktúry)** môžu byť nedostupné
- ❌ **Potrebuje plnú licenciu** pre plnú funkcionalitu

---

## 📄 **POHODA Nastavenia - XML**

### **Import faktúr:**
1. **Exportujte faktúry** z POHODA do XML súboru
2. **Nahrajte XML súbor** v aplikácii
3. **Systém automaticky** spracuje a importuje faktúry
4. **Kontrola duplicity** - existujúce faktúry sa aktualizujú

### **Export faktúr:**
1. **Vyberte dátumy** (voliteľné)
2. **Kliknite "Exportovať do XML"**
3. **Stiahne sa XML súbor** v POHODA formáte
4. **Importujte súbor** do POHODA

### **Výhody:**
- ✅ **Funguje s demo verziou** POHODA
- ✅ **Hromadný import** - stovky faktúr naraz
- ✅ **Automatické mapovanie** XML → databáza
- ✅ **Bezpečný** - validuje XML formát
- ✅ **Logovanie** - vidíte presne, čo sa importovalo

---

## 🚀 **Ako začať**

### **Pre demo verziu POHODA:**
1. **Povoľte POHODA integráciu** v nastaveniach
2. **Použite XML import/export** pre faktúry
3. **Testujte mServer** (môže byť obmedzený)

### **Pre plnú verziu POHODA E1:**
1. **Nastavte mServer** v POHODA
2. **Povoľte POHODA integráciu** v aplikácii
3. **Nastavte mServer parametre** (URL, prihlásenie, IČO, rok)
4. **Testujte spojenie** a synchronizáciu
5. **Nastavte automatickú synchronizáciu**

---

## 📋 **Demo XML súbor**

Vytvorený je `demo_pohoda_invoices.xml` s 3 demo faktúrami:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack version="2.0" ico="36255789_2024" application="Portal App" note="Demo faktúry">
  <inv:invoice version="2.0">
    <inv:invoiceHeader>
      <inv:invoiceType>issued</inv:invoiceType>
      <inv:symVar>2024/001</inv:symVar>
      <inv:date>2024-01-15</inv:date>
      <!-- ... -->
    </inv:invoiceHeader>
    <inv:invoiceSummary>
      <inv:homeCurrency>
        <typ:priceHighSum>1000.00</typ:priceHighSum>
        <typ:priceHighSumVAT>200.00</typ:priceHighSumVAT>
      </inv:homeCurrency>
    </inv:invoiceSummary>
  </inv:invoice>
</dat:dataPack>
```

---

## 🔍 **Riešenie problémov**

### **Chyba pri nahrávaní XML:**
- ✅ Skontrolujte, či je XML súbor platný
- ✅ Overte, či máte správne oprávnenia
- ✅ Skontrolujte backend logy

### **mServer 404 chyby:**
- ⚠️ **Demo verzia** má obmedzené endpointy
- ✅ Skontrolujte mServer nastavenia v POHODA
- ✅ Overte URL a prihlásenie

### **Autentifikácia:**
- ✅ Skontrolujte, či ste prihlásený
- ✅ Overte, či token nevypršal
- ✅ Skontrolujte oprávnenia používateľa

---

## 📞 **Podpora**

Pre technickú podporu kontaktujte:
- **Email:** info@artprofit.sk
- **Dokumentácia:** Tento súbor
- **Logy:** Backend konzola pre detailné chyby
