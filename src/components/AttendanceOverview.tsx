import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { hrService, Attendance } from '../services/hrService';
import { CalendarService } from '../services/calendarService';

interface AttendanceOverviewProps {
  companyId: number;
  employeeId?: number; // Voliteľné - ak nie je uvedené, zobrazí všetkých zamestnancov
  employeeName?: string;
  isCompanyView?: boolean; // Pre rozlíšenie medzi pohľadom firmy a zamestnanca
}

type PeriodType = 'year' | 'month' | 'custom' | 'week';

interface PeriodOption {
  value: PeriodType;
  label: string;
}

const AttendanceOverview: React.FC<AttendanceOverviewProps> = ({
  companyId,
  employeeId,
  employeeName,
  isCompanyView = false
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [showAllEmployees, setShowAllEmployees] = useState<boolean>(false);

  const periodOptions: PeriodOption[] = [
    { value: 'week', label: 'Tento týždeň' },
    { value: 'month', label: 'Tento mesiac' },
    { value: 'year', label: 'Tento rok' },
    { value: 'custom', label: 'Vlastné obdobie' }
  ];

  useEffect(() => {
    if (isCompanyView) {
      loadEmployees();
    }
    updateDateRange();
  }, [selectedPeriod, isCompanyView]);

  useEffect(() => {
    if (startDate && endDate) {
      loadAttendance();
    }
  }, [startDate, endDate, selectedEmployee, showAllEmployees]);

  const loadEmployees = async () => {
    try {
      const employeesData = await hrService.getEmployees(companyId);
      setEmployees(employeesData);
      if (employeesData.length > 0) {
        setSelectedEmployee(employeesData[0].id);
      }
    } catch (error) {
      console.error('Chyba pri načítaní zamestnancov:', error);
    }
  };

  const updateDateRange = () => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (selectedPeriod) {
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay() + 1); // Pondelok
        end = new Date(now);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Posledný deň mesiaca
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31); // 31. december
        break;
      case 'custom':
        // Použije aktuálne hodnoty startDate a endDate
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

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const loadAttendance = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      if (showAllEmployees) {
        // Načítanie dochádzky pre všetkých zamestnancov
        const allAttendanceData = await Promise.all(
          employees.map(async (emp) => {
            try {
              const empAttendance = await hrService.getAttendance(
                companyId,
                emp.id,
                startDate,
                endDate
              );
              return empAttendance.map(att => ({
                ...att,
                employee_name: `${emp.first_name} ${emp.last_name}`
              }));
            } catch (error) {
              console.error(`Chyba pri načítaní dochádzky pre zamestnanca ${emp.id}:`, error);
              return [];
            }
          })
        );
        
        // Spojenie všetkých dochádzok do jedného poľa
        const combinedAttendance = allAttendanceData.flat();
        setAttendance(combinedAttendance);
      } else {
        const targetEmployeeId = employeeId || selectedEmployee;
        if (!targetEmployeeId) return;

        // Kontrola duplicitných záznamov
        try {
          const duplicates = await hrService.checkAttendanceDuplicates(
            companyId,
            targetEmployeeId,
            startDate,
            endDate
          );
          if (duplicates.duplicates && duplicates.duplicates.length > 0) {
            console.warn('Nájdené duplicitné záznamy dochádzky:', duplicates.duplicates);
          }
        } catch (error) {
          console.error('Chyba pri kontrole duplicitných záznamov:', error);
        }

        const attendanceData = await hrService.getAttendance(
          companyId, 
          targetEmployeeId, 
          startDate, 
          endDate
        );
        setAttendance(attendanceData);
      }
    } catch (error) {
      console.error('Chyba pri načítaní dochádzky:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    if (!attendance.length) return null;

    let totalDays: number;
    let presentDays: number;
    let absentDays: number;
    let lateDays: number;
    
         if (showAllEmployees) {
       // Pre všetkých zamestnancov počítame podľa kalendára
       // Počítame pracovné dni v období pomocou CalendarService
       const workingDaysInPeriod = await CalendarService.calculateWorkingDays(startDate, endDate);
       
       totalDays = workingDaysInPeriod; // Celkový počet pracovných dní v období
       
       // Počítame dni pracovného voľna ako celkové pracovné dni mínus neprítomné dni
       const totalAbsentDays = attendance.filter(a => a.status === 'absent').length;
       presentDays = totalAbsentDays; // Dni pracovného voľna = neprítomné dni
       absentDays = totalDays - totalAbsentDays; // Prítomné dni = celkové dni mínus neprítomné dni
       lateDays = attendance.filter(a => a.status === 'late').length;
    } else {
      // Pre individuálneho zamestnanca počítame pracovné dni v období
      const workingDaysInPeriod = await CalendarService.calculateWorkingDays(startDate, endDate);
      totalDays = workingDaysInPeriod;
      
      // Počítame unikátne dni s dochádzkou (aby sme eliminovali duplicity)
      const presentDates = new Set(
        attendance
          .filter(a => a.status === 'present')
          .map(a => a.date)
      );
      const lateDates = new Set(
        attendance
          .filter(a => a.status === 'late')
          .map(a => a.date)
      );
      
      // Počítame dni s dochádzkou (prítomné + meškanie)
      const daysWithAttendance = new Set();
      presentDates.forEach(date => daysWithAttendance.add(date));
      lateDates.forEach(date => daysWithAttendance.add(date));
      presentDays = daysWithAttendance.size;
      
      // Neprítomné dni = celkové pracovné dni mínus dni s dochádzkou
      absentDays = Math.max(0, totalDays - presentDays);
      lateDays = lateDates.size;
    }
    
    const totalHours = attendance.reduce((sum, a) => sum + (a.total_hours || 0), 0);
    const totalBreakMinutes = attendance.reduce((sum, a) => sum + (a.break_minutes || 0), 0);
    
    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;
    // Účasť = (dni s dochádzkou / celkové pracovné dni) * 100
    const attendanceRate = totalDays > 0 ? Math.min(100, (presentDays / totalDays) * 100) : 0;
    
    // Debug informácie
    console.log('Attendance Overview Debug:', {
      attendanceLength: attendance.length,
      totalHours,
      totalBreakMinutes,
      presentDays,
      absentDays,
      totalDays,
      attendanceRate,
      averageHours,
      uniqueDates: showAllEmployees ? 'N/A' : new Set(attendance.map(a => a.date)).size,
      presentDates: showAllEmployees ? 'N/A' : new Set(attendance.filter(a => a.status === 'present').map(a => a.date)).size,
      lateDates: showAllEmployees ? 'N/A' : new Set(attendance.filter(a => a.status === 'late').map(a => a.date)).size
    });

    // Pre všetkých zamestnancov pridáme informáciu o počte zamestnancov
    const uniqueEmployees = showAllEmployees 
      ? new Set(attendance.map(a => a.employee_name)).size 
      : 1;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      totalHours,
      totalBreakMinutes,
      averageHours,
      attendanceRate,
      uniqueEmployees
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sk-SK', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    
    try {
      // Ak je to už čas v formáte HH:MM, vráť ho
      if (timeString.match(/^\d{2}:\d{2}$/)) {
        return timeString;
      }
      
      // Ak je to dátum, skús ho spracovať
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        return '-';
      }
      
      return date.toLocaleTimeString('sk-SK', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Chyba pri formátovaní času:', timeString, error);
      return '-';
    }
  };

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const loadStats = async () => {
      const calculatedStats = await calculateStats();
      setStats(calculatedStats);
    };
    
    if (attendance.length > 0) {
      loadStats();
    } else {
      setStats(null);
    }
  }, [attendance, showAllEmployees, startDate, endDate, employees.length]);

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Prehľad dochádzky
          </h3>
          {employeeName && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {employeeName}
            </p>
          )}
        </div>

        {/* Výber obdobia */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as PeriodType)}
              className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {selectedPeriod === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Výber zamestnanca pre firmu */}
      {isCompanyView && employees.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Zobrazenie dochádzky
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="viewType"
                  checked={!showAllEmployees}
                  onChange={() => setShowAllEmployees(false)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Individuálne</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="viewType"
                  checked={showAllEmployees}
                  onChange={() => setShowAllEmployees(true)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Všetci zamestnanci</span>
              </label>
            </div>
          </div>
          
          {!showAllEmployees && (
            <select
              value={selectedEmployee || ''}
              onChange={(e) => setSelectedEmployee(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Štatistiky */}
      {stats && (
        <div className={`grid grid-cols-2 md:grid-cols-4 ${showAllEmployees ? 'lg:grid-cols-5' : ''} gap-4 mb-6`}>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Účasť</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.attendanceRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Celkové hodiny</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {(() => {
                    const hours = stats.totalHours;
                    const wholeHours = Math.floor(hours);
                    const minutes = Math.round((hours - wholeHours) * 60);
                    return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
                  })()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Priemerné hodiny</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {(() => {
                    const hours = stats.averageHours;
                    const wholeHours = Math.floor(hours);
                    const minutes = Math.round((hours - wholeHours) * 60);
                    return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
                  })()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Prestávky</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {(() => {
                    const totalMinutes = Math.round(stats.totalBreakMinutes);
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    return `${hours}:${minutes.toString().padStart(2, '0')}`;
                  })()}
                </p>
              </div>
            </div>
          </div>
          
          {showAllEmployees && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <ChartBarIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Zamestnanci</p>
                  <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                    {stats.uniqueEmployees}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

             {/* Detailné štatistiky */}
       {stats && (
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
           <div className="text-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
             <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDays}</p>
             <p className="text-sm text-gray-500 dark:text-gray-400">
               {showAllEmployees ? 'Celkovo pracovných dní' : 'Celkovo dní'}
             </p>
           </div>
           <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
             <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.presentDays}</p>
             <p className="text-sm text-green-600 dark:text-green-400">
               {showAllEmployees ? 'Dni pracovného voľna' : 'Prítomné dni'}
             </p>
           </div>
           <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
             <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absentDays}</p>
             <p className="text-sm text-red-600 dark:text-red-400">
               {showAllEmployees ? 'Prítomné dni' : 'Neprítomné dni'}
             </p>
           </div>
           <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
             <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.lateDays}</p>
             <p className="text-sm text-yellow-600 dark:text-yellow-400">Meškania</p>
           </div>
         </div>
       )}

      {/* Tabuľka dochádzky */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
          <thead className="bg-gray-50 dark:bg-dark-700">
            <tr>
              {showAllEmployees && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Zamestnanec
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Dátum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Príchod
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Odchod
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Hodiny
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Prestávky
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
            {loading ? (
              <tr>
                <td colSpan={showAllEmployees ? 7 : 6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Načítavam...
                </td>
              </tr>
            ) : attendance.length === 0 ? (
              <tr>
                <td colSpan={showAllEmployees ? 7 : 6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Žiadne záznamy dochádzky pre vybrané obdobie
                </td>
              </tr>
            ) : (
              attendance.map((att) => (
                <tr key={att.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                  {showAllEmployees && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {att.employee_name || '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(att.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {att.check_in ? formatTime(att.check_in) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {att.check_out ? formatTime(att.check_out) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {att.total_hours ? (() => {
                      const hours = att.total_hours;
                      const wholeHours = Math.floor(hours);
                      const minutes = Math.round((hours - wholeHours) * 60);
                      return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
                    })() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {att.break_minutes ? (() => {
                      const totalMinutes = att.break_minutes;
                      const hours = Math.floor(totalMinutes / 60);
                      const minutes = totalMinutes % 60;
                      return `${hours}:${minutes.toString().padStart(2, '0')}`;
                    })() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      att.status === 'present' 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : att.status === 'late'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {hrService.getAttendanceStatusLabel(att.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceOverview;
