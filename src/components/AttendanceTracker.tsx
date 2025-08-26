import React, { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { hrService, Attendance } from '../services/hrService';

// Helper funkcia pre lokálne formátovanie dátumu
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface AttendanceTrackerProps {
  companyId: number;
  employeeId: number;
  employeeName: string;
  onSuccess: () => void;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  companyId,
  employeeId,
  employeeName,
  onSuccess
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [breakTime, setBreakTime] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);

  useEffect(() => {
    loadTodayAttendance();
  }, [companyId, employeeId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const loadTodayAttendance = async () => {
    try {
      const today = formatDate(new Date());
      const attendance = await hrService.getAttendance(companyId, employeeId, today, today);
      if (attendance.length > 0) {
        setTodayAttendance(attendance[0]);
        if (attendance[0].check_in && !attendance[0].check_out) {
          setIsTracking(true);
          setStartTime(new Date(attendance[0].check_in));
        }
      }
    } catch (error) {
      console.error('Chyba pri načítaní dochádzky:', error);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('sk-SK', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatDuration = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getWorkDuration = (): number => {
    if (!startTime) return 0;
    const totalDuration = currentTime.getTime() - startTime.getTime();
    return totalDuration - breakTime;
  };

  const handleStartWork = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = formatDate(now);
      
      await hrService.addAttendanceWithType({
        employee_id: employeeId,
        company_id: companyId,
        date: today,
        check_in: now.toISOString(),
        status: 'present',
        break_minutes: 0,
        attendance_type: 'manual'
      });

      setIsTracking(true);
      setStartTime(now);
      setBreakTime(0);
      setIsOnBreak(false);
      setBreakStartTime(null);
      await loadTodayAttendance(); // Obnoviť dáta
      onSuccess();
    } catch (error) {
      console.error('Chyba pri začatí práce:', error);
      alert('Chyba pri začatí práce');
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = () => {
    setIsOnBreak(true);
    setBreakStartTime(new Date());
  };

  const handleEndBreak = () => {
    if (breakStartTime) {
      const breakDuration = new Date().getTime() - breakStartTime.getTime();
      setBreakTime(prev => prev + breakDuration);
    }
    setIsOnBreak(false);
    setBreakStartTime(null);
  };

  const handleEndWork = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = formatDate(now);
      const workDuration = getWorkDuration();
      const totalHours = workDuration / (1000 * 60 * 60);

      await hrService.addAttendanceWithType({
        employee_id: employeeId,
        company_id: companyId,
        date: today,
        check_in: startTime?.toISOString(),
        check_out: now.toISOString(),
        total_hours: Math.round(totalHours * 100) / 100,
        break_minutes: Math.round(breakTime / (1000 * 60)),
        status: 'present',
        attendance_type: 'manual'
      });

      setIsTracking(false);
      setStartTime(null);
      setBreakTime(0);
      setIsOnBreak(false);
      setBreakStartTime(null);
      await loadTodayAttendance(); // Obnoviť dáta
      onSuccess();
    } catch (error) {
      console.error('Chyba pri ukončení práce:', error);
      alert('Chyba pri ukončení práce');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAbsent = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await hrService.addAttendance({
        employee_id: employeeId,
        company_id: companyId,
        date: today,
        status: 'absent',
        break_minutes: 0
      });

      onSuccess();
    } catch (error) {
      console.error('Chyba pri označení neprítomnosti:', error);
      alert('Chyba pri označení neprítomnosti');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Dochádzka - {employeeName}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('sk-SK', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Časomiera */}
      <div className="text-center mb-6">
        <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white mb-2">
          {isTracking ? formatDuration(getWorkDuration()) : '00:00:00'}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {isTracking ? 'Pracovný čas' : 'Časomiera'}
        </div>
        {breakTime > 0 && (
          <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">
            Prestávka: {Math.round(breakTime / (1000 * 60))} min
          </div>
        )}
      </div>

      {/* Stav dochádzky */}
      {todayAttendance && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Dnešná dochádzka:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Príchod:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {todayAttendance.check_in ? formatTime(new Date(todayAttendance.check_in)) : 'Nezaznamenané'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Odchod:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {todayAttendance.check_out ? formatTime(new Date(todayAttendance.check_out)) : 'Nezaznamenané'}
              </span>
            </div>
            {todayAttendance.total_hours && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Celkový čas:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {(() => {
                    const hours = todayAttendance.total_hours;
                    const wholeHours = Math.floor(hours);
                    const minutes = Math.round((hours - wholeHours) * 60);
                    return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
                  })()}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                todayAttendance.status === 'present' 
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}>
                {hrService.getAttendanceStatusLabel(todayAttendance.status)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Kontrolné tlačidlá */}
      <div className="flex flex-wrap justify-center gap-3">
        {!isTracking && !todayAttendance && (
          <>
            <button
              onClick={handleStartWork}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Začať prácu
            </button>
            <button
              onClick={handleMarkAbsent}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-5 h-5 mr-2" />
              Neprítomný
            </button>
          </>
        )}

        {isTracking && (
          <>
            {!isOnBreak ? (
              <button
                onClick={handleStartBreak}
                className="flex items-center px-4 py-2 bg-yellow-600 dark:bg-yellow-500 text-white rounded-md hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors"
              >
                <PauseIcon className="w-5 h-5 mr-2" />
                Prestávka
              </button>
            ) : (
              <button
                onClick={handleEndBreak}
                className="flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                <PlayIcon className="w-5 h-5 mr-2" />
                Koniec prestávky
              </button>
            )}
            <button
              onClick={handleEndWork}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <StopIcon className="w-5 h-5 mr-2" />
              Ukončiť prácu
            </button>
          </>
        )}

        {todayAttendance && !isTracking && (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <CheckIcon className="w-5 h-5 mr-2" />
            Dochádzka zaznamenaná
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracker;
