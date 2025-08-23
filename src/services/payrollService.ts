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
    return apiService.get(`/payroll/periods/${companyId}${params}`);
  }

  // Získanie aktuálneho neuzatvoreného obdobia
  async getCurrentPeriod(companyId: number): Promise<PayrollPeriod | null> {
    return apiService.get(`/payroll/periods/${companyId}/current`);
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
}

export const payrollService = new PayrollService();
