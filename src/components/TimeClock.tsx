import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import {
  ClockIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
// Odstránenie nepoužívaného importu

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  employee_id: string;
}

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
}

interface TimeClockProps {
  companyId: number;
  companyName: string;
}

const TimeClock: React.FC<TimeClockProps> = ({ companyId, companyName }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notes, setNotes] = useState('');

  // Aktualizácia času každú sekundu
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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

  // Načítanie dnešnej dochádzky pre vybraného zamestnanca
  useEffect(() => {
    if (!selectedEmployee) {
      setTodayAttendance(null);
      return;
    }

    const loadTodayAttendance = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/attendance/employee/${selectedEmployee}?startDate=${today}&endDate=${today}`);
        if (response.ok) {
          const data = await response.json();
          setTodayAttendance(data.length > 0 ? data[0] : null);
        }
      } catch (error) {
        console.error('Chyba pri načítaní dochádzky:', error);
      }
    };

    loadTodayAttendance();
  }, [selectedEmployee]);

  const handleClockIn = async () => {
    if (!selectedEmployee) {
      setMessage({ type: 'error', text: 'Vyberte zamestnanca' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          companyId: companyId,
          notes: notes
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Príchod úspešne zaznamenaný!' });
        setNotes('');
        // Obnovenie dochádzky
        const today = new Date().toISOString().split('T')[0];
        const attendanceResponse = await fetch(`/api/attendance/employee/${selectedEmployee}?startDate=${today}&endDate=${today}`);
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          setTodayAttendance(attendanceData.length > 0 ? attendanceData[0] : null);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Chyba pri zaznamenávaní príchodu' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Chyba pri zaznamenávaní príchodu' });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!selectedEmployee) {
      setMessage({ type: 'error', text: 'Vyberte zamestnanca' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          notes: notes
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `Odchod úspešne zaznamenaný! Odpracované hodiny: ${data.totalHours}h` });
        setNotes('');
        // Obnovenie dochádzky
        const today = new Date().toISOString().split('T')[0];
        const attendanceResponse = await fetch(`/api/attendance/employee/${selectedEmployee}?startDate=${today}&endDate=${today}`);
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          setTodayAttendance(attendanceData.length > 0 ? attendanceData[0] : null);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Chyba pri zaznamenávaní odchodu' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Chyba pri zaznamenávaní odchodu' });
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Časová karta</h2>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Aktuálny čas</div>
          <div className="text-lg font-mono text-gray-800">
            {format(currentTime, 'HH:mm:ss', { locale: sk })}
          </div>
          <div className="text-sm text-gray-500">
            {format(currentTime, 'EEEE, d. MMMM yyyy', { locale: sk })}
          </div>
        </div>
      </div>

      {/* Firma */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-800">{companyName}</span>
        </div>
      </div>

      {/* Výber zamestnanca */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vyberte zamestnanca
        </label>
        <select
          value={selectedEmployee || ''}
          onChange={(e) => setSelectedEmployee(Number(e.target.value) || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Vyberte zamestnanca --</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.first_name} {employee.last_name} - {employee.position}
            </option>
          ))}
        </select>
      </div>

      {/* Informácie o vybranom zamestnancovi */}
      {selectedEmployeeData && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <UserIcon className="w-8 h-8 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-800">
                {selectedEmployeeData.first_name} {selectedEmployeeData.last_name}
              </h3>
              <p className="text-sm text-gray-600">{selectedEmployeeData.position}</p>
              <p className="text-xs text-gray-500">ID: {selectedEmployeeData.employee_id}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dnešná dochádzka */}
      {todayAttendance && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-800 mb-2">Dnešná dochádzka</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Príchod:</span>
              <div className="font-mono text-green-700">
                {todayAttendance.clock_in ? format(new Date(todayAttendance.clock_in), 'HH:mm:ss') : 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Odchod:</span>
              <div className="font-mono text-green-700">
                {todayAttendance.clock_out ? format(new Date(todayAttendance.clock_out), 'HH:mm:ss') : 'N/A'}
              </div>
            </div>
            {todayAttendance.total_hours && (
              <div>
                <span className="text-gray-600">Odpracované hodiny:</span>
                <div className="font-mono text-green-700">{todayAttendance.total_hours}h</div>
              </div>
            )}
            {todayAttendance.overtime_hours > 0 && (
              <div>
                <span className="text-gray-600">Nadčasy:</span>
                <div className="font-mono text-orange-700">{todayAttendance.overtime_hours}h</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Poznámky */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Poznámky (voliteľné)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Zadajte poznámky k dochádzke..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Tlačidlá */}
      <div className="flex space-x-4">
        <button
          onClick={handleClockIn}
          disabled={loading || !selectedEmployee || Boolean(todayAttendance?.clock_in)}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md font-medium transition-colors ${
            loading || !selectedEmployee || Boolean(todayAttendance?.clock_in)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <CheckCircleIcon className="w-5 h-5" />
          <span>Príchod</span>
        </button>

        <button
          onClick={handleClockOut}
          disabled={loading || !selectedEmployee || !todayAttendance || !Boolean(todayAttendance.clock_in) || Boolean(todayAttendance.clock_out)}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md font-medium transition-colors ${
            loading || !selectedEmployee || !todayAttendance || !Boolean(todayAttendance.clock_in) || Boolean(todayAttendance.clock_out)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          <XCircleIcon className="w-5 h-5" />
          <span>Odchod</span>
        </button>
      </div>

      {/* Správa */}
      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stav */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Stav dochádzky</h4>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className={`w-3 h-3 rounded-full ${
              todayAttendance?.clock_in ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <span>Príchod</span>
          </div>
          <ArrowRightIcon className="w-4 h-4 text-gray-400" />
          <div className="flex items-center space-x-1">
            <div className={`w-3 h-3 rounded-full ${
              todayAttendance?.clock_out ? 'bg-red-500' : 'bg-gray-300'
            }`}></div>
            <span>Odchod</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeClock;
