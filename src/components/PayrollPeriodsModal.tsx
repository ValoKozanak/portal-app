import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import { payrollService, PayrollPeriod } from '../services/payrollService';

interface PayrollPeriodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number;
  userEmail: string;
  userRole?: 'admin' | 'accountant' | 'company' | 'user';
}

const PayrollPeriodsModal: React.FC<PayrollPeriodsModalProps> = ({
  isOpen,
  onClose,
  companyId,
  userEmail,
  userRole = 'user'
}) => {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Načítanie mzdových období
  const loadPeriods = async () => {
    try {
      setLoading(true);
      const data = await payrollService.getPayrollPeriods(companyId, selectedYear);
      setPeriods(data);
    } catch (error) {
      console.error('Chyba pri načítaní mzdových období:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPeriods();
    }
  }, [isOpen, selectedYear]);

  // Kontrola oprávnení na editáciu
  const canEdit = userRole === 'admin' || userRole === 'accountant';

  // Uzatvorenie/odomknutie obdobia
  const handleTogglePeriod = async (period: PayrollPeriod) => {
    if (!canEdit) {
      alert('Nemáte oprávnenie na úpravu mzdových období. Kontaktujte administrátora alebo účtovníka.');
      return;
    }

    try {
      setActionLoading(true);
      
      if (period.is_closed) {
        // Odomknutie
        await payrollService.openPayrollPeriod(companyId, period.year, period.month);
      } else {
        // Uzatvorenie
        if (!payrollService.canClosePeriod(period.year, period.month)) {
          alert('Nie je možné uzatvoriť aktuálne alebo budúce obdobie!');
          return;
        }
        await payrollService.closePayrollPeriod(companyId, period.year, period.month, userEmail);
      }
      
      // Obnovenie dát
      await loadPeriods();
    } catch (error) {
      console.error('Chyba pri zmene stavu obdobia:', error);
      alert('Chyba pri zmene stavu obdobia');
    } finally {
      setActionLoading(false);
    }
  };

  // Generovanie rokov pre výber
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Účtovné obdobia
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Výber roku */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rok
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
            >
              {generateYearOptions().map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Tabuľka období */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Načítavam...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                <thead className="bg-gray-50 dark:bg-dark-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Obdobie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Uzatvorené
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Akcie
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                  {periods.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        Žiadne mzdové obdobia pre vybraný rok
                      </td>
                    </tr>
                  ) : (
                    periods.map((period) => (
                      <tr key={period.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {payrollService.getPeriodLabel(period.year, period.month)}
                              </div>
                              {payrollService.isCurrentPeriod(period.year, period.month) && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  Aktuálne obdobie
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            period.is_closed
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          }`}>
                            {period.is_closed ? 'Uzatvorené' : 'Otvorené'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {period.closed_at ? (
                            <div>
                              <div>{new Date(period.closed_at).toLocaleDateString('sk-SK')}</div>
                              <div className="text-xs">{period.closed_by}</div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {canEdit ? (
                            <button
                              onClick={() => handleTogglePeriod(period)}
                              disabled={actionLoading || (!period.is_closed && !payrollService.canClosePeriod(period.year, period.month))}
                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                                period.is_closed
                                  ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
                                  : 'text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {actionLoading ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                              ) : period.is_closed ? (
                                <LockOpenIcon className="w-3 h-3 mr-1" />
                              ) : (
                                <LockClosedIcon className="w-3 h-3 mr-1" />
                              )}
                              {period.is_closed ? 'Odomknúť' : 'Uzatvoriť'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Len na zobrazenie
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-dark-600">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            * Môžete uzatvoriť len minulé mesiace
            {!canEdit && (
              <span className="block mt-1 text-orange-600">
                ** Len administrátori a účtovníci môžu upravovať obdobia
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-dark-500"
          >
            Zavrieť
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollPeriodsModal;
