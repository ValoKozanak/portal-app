export interface EmploymentRelation {
  id?: number;
  employee_id: number;
  // Polia z backend API (JOIN s employees tabuľkou)
  first_name?: string;
  last_name?: string;
  email?: string;
  // Staré polia pre kompatibilitu
  employee_first_name?: string;
  employee_last_name?: string;
  employee_email?: string;
  
  // Základné údaje
  birth_number: string;
  insurance_company: string;
  insurance_number: string;
  workplace: string;
  center: string;
  work_start_date: string;
  work_end_date?: string;
  position: string;
  position_name: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern' | 'dohoda';
  employment_start_date: string;
  probation_end_date?: string;
  fixed_term_contract: boolean;
  departure_date?: string;
  employment_termination_date?: string; // Ukončenie pracovného pomeru
  is_active: boolean;
  
  // Mzdové údaje
  salary: number;
  salary_after_departure: number;
  temporary_work_force: boolean;
  irregular_income: boolean;
  reduce_personal_evaluation: boolean;
  agreed_weekly_hours: number;
  no_vacation_entitlement: boolean;
  manual_vacation_adjustment: boolean;
  
  // Dovolenka
  permanent_child_care_from?: string;
  permanent_child_care_to?: string;
  agreed_work_days: number;
  agreed_work_days_partial: number;
  work_days_full_time: number;
  work_days_full_time_partial: number;
  vacation_increase: number;
  vacation_increase_partial: number;
  basic_annual_vacation_days: number;
  basic_annual_vacation_days_partial: number;
  vacation_partial: number;
  vacation_days: number;
  forfeited_vacation_days: number;
  forfeited_vacation_days_partial: number;
  vacation_reduction_days: number;
  vacation_reduction_days_partial: number;
  vacation_used: number;
  vacation_used_partial: number;
  overpaid_vacation_days: number;
  overpaid_vacation_days_2year: number;
  overpaid_vacation_days_3year: number;
  
  // Mzda a prémie
  salary_type: 'hourly' | 'monthly' | 'task_based';
  holidays_paid: string;
  schedule: string;
  rate: number;
  vacation: number;
  personal_evaluation: number;
  bonus_percentage: number;
  bonus: number;
  
  // Poistenie
  life_insurance_company: string;
  life_insurance: number;
  varsym_life_insurance: string;
  specsym_life_insurance: string;
  risky_work: boolean;
  
  // Výplata
  advance: number;
  payment: number;
  advance_2: number;
  in_cash: number;
  account_number: string;
  bank_code: string;
  varsym_settlement: string;
  specsym_settlement: string;
  
  // Počítané roky
  counted_years: number;
  counted_days: number;
  
  // Oznámenia
  organization_notice: string;
  termination_reason: string;
  other_notice: string;
  
  // Poistné
  np: boolean;
  sp: boolean;
  ip: boolean;
  pvn: boolean;
  pfp: boolean;
  gp: boolean;
  up: boolean;
  prfs: boolean;
  zp: boolean;
  
  // Dôchodkové poistenie
  pension_company: string;
  varsym_pension: string;
  specsym_pension: string;
  pension_contribution: number;
  maximum: number;
  pension_contribution_percentage: number;
  
  // Identifikácia
  identification_number: string;
  workplace_code: string;
  classification_code: string;
  oop_application_date?: string;
  oop_termination_date?: string;
  
  // Systémové polia
  status: 'active' | 'inactive' | 'terminated';
  created_at?: string;
  updated_at?: string;
  
  // Dochádzkové nastavenia
  attendance_mode?: 'manual' | 'automatic';
  work_start_time?: string;
  work_end_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  weekly_hours?: number;
}
