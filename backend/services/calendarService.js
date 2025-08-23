const { google } = require('googleapis');

class CalendarService {
  constructor() {
    this.calendar = google.calendar('v3');
    this.auth = null;
    this.calendarCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hodín
  }

  // Inicializácia autentifikácie
  async initializeAuth() {
    try {
      // Použijeme service account pre automatickú autentifikáciu
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || './google-service-account.json',
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      });
      
      this.auth = await auth.getClient();
      console.log('✅ Google Calendar autentifikácia úspešná');
    } catch (error) {
      console.error('❌ Chyba pri Google Calendar autentifikácii:', error);
      throw error;
    }
  }

  // Získanie slovenského pracovného kalendára z Google Calendar
  async getSlovakWorkCalendar(year) {
    try {
      if (!this.auth) {
        await this.initializeAuth();
      }

      // ID slovenského štátneho kalendára (môže sa meniť)
      const calendarId = 'sk.slovak#holiday@group.v.calendar.google.com';
      
      const startDate = new Date(year, 0, 1).toISOString();
      const endDate = new Date(year, 11, 31).toISOString();

      const response = await this.calendar.events.list({
        auth: this.auth,
        calendarId: calendarId,
        timeMin: startDate,
        timeMax: endDate,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const holidays = response.data.items.map(event => ({
        date: event.start.date,
        title: event.summary,
        description: event.description || ''
      }));

      console.log(`✅ Získaný pracovný kalendár pre rok ${year}: ${holidays.length} sviatkov`);
      return holidays;

    } catch (error) {
      console.error('❌ Chyba pri získavaní pracovného kalendára:', error);
      
      // Fallback na lokálny kalendár ak Google API zlyhá
      return this.getLocalWorkCalendar(year);
    }
  }

  // Lokálny fallback kalendár (dni pracovného pokoja - víkendy + sviatky)
  getLocalWorkCalendar(year) {
    const holidays = [
      { date: `${year}-01-01`, title: 'Deň vzniku Slovenskej republiky' },
      { date: `${year}-01-06`, title: 'Zjavenie Pána (Traja králi)' },
      { date: `${year}-05-01`, title: 'Sviatok práce' },
      { date: `${year}-05-08`, title: 'Deň víťazstva nad fašizmom' },
      { date: `${year}-07-05`, title: 'Sviatok svätého Cyrila a Metoda' },
      { date: `${year}-08-29`, title: 'Výročie SNP' },
      // 1.9.2025 je pondelok - nie je deň pracovného pokoja
      { date: `${year}-09-15`, title: 'Sedembolestná Panna Mária' },
      { date: `${year}-11-01`, title: 'Sviatok všetkých svätých' },
      { date: `${year}-11-17`, title: 'Deň boja za slobodu a demokraciu' },
      { date: `${year}-12-24`, title: 'Štedrý deň' },
      { date: `${year}-12-25`, title: 'Prvý sviatok vianočný' },
      { date: `${year}-12-26`, title: 'Druhý sviatok vianočný' }
    ];

    console.log(`📅 Použitý lokálny kalendár pre rok ${year}`);
    return holidays;
  }

  // Kontrola či je deň sviatok
  isHoliday(date, holidays) {
    // Použijeme lokálny dátum namiesto UTC aby sme predišli posunu
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return holidays.some(holiday => holiday.date === dateString);
  }

  // Kontrola či je deň víkend
  isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = nedeľa, 6 = sobota
  }

  // Výpočet pracovných dní s aktuálnym kalendárom
  async calculateWorkingDays(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const year = start.getFullYear();

      // Získanie aktuálneho kalendára
      const holidays = await this.getSlovakWorkCalendar(year);

      let workingDays = 0;
      const current = new Date(start);

      // Iterujeme cez každý deň v rozsahu
      while (current <= end) {
        // Ak nie je víkend a nie je sviatok, počítame ako pracovný deň
        if (!this.isWeekend(current) && !this.isHoliday(current, holidays)) {
          workingDays++;
        }
        current.setDate(current.getDate() + 1);
      }

      return workingDays;

    } catch (error) {
      console.error('❌ Chyba pri výpočte pracovných dní:', error);
      
      // Fallback na základný výpočet
      return this.calculateBasicWorkingDays(startDate, endDate);
    }
  }

  // Základný výpočet pracovných dní (fallback)
  calculateBasicWorkingDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let workingDays = 0;
    const current = new Date(start);
    
    while (current <= end) {
      if (!this.isWeekend(current)) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
  }

  // Cache pre kalendáre (aby sme nevolali API pre každý výpočet)

  // Získanie kalendára s cache
  async getCachedWorkCalendar(year) {
    const cacheKey = `calendar_${year}`;
    const cached = this.calendarCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(`📅 Použitý cached kalendár pre rok ${year}`);
      return cached.data;
    }

    const calendar = await this.getSlovakWorkCalendar(year);
    this.calendarCache.set(cacheKey, {
      data: calendar,
      timestamp: Date.now()
    });

    return calendar;
  }
}

module.exports = new CalendarService();
