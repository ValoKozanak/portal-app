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
  const [holidays, setHolidays] = useState<{ date: string; title: string }[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDay, setEditDay] = useState<{ date: string; status: 'present' | 'absent' | 'vacation' | 'sick_leave'; start_time?: string; end_time?: string; break_minutes?: number; note?: string } | null>(null);
  const userRoleRaw = typeof window !== 'undefined' ? window.localStorage.getItem('userRole') : null;
  const userRole = (() => { try { return userRoleRaw ? JSON.parse(userRoleRaw) : null; } catch { return userRoleRaw; } })() as 'admin' | 'accountant' | 'user' | 'employee' | null;
  const canEdit = userRole === 'admin' || userRole === 'accountant' || userRole === 'user';

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
    const loadCalendar = async () => {
      try {
        if (!startDate) return;
        const year = new Date(startDate).getFullYear();
        const calendar = await CalendarService.getWorkCalendar(year);
        setHolidays(calendar.holidays || []);
      } catch (e) {
        setHolidays([]);
      }
    };
    loadCalendar();
  }, [startDate]);

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

  const getDatesInRange = (start: string, end: string): string[] => {
    const result: string[] = [];
    const s = new Date(start);
    const e = new Date(end);
    const cur = new Date(s);
    while (cur <= e) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      result.push(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  };

  const isHolidayLocal = (dateStr: string) => holidays.some(h => h.date === dateStr);
  const isWeekendLocal = (dateStr: string) => {
    const dt = new Date(dateStr);
    const day = dt.getDay();
    return day === 0 || day === 6;
  };

  const buildDisplayRows = (): Array<Attendance & { synthetic?: boolean }> => {
    if (!startDate || !endDate) return [];
    const mapByDate = new Map<string, Attendance>();
    attendance.forEach(a => { mapByDate.set(a.date, a); });
    const dates = getDatesInRange(startDate, endDate);
    return dates.map(dateStr => {
      const existing = mapByDate.get(dateStr);
      if (existing) return existing;
      const status: Attendance['status'] = isHolidayLocal(dateStr) || isWeekendLocal(dateStr) ? 'holiday' : 'absent';
      return {
        id: -1,
        employee_id: (employeeId || selectedEmployee || 0) as number,
        company_id: companyId,
        date: dateStr,
        check_in: undefined,
        check_out: undefined,
        total_hours: undefined,
        break_minutes: 0,
        status,
        notes: status === 'holiday' ? 'Pracovný pokoj' : undefined,
        first_name: '',
        last_name: '',
        employee_id_code: '',
        created_at: '',
        updated_at: '',
        synthetic: true
      } as any;
    });
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
                Aktuálne
              </th>
              {!showAllEmployees && canEdit && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Akcie</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
            {loading ? (
              <tr>
                <td colSpan={showAllEmployees ? 7 : (canEdit ? 7 : 6)} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Načítavam...
                </td>
              </tr>
            ) : (!showAllEmployees && (buildDisplayRows().length === 0)) || (showAllEmployees && attendance.length === 0) ? (
              <tr>
                <td colSpan={showAllEmployees ? 7 : (canEdit ? 7 : 6)} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Žiadne záznamy dochádzky pre vybrané obdobie
                </td>
              </tr>
            ) : (
              (showAllEmployees ? attendance : buildDisplayRows()).map((att) => (
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
                        : att.status === 'holiday'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {hrService.getAttendanceStatusLabel(att.status)}
                    </span>
                  </td>
                  {!showAllEmployees && canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                      <button
                        onClick={() => {
                          setEditDay({
                            date: att.date,
                            status: att.status === 'holiday' ? 'absent' : (att.status as any),
                            start_time: att.check_in ? formatTime(att.check_in) + (formatTime(att.check_in).length === 5 ? ':00' : '') : undefined,
                            end_time: att.check_out ? formatTime(att.check_out) + (formatTime(att.check_out).length === 5 ? ':00' : '') : undefined,
                            break_minutes: att.break_minutes || 0,
                            note: att.notes || ''
                          });
                          setEditModalOpen(true);
                        }}
                        className="hover:underline"
                      >
                        Upraviť
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editModalOpen && editDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upraviť deň {new Date(editDay.date).toLocaleDateString('sk-SK')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stav</label>
                <select
                  value={editDay.status}
                  onChange={(e) => setEditDay(prev => prev ? { ...prev, status: e.target.value as any } : prev)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                >
                  <option value="present">Prítomný</option>
                  <option value="absent">Neprítomný</option>
                  <option value="vacation">Dovolenka</option>
                  <option value="sick_leave">PN</option>
                </select>
              </div>
              {editDay.status === 'present' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Príchod</label>
                    <input type="time" value={(editDay.start_time || '').slice(0,5)} onChange={(e)=> setEditDay(prev => prev ? { ...prev, start_time: e.target.value } : prev)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Odchod</label>
                    <input type="time" value={(editDay.end_time || '').slice(0,5)} onChange={(e)=> setEditDay(prev => prev ? { ...prev, end_time: e.target.value } : prev)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prestávka (min)</label>
                    <input type="number" min={0} value={editDay.break_minutes || 0} onChange={(e)=> setEditDay(prev => prev ? { ...prev, break_minutes: Number(e.target.value) } : prev)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Poznámka</label>
                <input type="text" value={editDay.note || ''} onChange={(e)=> setEditDay(prev => prev ? { ...prev, note: e.target.value } : prev)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white" />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button onClick={()=>{ setEditModalOpen(false); setEditDay(null); }} className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700">Zrušiť</button>
                <button
                  onClick={async ()=>{
                    if (!editDay) return;
                    try {
                      const attendance_type = editDay.status === 'vacation' ? 'leave' : (editDay.status as any);
                      const targetEmployeeId = employeeId || selectedEmployee;
                      if (!targetEmployeeId) return;
                      await hrService.updateAttendanceDay({
                        employee_id: targetEmployeeId,
                        company_id: companyId,
                        date: editDay.date,
                        attendance_type,
                        start_time: editDay.status === 'present' ? (editDay.start_time ? `${editDay.start_time}:00` : null) : null,
                        end_time: editDay.status === 'present' ? (editDay.end_time ? `${editDay.end_time}:00` : null) : null,
                        break_minutes: editDay.status === 'present' ? (editDay.break_minutes || 0) : 0,
                        note: editDay.note || ''
                      });
                      setEditModalOpen(false);
                      setEditDay(null);
                      await loadAttendance();
                    } catch (e: any) {
                      alert(e?.message || 'Chyba pri ukladaní dochádzky');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Uložiť
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceOverview;
