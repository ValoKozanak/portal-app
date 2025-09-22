import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Employee } from '../services/hrService';
import { EmploymentRelation } from '../types/EmploymentRelation';

interface EmploymentRelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (relation: EmploymentRelation) => void;
  relation?: EmploymentRelation | null;
  employees: Employee[];
  isEdit?: boolean;
}

const EmploymentRelationModal: React.FC<EmploymentRelationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  relation,
  employees,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<EmploymentRelation>({
    employee_id: 0,
    employee_first_name: '',
    employee_last_name: '',
    employee_email: '',
    
    // Základné údaje
    birth_number: '',
    insurance_company: 'Všeobecná zdravotná poisťovňa',
    insurance_number: '',
    workplace: 'HS',
    center: '',
    work_start_date: '',
    work_end_date: undefined,
    position: '',
    position_name: '',
    employment_type: 'full_time',
    employment_start_date: '',
    probation_end_date: undefined,
    fixed_term_contract: false,
    departure_date: undefined,
    employment_termination_date: undefined, // Ukončenie pracovného pomeru
    is_active: true,
    
    // Mzdové údaje
    salary: 0,
    salary_after_departure: 0,
    temporary_work_force: false,
    irregular_income: false,
    reduce_personal_evaluation: false,
    agreed_weekly_hours: 40,
    no_vacation_entitlement: false,
    manual_vacation_adjustment: false,
    
    // Dovolenka
    permanent_child_care_from: undefined,
    permanent_child_care_to: undefined,
    agreed_work_days: 5,
    agreed_work_days_partial: 5,
    work_days_full_time: 5,
    work_days_full_time_partial: 5,
    vacation_increase: 0,
    vacation_increase_partial: 0,
    basic_annual_vacation_days: 25,
    basic_annual_vacation_days_partial: 25,
    vacation_partial: 25,
    vacation_days: 25,
    forfeited_vacation_days: 0,
    forfeited_vacation_days_partial: 0,
    vacation_reduction_days: 0,
    vacation_reduction_days_partial: 0,
    vacation_used: 0,
    vacation_used_partial: 0,
    overpaid_vacation_days: 0,
    overpaid_vacation_days_2year: 0,
    overpaid_vacation_days_3year: 0,
    
    // Mzda a prémie
    salary_type: 'monthly',
    holidays_paid: 'Priemerom',
    schedule: 'Rovnomerný',
    rate: 0,
    vacation: 25,
    personal_evaluation: 0,
    bonus_percentage: 0,
    bonus: 0,
    
    // Poistenie
    life_insurance_company: '',
    life_insurance: 0,
    varsym_life_insurance: '',
    specsym_life_insurance: '',
    risky_work: false,
    
    // Výplata
    advance: 0,
    payment: 0,
    advance_2: 0,
    in_cash: 0,
    account_number: '',
    bank_code: '',
    varsym_settlement: '',
    specsym_settlement: '',
    
    // Počítané roky
    counted_years: 0,
    counted_days: 0,
    
    // Oznámenia
    organization_notice: '',
    termination_reason: '',
    other_notice: '',
    
    // Poistné
    np: true,
    sp: true,
    ip: true,
    pvn: true,
    pfp: true,
    gp: true,
    up: true,
    prfs: true,
    zp: true,
    
    // Dôchodkové poistenie
    pension_company: '',
    varsym_pension: '',
    specsym_pension: '',
    pension_contribution: 0,
    maximum: 0,
    pension_contribution_percentage: 0,
    
    // Identifikácia
    identification_number: '',
    workplace_code: '',
    classification_code: '',
    oop_application_date: undefined,
    oop_termination_date: undefined,
    
    // Systémové polia
    status: 'active',
    
    // Dochádzkové nastavenia
    attendance_mode: 'manual',
    work_start_time: '08:00',
    work_end_time: '16:00',
    break_start_time: '12:00',
    break_end_time: '12:30',
    weekly_hours: 40
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (relation && isOpen) {
      setFormData(relation);
    } else if (!isEdit && isOpen) {
      // Reset form for new relation
      setFormData({
        ...formData,
        id: undefined,
        employee_id: 0,
        employee_first_name: '',
        employee_last_name: '',
        employee_email: '',
        position: '',
        position_name: '',
        salary: 0,
        rate: 0
      });
    }
    setErrors({});
  }, [relation, isOpen, isEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let newValue: any = value;
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      newValue = value === '' ? 0 : parseFloat(value);
    } else if (name === 'salary') {
      // Pre mzdu zachováme text, ale odstránime nečíselné znaky okrem bodky a čiarky
      newValue = value.replace(/[^\d.,]/g, '');
    } else if (name === 'is_active') {
      // Pre boolean hodnoty
      newValue = value === 'true';
    } else if (name === 'employment_termination_date') {
      // Ak sa zadá dátum ukončenia, automaticky nastavíme status na neaktívny
      if (value && value.trim() !== '') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          is_active: false
        }));
        return; // Ukončíme funkciu, aby sa nevykonal setFormData dvakrát
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleEmployeeChange = (employeeId: number) => {
    const selectedEmployee = employees.find(emp => emp.id === employeeId);
    if (selectedEmployee) {
      setFormData(prev => ({
        ...prev,
        employee_id: employeeId,
        employee_first_name: selectedEmployee.first_name,
        employee_last_name: selectedEmployee.last_name,
        employee_email: selectedEmployee.email,
        birth_number: selectedEmployee.birth_number || ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employee_id) {
      newErrors.employee_id = 'Zamestnanec je povinný';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'Pozícia je povinná';
    }

    if (!formData.employment_start_date) {
      newErrors.employment_start_date = 'Dátum začiatku pracovného pomeru je povinný';
    }

    // Umožniť potvrdiť aj so mzdou 0; validuj len, že je to číslo >= 0
    const salaryNum = parseFloat(String(formData.salary).replace(',', '.'));
    if (isNaN(salaryNum) || salaryNum < 0) {
      newErrors.salary = 'Mzda musí byť číslo >= 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Normalizuj mzdu na číslo (backend akceptuje 0)
      const normalizedSalary = (() => {
        const n = parseFloat(String(formData.salary).replace(',', '.'));
        return isNaN(n) ? 0 : n;
      })();

      onSave({
        ...formData,
        salary: normalizedSalary
      });
      onClose();
    } catch (error) {
      console.error('Chyba pri ukladaní pracovného pomeru:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      employee_id: 0,
      employee_first_name: '',
      employee_last_name: '',
      employee_email: '',
      birth_number: '',
      insurance_company: 'Všeobecná zdravotná poisťovňa',
      insurance_number: '',
      workplace: 'HS',
      center: '',
      work_start_date: '',
      work_end_date: undefined,
      position: '',
      position_name: '',
      employment_type: 'full_time',
      employment_start_date: '',
      probation_end_date: undefined,
      fixed_term_contract: false,
      departure_date: undefined,
      is_active: true,
      salary: 0,
      salary_after_departure: 0,
      temporary_work_force: false,
      irregular_income: false,
      reduce_personal_evaluation: false,
      agreed_weekly_hours: 40,
      no_vacation_entitlement: false,
      manual_vacation_adjustment: false,
      permanent_child_care_from: undefined,
      permanent_child_care_to: undefined,
      agreed_work_days: 5,
      agreed_work_days_partial: 5,
      work_days_full_time: 5,
      work_days_full_time_partial: 5,
      vacation_increase: 0,
      vacation_increase_partial: 0,
      basic_annual_vacation_days: 25,
      basic_annual_vacation_days_partial: 25,
      vacation_partial: 25,
      vacation_days: 25,
      forfeited_vacation_days: 0,
      forfeited_vacation_days_partial: 0,
      vacation_reduction_days: 0,
      vacation_reduction_days_partial: 0,
      vacation_used: 0,
      vacation_used_partial: 0,
      overpaid_vacation_days: 0,
      overpaid_vacation_days_2year: 0,
      overpaid_vacation_days_3year: 0,
      salary_type: 'monthly',
      holidays_paid: 'Priemerom',
      schedule: 'Rovnomerný',
      rate: 0,
      vacation: 25,
      personal_evaluation: 0,
      bonus_percentage: 0,
      bonus: 0,
      life_insurance_company: '',
      life_insurance: 0,
      varsym_life_insurance: '',
      specsym_life_insurance: '',
      risky_work: false,
      advance: 0,
      payment: 0,
      advance_2: 0,
      in_cash: 0,
      account_number: '',
      bank_code: '',
      varsym_settlement: '',
      specsym_settlement: '',
      counted_years: 0,
      counted_days: 0,
      organization_notice: '',
      termination_reason: '',
      other_notice: '',
      np: true,
      sp: true,
      ip: true,
      pvn: true,
      pfp: true,
      gp: true,
      up: true,
      prfs: true,
      zp: true,
      pension_company: '',
      varsym_pension: '',
      specsym_pension: '',
      pension_contribution: 0,
      maximum: 0,
      pension_contribution_percentage: 0,
      identification_number: '',
      workplace_code: '',
      classification_code: '',
      oop_application_date: undefined,
      oop_termination_date: undefined,
      status: 'active'
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Upraviť pracovný pomer' : 'Pridať pracovný pomer'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Základné informácie */}
          <div className="border-b border-gray-200 dark:border-dark-600 pb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Základné informácie
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Zamestnanec *
                </label>
                <select
                  id="employee_id"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => handleEmployeeChange(parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white ${
                    errors.employee_id ? 'border-red-300' : 'border-gray-300 dark:border-dark-600'
                  }`}
                >
                  <option value="">Vyberte zamestnanca</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} ({employee.email})
                    </option>
                  ))}
                </select>
                {errors.employee_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>
                )}
              </div>

              <div>
                <label htmlFor="birth_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rodné číslo
                </label>
                <input
                  type="text"
                  id="birth_number"
                  name="birth_number"
                  value={formData.birth_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pozícia *
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white ${
                    errors.position ? 'border-red-300' : 'border-gray-300 dark:border-dark-600'
                  }`}
                />
                {errors.position && (
                  <p className="mt-1 text-sm text-red-600">{errors.position}</p>
                )}
              </div>

              <div>
                <label htmlFor="employment_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Druh pracovného pomeru
                </label>
                <select
                  id="employment_type"
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                >
                  <option value="full_time">Hlavný pracovný pomer</option>
                  <option value="part_time">Čiastočný úväzok</option>
                  <option value="contract">Dohoda o pracovnej činnosti</option>
                  <option value="intern">Stáž</option>
                  <option value="dohoda">Dohoda</option>
                </select>
              </div>

              <div>
                <label htmlFor="employment_start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Začiatok pracovného pomeru *
                </label>
                <input
                  type="date"
                  id="employment_start_date"
                  name="employment_start_date"
                  value={formData.employment_start_date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white ${
                    errors.employment_start_date ? 'border-red-300' : 'border-gray-300 dark:border-dark-600'
                  }`}
                />
                {errors.employment_start_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.employment_start_date}</p>
                )}
              </div>

              <div>
                <label htmlFor="employment_termination_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ukončenie pracovného pomeru
                </label>
                <input
                  type="date"
                  id="employment_termination_date"
                  name="employment_termination_date"
                  value={formData.employment_termination_date || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status pracovného pomeru
                </label>
                <select
                  id="is_active"
                  name="is_active"
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                >
                  <option value="true">Aktívny</option>
                  <option value="false">Neaktívny (ukončený)</option>
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Neaktívny status sa automaticky nastaví pri zadaní dátumu ukončenia
                </p>
              </div>

              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mzda (€) - napíšte sumu *
                </label>
                <input
                  type="text"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  placeholder="Napríklad: 2500"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white ${
                    errors.salary ? 'border-red-300' : 'border-gray-300 dark:border-dark-600'
                  }`}
                />
                {errors.salary && (
                  <p className="mt-1 text-sm text-red-600">{errors.salary}</p>
                )}
              </div>

              <div>
                <label htmlFor="salary_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Druh mzdy
                </label>
                <select
                  id="salary_type"
                  name="salary_type"
                  value={formData.salary_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                >
                  <option value="monthly">Mesačné</option>
                  <option value="hourly">Hodinová</option>
                  <option value="task_based">Úkolová</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mzdové údaje */}
          <div className="border-b border-gray-200 dark:border-dark-600 pb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Mzdové údaje
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sadzba (€)
                </label>
                <input
                  type="number"
                  id="rate"
                  name="rate"
                  value={formData.rate}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="personal_evaluation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Osobné ohodnotenie (€)
                </label>
                <input
                  type="number"
                  id="personal_evaluation"
                  name="personal_evaluation"
                  value={formData.personal_evaluation}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="bonus_percentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prémie (%)
                </label>
                <input
                  type="number"
                  id="bonus_percentage"
                  name="bonus_percentage"
                  value={formData.bonus_percentage}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="agreed_weekly_hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dohodnutý týždenný úväzok (hodiny)
                </label>
                <input
                  type="number"
                  id="agreed_weekly_hours"
                  name="agreed_weekly_hours"
                  value={formData.agreed_weekly_hours}
                  onChange={handleInputChange}
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Checkboxy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="temporary_work_force"
                  name="temporary_work_force"
                  checked={formData.temporary_work_force}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="temporary_work_force" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Prenájom pracovnej sily
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="irregular_income"
                  name="irregular_income"
                  checked={formData.irregular_income}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="irregular_income" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Nepravidelný príjem
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="no_vacation_entitlement"
                  name="no_vacation_entitlement"
                  checked={formData.no_vacation_entitlement}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="no_vacation_entitlement" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Bez nároku na dovolenku
                </label>
              </div>
            </div>
          </div>

          {/* Dochádzkové nastavenia */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Dochádzkové nastavenia
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="attendance_mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Režim dochádzky
                </label>
                <select
                  id="attendance_mode"
                  name="attendance_mode"
                  value={formData.attendance_mode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                >
                  <option value="manual">Manuálne - zamestnanec označuje dochádzku</option>
                  <option value="automatic">Automaticky - systém počíta dochádzku podľa nastavení</option>
                </select>
              </div>

              <div>
                <label htmlFor="weekly_hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Týždenný úväzok (hodiny)
                </label>
                <input
                  type="number"
                  id="weekly_hours"
                  name="weekly_hours"
                  value={formData.weekly_hours}
                  onChange={handleInputChange}
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="work_start_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Začiatok pracovného času
                </label>
                <input
                  type="time"
                  id="work_start_time"
                  name="work_start_time"
                  value={formData.work_start_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="work_end_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Koniec pracovného času
                </label>
                <input
                  type="time"
                  id="work_end_time"
                  name="work_end_time"
                  value={formData.work_end_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="break_start_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Začiatok prestávky
                </label>
                <input
                  type="time"
                  id="break_start_time"
                  name="break_start_time"
                  value={formData.break_start_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="break_end_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Koniec prestávky
                </label>
                <input
                  type="time"
                  id="break_end_time"
                  name="break_end_time"
                  value={formData.break_end_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {formData.attendance_mode === 'automatic' && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Automatický režim:</strong> Systém automaticky vytvorí dochádzku pre tohto zamestnanca 
                  na základe nastavených pracovných hodín. Zamestnanec nebude musieť manuálne označovať dochádzku.
                </p>
              </div>
            )}

            {formData.attendance_mode === 'manual' && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  💡 <strong>Manuálny režim:</strong> Zamestnanec bude musieť manuálne označovať dochádzku cez 
                  AttendanceTracker. Firma môže upraviť dochádzku v prípade potreby.
                </p>
              </div>
            )}
          </div>

          {/* Tlačidlá */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-dark-600">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Ukladám...' : (isEdit ? 'Uložiť zmeny' : 'Pridať pracovný pomer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmploymentRelationModal;
