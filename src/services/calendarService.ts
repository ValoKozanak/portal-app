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
  // ZA?skanie pracovnA?ho kalendA?ra pre rok
  static async getWorkCalendar(year: number): Promise<WorkCalendar> {
    return apiService.get(`/hr/work-calendar/${year}`);
  }

  // Kontrola ?Ti je deL? vA?kend
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = nede?la, 6 = sobota
  }

  // Kontrola ?Ti je deL? sviatok
  static isHoliday(date: Date, holidays: Holiday[]): boolean {
    // PouLlijeme lokA?lny dA?tum namiesto UTC aby sme prediL?li posunu
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return holidays.some(holiday => holiday.date === dateString);
  }

  // VA?po?Tet pracovnA?ch dnA? s aktuA?lnym kalendA?rom
  static async calculateWorkingDays(startDate: string, endDate: string): Promise<number> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const year = start.getFullYear();

      // ZA?skanie aktuA?lneho kalendA?ra
      const calendar = await this.getWorkCalendar(year);

      let workingDays = 0;
      const current = new Date(start);

      // Iterujeme cez kaLldA? deL? v rozsahu
      while (current <= end) {
        // Ak nie je vA?kend a nie je sviatok, po?TA?tame ako pracovnA? deL?
        if (!this.isWeekend(current) && !this.isHoliday(current, calendar.holidays)) {
          workingDays++;
        }
        current.setDate(current.getDate() + 1);
      }

      return workingDays;

    } catch (error) {
      console.error('?tS Chyba pri vA?po?Tte pracovnA?ch dnA?:', error);
      
      // Fallback na zA?kladnA? vA?po?Tet
      return this.calculateBasicWorkingDays(startDate, endDate);
    }
  }

  // ZA?kladnA? vA?po?Tet pracovnA?ch dnA? (fallback)
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

  // ZA?skanie nA?zvu sviatku pre dA?tum
  static getHolidayName(date: Date, holidays: Holiday[]): string | null {
    // PouLlijeme lokA?lny dA?tum namiesto UTC aby sme prediL?li posunu
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const holiday = holidays.find(h => h.date === dateString);
    return holiday ? holiday.title : null;
  }

  // ZA?skanie vL?etkA?ch sviatkov v rozsahu dA?tumov
  static getHolidaysInRange(startDate: string, endDate: string, holidays: Holiday[]): Holiday[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate >= start && holidayDate <= end;
    });
  }

  // FormA?tovanie dA?tumu pre zobrazenie
  static formatDate(date: Date): string {
    return date.toLocaleDateString('sk-SK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ZA?skanie informA?ciA? o dni (pracovnA?/nepracovnA?, sviatok)
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

