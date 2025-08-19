import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import {
  DocumentChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface AttendanceRecord {
  id: number;
  employee_id: number;
  company_id: number;
  date: string;
  clock_in: string;
  clock_out: string;
  total_hours: number;
  overtime_hours: number;
  status: string;
  notes: string;
  first_name: string;
  last_name: string;
  position: string;
  employee_id_string: string;
}

interface AttendanceStats {
  total_employees: number;
  total_records: number;
  avg_hours: number;
  total_overtime: number;
  present_days: number;
  absent_days: number;
}

interface AttendanceReportProps {
  companyId: number;
  companyName: string;
}

const AttendanceReport: React.FC<AttendanceReportProps> = ({ companyId, companyName }) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [employees, setEmployees] = useState<Array<{ id: number; first_name: string; last_name: string; employee_id: string }>>([]);

  // Nastavenie predvolených dátumov (aktuálny mesiac)
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(format(firstDay, 'yyyy-MM-dd'));
    setEndDate(format(lastDay, 'yyyy-MM-dd'));
  }, []);

  // Načítanie zamestnancov
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await fetch(`/api/attendance/employees/${companyId}`);
        if (response.ok) {
          const data = await response.json();
          setEmployees(data);
        }
      } catch (error) {
        console.error('Chyba pri načítaní zamestnancov:', error);
      }
    };

    loadEmployees();
  }, [companyId]);

  // Načítanie dochádzky
  const loadAttendance = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      let url = `/api/attendance/company/${companyId}?startDate=${startDate}&endDate=${endDate}`;
      if (selectedEmployee !== 'all') {
        url += `&employeeId=${selectedEmployee}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
      }
    } catch (error) {
      console.error('Chyba pri načítaní dochádzky:', error);
    } finally {
      setLoading(false);
    }
  };

  // Načítanie štatistík
  const loadStats = async () => {
    if (!startDate || !endDate) return;

    try {
      const response = await fetch(`/api/attendance/stats/${companyId}?startDate=${startDate}&endDate=${endDate}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Chyba pri načítaní štatistík:', error);
    }
  };

  useEffect(() => {
    loadAttendance();
    loadStats();
  }, [startDate, endDate, selectedEmployee, companyId]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      let url = `/api/attendance/export/${companyId}?startDate=${startDate}&endDate=${endDate}&format=${format}`;
      if (selectedEmployee !== 'all') {
        url += `&employeeId=${selectedEmployee}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        if (format === 'csv') {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `dochadzka_${companyName}_${startDate}_${endDate}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          const data = await response.json();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `dochadzka_${companyName}_${startDate}_${endDate}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (error) {
      console.error('Chyba pri exporte:', error);
    }
  };

  const calculateTotalHours = (records: AttendanceRecord[]) => {
    return records.reduce((total, record) => total + (record.total_hours || 0), 0);
  };

  const calculateTotalOvertime = (records: AttendanceRecord[]) => {
    return records.reduce((total, record) => total + (record.overtime_hours || 0), 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <DocumentChartBarIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Report dochádzky</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filtre */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <FunnelIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtre</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Od dátumu
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Do dátumu
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zamestnanec
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Všetci zamestnanci</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => { loadAttendance(); loadStats(); }}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              <span>{loading ? 'Načítavam...' : 'Filtrovať'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Štatistiky */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">Zamestnanci</div>
                <div className="text-lg font-semibold text-blue-800">{stats.total_employees}</div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm text-gray-600">Záznamy</div>
                <div className="text-lg font-semibold text-green-800">{stats.total_records}</div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-sm text-gray-600">Priem. hodiny</div>
                <div className="text-lg font-semibold text-yellow-800">{stats.avg_hours?.toFixed(1) || '0'}</div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-sm text-gray-600">Nadčasy</div>
                <div className="text-lg font-semibold text-orange-800">{stats.total_overtime?.toFixed(1) || '0'}h</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabuľka dochádzky */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Zamestnanec
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dátum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Príchod
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Odchod
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hodiny
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nadčasy
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendance.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {record.first_name} {record.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{record.position}</div>
                                         <div className="text-xs text-gray-400">ID: {record.employee_id_string}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(record.date), 'dd.MM.yyyy', { locale: sk })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.clock_in ? format(new Date(record.clock_in), 'HH:mm:ss') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.clock_out ? format(new Date(record.clock_out), 'HH:mm:ss') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.total_hours ? `${record.total_hours}h` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.overtime_hours > 0 ? `${record.overtime_hours}h` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    record.status === 'present' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {record.status === 'present' ? 'Prítomný' : 'Neprítomný'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Súhrn */}
      {attendance.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Súhrn</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Celkové hodiny:</span>
              <div className="font-semibold text-gray-800">{calculateTotalHours(attendance).toFixed(1)}h</div>
            </div>
            <div>
              <span className="text-gray-600">Celkové nadčasy:</span>
              <div className="font-semibold text-orange-600">{calculateTotalOvertime(attendance).toFixed(1)}h</div>
            </div>
            <div>
              <span className="text-gray-600">Počet záznamov:</span>
              <div className="font-semibold text-gray-800">{attendance.length}</div>
            </div>
            <div>
              <span className="text-gray-600">Priemerné hodiny:</span>
              <div className="font-semibold text-gray-800">
                {(calculateTotalHours(attendance) / attendance.length).toFixed(1)}h
              </div>
            </div>
          </div>
        </div>
      )}

      {attendance.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <DocumentChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Žiadne záznamy dochádzky pre vybrané obdobie</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceReport;
