import React, { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { hrService } from '../services/hrService';

interface AttendanceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number;
  onSuccess: () => void;
}

interface EmployeeWithMissingAttendance {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  attendance_mode: string;
  missing_dates: string[];
  work_start_time?: string;
  work_end_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  weekly_hours?: number;
}

const AttendanceRecordModal: React.FC<AttendanceRecordModalProps> = ({
  isOpen,
  onClose,
  companyId,
  onSuccess
}) => {
  const [employees, setEmployees] = useState<EmployeeWithMissingAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithMissingAttendance | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [attendanceType, setAttendanceType] = useState<'present' | 'absent' | 'leave' | 'sick_leave'>('present');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('16:00');
  const [breakMinutes, setBreakMinutes] = useState<number>(30);
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEmployeesWithMissingAttendance();
    }
  }, [isOpen, companyId]);

  const loadEmployeesWithMissingAttendance = async () => {
    try {
      setLoading(true);
      // ZA�skame zamestnancov s manuA?lnou dochA?dzkou, ktorA� nemajAs zaznamenanAs dochA?dzku
      const employeesData = await hrService.getEmployeesWithMissingAttendance(companyId);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Chyba pri na�TA�tanA� zamestnancov:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employee: EmployeeWithMissingAttendance) => {
    setSelectedEmployee(employee);
    if (employee.missing_dates.length > 0) {
      setSelectedDate(employee.missing_dates[0]);
    }
    
    // Automaticky nastavA�me pracovnA� �Tasy pod�la nastavenA� zamestnanca
    if (employee.work_start_time) {
      setStartTime(employee.work_start_time);
    }
    if (employee.work_end_time) {
      setEndTime(employee.work_end_time);
    }
    
    // Vypo�TA�tame prestA?vku v minAstach
    if (employee.break_start_time && employee.break_end_time) {
      const breakStart = new Date(`2000-01-01T${employee.break_start_time}`);
      const breakEnd = new Date(`2000-01-01T${employee.break_end_time}`);
      const breakMinutes = Math.round((breakEnd.getTime() - breakStart.getTime()) / (1000 * 60));
      setBreakMinutes(breakMinutes);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedDate) {
      alert('Vyberte zamestnanca a dA?tum');
      return;
    }

    try {
      setSubmitting(true);

      const attendanceData = {
        employee_id: selectedEmployee.id,
        company_id: companyId,
        date: selectedDate,
        attendance_type: attendanceType,
        start_time: attendanceType === 'present' ? startTime : null,
        end_time: attendanceType === 'present' ? endTime : null,
        break_minutes: attendanceType === 'present' ? breakMinutes : 0,
        note: note,
        recorded_by: 'hr_manager' // TODO: pouLliLA skuto�TnA� ID prihlA?senA�ho pouLlA�vate�la
      };

      await hrService.recordAttendance(attendanceData);
      
      // ObnoviLA zoznam zamestnancov
      await loadEmployeesWithMissingAttendance();
      
      // Reset formulA?ra
      setSelectedEmployee(null);
      setSelectedDate('');
      setAttendanceType('present');
      setStartTime('08:00');
      setEndTime('16:00');
      setBreakMinutes(30);
      setNote('');
      
      onSuccess();
      alert('DochA?dzka bola AsspeL?ne zaznamenanA?');
    } catch (error) {
      console.error('Chyba pri zaznamenA?vanA� dochA?dzky:', error);
      alert('Chyba pri zaznamenA?vanA� dochA?dzky');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            ZaznamenaLA dochA?dzku
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Na�TA�tavam zamestnancov...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                VL?etci zamestnanci majAs zaznamenanAs dochA?dzku
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                VL?etci zamestnanci s manuA?lnou dochA?dzkou majAs dnes zaznamenanAs dochA?dzku.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Zoznam zamestnancov */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Zamestnanci bez dochA?dzky
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      onClick={() => handleEmployeeSelect(employee)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedEmployee?.id === employee.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {employee.first_name} {employee.last_name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.position}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {employee.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {employee.missing_dates.length} dnA�
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FormulA?r pre zaznamenanie dochA?dzky */}
              {selectedEmployee && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    ZaznamenaLA dochA?dzku pre {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* DA?tum */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        DA?tum
                      </label>
                      <select
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:text-white"
                      >
                        {selectedEmployee.missing_dates.map((date) => (
                          <option key={date} value={date}>
                            {new Date(date).toLocaleDateString('sk-SK')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Typ dochA?dzky */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Typ dochA?dzky
                      </label>
                      <select
                        value={attendanceType}
                        onChange={(e) => setAttendanceType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:text-white"
                      >
                        <option value="present">PrA�tomnA?</option>
                        <option value="absent">NeprA�tomnA?</option>
                        <option value="leave">Dovolenka</option>
                        <option value="sick_leave">PN</option>
                      </select>
                    </div>

                    {/* �Sasy (len pre prA�tomnA?ch) */}
                    {attendanceType === 'present' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            PrA�chod
                          </label>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Odchod
                          </label>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* PrestA?vka (len pre prA�tomnA?ch) */}
                    {attendanceType === 'present' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          PrestA?vka (minAsty)
                        </label>
                        <input
                          type="number"
                          value={breakMinutes}
                          onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                          min="0"
                          max="480"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:text-white"
                        />
                      </div>
                    )}

                    {/* PoznA?mka */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        PoznA?mka
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:text-white"
                        placeholder="Volite�lnA? poznA?mka k dochA?dzke..."
                      />
                    </div>

                    {/* Tla�TidlA? */}
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'ZaznamenA?vam...' : 'ZaznamenaLA dochA?dzku'}
                      </button>
                      <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700"
                      >
                        ZruL?iLA
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceRecordModal;

