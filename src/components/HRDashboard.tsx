import React, { useState, useEffect, useCallback } from 'react';
import { 
  UsersIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  UserPlusIcon, 
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import EmployeeModal from './EmployeeModal';
import LeaveRequestModal from './LeaveRequestModal';
import EmployeeCardPage from '../pages/EmployeeCardPage';
import EmploymentRelationsPage from '../pages/EmploymentRelationsPage';
import AttendanceOverview from './AttendanceOverview';
import AutomaticAttendancePage from '../pages/AutomaticAttendancePage';
import AttendanceRecordModal from './AttendanceRecordModal';
import { hrService, Employee, LeaveRequest, HRStats, EmployeeAttendanceStatus } from '../services/hrService';

// Helper funkcia pre lokálne formátovanie dátumu
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper funkcia pre formátovanie času
const formatTime = (timeString: string | null): string => {
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

interface HRDashboardProps {
  companyId: number;
}

const HRDashboard: React.FC<HRDashboardProps> = ({ companyId }) => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<HRStats | null>(null);
  const [employeeChanges, setEmployeeChanges] = useState<any[]>([]);
  const [presentEmployeesToday, setPresentEmployeesToday] = useState<any[]>([]);
  const [absentEmployeesToday, setAbsentEmployeesToday] = useState<any[]>([]);
  const [employeesAttendanceStatus, setEmployeesAttendanceStatus] = useState<EmployeeAttendanceStatus[]>([]);
  const [lastAttendanceUpdate, setLastAttendanceUpdate] = useState<Date>(new Date());
  const [isRefreshingAttendance, setIsRefreshingAttendance] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'attendance' | 'leave' | 'employee-cards' | 'employment-relations' | 'attendance-overview'>('overview');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showLeaveRequestModal, setShowLeaveRequestModal] = useState(false);
  const [selectedEmployeeForLeave, setSelectedEmployeeForLeave] = useState<Employee | null>(null);
  const [showAttendanceRecordModal, setShowAttendanceRecordModal] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'leave-requests' | 'automatic-attendance' | 'select-employee-for-leave' | 'present-today' | 'absent-today'>('overview');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Načítanie štatistík
      const statsData = await hrService.getHRStats(companyId);
      console.log('HR Stats:', statsData);
      setStats(statsData);

      // Načítanie zamestnancov
      const employeesData = await hrService.getEmployees(companyId);
      setEmployees(employeesData);

      // Načítanie žiadostí o dovolenku
      const leaveData = await hrService.getLeaveRequests(companyId);
      console.log('Všetky žiadosti o dovolenku:', leaveData);
      console.log('Čakajúce žiadosti:', statsData?.leave_requests?.pending_leave_requests);
      console.log('Počet všetkých žiadostí:', leaveData.length);
      setLeaveRequests(leaveData);

      // Načítanie zmien zamestnancov
      const changesData = await hrService.getCompanyChanges(companyId);
      setEmployeeChanges(changesData);

      // Načítanie prítomných zamestnancov dnes
      try {
        const presentData = await hrService.getPresentEmployeesToday(companyId);
        setPresentEmployeesToday(presentData);
      } catch (error) {
        console.error('Chyba pri načítaní prítomných zamestnancov:', error);
        setPresentEmployeesToday([]);
      }

      // Načítanie neprítomných zamestnancov dnes
      try {
        const absentData = await hrService.getAbsentEmployeesToday(companyId);
        setAbsentEmployeesToday(absentData);
      } catch (error) {
        console.error('Chyba pri načítaní neprítomných zamestnancov:', error);
        setAbsentEmployeesToday([]);
      }

      // Načítanie všetkých aktívnych zamestnancov s dochádzkou
      try {
        const attendanceStatusData = await hrService.getEmployeesAttendanceStatus(companyId);
        setEmployeesAttendanceStatus(attendanceStatusData);
      } catch (error) {
        console.error('Chyba pri načítaní zamestnancov s dochádzkou:', error);
        setEmployeesAttendanceStatus([]);
      }

    } catch (error) {
      console.error('Chyba pri načítaní HR dát:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Funkcia na aktualizáciu dochádzkových dát
  const refreshAttendanceData = useCallback(async () => {
    try {
      setIsRefreshingAttendance(true);
      
      // Aktualizácia štatistík
      const statsData = await hrService.getHRStats(companyId);
      setStats(statsData);

      // Aktualizácia prítomných zamestnancov dnes
      const presentData = await hrService.getPresentEmployeesToday(companyId);
      setPresentEmployeesToday(presentData);

      // Aktualizácia neprítomných zamestnancov dnes
      const absentData = await hrService.getAbsentEmployeesToday(companyId);
      setAbsentEmployeesToday(absentData);

      setLastAttendanceUpdate(new Date());
    } catch (error) {
      console.error('Chyba pri aktualizácii dochádzkových dát:', error);
    } finally {
      setIsRefreshingAttendance(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Automatické aktualizácie dochádzkových dát každých 30 sekúnd
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAttendanceData();
    }, 30000); // 30 sekúnd

    return () => clearInterval(interval);
  }, [refreshAttendanceData]);

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setShowEmployeeModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(true);
  };

  const handleOpenPersonalCard = (employee: Employee) => {
    setSelectedEmployee(employee);
    setActiveTab('employee-cards');
  };

  const handleEmployeeSuccess = () => {
    setShowEmployeeModal(false);
    loadData();
  };

  const handleLeaveRequestSuccess = () => {
    setShowLeaveRequestModal(false);
    loadData();
  };

  const handleApproveLeaveRequest = async (requestId: number) => {
    try {
      await hrService.updateLeaveRequestStatus(requestId, 'approved', 1); // TODO: použiť skutočné ID schvaľovateľa
      loadData(); // Obnoviť dáta
      alert('Žiadosť o dovolenku bola schválená');
    } catch (error) {
      console.error('Chyba pri schvaľovaní dovolenky:', error);
      alert('Chyba pri schvaľovaní dovolenky');
    }
  };

  // Funkcia na získanie stavu zmien pre zamestnanca
  const getEmployeeChangeStatus = (employeeId: number) => {
    const pendingChanges = employeeChanges.filter(c => 
      c.employee_id === employeeId && 
      c.status === 'pending'
    );
    
    if (pendingChanges.length > 0) {
      return {
        hasPendingChanges: true,
        pendingCount: pendingChanges.length,
        latestChange: pendingChanges.reduce((latest, current) => 
          (current.id > latest.id) ? current : latest
        )
      };
    }
    
    return {
      hasPendingChanges: false,
      pendingCount: 0,
      latestChange: null
    };
  };

  // Funkcia na kontrolu, či má nejaký zamestnanec pending zmeny
  const hasAnyPendingChanges = () => {
    const pendingChanges = employeeChanges.filter(c => c.status === 'pending');
    return pendingChanges.length > 0;
  };

  // Funkcia na získanie počtu zamestnancov s pending zmenami
  const getEmployeesWithPendingChangesCount = () => {
    const employeesWithChanges = new Set(
      employeeChanges
        .filter(c => c.status === 'pending')
        .map(c => c.employee_id)
    );
    return employeesWithChanges.size;
  };

  const handleRejectLeaveRequest = async (requestId: number) => {
    try {
      await hrService.updateLeaveRequestStatus(requestId, 'rejected', 1); // TODO: použiť skutočné ID schvaľovateľa
      loadData(); // Obnoviť dáta
      alert('Žiadosť o dovolenku bola zamietnutá');
    } catch (error) {
      console.error('Chyba pri zamietaní dovolenky:', error);
      alert('Chyba pri zamietaní dovolenky');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCreateAutomaticAttendance = async () => {
    try {
              const today = formatDate(new Date());
      const result = await hrService.createAutomaticAttendance(companyId, today);
      
      if (result.results && result.results.length > 0) {
        const successCount = result.results.filter(r => r.success).length;
        const errorCount = result.results.length - successCount;
        
        let message = `Automatická dochádzka vytvorená!\n\n`;
        message += `✅ Úspešne vytvorená: ${successCount} zamestnancov\n`;
        if (errorCount > 0) {
          message += `❌ Chyby: ${errorCount} zamestnancov\n`;
          message += `(Dochádzka už existuje alebo nastala chyba)`;
        }
        
        alert(message);
      } else {
        alert('Žiadni zamestnanci s automatickou dochádzkou');
      }
      
      loadData(); // Obnoviť dáta
    } catch (error) {
      console.error('Chyba pri vytváraní automatickej dochádzky:', error);
      alert('Chyba pri vytváraní automatickej dochádzky');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Načítavam HR dashboard..." />
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {activeSection === 'overview' && (
        <>
          {/* Štatistiky */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              className={`bg-white dark:bg-dark-800 rounded-lg shadow p-6 border-l-4 ${
                hasAnyPendingChanges() ? 'border-red-500 hover:shadow-lg cursor-pointer' : 'border-blue-500 hover:shadow-lg cursor-pointer'
              } transition-all duration-200`}
              title={hasAnyPendingChanges() ? 
                `⚠️ Pozor - Čakajúce zmeny údajov

${getEmployeesWithPendingChangesCount()} ${getEmployeesWithPendingChangesCount() === 1 ? 'zamestnanec má' : 'zamestnanci majú'} nepotvrdené zmeny údajov.

Kliknite pre zobrazenie zoznamu zamestnancov.` : 
                'Celkový počet zamestnancov vo firme. Kliknite pre zobrazenie zoznamu zamestnancov.'}
              onClick={() => setActiveTab('employees')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${
                    hasAnyPendingChanges() 
                      ? 'bg-red-100 dark:bg-red-900' 
                      : 'bg-blue-100 dark:bg-blue-900'
                  }`}>
                    <UsersIcon className={`w-6 h-6 ${
                      hasAnyPendingChanges() 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-blue-600 dark:text-blue-400'
                    }`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Celkovo zamestnancov</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.employees.total_employees || 0}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Aktívnych: {stats?.employees.active_employees || 0}</span>
                      {hasAnyPendingChanges() && (
                        <span className="text-red-600 dark:text-red-400 animate-pulse" style={{ animationDuration: '0.5s' }}>
                          Zmena: {getEmployeesWithPendingChangesCount()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setActiveSection('present-today')}
              className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 border-l-4 border-green-500 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left w-full"
            >
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Prítomní dnes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{presentEmployeesToday.length}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Meškanie: {presentEmployeesToday.filter(emp => emp.status === 'late').length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Kliknite pre zobrazenie</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('leave')}
              className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left w-full"
            >
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Čakajúce dovolenky</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.leave_requests.pending_leave_requests || 0}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Na schválenie</p>
                  <p className="text-xs text-yellow-600 mt-1">Kliknite pre zobrazenie</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => setActiveSection('automatic-attendance')}
              className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 border-l-4 border-purple-500 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left w-full"
            >
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Automatická dochádzka</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">⚡</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Prepočítať dochádzku</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => setActiveSection('absent-today')}
              className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 border-l-4 border-orange-500 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left w-full"
            >
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <ExclamationTriangleIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Neprítomní dnes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{absentEmployeesToday.length}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Dovolenka, PN, Absencia
                  </p>
                  <p className="text-xs text-orange-600 mt-1">Kliknite pre zobrazenie</p>
                </div>
              </div>
            </button>
          </div>

          {/* Rýchle akcie */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Rýchle akcie</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={handleAddEmployee}
                className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <UserPlusIcon className="w-6 h-6 text-gray-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">Pridať zamestnanca</span>
              </button>
              <button 
                onClick={() => setShowAttendanceRecordModal(true)}
                className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <ClockIcon className="w-6 h-6 text-gray-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">Zaznamenať dochádzku</span>
              </button>
              <button 
                onClick={() => setActiveSection('select-employee-for-leave')}
                className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <CalendarIcon className="w-6 h-6 text-gray-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">Žiadosť o dovolenku</span>
              </button>
            </div>
          </div>

          {/* Posledné aktivity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Najnovší zamestnanci</h3>
              <div className="space-y-3">
                {employees.slice(0, 5).map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{employee.position}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      employee.status === 'active' 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {hrService.getStatusLabel(employee.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Čakajúce dovolenky</h3>
              <div className="space-y-3">
                {leaveRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.first_name} {request.last_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {hrService.getLeaveTypeLabel(request.leave_type)} • {request.total_days} dní
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                      Čaká
                    </span>
                  </div>
                ))}
                {leaveRequests.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Žiadne čakajúce žiadosti o dovolenku
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'present-today' && (
        <div className="space-y-6">
          {/* Header pre prítomných dnes */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Prítomní zamestnanci dnes</h2>
              <p className="text-gray-600 dark:text-gray-300">Zamestnanci, ktorí sú dnes v práci</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={refreshAttendanceData}
                className="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Aktualizovať
              </button>
              <button
                onClick={() => setActiveSection('overview')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-600"
              >
                Späť na prehľad
              </button>
            </div>
          </div>

          {/* Zoznam prítomných zamestnancov */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Prítomní dnes ({presentEmployeesToday.length})</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  {isRefreshingAttendance && (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Aktualizuje sa...</span>
                    </div>
                  )}
                  <span>Posledná aktualizácia: {lastAttendanceUpdate.toLocaleTimeString('sk-SK')}</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                <thead className="bg-gray-50 dark:bg-dark-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Zamestnanec
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Pozícia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Príchod
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                  {presentEmployeesToday.length > 0 ? (
                    presentEmployeesToday.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{employee.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {employee.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {employee.check_in ? new Date(employee.check_in).toLocaleTimeString('sk-SK', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            employee.status === 'late' 
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          }`}>
                            {employee.status === 'late' ? 'Meškanie' : 'Prítomný'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        Žiadni prítomní zamestnanci dnes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {activeSection === 'absent-today' && (
        <div className="space-y-6">
          {/* Header pre neprítomných dnes */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Neprítomní zamestnanci dnes</h2>
              <p className="text-gray-600 dark:text-gray-300">Zamestnanci na dovolenke, PN, absencii alebo iných dôvodoch</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={refreshAttendanceData}
                className="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Aktualizovať
              </button>
              <button
                onClick={() => setActiveSection('overview')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-600"
              >
                Späť na prehľad
              </button>
            </div>
          </div>

          {/* Zoznam ospravedlnených zamestnancov */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Neprítomní dnes ({absentEmployeesToday.length})</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  {isRefreshingAttendance && (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Aktualizuje sa...</span>
                    </div>
                  )}
                  <span>Posledná aktualizácia: {lastAttendanceUpdate.toLocaleTimeString('sk-SK')}</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                <thead className="bg-gray-50 dark:bg-dark-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Zamestnanec
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Pozícia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Dôvod
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Obdobie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                  {absentEmployeesToday.length > 0 ? (
                    absentEmployeesToday.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{employee.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {employee.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {employee.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {employee.period || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            employee.reason === 'Dovolenka' 
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                              : employee.reason === 'PN'
                              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              : employee.reason === 'Pracovný pokoj'
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                              : employee.reason === 'Absencia'
                              ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          }`}>
                            {employee.reason}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        Žiadni neprítomní zamestnanci dnes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

    </div>
  );

  const renderEmployees = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Zamestnanci</h2>
        <button 
          onClick={handleAddEmployee}
          className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Pridať zamestnanca
        </button>
      </div>

      {/* Informačný box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Informácia o správe zamestnancov
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>• <strong>Zamestnanci:</strong> Tu pridávate základné údaje a vytvárate prihlasovacie účty</p>
              <p>• <strong>Karty zamestnancov:</strong> Tu dopĺňate detailné personálne údaje pre registrovaných zamestnancov</p>
              <p>• <strong>Pracovné pomery:</strong> Tu vytvárate pracovné pomery pre vybraných zamestnancov</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Zamestnanec
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Pozícia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Dátum nástupu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Typ dochádzky
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Akcie
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {employee.first_name} {employee.last_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {employee.employee_id || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {employee.position || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900 dark:text-white">{employee.email}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{employee.phone || 'Bez telefónu'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {employee.employment_start_date ? new Date(employee.employment_start_date).toLocaleDateString('sk-SK') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      employee.attendance_mode === 'automatic'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : employee.attendance_mode === 'manual'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                    }`}>
                      {employee.attendance_mode === 'automatic' ? 'Automatická' : 
                       employee.attendance_mode === 'manual' ? 'Manuálna' : 'Nenastavené'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      employee.status === 'active' 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : employee.status === 'inactive'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {hrService.getStatusLabel(employee.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditEmployee(employee)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center"
                        title="Upraviť základné údaje"
                      >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Upraviť
                      </button>
                      <button 
                        onClick={() => handleOpenPersonalCard(employee)}
                        className={`${
                          (() => {
                            const changeStatus = getEmployeeChangeStatus(employee.id);
                            if (changeStatus.hasPendingChanges) {
                              return 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300';
                            }
                            return 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300';
                          })()
                        } flex items-center`}
                        title={(() => {
                          const changeStatus = getEmployeeChangeStatus(employee.id);
                          if (changeStatus.hasPendingChanges) {
                            return `🔄 Zamestnanec má ${changeStatus.pendingCount} čakajúcich zmien údajov

📝 Posledná zmena: ${changeStatus.latestChange?.field_name}
🆕 Nová hodnota: ${changeStatus.latestChange?.new_value}

Kliknite pre zobrazenie personal card a schválenie zmien.`;
                          }
                          return 'Kliknite pre zobrazenie personal card';
                        })()}
                      >
                        <DocumentTextIcon className="w-4 h-4 mr-1" />
                        Personal Card
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {employees.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Žiadni zamestnanci</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dochádzka</h2>
        <button 
          onClick={() => setShowAttendanceRecordModal(true)}
          className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Zaznamenať dochádzku
        </button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Dochádzka dnes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Prítomní</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{presentEmployeesToday.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Neprítomní</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{absentEmployeesToday.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Meškanie</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{presentEmployeesToday.filter(emp => emp.status === 'late').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Zoznam všetkých aktívnych zamestnancov */}
        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Všetci aktívni zamestnanci dnes</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Zamestnanec
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pozícia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Typ dochádzky
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status dnes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Príchod
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Odchod
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                {employeesAttendanceStatus.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div>
                        <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                        <div className="text-gray-500 dark:text-gray-400">{employee.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {employee.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        employee.attendance_mode === 'automatic'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          : employee.attendance_mode === 'manual'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                      }`}>
                        {employee.attendance_mode === 'automatic' ? 'Automatická' : 
                         employee.attendance_mode === 'manual' ? 'Manuálna' : 'Nenastavené'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          employee.status_type === 'present' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : employee.status_type === 'late'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            : employee.status_type === 'absent'
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            : employee.status_type === 'leave'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : employee.status_type === 'holiday'
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                            : employee.status_type === 'weekend'
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                        }`}>
                          {employee.status_type === 'present' ? 'Prítomný' :
                           employee.status_type === 'late' ? 'Meškanie' :
                           employee.status_type === 'absent' ? 'Absencia' :
                           employee.status_type === 'leave' ? 'Dovolenka/PN' :
                           employee.status_type === 'holiday' ? 'Pracovný pokoj' :
                           employee.status_type === 'weekend' ? 'Pracovný pokoj' :
                           employee.status_type}
                        </span>
                        {employee.status_description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {employee.status_description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {employee.status_type === 'present' || employee.status_type === 'late' 
                        ? (employee.check_in ? formatTime(employee.check_in) : '-')
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {employee.status_type === 'present' || employee.status_type === 'late'
                        ? (employee.check_out ? formatTime(employee.check_out) : '-')
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );



  return (
    <div className="space-y-6">
      {/* Header */}
      {activeSection !== 'automatic-attendance' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HR Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">Správa ľudských zdrojov a dochádzky</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      {activeSection !== 'automatic-attendance' && (
        <nav className="bg-white dark:bg-dark-800 shadow rounded-lg">
          <div className="px-4">
            <div className="flex space-x-8">
              {[
                { id: 'overview', name: 'Prehľad', icon: DocumentTextIcon },
                { id: 'employees', name: 'Zamestnanci', icon: UsersIcon },
                { id: 'attendance', name: 'Dochádzka', icon: ClockIcon },
                { id: 'attendance-overview', name: 'Prehľad dochádzky', icon: ChartBarIcon },
                { id: 'leave', name: 'Dovolenky', icon: CalendarIcon },
                { id: 'employee-cards', name: 'Karty zamestnancov', icon: DocumentTextIcon },
                { id: 'employment-relations', name: 'Pracovné pomery', icon: BriefcaseIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Content */}
      <div className="mt-6">
        {activeSection === 'automatic-attendance' ? (
          <AutomaticAttendancePage 
            companyId={companyId}
            onBack={() => setActiveSection('overview')}
          />
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'employees' && renderEmployees()}
            {activeTab === 'attendance' && renderAttendance()}
            {activeTab === 'attendance-overview' && (
              <AttendanceOverview
                companyId={companyId}
                isCompanyView={true}
              />
            )}
            {activeTab === 'leave' && (
              <div className="space-y-6">
                {activeSection === 'overview' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Správa dovoleniek</h2>
                        <p className="text-gray-600 dark:text-gray-300">Spravujte žiadosti o dovolenku</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button 
                        onClick={() => setActiveSection('leave-requests')}
                        className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-all duration-200 text-left"
                      >
                        <div className="flex items-center">
                          <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div className="ml-4">
                            <p className="text-lg font-medium text-gray-900 dark:text-white">Čakajúce žiadosti</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {stats?.leave_requests.pending_leave_requests || 0} žiadostí čaká na schválenie
                            </p>
                          </div>
                        </div>
                      </button>

                      <button 
                        onClick={() => setActiveSection('select-employee-for-leave')}
                        className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 border-l-4 border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
                      >
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <PlusIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="ml-4">
                            <p className="text-lg font-medium text-gray-900 dark:text-white">Nová žiadosť</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Vytvoriť žiadosť o dovolenku za zamestnanca
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </>
                )}

                {activeSection === 'select-employee-for-leave' && (
                  <div className="space-y-6">
                    {/* Header pre výber zamestnanca */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vytvoriť žiadosť o dovolenku</h2>
                        <p className="text-gray-600 dark:text-gray-300">Vyberte zamestnanca, za ktorého chcete vytvoriť žiadosť o dovolenku</p>
                      </div>
                      <button
                        onClick={() => setActiveSection('overview')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-600"
                      >
                        Späť na prehľad
                      </button>
                    </div>

                    {/* Zoznam zamestnancov */}
                    <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Zamestnanci</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                          <thead className="bg-gray-50 dark:bg-dark-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Zamestnanec
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Pozícia
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Akcie
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                            {employees.map((employee) => (
                              <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {employee.first_name} {employee.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{employee.email}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {employee.position}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    employee.status === 'active' 
                                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                      : employee.status === 'inactive'
                                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                  }`}>
                                    {hrService.getStatusLabel(employee.status)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button 
                                    onClick={() => {
                                      setSelectedEmployeeForLeave(employee);
                                      setShowLeaveRequestModal(true);
                                      setActiveSection('overview');
                                    }}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium"
                                  >
                                    Vytvoriť žiadosť
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {employees.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">Žiadni zamestnanci</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === 'leave-requests' && (
                  <div className="space-y-6">
                    {/* Header pre čakajúce žiadosti */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Čakajúce žiadosti o dovolenku</h2>
                        <p className="text-gray-600 dark:text-gray-300">Žiadosti čakajúce na schválenie</p>
                      </div>
                      <button
                        onClick={() => setActiveSection('overview')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-600"
                      >
                        Späť na prehľad
                      </button>
                    </div>

                    {/* Filtrované žiadosti - len čakajúce */}
                    <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Žiadosti čakajúce na schválenie</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                          <thead className="bg-gray-50 dark:bg-dark-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Zamestnanec
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Typ
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Obdobie
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Dní
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Akcie
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                            {leaveRequests.filter(request => request.status === 'pending').map((request) => (
                              <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {request.first_name} {request.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{request.employee_id_code}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {hrService.getLeaveTypeLabel(request.leave_type)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  <div>
                                    <div>{hrService.formatDate(request.start_date)}</div>
                                    <div className="text-gray-500 dark:text-gray-400">do {hrService.formatDate(request.end_date)}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {request.total_days} dní
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button 
                                      onClick={() => handleApproveLeaveRequest(request.id)}
                                      className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 font-medium"
                                    >
                                      Schváliť
                                    </button>
                                    <button 
                                      onClick={() => handleRejectLeaveRequest(request.id)}
                                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium"
                                    >
                                      Zamietnuť
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {leaveRequests.filter(request => request.status === 'pending').length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">Žiadne čakajúce žiadosti o dovolenku</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'employee-cards' && (
              <EmployeeCardPage 
                userEmail="admin@portal.sk" 
                companyId={companyId}
                onBack={() => setActiveTab('overview')} 
                selectedEmployeeId={selectedEmployee?.id}
              />
            )}
            {activeTab === 'employment-relations' && (
              <EmploymentRelationsPage 
                companyId={companyId} 
                userEmail="admin@portal.sk" 
                onBack={() => setActiveTab('overview')} 
              />
            )}
          </>
        )}
      </div>

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        employee={selectedEmployee}
        companyId={companyId}
        onSuccess={handleEmployeeSuccess}
      />

      {/* Leave Request Modal */}
      <LeaveRequestModal
        isOpen={showLeaveRequestModal}
        onClose={() => setShowLeaveRequestModal(false)}
        companyId={companyId}
        employeeId={selectedEmployeeForLeave?.id || 0}
        employeeName={selectedEmployeeForLeave ? `${selectedEmployeeForLeave?.first_name} ${selectedEmployeeForLeave?.last_name}` : 'Nezvolený zamestnanec'}
        onSuccess={handleLeaveRequestSuccess}
      />

      {/* Attendance Record Modal */}
      <AttendanceRecordModal
        isOpen={showAttendanceRecordModal}
        onClose={() => setShowAttendanceRecordModal(false)}
        companyId={companyId}
        onSuccess={() => {
          setShowAttendanceRecordModal(false);
          loadData();
        }}
      />
    </div>
  );
};

export default HRDashboard;
