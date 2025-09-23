import { apiService } from './apiService';

export interface PayrollPeriod {
  id: number;
  company_id: number;
  year: number;
  month: number;
  is_closed: number;
  closed_at?: string;
  closed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollPeriodStatus {
  isClosed: boolean;
}

class PayrollService {
  // Získanie mzdových období pre firmu
  async getPayrollPeriods(companyId: number, year?: number): Promise<PayrollPeriod[]> {
    const params = year ? `?year=${year}` : '';
    const raw = await apiService.get(`/payroll/periods/${companyId}${params}`);
    const list = Array.isArray(raw) ? raw : [];
    const normalized: PayrollPeriod[] = list.map((p: any) => ({
      id: Number(p.id),
      company_id: Number(p.company_id),
      year: Number(p.year),
      month: Number(p.month),
      is_closed: typeof p.is_closed === 'string' ? (p.is_closed === '1' || p.is_closed === 't' || p.is_closed === 'true' ? 1 : 0) : Number(p.is_closed) || 0,
      closed_at: p.closed_at || undefined,
      closed_by: p.closed_by || undefined,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }))
    .filter(p => !year || p.year === year)
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
    return normalized;
  }

  // Získanie aktuálneho neuzatvoreného obdobia
  async getCurrentPeriod(companyId: number): Promise<PayrollPeriod | null> {
    const p = await apiService.get(`/payroll/periods/${companyId}/current`);
    if (!p) return null;
    return {
      id: Number(p.id),
      company_id: Number(p.company_id),
      year: Number(p.year),
      month: Number(p.month),
      is_closed: typeof p.is_closed === 'string' ? (p.is_closed === '1' || p.is_closed === 't' || p.is_closed === 'true' ? 1 : 0) : Number(p.is_closed) || 0,
      closed_at: p.closed_at || undefined,
      closed_by: p.closed_by || undefined,
      created_at: p.created_at,
      updated_at: p.updated_at,
    } as PayrollPeriod;
  }

  // Uzatvorenie mzdového obdobia
  async closePayrollPeriod(
    companyId: number, 
    year: number, 
    month: number, 
    closedBy: string
  ): Promise<{ message: string; changes: number }> {
    return apiService.post(`/payroll/periods/${companyId}/close`, {
      year,
      month,
      closedBy
    });
  }

  // Odomknutie mzdového obdobia
  async openPayrollPeriod(
    companyId: number, 
    year: number, 
    month: number
  ): Promise<{ message: string; changes: number }> {
    return apiService.post(`/payroll/periods/${companyId}/open`, {
      year,
      month
    });
  }

  // Kontrola či je obdobie uzatvorené
  async checkPeriodStatus(
    companyId: number, 
    year: number, 
    month: number
  ): Promise<PayrollPeriodStatus> {
    return apiService.get(`/payroll/periods/${companyId}/check/${year}/${month}`);
  }

  // Inicializácia období pre daný rok (ak chýbajú)
  async initPayrollPeriods(companyId: number, year: number): Promise<PayrollPeriod[]> {
    return apiService.post(`/payroll/periods/${companyId}/init`, { year });
  }

  // Pomocné metódy
  getMonthName(month: number): string {
    const months = [
      'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
      'Júl', 'August', 'September', 'Október', 'November', 'December'
    ];
    return months[month - 1] || '';
  }

  getPeriodLabel(year: number, month: number): string {
    return `${this.getMonthName(month)} ${year}`;
  }

  isCurrentPeriod(year: number, month: number): boolean {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth() + 1;
  }

  canClosePeriod(year: number, month: number): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Môžeme uzatvoriť len minulé mesiace
    return year < currentYear || (year === currentYear && month < currentMonth);
  }

  // Výplatné pásky – ročný prehľad z MDB (MZSK)
  async getPayslips(
    companyId: number,
    employeeId: number,
    year: number
  ): Promise<{
    year: number;
    employeeId: number;
    months: Array<{
      year: number;
      month: number;
      employeeCode: string | null;
      calendarDays: number;
      holidays: number;
      workingDays: number;
      workRatio: string | number | null;
      workedDays: number;
      workedHours: number;
      baseWage: number;
      bonuses: number;
      grossWage: number;
      taxableIncome: number;
      wageTax: number;
      taxBonus: number;
      netWage: number;
      advance: number;
      settlement: number;
      socialInsurance: number; // SP = KcNem+KcSoc+KcInv+KcFz
      healthInsurance: number; // ZP = KcZdr
    }>;
    summary: {
      totalGross: number;
      totalNet: number;
      totalAdvance: number;
      totalSettlement: number;
      totalBonuses: number;
      totalTax: number;
      totalTaxableIncome: number;
      totalWorkedHours: number;
      totalWorkedDays: number;
      totalSocialInsurance: number;
      totalHealthInsurance: number;
      monthsCount: number;
    };
    source: string;
  }> {
    const url = `/payroll/payslips/${companyId}?employeeId=${employeeId}&year=${year}`;
    return apiService.get(url);
  }

  async getPayslipDetail(
    companyId: number,
    employeeId: number,
    year: number,
    month: number
  ): Promise<{
    year: number;
    month: number;
    employeeId: number;
    payslip: any;
    source: string;
  }> {
    const url = `/payroll/payslips/${companyId}/detail?employeeId=${employeeId}&year=${year}&month=${month}`;
    return apiService.get(url);
  }
}

export const payrollService = new PayrollService();
