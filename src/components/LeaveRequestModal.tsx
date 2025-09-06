import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { LeaveRequest, hrService } from '../services/hrService';
import { CalendarService } from '../services/calendarService';
import DatePicker from './DatePicker';

// Helper funkcia pre lokálne formátovanie dátumu
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveRequest?: LeaveRequest | null;
  companyId: number;
  employeeId: number;
  employeeName: string;
  onSuccess: () => void;
}

const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  isOpen,
  onClose,
  leaveRequest,
  companyId,
  employeeId,
  employeeName,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    leave_type: 'vacation' as 'vacation' | 'sick_leave' | 'personal_leave' | 'maternity_leave' | 'paternity_leave' | 'unpaid_leave',
    start_date: '',
    end_date: '',
    total_days: '',
    reason: ''
  });

  const [loading, setLoading] = useState(false);
  const isEdit = !!leaveRequest;

  useEffect(() => {
    if (isOpen) {
      if (leaveRequest) {
        setFormData({
          leave_type: leaveRequest.leave_type,
          start_date: leaveRequest.start_date,
          end_date: leaveRequest.end_date,
          total_days: leaveRequest.total_days.toString(),
          reason: leaveRequest.reason || ''
        });
      } else {
        setFormData({
          leave_type: 'vacation',
          start_date: '',
          end_date: '',
          total_days: '',
          reason: ''
        });
      }
    }
  }, [isOpen, leaveRequest]);

  // Výpočet pracovných dní s aktuálnym kalendárom
  const calculateDays = async (startDate: string, endDate: string): Promise<number> => {
    try {
      return await CalendarService.calculateWorkingDays(startDate, endDate);
    } catch (error) {
      console.error('❌ Chyba pri výpočte pracovných dní:', error);
      // Fallback na základný výpočet
      return CalendarService.calculateBasicWorkingDays(startDate, endDate);
    }
  };

  const handleDateChange = async (field: 'start_date' | 'end_date', value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Automaticky vypočítať počet dní
      if (newData.start_date && newData.end_date) {
        calculateDays(newData.start_date, newData.end_date).then(days => {
          setFormData(current => ({
            ...current,
            total_days: days.toString()
          }));
        });
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const leaveData = {
        employee_id: employeeId,
        company_id: companyId,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_days: parseInt(formData.total_days),
        status: 'pending' as const,
        reason: formData.reason || undefined
      };

      if (isEdit) {
        // Pre editáciu by sme potrebovali endpoint na update
        alert('Editácia dovoleniek zatiaľ nie je implementovaná');
      } else {
        await hrService.addLeaveRequest(leaveData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Chyba pri ukladaní žiadosti o dovolenku:', error);
      alert('Chyba pri ukladaní žiadosti o dovolenku');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'start_date' || name === 'end_date') {
      handleDateChange(name as 'start_date' | 'end_date', value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Upraviť žiadosť o dovolenku' : 'Nová žiadosť o dovolenku'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informácie o zamestnancovi */}
          <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zamestnanec</h3>
            <p className="text-gray-900 dark:text-white">{employeeName}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Typ dovolenky */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Typ dovolenky *
              </label>
              <select
                name="leave_type"
                value={formData.leave_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              >
                <option value="vacation">Dovolenka</option>
                <option value="sick_leave">PN</option>
                <option value="personal_leave">Osobné voľno</option>
                <option value="maternity_leave">Materská dovolenka</option>
                <option value="paternity_leave">Otcovská dovolenka</option>
                <option value="unpaid_leave">Neplatené voľno</option>
              </select>
            </div>

            {/* Počet dní (automaticky) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Počet dní
              </label>
              {formData.start_date && formData.end_date ? (
                <input
                  type="number"
                  name="total_days"
                  value={formData.total_days}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
                  Vyberte začiatok a koniec dovolenky. Počet dní sa spočíta automaticky.
                </div>
              )}
            </div>

            {/* Začiatok dovolenky */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Začiatok dovolenky *
              </label>
              <DatePicker
                value={formData.start_date}
                onChange={(date) => handleDateChange('start_date', date)}
                min={formatDate(new Date())}
                placeholder="Vyberte dátum začiatku"
                className="w-full"
              />
            </div>

            {/* Koniec dovolenky */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Koniec dovolenky *
              </label>
              <DatePicker
                value={formData.end_date}
                onChange={(date) => handleDateChange('end_date', date)}
                min={formData.start_date || formatDate(new Date())}
                placeholder="Vyberte dátum konca"
                className="w-full"
              />
            </div>
          </div>

          {/* Dôvod */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dôvod
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              placeholder="Popíšte dôvod žiadosti o dovolenku..."
            />
          </div>

          {/* Informácie o dovolenke */}
          {formData.start_date && formData.end_date && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Informácie o dovolenke</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Od:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100">
                    {new Date(formData.start_date).toLocaleDateString('sk-SK')}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Do:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100">
                    {new Date(formData.end_date).toLocaleDateString('sk-SK')}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Počet dní:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100">
                    {formData.total_days} dní
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Typ:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100">
                    {hrService.getLeaveTypeLabel(formData.leave_type)}
                  </span>
                </div>
              </div>
            </div>
          )}

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
              disabled={
                loading ||
                !formData.start_date ||
                !formData.end_date ||
                !formData.total_days ||
                Number(formData.total_days) <= 0
              }
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Ukladám...' : (isEdit ? 'Upraviť' : 'Odoslať žiadosť')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequestModal;
