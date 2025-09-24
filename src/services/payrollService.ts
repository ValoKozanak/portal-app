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
  // ZA�skanie mzdovA?ch obdobA� pre firmu
  async getPayrollPeriods(companyId: number, year?: number): Promise<PayrollPeriod[]> {
    const params = year ? `?year=${year}` : '';
    const raw = await apiService.get(`/payroll/periods/${companyId}${params}`);
    const normalize = (p: any): PayrollPeriod => ({
      id: Number(p.id),
      company_id: Number(p.company_id),
      year: Number(p.year),
      month: Number(p.month),
      // backend vracia is_closed rA�zne (0/1, true/false, '0'/'1'/'t'), znormalizuj na 0/1
      is_closed: p.is_closed === true || p.is_closed === 1 || p.is_closed === '1' || p.is_closed === 't' || p.is_closed === 'true' ? 1 : 0,
      closed_at: p.closed_at ?? undefined,
      closed_by: p.closed_by ?? undefined,
      created_at: String(p.created_at),
      updated_at: String(p.updated_at)
    });
    return Array.isArray(raw) ? raw.map(normalize) : [];
  }

  // ZA�skanie aktuA?lneho neuzatvorenA�ho obdobia
  async getCurrentPeriod(companyId: number): Promise<PayrollPeriod | null> {
    const p = await apiService.get(`/payroll/periods/${companyId}/current`);
    if (!p) return null;
    if (typeof p !== 'object') return null;
    if (!('year' in (p as any)) || !('month' in (p as any))) return null;
    const anyP = p as any;
    return {
      id: Number(anyP.id),
      company_id: Number(anyP.company_id),
      year: Number(anyP.year),
      month: Number(anyP.month),
      is_closed: anyP.is_closed === true || anyP.is_closed === 1 || anyP.is_closed === '1' || anyP.is_closed === 't' || anyP.is_closed === 'true' ? 1 : 0,
      closed_at: anyP.closed_at ?? undefined,
      closed_by: anyP.closed_by ?? undefined,
      created_at: String(anyP.created_at ?? ''),
      updated_at: String(anyP.updated_at ?? '')
    };
  }

  // Uzatvorenie mzdovA�ho obdobia
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

  // Odomknutie mzdovA�ho obdobia
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

  // Kontrola �Ti je obdobie uzatvorenA�
  async checkPeriodStatus(
    companyId: number, 
    year: number, 
    month: number
  ): Promise<PayrollPeriodStatus> {
    return apiService.get(`/payroll/periods/${companyId}/check/${year}/${month}`);
  }

  // InicializA?cia obdobA� pre danA? rok (ak chA?bajAs)
  async initPayrollPeriods(companyId: number, year: number): Promise<PayrollPeriod[]> {
    return apiService.post(`/payroll/periods/${companyId}/init`, { year });
  }

  // PomocnA� metAldy
  getMonthName(month: number): string {
    const months = [
      'JanuA?r', 'FebruA?r', 'Marec', 'AprA�l', 'MA?j', 'JAsn',
      'JAsl', 'August', 'September', 'OktAlber', 'November', 'December'
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
    
    // MA�Lleme uzatvoriLA len minulA� mesiace
    return year < currentYear || (year === currentYear && month < currentMonth);
  }

  // VA?platnA� pA?sky �?" ro�TnA? preh�lad z MDB (MZSK)
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

