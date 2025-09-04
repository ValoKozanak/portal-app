import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { hrService } from '../services/hrService';
import LoadingSpinner from '../components/LoadingSpinner';

interface AutomaticAttendancePageProps {
  companyId: number;
  onBack?: () => void;
}

interface EmployeeWithAutomaticAttendance {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  employment_relation_id: number;
  work_start_time: string;
  work_end_time: string;
  break_start_time: string;
  break_end_time: string;
  weekly_hours: number;
}

type PeriodType = 'month' | 'year' | 'custom';

interface PeriodOption {
  value: PeriodType;
  label: string;
}

const AutomaticAttendancePage: React.FC<AutomaticAttendancePageProps> = ({ companyId, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [employees, setEmployees] = useState<EmployeeWithAutomaticAttendance[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [periodHint, setPeriodHint] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const periodOptions: PeriodOption[] = [
    { value: 'month', label: 'Tento mesiac' },
    { value: 'year', label: 'Tento rok' },
    { value: 'custom', label: 'Vlastné obdobie' }
  ];

  useEffect(() => {
    loadEmployees();
    updateDateRange();
  }, [companyId]); // Pridaná závislosť companyId

  useEffect(() => {
    updateDateRange();
  }, [selectedPeriod]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const employeesData = await hrService.getEmployeesWithAutomaticAttendance(companyId);
      setEmployees(employeesData);
      // Resetovať výber len ak je prázdny alebo ak sa zmenili zamestnanci
      setSelectedEmployees(prev => {
        // Ak sú zamestnanci rovnakí, zachovať výber
        if (employees.length === employeesData.length && 
            employees.every((emp, index) => emp.id === employeesData[index]?.id)) {
          return prev;
        }
        // Inak resetovať
        return [];
      });
    } catch (error) {
      console.error('Chyba pri načítaní zamestnancov:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDateRange = () => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (selectedPeriod) {
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Posledný deň mesiaca (pred úpravou)
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31); // 31. december tohto roku (pred úpravou)
        break;
      case 'custom':
        // Použije aktuálne hodnoty startDate a endDate
        setPeriodHint('');
        return;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Použiť lokálne dátumové formátovanie namiesto toISOString()
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Koncový dátum nesmie presiahnuť včerajší deň
    const yesterday = new Date(now);
    yesterday.setHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);

    const originalEnd = new Date(end);
    originalEnd.setHours(0, 0, 0, 0);

    if (originalEnd.getTime() > yesterday.getTime()) {
      end = new Date(yesterday);
      setPeriodHint('Koncový dátum bol upravený na včerajší deň, aby sa vyhli dnešku/future.');
    } else {
      setPeriodHint('');
    }

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
    }
  };

  const handleSelectEmployee = (employeeId: number) => {
    setSelectedEmployees(prev => {
      const newSelection = prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId];
      return newSelection;
    });
  };

  const handleProcessAttendance = async () => {
    if (selectedEmployees.length === 0) {
      alert('Vyberte aspoň jedného zamestnanca');
      return;
    }

    if (!startDate || !endDate) {
      alert('Vyberte obdobie');
      return;
    }

    const confirmed = window.confirm(
      `Naozaj chcete prepočítať dochádzku pre ${selectedEmployees.length} zamestnancov ` +
      `za obdobie ${startDate} až ${endDate}?\n\n` +
      'Táto akcia prepíše existujúce záznamy dochádzky!'
    );

    if (!confirmed) return;

    setProcessing(true);
    setShowResults(false);
    setResults([]);

    try {
      const response = await hrService.processAutomaticAttendance(
        companyId,
        selectedEmployees,
        startDate,
        endDate
      );
      
      // Backend vracia { message, results }
      setResults(response.results || []);
      setShowResults(true);
    } catch (error: any) {
      console.error('Chyba pri spracovaní dochádzky:', error);
      
      // Zobraziť špecifickú chybu pre uzatvorené obdobie
      if (error.response?.data?.error) {
        alert(`Chyba: ${error.response.data.error}`);
      } else {
        alert('Chyba pri spracovaní dochádzky');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleCleanupFutureAttendance = async () => {
    if (!window.confirm('Naozaj chcete vyčistiť všetku dochádzku za budúce dni? Táto akcia sa nedá vrátiť späť.')) {
      return;
    }

    try {
      const response = await fetch('/api/hr/attendance/cleanup-future', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ companyId })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Vyčistenie dokončené. Odstránených ${result.deletedCount} záznamov.`);
        // Obnoviť stránku pre zobrazenie aktuálnych dát
        window.location.reload();
      } else {
        alert(`Chyba: ${result.error}`);
      }
    } catch (error) {
      console.error('Chyba pri vyčistení dochádzky:', error);
      alert('Chyba pri vyčistení dochádzky. Skúste to znova.');
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // Zobraziť len HH:MM
  };

  const getSuccessCount = () => {
    return Array.isArray(results) ? results.filter(r => r.success && !r.skipped).length : 0;
  };

  const getErrorCount = () => {
    return Array.isArray(results) ? results.filter(r => !r.success && !r.skipped).length : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Načítavam zamestnancov..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => onBack ? onBack() : window.history.back()}
            className="mr-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Automatické prepočítanie dochádzky
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Prepočítaj dochádzku na základe nastavených pracovných hodín
            </p>
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Dôležité:</strong> Automatický výpočet dochádzky môže prebehnúť len za dni <strong>pred aktuálnym dňom</strong>.
            Systém automaticky zohľadní dovolenky, PN, dni pracovného voľna a sviatky.
          </p>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
            <strong>Pozor:</strong> Ak máte dochádzku za budúce dni, môžete ju vyčistiť pomocou tlačidla nižšie.
          </p>
          <button
            onClick={handleCleanupFutureAttendance}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Vyčistiť budúce dochádzky
          </button>
        </div>
            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Poznámka:</strong> Ak máte existujúce dochádzky za víkendy alebo sviatky, môžete ich vyčistiť pomocou tlačidla "Vyčistiť dochádzku za víkendy a sviatky".
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ľavý panel - Výber zamestnancov */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Zamestnanci s automatickou dochádzkou
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Kliknite na zamestnanca pre výber alebo použite "Označiť všetkých"
                </p>
              </div>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {selectedEmployees.length === employees.length ? 'Odznačiť všetkých' : 'Označiť všetkých'}
              </button>
            </div>


            {employees.length === 0 ? (
              <div className="text-center py-8">
                <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Žiadni zamestnanci s automatickou dochádzkou
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Zamestnanci musia mať nastavený režim "Automatická dochádzka" v pracovných pomeroch
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {employees.map((employee, index) => (
                    <div
                      key={`${employee.id}-${index}`}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedEmployees.includes(employee.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                      }`}
                      onClick={() => handleSelectEmployee(employee.id)}
                    >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => handleSelectEmployee(employee.id)}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <p className={`font-medium ${
                            selectedEmployees.includes(employee.id)
                              ? 'text-blue-900 dark:text-blue-100'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {employee.first_name} {employee.last_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.position}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                        <p>{formatTime(employee.work_start_time)} - {formatTime(employee.work_end_time)}</p>
                        <p>{employee.weekly_hours}h/týždeň</p>
                      </div>
                                          </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Pravý panel - Nastavenia */}
        <div className="space-y-6">
          {/* Výber obdobia */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Obdobie prepočítania
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Typ obdobia
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as PeriodType)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                >
                  {periodOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPeriod === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Od dátumu
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Do dátumu
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-dark-700 p-3 rounded-md">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Obdobie:</strong> {startDate} až {endDate}
                </p>
                {periodHint && (
                  <p className="text-xs mt-1 text-yellow-700 dark:text-yellow-300">{periodHint}</p>
                )}
              </div>
            </div>
          </div>

          {/* Akcie */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Akcie
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={handleProcessAttendance}
                disabled={processing || selectedEmployees.length === 0}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Spracovávam...
                  </>
                ) : (
                  <>
                    <ClockIcon className="w-5 h-5 mr-2" />
                    Prepočítať dochádzku
                  </>
                )}
              </button>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>✅ Vybraných: {selectedEmployees.length} zamestnancov</p>
                {selectedEmployees.length === 0 && (
                  <p className="text-orange-600 dark:text-orange-400">⚠️ Vyberte aspoň jedného zamestnanca</p>
                )}
                <p>⚠️ Táto akcia prepíše existujúce záznamy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Výsledky */}
      {showResults && (
        <div className="mt-6 bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Výsledky spracovania
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Úspešne</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {getSuccessCount()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Preskočené</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {results.filter(r => r.skipped).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Chyby</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {getErrorCount()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <CalendarIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Celkom</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {results.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                <thead className="bg-gray-50 dark:bg-dark-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Zamestnanec
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Dátum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Správa
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                  {results.map((result, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {employees.find(emp => emp.id === result.employee_id)?.first_name} {employees.find(emp => emp.id === result.employee_id)?.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {result.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          result.success
                            ? result.skipped
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}>
                          {result.success 
                            ? result.skipped 
                              ? 'Preskočené' 
                              : (result.status || 'Úspech')
                            : 'Chyba'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {result.success 
                          ? result.note || 'Dochádzka vytvorená'
                          : result.error
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutomaticAttendancePage;
