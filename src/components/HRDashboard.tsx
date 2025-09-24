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
  ChartBarIcon,
  BanknotesIcon
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
import { payrollService } from '../services/payrollService';
import PayslipDetailModal from './PayslipDetailModal';

// Helper funkcia pre lokA?lne formA?tovanie dA?tumu
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper funkcia pre formA?tovanie �Tasu
const formatTime = (timeString: string | null): string => {
  if (!timeString) return '-';
  
  try {
    // Ak je to uLl �Tas v formA?te HH:MM, vrA?LA ho
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }
    
    // Ak je to dA?tum, skAss ho spracovaLA
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
    console.error('Chyba pri formA?tovanA� �Tasu:', timeString, error);
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
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'attendance' | 'leave' | 'employee-cards' | 'employment-relations' | 'attendance-overview' | 'payslips'>('overview');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeFilter, setEmployeeFilter] = useState<'all' | 'active' | 'inactive' | 'terminated' | 'on_leave'>('all');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(new Set());
  const [showLeaveRequestModal, setShowLeaveRequestModal] = useState(false);
  const [selectedEmployeeForLeave, setSelectedEmployeeForLeave] = useState<Employee | null>(null);
  const [showAttendanceRecordModal, setShowAttendanceRecordModal] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'leave-requests' | 'automatic-attendance' | 'select-employee-for-leave' | 'present-today' | 'absent-today'>('overview');

  // VA?platnA� pA?sky (firma) �?" filtre a stav
  const [payslipsYear, setPayslipsYear] = useState<number>(new Date().getFullYear());
  const [payslipsMonth, setPayslipsMonth] = useState<number | ''>('');
  const [payslipsEmployeeId, setPayslipsEmployeeId] = useState<number | 'all'>('all');
  const [payslipsLoading, setPayslipsLoading] = useState(false);
  const [payslipsRows, setPayslipsRows] = useState<Array<{
    employeeId: number;
    name: string;
    month?: number;
    gross?: number;
    net?: number;
    settlement?: number;
    workedDays?: number;
    workedHours?: number;
    socialInsurance?: number;
    healthInsurance?: number;
  }>>([]);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [payslipModalEmployeeId, setPayslipModalEmployeeId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Na�TA�tanie L?tatistA�k
      const statsData = await hrService.getHRStats(companyId);
      console.log('HR Stats:', statsData);
      setStats(statsData);

      // Na�TA�tanie zamestnancov
      const employeesData = await hrService.getEmployees(companyId);
      setEmployees(employeesData);

      // Na�TA�tanie LliadostA� o dovolenku
      const leaveData = await hrService.getLeaveRequests(companyId);
      console.log('VL?etky Lliadosti o dovolenku:', leaveData);
      console.log('�SakajAsce Lliadosti:', statsData?.leave_requests?.pending_leave_requests);
      console.log('Po�Tet vL?etkA?ch LliadostA�:', leaveData.length);
      setLeaveRequests(leaveData);

      // Na�TA�tanie zmien zamestnancov
      const changesData = await hrService.getCompanyChanges(companyId);
      setEmployeeChanges(changesData);

      // Na�TA�tanie prA�tomnA?ch zamestnancov dnes
      try {
        const presentData = await hrService.getPresentEmployeesToday(companyId);
        setPresentEmployeesToday(presentData);
      } catch (error) {
        console.error('Chyba pri na�TA�tanA� prA�tomnA?ch zamestnancov:', error);
        setPresentEmployeesToday([]);
      }

      // Na�TA�tanie neprA�tomnA?ch zamestnancov dnes
      try {
        const absentData = await hrService.getAbsentEmployeesToday(companyId);
        setAbsentEmployeesToday(absentData);
      } catch (error) {
        console.error('Chyba pri na�TA�tanA� neprA�tomnA?ch zamestnancov:', error);
        setAbsentEmployeesToday([]);
      }

      // Na�TA�tanie vL?etkA?ch aktA�vnych zamestnancov s dochA?dzkou
      try {
        const attendanceStatusData = await hrService.getEmployeesAttendanceStatus(companyId);
        setEmployeesAttendanceStatus(attendanceStatusData);
      } catch (error) {
        console.error('Chyba pri na�TA�tanA� zamestnancov s dochA?dzkou:', error);
        setEmployeesAttendanceStatus([]);
      }

    } catch (error) {
      console.error('Chyba pri na�TA�tanA� HR dA?t:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Funkcia na aktualizA?ciu dochA?dzkovA?ch dA?t
  const refreshAttendanceData = useCallback(async () => {
    try {
      setIsRefreshingAttendance(true);
      
      // AktualizA?cia L?tatistA�k
      const statsData = await hrService.getHRStats(companyId);
      setStats(statsData);

      // AktualizA?cia prA�tomnA?ch zamestnancov dnes
      const presentData = await hrService.getPresentEmployeesToday(companyId);
      setPresentEmployeesToday(presentData);

      // AktualizA?cia neprA�tomnA?ch zamestnancov dnes
      const absentData = await hrService.getAbsentEmployeesToday(companyId);
      setAbsentEmployeesToday(absentData);

      setLastAttendanceUpdate(new Date());
    } catch (error) {
      console.error('Chyba pri aktualizA?cii dochA?dzkovA?ch dA?t:', error);
    } finally {
      setIsRefreshingAttendance(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Automaticky ozna�TiLA prA�tomnA�ho zamestnanca s automatickou dochA?dzkou v aktuA?lny deL�
  useEffect(() => {
    const autoCheckInAutomaticToday = async () => {
      try {
        // ZA�skaLA zoznam zamestnancov s automatickou dochA?dzkou (obsahuje pracovnA� �Tasy)
        const automaticEmployees = await hrService.getEmployeesWithAutomaticAttendance(companyId);

        const now = new Date();
        const todayStr = formatDate(now);
        const minutesNow = now.getHours() * 60 + now.getMinutes();

        // Cez vA�kend neauto-checkovaLA
        const dayOfWeek = now.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return;
        }

        const toMinutes = (t?: string) => {
          if (!t) return null;
          const [h, m] = t.split(':');
          const hh = parseInt(h || '0', 10);
          const mm = parseInt(m || '0', 10);
          return hh * 60 + mm;
        };

        // Zostav mnoLlinu zamestnancov s aktA�vnou nahlA?senou absenciou (dovolenka/PN/O�SR...) pre dneL?ok
        const employeesWithActiveLeaveToday = new Set<number>();
        try {
          const isTodayBetween = (start: string, end: string) => {
            const s = new Date(start);
            const e = new Date(end);
            const d = new Date(todayStr + 'T00:00:00');
            s.setHours(0, 0, 0, 0);
            e.setHours(23, 59, 59, 999);
            return d >= s && d <= e;
          };
          (leaveRequests || []).forEach(req => {
            const status = (req as any).status || 'pending';
            if ((status === 'approved' || status === 'pending') && isTodayBetween((req as any).start_date, (req as any).end_date)) {
              employeesWithActiveLeaveToday.add((req as any).employee_id);
            }
          });
        } catch (_) {}

        for (const emp of automaticEmployees) {
          const status = employeesAttendanceStatus.find(e => e.id === emp.id);
          // Presko�TiLA ak uLl mA? status prA�tomnA?/meL?kA? alebo je vA�kend/sviatok/dovolenka/PN/absencia
          if (
            status && (
              status.status_type === 'present' ||
              status.status_type === 'late' ||
              (status as any).is_weekend ||
              (status as any).is_holiday ||
              status.status_type === 'leave' ||
              status.status_type === 'absent'
            )
          ) {
            continue;
          }

          // Presko�TiLA ak mA? aktA�vnu nahlA?senAs absenciu (dovolenka/PN/O�SR) dnes
          if (employeesWithActiveLeaveToday.has(emp.id)) {
            continue;
          }

          const startM = toMinutes(emp.work_start_time);
          const endM = toMinutes(emp.work_end_time);
          if (startM == null || endM == null) continue;

          // Mimo pracovnA�ho �Tasu neozna�TovaLA
          if (minutesNow < startM || minutesNow > endM) continue;

          const flagKey = `auto_checked_in_${emp.id}_${todayStr}`;
          if (localStorage.getItem(flagKey) === 'true') continue;

          // OveriLA, �Ti uLl dnes nemA? zA?znam
          const records = await hrService.getAttendance(companyId, emp.id, todayStr, todayStr);
          if (Array.isArray(records) && records.length > 0) {
            localStorage.setItem(flagKey, 'true');
            continue;
          }

          // ZaznamenaLA rA?chly prA�chod teraz
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          await hrService.addAttendance({
            employee_id: emp.id,
            company_id: companyId,
            date: todayStr,
            check_in: `${todayStr}T${hh}:${mm}:00`,
            check_out: null as any,
            total_hours: 0,
            break_minutes: 0,
            status: 'present',
            notes: 'AutomatickA? prA�chod (v rA?mci pracovnA?ch hodA�n)'
          } as any);

          localStorage.setItem(flagKey, 'true');
        }

        // Po automatickom prA�chode obnoviLA dneL?nA� preh�lady
        await refreshAttendanceData();
      } catch (e) {
        // Ticho ignorovaLA �?" nech to neblokuje UI
        console.warn('Auto check-in skipped:', e);
      }
    };

    // SpustiLA len ke�Z mA?me na�TA�tanA� dneL?nA� statusy a Lliadosti o dovolenku
    if (employeesAttendanceStatus && employeesAttendanceStatus.length > 0) {
      autoCheckInAutomaticToday();
    }
  }, [companyId, employeesAttendanceStatus, leaveRequests, refreshAttendanceData]);

  // AutomatickA� aktualizA?cie dochA?dzkovA?ch dA?t kaLldA?ch 30 sekAsnd
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAttendanceData();
    }, 30000); // 30 sekAsnd

    return () => clearInterval(interval);
  }, [refreshAttendanceData]);

  // Na�TA�tanie vA?platnA?ch pA?sok pod�la filtrov (firma)
  useEffect(() => {
    const loadPayslips = async () => {
      if (activeTab !== 'payslips') return;
      setPayslipsLoading(true);
      try {
        const targetEmployees = payslipsEmployeeId === 'all'
          ? employees
          : employees.filter(e => e.id === payslipsEmployeeId);

        const rows: Array<{
          employeeId: number; name: string; month?: number; gross?: number; net?: number; settlement?: number; workedDays?: number; workedHours?: number; socialInsurance?: number; healthInsurance?: number;
        }> = [];

        if (payslipsMonth) {
          await Promise.all(targetEmployees.map(async (emp) => {
            try {
              const detail = await payrollService.getPayslipDetail(companyId, emp.id, payslipsYear, payslipsMonth as number);
              const p = detail.payslip || {};
              rows.push({
                employeeId: emp.id,
                name: `${emp.first_name} ${emp.last_name}`,
                month: payslipsMonth as number,
                gross: p.grossWage || 0,
                net: p.netWage || 0,
                settlement: p.settlement || 0,
                workedDays: p.workedDays || 0,
                workedHours: p.workedHours || 0,
                socialInsurance: p.socialInsurance || 0,
                healthInsurance: p.healthInsurance || 0,
              });
            } catch (_) {}
          }));
        } else {
          await Promise.all(targetEmployees.map(async (emp) => {
            try {
              const data = await payrollService.getPayslips(companyId, emp.id, payslipsYear);
              rows.push({
                employeeId: emp.id,
                name: `${emp.first_name} ${emp.last_name}`,
                gross: data.summary?.totalGross || 0,
                net: data.summary?.totalNet || 0,
                settlement: data.summary?.totalSettlement || 0,
                workedDays: data.summary?.totalWorkedDays || 0,
                workedHours: data.summary?.totalWorkedHours || 0,
                socialInsurance: data.summary?.totalSocialInsurance || 0,
                healthInsurance: data.summary?.totalHealthInsurance || 0,
              });
            } catch (_) {}
          }));
        }

        rows.sort((a, b) => a.name.localeCompare(b.name, 'sk'));
        setPayslipsRows(rows);
      } finally {
        setPayslipsLoading(false);
      }
    };
    loadPayslips();
  }, [activeTab, payslipsYear, payslipsMonth, payslipsEmployeeId, employees, companyId]);

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
  // Filtrovanie a vA?ber zamestnancov
  const filteredEmployees = employees.filter(e => {
    const byStatus = employeeFilter === 'all' ? true : e.status === employeeFilter;
    const term = employeeSearch.trim().toLowerCase();
    const bySearch = term === '' || [
      e.first_name, e.last_name, e.email, e.position, e.employee_id
    ].filter(Boolean).some(v => String(v).toLowerCase().includes(term));
    return byStatus && bySearch;
  });

  const toggleEmployeeSelect = (id: number) => {
    setSelectedEmployeeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllVisibleEmployees = () => setSelectedEmployeeIds(new Set(filteredEmployees.map(e => e.id)));
  const clearEmployeesSelection = () => setSelectedEmployeeIds(new Set());

  const handleBulkEmployeeStatus = async (newStatus: Employee['status']) => {
    if (selectedEmployeeIds.size === 0) return;
    try {
      await Promise.all(Array.from(selectedEmployeeIds).map(id => hrService.updateEmployee(id, { status: newStatus })));
      setEmployees(prev => prev.map(e => selectedEmployeeIds.has(e.id) ? { ...e, status: newStatus } : e));
      clearEmployeesSelection();
    } catch (error) {
      console.error('Chyba pri hromadnej zmene statusu zamestnancov:', error);
      alert('Chyba pri hromadnej zmene statusu zamestnancov');
    }
  };

  const handleBulkEmployeeDelete = async () => {
    if (selectedEmployeeIds.size === 0) return;
    if (!window.confirm(`Naozaj chcete vymazaLA ${selectedEmployeeIds.size} vybranA?ch zamestnancov?`)) return;
    try {
      await Promise.all(Array.from(selectedEmployeeIds).map(id => hrService.deleteEmployee(id)));
      setEmployees(prev => prev.filter(e => !selectedEmployeeIds.has(e.id)));
      clearEmployeesSelection();
    } catch (error) {
      console.error('Chyba pri hromadnom mazanA� zamestnancov:', error);
      alert('Chyba pri hromadnom mazanA� zamestnancov');
    }
  };

  const handleEmployeeSuccess = () => {
    setShowEmployeeModal(false);
    loadData();
  };

  const handleLeaveRequestSuccess = () => {
    setShowLeaveRequestModal(false);
    loadData();
  };

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const quickCheckIn = async (employee: Employee) => {
    try {
      const date = getTodayString();
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const startTime = `${hh}:${mm}:00`;

      await hrService.addAttendance({
        employee_id: employee.id,
        company_id: companyId,
        date,
        check_in: `${date}T${startTime}`,
        check_out: null as any,
        total_hours: 0,
        break_minutes: 0,
        status: 'present',
        notes: 'RA?chly prA�chod'
      } as any);

      await refreshAttendanceData();
    } catch (error) {
      console.error('Chyba pri rA?chlom prA�chode:', error);
      alert('Chyba pri rA?chlom prA�chode');
    }
  };

  const quickCheckOut = async (employee: Employee) => {
    try {
      const date = getTodayString();
      // ZistiLA dneL?nA? zA?znam dochA?dzky pre zamestnanca
      const records = await hrService.getAttendance(companyId, employee.id, date, date);
      const todayRecord = Array.isArray(records) ? records[0] : null;
      if (!todayRecord || !todayRecord.check_in) {
        alert('Najprv je potrebnA� zaznamenaLA prA�chod.');
        return;
      }

      const checkInISO = todayRecord.check_in;
      const now = new Date();
      const checkInDate = new Date(checkInISO);
      const diffMs = now.getTime() - checkInDate.getTime();
      const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));
      const breakMinutes = 0; // volite�lne upraviLA pod�la politiky firmy
      const totalHours = Math.max(0, diffHours - breakMinutes / 60);

      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const endTime = `${hh}:${mm}:00`;

      await hrService.addAttendance({
        employee_id: employee.id,
        company_id: companyId,
        date,
        check_in: checkInISO,
        check_out: `${date}T${endTime}`,
        total_hours: Math.round(totalHours * 100) / 100,
        break_minutes: breakMinutes,
        status: 'present',
        notes: 'RA?chly odchod'
      } as any);

      await refreshAttendanceData();
    } catch (error) {
      console.error('Chyba pri rA?chlom odchode:', error);
      alert('Chyba pri rA?chlom odchode');
    }
  };

  const handleApproveLeaveRequest = async (requestId: number) => {
    try {
      await hrService.updateLeaveRequestStatus(requestId, 'approved', 1); // TODO: pouLliLA skuto�TnA� ID schva�lovate�la
      loadData(); // ObnoviLA dA?ta
      alert('L?iadosLA o dovolenku bola schvA?lenA?');
    } catch (error) {
      console.error('Chyba pri schva�lovanA� dovolenky:', error);
      alert('Chyba pri schva�lovanA� dovolenky');
    }
  };

  // Funkcia na zA�skanie stavu zmien pre zamestnanca
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

  // Funkcia na kontrolu, �Ti mA? nejakA? zamestnanec pending zmeny
  const hasAnyPendingChanges = () => {
    const pendingChanges = employeeChanges.filter(c => c.status === 'pending');
    return pendingChanges.length > 0;
  };

  // Funkcia na zA�skanie po�Ttu zamestnancov s pending zmenami
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
      await hrService.updateLeaveRequestStatus(requestId, 'rejected', 1); // TODO: pouLliLA skuto�TnA� ID schva�lovate�la
      loadData(); // ObnoviLA dA?ta
      alert('L?iadosLA o dovolenku bola zamietnutA?');
    } catch (error) {
      console.error('Chyba pri zamietanA� dovolenky:', error);
      alert('Chyba pri zamietanA� dovolenky');
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
        
        let message = `AutomatickA? dochA?dzka vytvorenA?!\n\n`;
        message += `�s. AsspeL?ne vytvorenA?: ${successCount} zamestnancov\n`;
        if (errorCount > 0) {
          message += `�tS Chyby: ${errorCount} zamestnancov\n`;
          message += `(DochA?dzka uLl existuje alebo nastala chyba)`;
        }
        
        alert(message);
      } else {
        alert('L?iadni zamestnanci s automatickou dochA?dzkou');
      }
      
      loadData(); // ObnoviLA dA?ta
    } catch (error) {
      console.error('Chyba pri vytvA?ranA� automatickej dochA?dzky:', error);
      alert('Chyba pri vytvA?ranA� automatickej dochA?dzky');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Na�TA�tavam HR dashboard..." />
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {activeSection === 'overview' && (
        <>
          {/* L�tatistiky */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              className={`bg-white dark:bg-dark-800 rounded-lg shadow p-6 border-l-4 ${
                hasAnyPendingChanges() ? 'border-red-500 hover:shadow-lg cursor-pointer' : 'border-blue-500 hover:shadow-lg cursor-pointer'
              } transition-all duration-200`}
              title={hasAnyPendingChanges() ? 
                `�s�d�Z Pozor - �SakajAsce zmeny Asdajov

${getEmployeesWithPendingChangesCount()} ${getEmployeesWithPendingChangesCount() === 1 ? 'zamestnanec mA?' : 'zamestnanci majAs'} nepotvrdenA� zmeny Asdajov.

Kliknite pre zobrazenie zoznamu zamestnancov.` : 
                'CelkovA? po�Tet zamestnancov vo firme. Kliknite pre zobrazenie zoznamu zamestnancov.'}
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
                      <span>AktA�vnych: {stats?.employees.active_employees || 0}</span>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">PrA�tomnA� dnes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{presentEmployeesToday.length}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    MeL?kanie: {presentEmployeesToday.filter(emp => emp.status === 'late').length}
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">�SakajAsce dovolenky</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.leave_requests.pending_leave_requests || 0}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Na schvA?lenie</p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">AutomatickA? dochA?dzka</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">�s?</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Prepo�TA�taLA dochA?dzku</p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">NeprA�tomnA� dnes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{absentEmployeesToday.length}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Dovolenka, PN, Absencia
                  </p>
                  <p className="text-xs text-orange-600 mt-1">Kliknite pre zobrazenie</p>
                </div>
              </div>
            </button>
          </div>

          {/* RA?chle akcie */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">RA?chle akcie</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={handleAddEmployee}
                className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <UserPlusIcon className="w-6 h-6 text-gray-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">PridaLA zamestnanca</span>
              </button>
              <button 
                onClick={() => setShowAttendanceRecordModal(true)}
                className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <ClockIcon className="w-6 h-6 text-gray-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">ZaznamenaLA dochA?dzku</span>
              </button>
              <button 
                onClick={() => setActiveSection('select-employee-for-leave')}
                className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <CalendarIcon className="w-6 h-6 text-gray-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">L?iadosLA o dovolenku</span>
              </button>
            </div>
          </div>

          {/* PoslednA� aktivity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">NajnovL?A� zamestnanci</h3>
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">�SakajAsce dovolenky</h3>
              <div className="space-y-3">
                {leaveRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.first_name} {request.last_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {hrService.getLeaveTypeLabel(request.leave_type)} �?? {request.total_days} dnA�
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                      �SakA?
                    </span>
                  </div>
                ))}
                {leaveRequests.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    L?iadne �TakajAsce Lliadosti o dovolenku
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'present-today' && (
        <div className="space-y-6">
          {/* Header pre prA�tomnA?ch dnes */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">PrA�tomnA� zamestnanci dnes</h2>
              <p className="text-gray-600 dark:text-gray-300">Zamestnanci, ktorA� sAs dnes v prA?ci</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={refreshAttendanceData}
                className="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                AktualizovaLA
              </button>
              <button
                onClick={() => setActiveSection('overview')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-600"
              >
                SpA�LA na preh�lad
              </button>
            </div>
          </div>

          {/* Zoznam prA�tomnA?ch zamestnancov */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">PrA�tomnA� dnes ({presentEmployeesToday.length})</h3>
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
                  <span>PoslednA? aktualizA?cia: {lastAttendanceUpdate.toLocaleTimeString('sk-SK')}</span>
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
                      PozA�cia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      PrA�chod
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
                            {employee.status === 'late' ? 'MeL?kanie' : 'PrA�tomnA?'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        L?iadni prA�tomnA� zamestnanci dnes
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
          {/* Header pre neprA�tomnA?ch dnes */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">NeprA�tomnA� zamestnanci dnes</h2>
              <p className="text-gray-600 dark:text-gray-300">Zamestnanci na dovolenke, PN, absencii alebo inA?ch dA�vodoch</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={refreshAttendanceData}
                className="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                AktualizovaLA
              </button>
              <button
                onClick={() => setActiveSection('overview')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-600"
              >
                SpA�LA na preh�lad
              </button>
            </div>
          </div>

          {/* Zoznam ospravedlnenA?ch zamestnancov */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">NeprA�tomnA� dnes ({absentEmployeesToday.length})</h3>
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
                  <span>PoslednA? aktualizA?cia: {lastAttendanceUpdate.toLocaleTimeString('sk-SK')}</span>
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
                      PozA�cia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      DA�vod
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
                              : employee.reason === 'PracovnA? pokoj'
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
                        L?iadni neprA�tomnA� zamestnanci dnes
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
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex items-center space-x-1">
            <span className="text-sm text-gray-500 dark:text-gray-400">VybranA�: {selectedEmployeeIds.size}</span>
            <button onClick={selectAllVisibleEmployees} className="px-3 py-2 text-sm border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600">VybraLA zobrazenA�</button>
            <button onClick={clearEmployeesSelection} className="px-3 py-2 text-sm border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600">ZruL?iLA vA?ber</button>
            <button onClick={() => handleBulkEmployeeStatus('active')} disabled={selectedEmployeeIds.size===0} className={`px-3 py-2 text-sm rounded-md ${selectedEmployeeIds.size===0?'bg-green-100 text-green-300 cursor-not-allowed':'bg-green-600 text-white hover:bg-green-700'}`}>AktA�vny</button>
            <button onClick={() => handleBulkEmployeeStatus('inactive')} disabled={selectedEmployeeIds.size===0} className={`px-3 py-2 text-sm rounded-md ${selectedEmployeeIds.size===0?'bg-gray-100 text-gray-300 cursor-not-allowed':'bg-gray-600 text-white hover:bg-gray-700'}`}>NeaktA�vny</button>
            <button onClick={() => handleBulkEmployeeStatus('terminated')} disabled={selectedEmployeeIds.size===0} className={`px-3 py-2 text-sm rounded-md ${selectedEmployeeIds.size===0?'bg-red-100 text-red-300 cursor-not-allowed':'bg-red-600 text-white hover:bg-red-700'}`}>Ukon�TenA?</button>
            <button onClick={() => handleBulkEmployeeStatus('on_leave')} disabled={selectedEmployeeIds.size===0} className={`px-3 py-2 text-sm rounded-md ${selectedEmployeeIds.size===0?'bg-yellow-100 text-yellow-300 cursor-not-allowed':'bg-yellow-600 text-white hover:bg-yellow-700'}`}>Na dovolenke</button>
            <button onClick={handleBulkEmployeeDelete} disabled={selectedEmployeeIds.size===0} className={`px-3 py-2 text-sm rounded-md ${selectedEmployeeIds.size===0?'bg-red-100 text-red-300 cursor-not-allowed':'bg-red-700 text-white hover:bg-red-800'}`}>VymazaLA vybranA?ch</button>
          </div>
          <button 
            onClick={handleAddEmployee}
            className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            PridaLA zamestnanca
          </button>
        </div>
      </div>

      {/* Informa�TnA? box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              InformA?cia o sprA?ve zamestnancov
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>�?? <strong>Zamestnanci:</strong> Tu pridA?vate zA?kladnA� Asdaje a vytvA?rate prihlasovacie As�Tty</p>
              <p>�?? <strong>Karty zamestnancov:</strong> Tu dop�sL�ate detailnA� personA?lne Asdaje pre registrovanA?ch zamestnancov</p>
              <p>�?? <strong>PracovnA� pomery:</strong> Tu vytvA?rate pracovnA� pomery pre vybranA?ch zamestnancov</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
            <button onClick={() => setEmployeeFilter('all')} className={`px-3 py-1 text-sm rounded-md ${employeeFilter==='all'?'bg-blue-600 text-white':'bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 border border-gray-300 dark:border-dark-600'}`}>VL?etci ({employees.length})</button>
            <button onClick={() => setEmployeeFilter('active')} className={`px-3 py-1 text-sm rounded-md ${employeeFilter==='active'?'bg-green-600 text-white':'bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 border border-gray-300 dark:border-dark-600'}`}>AktA�vni ({employees.filter(e=>e.status==='active').length})</button>
            <button onClick={() => setEmployeeFilter('inactive')} className={`px-3 py-1 text-sm rounded-md ${employeeFilter==='inactive'?'bg-gray-600 text-white':'bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 border border-gray-300 dark:border-dark-600'}`}>NeaktA�vni ({employees.filter(e=>e.status==='inactive').length})</button>
            <button onClick={() => setEmployeeFilter('terminated')} className={`px-3 py-1 text-sm rounded-md ${employeeFilter==='terminated'?'bg-red-600 text-white':'bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 border border-gray-300 dark:border-dark-600'}`}>Ukon�TenA� ({employees.filter(e=>e.status==='terminated').length})</button>
            <button onClick={() => setEmployeeFilter('on_leave')} className={`px-3 py-1 text-sm rounded-md ${employeeFilter==='on_leave'?'bg-yellow-600 text-white':'bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 border border-gray-300 dark:border-dark-600'}`}>Na dovolenke ({employees.filter(e=>e.status==='on_leave').length})</button>
          </div>
          <div className="mt-3 md:mt-0">
            <input
              type="text"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="H�ladaLA meno, email, pozA�ciu, ID..."
              className="w-full md:w-80 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-6 py-3">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" onChange={(e)=>{ if(e.target.checked){ selectAllVisibleEmployees(); } else { clearEmployeesSelection(); }}} />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Zamestnanec
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  PozA�cia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  DA?tum nA?stupu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Typ dochA?dzky
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  AktuA?lne
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Akcie
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={selectedEmployeeIds.has(employee.id)} onChange={()=>toggleEmployeeSelect(employee.id)} />
                  </td>
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
                      <div className="text-sm text-gray-500 dark:text-gray-400">{employee.phone || 'Bez telefAlnu'}</div>
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
                      {employee.attendance_mode === 'automatic' ? 'AutomatickA?' : 
                       employee.attendance_mode === 'manual' ? 'ManuA?lna' : 'NenastavenA�'}
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
                        title="UpraviLA zA?kladnA� Asdaje"
                      >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        UpraviLA
                      </button>
                      <button 
                        onClick={() => quickCheckIn(employee)}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        title="RA?chly prA�chod (teraz)"
                      >
                        PrA�chod
                      </button>
                      <button 
                        onClick={() => quickCheckOut(employee)}
                        className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                        title="RA?chly odchod (teraz)"
                      >
                        Odchod
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
                            return `dz"" Zamestnanec mA? ${changeStatus.pendingCount} �TakajAscich zmien Asdajov

dz"t PoslednA? zmena: ${changeStatus.latestChange?.field_name}
dz?. NovA? hodnota: ${changeStatus.latestChange?.new_value}

Kliknite pre zobrazenie personal card a schvA?lenie zmien.`;
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
            <p className="text-gray-500 dark:text-gray-400">L?iadni zamestnanci</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">DochA?dzka</h2>
        <button 
          onClick={() => setShowAttendanceRecordModal(true)}
          className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          ZaznamenaLA dochA?dzku
        </button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">DochA?dzka dnes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">PrA�tomnA�</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{presentEmployeesToday.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">NeprA�tomnA�</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{absentEmployeesToday.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">MeL?kanie</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{presentEmployeesToday.filter(emp => emp.status === 'late').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Zoznam vL?etkA?ch aktA�vnych zamestnancov */}
        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">VL?etci aktA�vni zamestnanci dnes</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Zamestnanec
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    PozA�cia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Typ dochA?dzky
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    AktuA?lne dnes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    PrA�chod
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
                        {employee.attendance_mode === 'automatic' ? 'AutomatickA?' : 
                         employee.attendance_mode === 'manual' ? 'ManuA?lna' : 'NenastavenA�'}
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
                          {employee.status_type === 'present' ? 'PrA�tomnA?' :
                           employee.status_type === 'late' ? 'MeL?kanie' :
                           employee.status_type === 'absent' ? 'Absencia' :
                           employee.status_type === 'leave' ? 'Dovolenka/PN' :
                           employee.status_type === 'holiday' ? 'PracovnA? pokoj' :
                           employee.status_type === 'weekend' ? 'PracovnA? pokoj' :
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

  const renderPayslips = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">VA?platnA� pA?sky</h2>
        <div className="flex items-center space-x-3">
          <label className="text-sm text-gray-600 dark:text-gray-300">Rok</label>
          <select
            value={payslipsYear}
            onChange={(e) => setPayslipsYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          >
            {Array.from({ length: 5 }).map((_, idx) => {
              const y = new Date().getFullYear() - idx;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
          <label className="text-sm text-gray-600 dark:text-gray-300 ml-4">Mesiac</label>
          <select
            value={String(payslipsMonth)}
            onChange={(e) => setPayslipsMonth(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          >
            <option value="">VL?etky</option>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i+1} value={i+1}>{i+1}</option>
            ))}
          </select>
          <label className="text-sm text-gray-600 dark:text-gray-300 ml-4">Zamestnanec</label>
          <select
            value={String(payslipsEmployeeId)}
            onChange={(e) => setPayslipsEmployeeId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          >
            <option value="all">VL?etci</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
            ))}
          </select>
        </div>
      </div>

      {!payslipsLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">�SistA? mzda spolu</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{payslipsRows.reduce((sum, r) => sum + (r.net || 0), 0).toFixed(2)} �,�</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">HrubA? mzda spolu</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{payslipsRows.reduce((sum, r) => sum + (r.gross || 0), 0).toFixed(2)} �,�</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300">VyplatenA� spolu</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{payslipsRows.reduce((sum, r) => sum + (r.settlement || 0), 0).toFixed(2)} �,�</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">Po�Tet zA?znamov</p>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{payslipsRows.length}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
        {payslipsLoading ? (
          <div className="p-6">Na�TA�tavam...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Zamestnanec</th>
                  {payslipsMonth && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mesiac</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">HrubA?</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">�SistA?</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">VyplatenA�</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ZP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">OdpracovanA� (dni / h)</th>
                  {payslipsMonth && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Akcie</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                {payslipsRows.map((row) => (
                  <tr key={`${row.employeeId}-${row.month || 'year'}`} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.name}</td>
                    {payslipsMonth && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.month}</td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{(row.gross || 0).toFixed(2)} �,�</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{(row.net || 0).toFixed(2)} �,�</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{(row.settlement || 0).toFixed(2)} �,�</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{(row.socialInsurance || 0).toFixed(2)} �,�</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{(row.healthInsurance || 0).toFixed(2)} �,�</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.workedDays || 0} / {row.workedHours || 0}</td>
                    {payslipsMonth && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => { setPayslipModalEmployeeId(row.employeeId); setShowPayslipModal(true); }}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Detail
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {payslipsRows.length === 0 && (
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400" colSpan={payslipsMonth ? 9 : 7}>L?iadne dA?ta pre zvolenA� filtre.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPayslipModal && payslipModalEmployeeId && payslipsMonth && (
        <PayslipDetailModal
          isOpen={showPayslipModal}
          onClose={() => setShowPayslipModal(false)}
          companyId={companyId}
          employeeId={payslipModalEmployeeId}
          year={payslipsYear}
          month={payslipsMonth as number}
        />
      )}
    </div>
  );


  return (
    <div className="space-y-6">
      {/* Header */}
      {activeSection !== 'automatic-attendance' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HR Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">SprA?va �ludskA?ch zdrojov a dochA?dzky</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      {activeSection !== 'automatic-attendance' && (
        <nav className="bg-white dark:bg-dark-800 shadow rounded-lg">
          <div className="px-4">
            <div className="flex space-x-8">
              {[
                { id: 'overview', name: 'Preh�lad', icon: DocumentTextIcon },
                { id: 'employees', name: 'Zamestnanci', icon: UsersIcon },
                { id: 'attendance', name: 'DochA?dzka', icon: ClockIcon },
                { id: 'attendance-overview', name: 'Preh�lad dochA?dzky', icon: ChartBarIcon },
                { id: 'payslips', name: 'VA?platnA� pA?sky', icon: BanknotesIcon },
                { id: 'leave', name: 'Dovolenky', icon: CalendarIcon },
                { id: 'employee-cards', name: 'Karty zamestnancov', icon: DocumentTextIcon },
                { id: 'employment-relations', name: 'PracovnA� pomery', icon: BriefcaseIcon }
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
            {activeTab === 'payslips' && renderPayslips()}
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
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">SprA?va dovoleniek</h2>
                        <p className="text-gray-600 dark:text-gray-300">Spravujte Lliadosti o dovolenku</p>
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
                            <p className="text-lg font-medium text-gray-900 dark:text-white">�SakajAsce Lliadosti</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {stats?.leave_requests.pending_leave_requests || 0} LliadostA� �TakA? na schvA?lenie
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
                            <p className="text-lg font-medium text-gray-900 dark:text-white">NovA? LliadosLA</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              VytvoriLA LliadosLA o dovolenku za zamestnanca
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </>
                )}

                {activeSection === 'select-employee-for-leave' && (
                  <div className="space-y-6">
                    {/* Header pre vA?ber zamestnanca */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">VytvoriLA LliadosLA o dovolenku</h2>
                        <p className="text-gray-600 dark:text-gray-300">Vyberte zamestnanca, za ktorA�ho chcete vytvoriLA LliadosLA o dovolenku</p>
                      </div>
                      <button
                        onClick={() => setActiveSection('overview')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-600"
                      >
                        SpA�LA na preh�lad
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
                                PozA�cia
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                AktuA?lne
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
                                    VytvoriLA LliadosLA
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {employees.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">L?iadni zamestnanci</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === 'leave-requests' && (
                  <div className="space-y-6">
                    {/* Header pre �TakajAsce Lliadosti */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">�SakajAsce Lliadosti o dovolenku</h2>
                        <p className="text-gray-600 dark:text-gray-300">L?iadosti �TakajAsce na schvA?lenie</p>
                      </div>
                      <button
                        onClick={() => setActiveSection('overview')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-600"
                      >
                        SpA�LA na preh�lad
                      </button>
                    </div>

                    {/* FiltrovanA� Lliadosti - len �TakajAsce */}
                    <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">L?iadosti �TakajAsce na schvA?lenie</h3>
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
                                DnA�
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
                                  {request.total_days} dnA�
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button 
                                      onClick={() => handleApproveLeaveRequest(request.id)}
                                      className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 font-medium"
                                    >
                                      SchvA?liLA
                                    </button>
                                    <button 
                                      onClick={() => handleRejectLeaveRequest(request.id)}
                                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium"
                                    >
                                      ZamietnuLA
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
                          <p className="text-gray-500 dark:text-gray-400">L?iadne �TakajAsce Lliadosti o dovolenku</p>
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
        employeeName={selectedEmployeeForLeave ? `${selectedEmployeeForLeave?.first_name} ${selectedEmployeeForLeave?.last_name}` : 'NezvolenA? zamestnanec'}
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

