import { apiService } from './apiService';

export interface Employee {
  id: number;
  company_id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  hire_date: string;
  salary?: number;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  termination_date?: string;
  termination_reason?: string;
  manager_id?: number;
  manager_first_name?: string;
  manager_last_name?: string;
  
  // Pracovné pomery
  employment_start_date?: string;
  employment_end_date?: string;
  attendance_mode?: 'manual' | 'automatic';
  
  // Personálne údaje
  birth_name?: string;
  title_before?: string;
  title_after?: string;
  gender?: 'muž' | 'žena';
  birth_date?: string;
  birth_number?: string;
  birth_place?: string;
  nationality?: string;
  citizenship?: string;
  education?: string;
  marital_status?: string;
  is_partner?: boolean;
  is_statutory?: boolean;
  employee_bonus?: boolean;
  bonus_months?: number;
  
  // Adresa trvalého pobytu
  permanent_street?: string;
  permanent_number?: string;
  permanent_city?: string;
  permanent_zip?: string;
  permanent_country?: string;
  
  // Kontaktná adresa
  contact_street?: string;
  contact_number?: string;
  contact_city?: string;
  contact_zip?: string;
  contact_country?: string;
  
  // Cudzinecké údaje
  is_foreigner?: boolean;
  foreigner_country?: string;
  residence_permit_number?: string;
  social_insurance_sr?: string;
  social_insurance_foreign?: string;
  health_insurance_sr?: string;
  foreigner_without_permanent_residence?: boolean;
  tax_identification_number?: string;
  
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: number;
  employee_id: number;
  company_id: number;
  date: string;
  check_in?: string;
  check_out?: string;
  total_hours?: number;
  break_minutes: number;
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'sick_leave' | 'vacation' | 'holiday';
  notes?: string;
  first_name: string;
  last_name: string;
  employee_id_code: string;
  employee_name?: string; // Pre zobrazenie všetkých zamestnancov
  created_at: string;
  updated_at: string;
}

export interface EmployeeAttendanceStatus {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  email: string;
  status: string;
  attendance_mode: 'manual' | 'automatic' | null;
  employment_start_date: string;
  employment_end_date: string | null;
  is_active: number;
  today_status: 'present' | 'absent' | 'late' | 'early_leave' | 'sick_leave' | 'vacation' | 'holiday';
  check_in: string | null;
  check_out: string | null;
  status_type: 'present' | 'absent' | 'late' | 'leave' | 'holiday' | 'weekend';
  status_description: string;
  is_weekend: boolean;
  is_holiday: boolean;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  company_id: number;
  leave_type: 'vacation' | 'sick_leave' | 'personal_leave' | 'maternity_leave' | 'paternity_leave' | 'unpaid_leave';
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: number;
  approved_at?: string;
  first_name: string;
  last_name: string;
  employee_id_code: string;
  approver_first_name?: string;
  approver_last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkShift {
  id: number;
  company_id: number;
  shift_name: string;
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
  is_active: boolean;
  created_at: string;
}

export interface HREvent {
  id: number;
  company_id: number;
  employee_id?: number;
  event_type: 'hire' | 'termination' | 'promotion' | 'salary_change' | 'position_change' | 'warning' | 'recognition';
  title: string;
  description?: string;
  event_date: string;
  created_by: number;
  first_name?: string;
  last_name?: string;
  employee_id_code?: string;
  created_by_first_name: string;
  created_by_last_name: string;
  created_at: string;
}

export interface HRStats {
  employees: {
    total_employees: number;
    active_employees: number;
    inactive_employees: number;
    terminated_employees: number;
    on_leave_employees: number;
  };
  attendance: {
    total_attendance: number;
    present_today: number;
    absent_today: number;
    late_today: number;
  };
  leave_requests: {
    pending_leave_requests: number;
  };
}

class HRService {
  // Zamestnanci
  async getEmployees(companyId: number): Promise<Employee[]> {
    return apiService.get(`/hr/employees/${companyId}`);
  }

  async addEmployee(employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<{ id: number; message: string }> {
    return apiService.post('/hr/employees', employeeData);
  }

  async updateEmployee(id: number, employeeData: Partial<Employee>): Promise<{ message: string }> {
    return apiService.put(`/hr/employees/${id}`, employeeData);
  }

  async getEmployeeFromMdb(companyId: number, birthNumber: string, year?: number): Promise<{ success: boolean; employee?: any; source?: string }> {
    const params = new URLSearchParams({ birthNumber });
    if (year) params.set('year', String(year));
    return apiService.get(`/hr/employees/from-mdb/${companyId}?${params.toString()}`);
  }

  async deleteEmployee(id: number): Promise<{ message: string }> {
    return apiService.delete(`/hr/employees/${id}`);
  }

  // Dochádzka
  async getAttendance(companyId: number, employeeId?: number, startDate?: string, endDate?: string): Promise<Attendance[]> {
    let url = `/hr/attendance/${companyId}`;
    
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return apiService.get(url);
  }

  async checkAttendanceDuplicates(companyId: number, employeeId?: number, startDate?: string, endDate?: string): Promise<any> {
    let url = `/hr/attendance/check-duplicates/${companyId}`;
    
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return apiService.get(url);
  }

  async addAttendance(attendanceData: Omit<Attendance, 'id' | 'created_at' | 'updated_at' | 'first_name' | 'last_name' | 'employee_id_code'>): Promise<{ id: number; message: string }> {
    return apiService.post('/hr/attendance', attendanceData);
  }

  // Dovolenky
  async getLeaveRequests(companyId: number, status?: string, employeeId?: number): Promise<LeaveRequest[]> {
    let url = `/hr/leave-requests/${companyId}`;
    const params = new URLSearchParams();
    if (status) {
      params.append('status', status);
    }
    if (employeeId) {
      params.append('employee_id', employeeId.toString());
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    return apiService.get(url);
  }

  async addLeaveRequest(leaveData: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at' | 'first_name' | 'last_name' | 'employee_id_code' | 'approver_first_name' | 'approver_last_name'>): Promise<{ id: number; message: string }> {
    return apiService.post('/hr/leave-requests', leaveData);
  }

  async updateLeaveRequestStatus(id: number, status: string, approvedBy: number): Promise<{ message: string }> {
    return apiService.put(`/hr/leave-requests/${id}/status`, { status, approved_by: approvedBy });
  }

  // Pracovné zmeny
  async getWorkShifts(companyId: number): Promise<WorkShift[]> {
    return apiService.get(`/hr/work-shifts/${companyId}`);
  }

  async addWorkShift(shiftData: Omit<WorkShift, 'id' | 'created_at'>): Promise<{ id: number; message: string }> {
    return apiService.post('/hr/work-shifts', shiftData);
  }

  // HR udalosti
  async getHREvents(companyId: number, eventType?: string, employeeId?: number): Promise<HREvent[]> {
    let url = `/hr/hr-events/${companyId}`;
    const params = new URLSearchParams();
    if (eventType) params.append('event_type', eventType);
    if (employeeId) params.append('employee_id', employeeId.toString());
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return apiService.get(url);
  }

  async addHREvent(eventData: Omit<HREvent, 'id' | 'created_at' | 'first_name' | 'last_name' | 'employee_id_code' | 'created_by_first_name' | 'created_by_last_name'>): Promise<{ id: number; message: string }> {
    return apiService.post('/hr/hr-events', eventData);
  }

  // Hľadanie zamestnanca podľa emailu
  async findEmployeeByEmail(email: string): Promise<Employee> {
    return apiService.get(`/hr/employees/find/${encodeURIComponent(email)}`);
  }

  // Aktualizácia company_id zamestnanca
  async updateEmployeeCompany(employeeId: number, companyId: number): Promise<{ message: string }> {
    return apiService.put(`/hr/employees/${employeeId}/company`, { company_id: companyId });
  }

  // Štatistiky
  async getHRStats(companyId: number): Promise<HRStats> {
    return apiService.get(`/hr/hr-stats/${companyId}`);
  }

  // Pomocné funkcie
  getEmploymentTypeLabel(type: string): string {
    const types = {
      'full_time': 'Plný úväzok',
      'part_time': 'Čiastočný úväzok',
      'contract': 'Dohoda',
      'intern': 'Stáž'
    };
    return types[type as keyof typeof types] || type;
  }

  getStatusLabel(status: string): string {
    const statuses = {
      'active': 'Aktívny',
      'inactive': 'Neaktívny',
      'terminated': 'Ukončený',
      'on_leave': 'Na dovolenke'
    };
    return statuses[status as keyof typeof statuses] || status;
  }

  getLeaveTypeLabel(type: string): string {
    const types = {
      'vacation': 'Dovolenka',
      'sick_leave': 'PN',
      'personal_leave': 'Osobné voľno',
      'maternity_leave': 'Materská dovolenka',
      'paternity_leave': 'Otcovská dovolenka',
      'unpaid_leave': 'Neplatené voľno'
    };
    return types[type as keyof typeof types] || type;
  }

  getEventTypeLabel(type: string): string {
    const types = {
      'hire': 'Nábor',
      'termination': 'Ukončenie',
      'promotion': 'Povýšenie',
      'salary_change': 'Zmena mzdy',
      'position_change': 'Zmena pozície',
      'warning': 'Upozornenie',
      'recognition': 'Uznanie'
    };
    return types[type as keyof typeof types] || type;
  }

  getAttendanceStatusLabel(status: string): string {
    const statuses = {
      'present': 'Prítomný',
      'absent': 'Neprítomný',
      'late': 'Meškanie',
      'early_leave': 'Predčasný odchod',
      'sick_leave': 'PN',
      'vacation': 'Dovolenka',
      'holiday': 'Pracovné voľno'
    };
    return statuses[status as keyof typeof statuses] || status;
  }

  calculateWorkHours(checkIn: string, checkOut: string): number {
    if (!checkIn || !checkOut) return 0;
    
    const start = new Date(`2000-01-01T${checkIn}`);
    const end = new Date(`2000-01-01T${checkOut}`);
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.round(diffHours * 100) / 100;
  }

  formatTime(time: string): string {
    if (!time) return '';
    return time.substring(0, 5); // Zobrazí len HH:MM
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('sk-SK');
  }

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString('sk-SK');
  }

  // API pre správu zmien personálnych údajov
  async createEmployeeChange(changeData: {
    employee_id: number;
    field_name: string;
    current_value: string;
    new_value: string;
    reason: string;
    company_id: number;
  }): Promise<{ id: number; message: string }> {
    return apiService.post('/hr/employee-changes', changeData);
  }

  async getEmployeeChanges(employeeId: number): Promise<any[]> {
    return apiService.get(`/hr/employee-changes/${employeeId}`);
  }

  async getCompanyChanges(companyId: number): Promise<any[]> {
    return apiService.get(`/hr/company-changes/${companyId}`);
  }

  async approveEmployeeChange(changeId: number, approvedBy: number): Promise<{ message: string }> {
    return apiService.patch(`/hr/employee-changes/${changeId}`, { status: 'approved', approved_by: approvedBy });
  }

  async rejectEmployeeChange(changeId: number, approvedBy: number): Promise<{ message: string }> {
    return apiService.patch(`/hr/employee-changes/${changeId}`, { status: 'rejected', approved_by: approvedBy });
  }

  async updateEmployeeField(employeeId: number, fieldName: string, newValue: string): Promise<{ message: string }> {
    return apiService.patch(`/hr/employees/${employeeId}/update-field`, { field_name: fieldName, new_value: newValue });
  }

  // Dochádzkové nastavenia
  async getAttendanceSettings(employeeId: number): Promise<any> {
    return apiService.get(`/hr/attendance-settings/${employeeId}`);
  }

  async createAutomaticAttendance(companyId: number, date: string): Promise<{ message: string; results: any[] }> {
    return apiService.post('/hr/attendance/auto-create', { companyId, date });
  }

  // Aktualizácia dochádzky s typom
  async addAttendanceWithType(attendanceData: Omit<Attendance, 'id' | 'created_at' | 'updated_at' | 'first_name' | 'last_name' | 'employee_id_code'> & { attendance_type: 'manual' | 'automatic' }): Promise<{ id: number; message: string }> {
    return apiService.post('/hr/attendance', attendanceData);
  }

  // Úprava/vytvorenie dochádzky pre konkrétny deň (s kontrolou oprávnení na serveri)
  async updateAttendanceDay(payload: {
    employee_id: number;
    company_id: number;
    date: string; // YYYY-MM-DD
    attendance_type: 'present' | 'absent' | 'leave' | 'sick_leave';
    start_time?: string | null; // HH:MM alebo HH:MM:SS
    end_time?: string | null;   // HH:MM alebo HH:MM:SS
    break_minutes?: number;
    note?: string;
  }): Promise<{ id: number; message: string }> {
    return apiService.put('/hr/attendance/day', payload);
  }

  // Pracovné pomery
  async getEmploymentRelations(companyId: number): Promise<any[]> {
    return apiService.get(`/hr/employment-relations/${companyId}`);
  }

  async addEmploymentRelation(relationData: {
    employee_id: number;
    company_id: number;
    position: string;
    employment_type?: 'full_time' | 'part_time' | 'contract' | 'intern';
    employment_start_date: string;
    employment_end_date?: string;
    salary?: number;
    weekly_hours?: number;
    attendance_mode?: 'manual' | 'automatic';
    work_start_time?: string;
    work_end_time?: string;
    break_start_time?: string;
    break_end_time?: string;
    is_active?: boolean;
  }): Promise<{ id: number; message: string }> {
    return apiService.post('/hr/employment-relations', relationData);
  }

  async updateEmploymentRelation(id: number, relationData: {
    position?: string;
    employment_type?: 'full_time' | 'part_time' | 'contract' | 'intern';
    employment_start_date?: string;
    employment_end_date?: string;
    salary?: number;
    weekly_hours?: number;
    attendance_mode?: 'manual' | 'automatic';
    work_start_time?: string;
    work_end_time?: string;
    break_start_time?: string;
    break_end_time?: string;
    is_active?: boolean;
  }): Promise<{ message: string }> {
    return apiService.put(`/hr/employment-relations/${id}`, relationData);
  }

  // Automatické prepočítanie dochádzky
  async getEmployeesWithAutomaticAttendance(companyId: number): Promise<any[]> {
    return apiService.get(`/hr/employees/automatic-attendance/${companyId}`);
  }

  async processAutomaticAttendance(
    companyId: number, 
    employeeIds: number[], 
    startDate: string, 
    endDate: string
  ): Promise<{ message: string; results: any[] }> {
    return apiService.post('/hr/attendance/process-automatic', {
      companyId,
      employeeIds,
      startDate,
      endDate
    });
  }

  // Získanie prítomných zamestnancov dnes
  async getPresentEmployeesToday(companyId: number): Promise<Attendance[]> {
    return apiService.get(`/hr/attendance/present-today/${companyId}`);
  }

  // Získanie neprítomných zamestnancov dnes
  async getAbsentEmployeesToday(companyId: number): Promise<any[]> {
    return apiService.get(`/hr/attendance/absent-today/${companyId}`);
  }

  // Získanie všetkých aktívnych zamestnancov s informáciou o dochádzke
  async getEmployeesAttendanceStatus(companyId: number): Promise<EmployeeAttendanceStatus[]> {
    return apiService.get(`/hr/employees/attendance-status/${companyId}`);
  }

  // Získanie zamestnancov s chýbajúcou dochádzkou
  async getEmployeesWithMissingAttendance(companyId: number): Promise<any[]> {
    return apiService.get(`/hr/employees/missing-attendance/${companyId}`);
  }

  // Zaznamenanie dochádzky
  async recordAttendance(attendanceData: {
    employee_id: number;
    company_id: number;
    date: string;
    attendance_type: 'present' | 'absent' | 'leave' | 'sick_leave';
    start_time?: string | null;
    end_time?: string | null;
    break_minutes?: number;
    note?: string;
    recorded_by: string;
  }): Promise<{ id: number; message: string }> {
    return apiService.post('/hr/attendance/record', attendanceData);
  }
}

export const hrService = new HRService();
