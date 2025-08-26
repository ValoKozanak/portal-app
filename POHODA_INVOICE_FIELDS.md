# POHODA Faktúry - Polia a štruktúra

## 📋 Prehľad polí pre vydané faktúry

### Základné informácie o faktúre
- **`invoiceNumber`** (symVar) - Číslo faktúry
- **`date`** - Dátum vystavenia
- **`dateTax`** - Dátum zdaniteľného plnenia
- **`dateAccounting`** - Dátum účtovania
- **`dateDelivery`** - Dátum dodania
- **`currency`** - Mena (CZK, EUR, USD)
- **`rate`** - Kurz meny
- **`note`** - Poznámka

### Partner (zákazník)
- **`customerName`** (company) - Názov spoločnosti
- **`customerIco`** (ico) - IČO
- **`customerDic`** (dic) - DIČ
- **`customerAddress`** (street) - Ulica
- **`customerCity`** (city) - Mesto
- **`customerZip`** (zip) - PSČ

### Účtovanie
- **`accountingId`** - Účtovná skupina (311 pre vydané faktúry)
- **`vatClassification`** - Klasifikácia DPH
- **`kvdphClassification`** - Klasifikácia KVDPH

### Platba
- **`paymentType`** - Typ platby
- **`priceLevel`** - Cenová úroveň

### Objednávka
- **`orderNumber`** - Číslo objednávky
- **`orderDate`** - Dátum objednávky

## 📦 Položky faktúry (items)

Každá položka obsahuje:
- **`description`** (text) - Popis položky
- **`quantity`** - Množstvo
- **`unit`** - Jednotka (ks, kg, m, hod)
- **`coefficient`** - Koeficient
- **`payVat`** - Podlieha DPH (true/false)
- **`rateVat`** - Sadzba DPH (high, low, zero)
- **`discountPercentage`** - Zľava v %
- **`unitPrice`** - Jednotková cena
- **`totalPrice`** - Celková cena bez DPH
- **`priceVat`** - DPH
- **`priceSum`** - Celková cena s DPH

## 💰 Súčty faktúry

### Bez DPH
- **`priceNone`** - Cena bez DPH
- **`priceLow`** - Cena so základnou sadzbou DPH
- **`price3`** - Cena s 3. sadzbou DPH

### S DPH
- **`priceLowVat`** - DPH základná sadzba
- **`price3Vat`** - DPH 3. sadzba

### Súčty
- **`priceLowSum`** - Celková cena základná sadzba
- **`priceLowSumVAT`** - Celková DPH základná sadzba
- **`price3Sum`** - Celková cena 3. sadzba
- **`price3SumVAT`** - Celková DPH 3. sadzba

### Zaokrúhľovanie
- **`roundingDocument`** - Zaokrúhľovanie dokumentu
- **`roundingVAT`** - Zaokrúhľovanie DPH

## 🔄 Synchronizácia s POHODA

### Testovanie faktúr
```javascript
// Test získania faktúr z POHODA
const result = await accountingService.testPohodaInvoices(companyId, settings);
```

### Synchronizácia faktúr
```javascript
// Synchronizácia faktúr z POHODA do našej databázy
const result = await accountingService.syncPohodaInvoices(companyId, dateFrom, dateTo);
```

### Filtre pre synchronizáciu
- **`dateFrom`** - Počiatočný dátum
- **`dateTo`** - Koncový dátum
- **`invoiceType`** - Typ faktúry (issued/received)

## 📊 Mapovanie polí

| POHODA pole | Naša databáza | Popis |
|-------------|---------------|-------|
| `symVar` | `invoice_number` | Číslo faktúry |
| `date` | `issue_date` | Dátum vystavenia |
| `dateDelivery` | `due_date` | Dátum splatnosti |
| `partnerIdentity.address.company` | `customer_name` | Názov zákazníka |
| `partnerIdentity.address.ico` | `customer_ico` | IČO zákazníka |
| `partnerIdentity.address.dic` | `customer_dic` | DIČ zákazníka |
| `homeCurrency.priceHighSum` | `total_amount` | Celková suma |
| `homeCurrency.priceHighSumVAT` | `vat_amount` | DPH |
| `currency.ids` | `currency` | Mena |
| `id` | `pohoda_id` | ID v POHODA |

## ⚠️ Dôležité poznámky

1. **IČO_ROK kombinácia** - Pre správnu identifikáciu firmy v POHODA sa používa kombinácia IČO a roku
2. **Autentifikácia** - Všetky požiadavky vyžadujú Basic Auth s používateľským menom a heslom
3. **XML formát** - Všetky dáta sa posielajú v XML formáte podľa POHODA špecifikácie
4. **Chybové stavy** - POHODA vracia detailné chybové správy v XML formáte
5. **Rate limiting** - POHODA mServer má limity na počet požiadaviek za sekundu

## 🧪 Testovanie

1. **Test spojenia** - Overí dostupnosť POHODA mServer
2. **Test faktúr** - Získa zoznam faktúr z POHODA
3. **Synchronizácia** - Importuje faktúry do našej databázy

Všetky testy sú dostupné v POHODA nastaveniach v Admin Dashboard.
