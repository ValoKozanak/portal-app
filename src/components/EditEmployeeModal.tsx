import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Employee } from '../services/hrService';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: Partial<Employee>) => void;
  employee: Employee | null;
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employee
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: '',
    employment_type: 'full_time' as 'full_time' | 'part_time' | 'contract' | 'intern',
    status: 'active' as 'active' | 'inactive' | 'terminated' | 'on_leave',
    termination_date: '',
    termination_reason: '',
    // Personálne údaje
    birth_name: '',
    title_before: '',
    title_after: '',
    gender: '' as '' | 'muž' | 'žena',
    birth_date: '',
    birth_number: '',
    birth_place: '',
    nationality: '',
    citizenship: '',
    education: '',
    marital_status: '',
    is_partner: false,
    is_statutory: false,
    employee_bonus: false,
    bonus_months: '',
    // Adresa trvalého pobytu
    permanent_street: '',
    permanent_number: '',
    permanent_city: '',
    permanent_zip: '',
    permanent_country: 'Slovensko',
    // Kontaktná adresa
    contact_street: '',
    contact_number: '',
    contact_city: '',
    contact_zip: '',
    contact_country: 'Slovensko',
    // Cudzinecké údaje
    is_foreigner: false,
    foreigner_country: '',
    residence_permit_number: '',
    social_insurance_sr: '',
    social_insurance_foreign: '',
    health_insurance_sr: '',
    foreigner_without_permanent_residence: false,
    tax_identification_number: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        salary: employee.salary?.toString() || '',
        employment_type: employee.employment_type || 'full_time',
        status: employee.status || 'active',
        termination_date: employee.termination_date || '',
        termination_reason: employee.termination_reason || '',
        // Personálne údaje
        birth_name: employee.birth_name || '',
        title_before: employee.title_before || '',
        title_after: employee.title_after || '',
        gender: employee.gender || '',
        birth_date: employee.birth_date || '',
        birth_number: employee.birth_number || '',
        birth_place: employee.birth_place || '',
        nationality: employee.nationality || '',
        citizenship: employee.citizenship || '',
        education: employee.education || '',
        marital_status: employee.marital_status || '',
        is_partner: employee.is_partner || false,
        is_statutory: employee.is_statutory || false,
        employee_bonus: employee.employee_bonus || false,
        bonus_months: employee.bonus_months?.toString() || '',
        // Adresa trvalého pobytu
        permanent_street: employee.permanent_street || '',
        permanent_number: employee.permanent_number || '',
        permanent_city: employee.permanent_city || '',
        permanent_zip: employee.permanent_zip || '',
        permanent_country: employee.permanent_country || 'Slovensko',
        // Kontaktná adresa
        contact_street: employee.contact_street || '',
        contact_number: employee.contact_number || '',
        contact_city: employee.contact_city || '',
        contact_zip: employee.contact_zip || '',
        contact_country: employee.contact_country || 'Slovensko',
        // Cudzinecké údaje
        is_foreigner: employee.is_foreigner || false,
        foreigner_country: employee.foreigner_country || '',
        residence_permit_number: employee.residence_permit_number || '',
        social_insurance_sr: employee.social_insurance_sr || '',
        social_insurance_foreign: employee.social_insurance_foreign || '',
        health_insurance_sr: employee.health_insurance_sr || '',
        foreigner_without_permanent_residence: employee.foreigner_without_permanent_residence || false,
        tax_identification_number: employee.tax_identification_number || ''
      });
      setErrors({});
    }
  }, [employee, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let newValue: any = value;
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Meno je povinné';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Priezvisko je povinné';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email je povinný';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Neplatný formát emailu';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'Pozícia je povinná';
    }

    if (formData.status === 'terminated' && !formData.termination_date) {
      newErrors.termination_date = 'Dátum ukončenia je povinný pri ukončení zamestnania';
    }

    if (formData.status === 'terminated' && !formData.termination_reason.trim()) {
      newErrors.termination_reason = 'Dôvod ukončenia je povinný';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const employeeData: Partial<Employee> = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        position: formData.position.trim(),
        department: formData.department.trim() || undefined,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        employment_type: formData.employment_type,
        status: formData.status,
        // Personálne údaje
        birth_name: formData.birth_name.trim() || undefined,
        title_before: formData.title_before.trim() || undefined,
        title_after: formData.title_after.trim() || undefined,
        gender: formData.gender || undefined,
        birth_date: formData.birth_date || undefined,
        birth_number: formData.birth_number.trim() || undefined,
        birth_place: formData.birth_place.trim() || undefined,
        nationality: formData.nationality.trim() || undefined,
        citizenship: formData.citizenship.trim() || undefined,
        education: formData.education.trim() || undefined,
        marital_status: formData.marital_status.trim() || undefined,
        is_partner: formData.is_partner,
        is_statutory: formData.is_statutory,
        employee_bonus: formData.employee_bonus,
        bonus_months: formData.bonus_months ? parseInt(formData.bonus_months) : undefined,
        // Adresa trvalého pobytu
        permanent_street: formData.permanent_street.trim() || undefined,
        permanent_number: formData.permanent_number.trim() || undefined,
        permanent_city: formData.permanent_city.trim() || undefined,
        permanent_zip: formData.permanent_zip.trim() || undefined,
        permanent_country: formData.permanent_country.trim() || undefined,
        // Kontaktná adresa
        contact_street: formData.contact_street.trim() || undefined,
        contact_number: formData.contact_number.trim() || undefined,
        contact_city: formData.contact_city.trim() || undefined,
        contact_zip: formData.contact_zip.trim() || undefined,
        contact_country: formData.contact_country.trim() || undefined,
        // Cudzinecké údaje
        is_foreigner: formData.is_foreigner,
        foreigner_country: formData.foreigner_country.trim() || undefined,
        residence_permit_number: formData.residence_permit_number.trim() || undefined,
        social_insurance_sr: formData.social_insurance_sr.trim() || undefined,
        social_insurance_foreign: formData.social_insurance_foreign.trim() || undefined,
        health_insurance_sr: formData.health_insurance_sr.trim() || undefined,
        foreigner_without_permanent_residence: formData.foreigner_without_permanent_residence,
        tax_identification_number: formData.tax_identification_number.trim() || undefined
      };

      // Ak je zamestnanec ukončený, pridaj dátum ukončenia
      if (formData.status === 'terminated') {
        employeeData.termination_date = formData.termination_date;
        employeeData.termination_reason = formData.termination_reason.trim();
        
        // Ak uplynul dátum ukončenia, automaticky nastav status na 'inactive'
        if (formData.termination_date && new Date(formData.termination_date) <= new Date()) {
          employeeData.status = 'inactive';
        }
      }

      await onSave(employeeData);
      onClose();
    } catch (error) {
      console.error('Chyba pri ukladaní zamestnanca:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      salary: '',
      employment_type: 'full_time',
      status: 'active',
      termination_date: '',
      termination_reason: '',
      // Personálne údaje
      birth_name: '',
      title_before: '',
      title_after: '',
      gender: '',
      birth_date: '',
      birth_number: '',
      birth_place: '',
      nationality: '',
      citizenship: '',
      education: '',
      marital_status: '',
      is_partner: false,
      is_statutory: false,
      employee_bonus: false,
      bonus_months: '',
      // Adresa trvalého pobytu
      permanent_street: '',
      permanent_number: '',
      permanent_city: '',
      permanent_zip: '',
      permanent_country: 'Slovensko',
      // Kontaktná adresa
      contact_street: '',
      contact_number: '',
      contact_city: '',
      contact_zip: '',
      contact_country: 'Slovensko',
      // Cudzinecké údaje
      is_foreigner: false,
      foreigner_country: '',
      residence_permit_number: '',
      social_insurance_sr: '',
      social_insurance_foreign: '',
      health_insurance_sr: '',
      foreigner_without_permanent_residence: false,
      tax_identification_number: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Upraviť zamestnanca
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meno *
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white ${
                  errors.first_name ? 'border-red-300' : 'border-gray-300 dark:border-dark-600'
                }`}
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priezvisko *
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white ${
                  errors.last_name ? 'border-red-300' : 'border-gray-300 dark:border-dark-600'
                }`}
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white ${
                  errors.email ? 'border-red-300' : 'border-gray-300 dark:border-dark-600'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefón
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
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
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Oddelenie
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mzda (€)
              </label>
              <input
                type="number"
                id="salary"
                name="salary"
                value={formData.salary}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="employment_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Typ úväzku
              </label>
              <select
                id="employment_type"
                name="employment_type"
                value={formData.employment_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              >
                <option value="full_time">Plný úväzok</option>
                <option value="part_time">Čiastočný úväzok</option>
                <option value="contract">Dohoda</option>
                <option value="intern">Stáž</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status zamestnania
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              >
                <option value="active">Aktívny</option>
                <option value="inactive">Neaktívny</option>
                <option value="terminated">Ukončený</option>
                <option value="on_leave">Na dovolenke</option>
              </select>
            </div>
          </div>

          {/* Personálne údaje */}
          <div className="border-t border-gray-200 dark:border-dark-600 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Personálne údaje
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="birth_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rodné priezvisko
                </label>
                <input
                  type="text"
                  id="birth_name"
                  name="birth_name"
                  value={formData.birth_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="title_before" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titul pred
                </label>
                <input
                  type="text"
                  id="title_before"
                  name="title_before"
                  value={formData.title_before}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="title_after" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titul za
                </label>
                <input
                  type="text"
                  id="title_after"
                  name="title_after"
                  value={formData.title_after}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pohlavie
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                >
                  <option value="">Vyberte pohlavie</option>
                  <option value="muž">Muž</option>
                  <option value="žena">Žena</option>
                </select>
              </div>

              <div>
                <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dátum narodenia
                </label>
                <input
                  type="date"
                  id="birth_date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
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
                <label htmlFor="birth_place" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Miesto narodenia
                </label>
                <input
                  type="text"
                  id="birth_place"
                  name="birth_place"
                  value={formData.birth_place}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Národnosť
                </label>
                <input
                  type="text"
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="citizenship" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Štát občianstvo
                </label>
                <input
                  type="text"
                  id="citizenship"
                  name="citizenship"
                  value={formData.citizenship}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="education" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vzdelanie
                </label>
                <input
                  type="text"
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="marital_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rodinný stav
                </label>
                <input
                  type="text"
                  id="marital_status"
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="bonus_months" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mesiacov pre zam. prémiu
                </label>
                <input
                  type="number"
                  id="bonus_months"
                  name="bonus_months"
                  value={formData.bonus_months}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Checkboxy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_partner"
                  name="is_partner"
                  checked={formData.is_partner}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_partner" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Spoločník
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_statutory"
                  name="is_statutory"
                  checked={formData.is_statutory}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_statutory" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Štatutár
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="employee_bonus"
                  name="employee_bonus"
                  checked={formData.employee_bonus}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="employee_bonus" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Zamestnanecká prémia
                </label>
              </div>
            </div>
          </div>

          {/* Adresa trvalého pobytu */}
          <div className="border-t border-gray-200 dark:border-dark-600 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Adresa trvalého pobytu
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="permanent_street" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ulica
                </label>
                <input
                  type="text"
                  id="permanent_street"
                  name="permanent_street"
                  value={formData.permanent_street}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="permanent_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Číslo popisné
                </label>
                <input
                  type="text"
                  id="permanent_number"
                  name="permanent_number"
                  value={formData.permanent_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="permanent_city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Obec
                </label>
                <input
                  type="text"
                  id="permanent_city"
                  name="permanent_city"
                  value={formData.permanent_city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="permanent_zip" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PSČ
                </label>
                <input
                  type="text"
                  id="permanent_zip"
                  name="permanent_zip"
                  value={formData.permanent_zip}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="permanent_country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Štát
                </label>
                <input
                  type="text"
                  id="permanent_country"
                  name="permanent_country"
                  value={formData.permanent_country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Kontaktná adresa */}
          <div className="border-t border-gray-200 dark:border-dark-600 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Kontaktná adresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contact_street" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ulica
                </label>
                <input
                  type="text"
                  id="contact_street"
                  name="contact_street"
                  value={formData.contact_street}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Číslo popisné
                </label>
                <input
                  type="text"
                  id="contact_number"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="contact_city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Obec
                </label>
                <input
                  type="text"
                  id="contact_city"
                  name="contact_city"
                  value={formData.contact_city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="contact_zip" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PSČ
                </label>
                <input
                  type="text"
                  id="contact_zip"
                  name="contact_zip"
                  value={formData.contact_zip}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="contact_country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Štát
                </label>
                <input
                  type="text"
                  id="contact_country"
                  name="contact_country"
                  value={formData.contact_country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Cudzinecké údaje */}
          <div className="border-t border-gray-200 dark:border-dark-600 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Cudzinecké údaje
            </h3>
            
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="is_foreigner"
                name="is_foreigner"
                checked={formData.is_foreigner}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_foreigner" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Cudzinec
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="foreigner_country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Štát (cudzinec)
                </label>
                <input
                  type="text"
                  id="foreigner_country"
                  name="foreigner_country"
                  value={formData.foreigner_country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="residence_permit_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Číslo povolenia k pobytu
                </label>
                <input
                  type="text"
                  id="residence_permit_number"
                  name="residence_permit_number"
                  value={formData.residence_permit_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="social_insurance_sr" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Číslo soc. poist. v SR
                </label>
                <input
                  type="text"
                  id="social_insurance_sr"
                  name="social_insurance_sr"
                  value={formData.social_insurance_sr}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="social_insurance_foreign" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Číslo soc. poist. v zahraničí
                </label>
                <input
                  type="text"
                  id="social_insurance_foreign"
                  name="social_insurance_foreign"
                  value={formData.social_insurance_foreign}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="health_insurance_sr" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Číslo zdrav. poist. v SR
                </label>
                <input
                  type="text"
                  id="health_insurance_sr"
                  name="health_insurance_sr"
                  value={formData.health_insurance_sr}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="tax_identification_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Identifikačné číslo na daňové účely
                </label>
                <input
                  type="text"
                  id="tax_identification_number"
                  name="tax_identification_number"
                  value={formData.tax_identification_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                id="foreigner_without_permanent_residence"
                name="foreigner_without_permanent_residence"
                checked={formData.foreigner_without_permanent_residence}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="foreigner_without_permanent_residence" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Cudzinec bez trv. pobytu v SR
              </label>
            </div>
          </div>

                     {/* Sekcia pre ukončenie zamestnania */}
           {formData.status === 'terminated' && (
             <div className="border-t border-gray-200 dark:border-dark-600 pt-6">
               <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                 Údaje o ukončení zamestnania
               </h3>
               
                               {/* Informácia o existujúcom dátume ukončenia */}
                {formData.termination_date && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex">
                      <CalendarIcon className="h-5 w-5 text-blue-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Dátum ukončenia: {new Date(formData.termination_date).toLocaleDateString('sk-SK')}
                        </h3>
                        {formData.termination_reason && (
                          <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                            <p><strong>Dôvod:</strong> {formData.termination_reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Upozornenie o uplynutí lehoty */}
                {formData.termination_date && new Date(formData.termination_date) <= new Date() && (
                  <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Dátum ukončenia uplynul
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                          <p>
                            Dátum ukončenia zamestnania ({new Date(formData.termination_date).toLocaleDateString('sk-SK')}) už uplynul. 
                            Po uložení sa status zamestnanca automaticky zmení na "Neaktívny".
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="termination_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dátum ukončenia *
                  </label>
                  <input
                    type="date"
                    id="termination_date"
                    name="termination_date"
                    value={formData.termination_date}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white ${
                      errors.termination_date ? 'border-red-300' : 'border-gray-300 dark:border-dark-600'
                    }`}
                  />
                  {errors.termination_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.termination_date}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="termination_reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dôvod ukončenia *
                  </label>
                  <textarea
                    id="termination_reason"
                    name="termination_reason"
                    value={formData.termination_reason}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white ${
                      errors.termination_reason ? 'border-red-300' : 'border-gray-300 dark:border-dark-600'
                    }`}
                    placeholder="Zadajte dôvod ukončenia zamestnania..."
                  />
                  {errors.termination_reason && (
                    <p className="mt-1 text-sm text-red-600">{errors.termination_reason}</p>
                  )}
                </div>
              </div>
            </div>
          )}

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
              {isSubmitting ? 'Ukladám...' : 'Uložiť zmeny'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
