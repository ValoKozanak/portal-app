import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Employee, hrService } from '../services/hrService';
import { apiService } from '../services/apiService';

// Helper funkcia pre lokálne formátovanie dátumu
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  companyId: number;
  onSuccess: () => void;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  companyId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);

  const isEdit = !!employee;

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        setFormData({
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone: employee.phone || '',
          password: ''
        });
      } else {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          password: ''
        });
      }
    }
  }, [isOpen, employee]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        // Aktualizácia základných údajov zamestnanca
        const employeeData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || undefined
        };
        await hrService.updateEmployee(employee!.id, employeeData);
      } else {
        // Vytvorenie základného záznamu zamestnanca
        const employeeData = {
          company_id: companyId,
          employee_id: `EMP${Date.now()}`, // Automaticky generované ID
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || undefined,
          position: 'Zamestnanec', // Základná pozícia
          hire_date: formatDate(new Date()), // Dnešný dátum
          employment_type: 'full_time' as const, // Základný typ úväzku
          status: 'active' as const
        };
        
        await hrService.addEmployee(employeeData);
        
        // Vytvorenie používateľského účtu pre zamestnanca
        if (formData.password) {
          try {
            console.log('🔧 Vytváram používateľský účet pre zamestnanca:', formData.email);
            const userData = {
              email: formData.email,
              password: formData.password,
              name: `${formData.first_name} ${formData.last_name}`,
              role: 'employee',
              status: 'active',
              phone: formData.phone || undefined
            };
            console.log('📤 Odosielam dáta:', userData);
            await apiService.createUser(userData);
            console.log('✅ Používateľský účet vytvorený úspešne');
          } catch (error) {
            console.error('❌ Chyba pri vytváraní používateľského účtu:', error);
            const errorMessage = error instanceof Error ? error.message : 'Neznáma chyba';
            alert('Chyba pri vytváraní používateľského účtu: ' + errorMessage);
          }
        } else {
          console.log('⚠️ Heslo nie je zadané, používateľský účet sa nevytvorí');
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Chyba pri ukladaní zamestnanca:', error);
      alert('Chyba pri ukladaní zamestnanca');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Upraviť základné údaje zamestnanca' : 'Pridať nového zamestnanca a vytvoriť účet'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Základné údaje zamestnanca</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meno *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="Ján"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priezvisko *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="Novák"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="jan.novak@firma.sk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefón
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="+421 901 234 567"
                />
              </div>
            </div>

            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Heslo pre prihlásenie *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!isEdit}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="Zadajte heslo pre zamestnanca"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Zamestnanec sa bude môcť prihlásiť s týmto emailom a heslom. 
                  Personálne údaje a pracovné pomery sa budú dopĺňať v sekciách "Karty zamestnancov" a "Pracovné pomery".
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-dark-600">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-md hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Ukladám...' : (isEdit ? 'Upraviť' : 'Pridať')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
