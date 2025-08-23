import { apiService } from './apiService';

export interface Holiday {
  date: string;
  title: string;
  description?: string;
}

export interface WorkCalendar {
  year: number;
  holidays: Holiday[];
  source: 'google_calendar' | 'local_fallback';
}

export class CalendarService {
  // Získanie pracovného kalendára pre rok
  static async getWorkCalendar(year: number): Promise<WorkCalendar> {
    return apiService.get(`/hr/work-calendar/${year}`);
  }

  // Kontrola či je deň víkend
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = nedeľa, 6 = sobota
  }

  // Kontrola či je deň sviatok
  static isHoliday(date: Date, holidays: Holiday[]): boolean {
    // Použijeme lokálny dátum namiesto UTC aby sme predišli posunu
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return holidays.some(holiday => holiday.date === dateString);
  }

  // Výpočet pracovných dní s aktuálnym kalendárom
  static async calculateWorkingDays(startDate: string, endDate: string): Promise<number> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const year = start.getFullYear();

      // Získanie aktuálneho kalendára
      const calendar = await this.getWorkCalendar(year);

      let workingDays = 0;
      const current = new Date(start);

      // Iterujeme cez každý deň v rozsahu
      while (current <= end) {
        // Ak nie je víkend a nie je sviatok, počítame ako pracovný deň
        if (!this.isWeekend(current) && !this.isHoliday(current, calendar.holidays)) {
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
  static calculateBasicWorkingDays(startDate: string, endDate: string): number {
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

  // Získanie názvu sviatku pre dátum
  static getHolidayName(date: Date, holidays: Holiday[]): string | null {
    // Použijeme lokálny dátum namiesto UTC aby sme predišli posunu
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const holiday = holidays.find(h => h.date === dateString);
    return holiday ? holiday.title : null;
  }

  // Získanie všetkých sviatkov v rozsahu dátumov
  static getHolidaysInRange(startDate: string, endDate: string, holidays: Holiday[]): Holiday[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate >= start && holidayDate <= end;
    });
  }

  // Formátovanie dátumu pre zobrazenie
  static formatDate(date: Date): string {
    return date.toLocaleDateString('sk-SK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Získanie informácií o dni (pracovný/nepracovný, sviatok)
  static getDayInfo(date: Date, holidays: Holiday[]): {
    isWorkingDay: boolean;
    isWeekend: boolean;
    isHoliday: boolean;
    holidayName?: string | null;
  } {
    const isWeekend = this.isWeekend(date);
    const isHoliday = this.isHoliday(date, holidays);
    const holidayName = isHoliday ? this.getHolidayName(date, holidays) : undefined;
    
    return {
      isWorkingDay: !isWeekend && !isHoliday,
      isWeekend,
      isHoliday,
      holidayName
    };
  }
}
