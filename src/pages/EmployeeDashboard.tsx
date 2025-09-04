import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  CogIcon,
  BellIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { hrService, Employee, LeaveRequest, Attendance } from '../services/hrService';
import { apiService, User, Company } from '../services/apiService';
import { EmploymentRelation } from '../types/EmploymentRelation';
import LoadingSpinner from '../components/LoadingSpinner';
import AttendanceTracker from '../components/AttendanceTracker';
import AttendanceOverview from '../components/AttendanceOverview';
import LeaveRequestModal from '../components/LeaveRequestModal';
import MessagesList from '../components/MessagesList';

// Helper funkcia pre lokálne formátovanie dátumu
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface EmployeeDashboardProps {
  userEmail: string;
  userRole: string;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ userEmail, userRole }) => {
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employmentRelations, setEmploymentRelations] = useState<EmploymentRelation[]>([]);
  const [employeeChanges, setEmployeeChanges] = useState<any[]>([]);
  const [attendanceSettings, setAttendanceSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'leave' | 'employment' | 'profile' | 'messages'>('overview');
  const [showLeaveRequestModal, setShowLeaveRequestModal] = useState(false);
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
  const [selectedField, setSelectedField] = useState<string>('');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [userEmail]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Vytvorenie profilu používateľa z dostupných údajov
      const profile: User = {
        id: 0,
        email: userEmail,
        name: userEmail.split('@')[0], // Základné meno z emailu
        role: userRole as 'admin' | 'accountant' | 'user' | 'employee',
        status: 'active',
        phone: ''
      };
      setUserProfile(profile);

      // Načítanie firiem a hľadanie zamestnanca vo všetkých firmách
      const companiesData: Company[] = await apiService.getAllCompanies();

      let foundEmployee: Employee | null = null;
      let foundCompany: Company | null = null;
      const matchedCompanies: Company[] = [];

      // Hľadanie zamestnanca vo všetkých firmách
      for (const company of companiesData) {
        try {
          const employees = await hrService.getEmployees(company.id);
          const currentEmployee = employees.find(emp => emp.email === userEmail);
          
          if (currentEmployee) {
            // Nastav prvý nájdený ako primárny
            if (!foundEmployee) {
              foundEmployee = currentEmployee;
              foundCompany = company;
            }
            matchedCompanies.push(company);
          }
        } catch (error) {
          console.error(`Chyba pri načítaní zamestnancov pre firmu ${company.id}:`, error);
        }
      }

      // Pre zamestnanca zobraz len firmy, kde má väzbu; pre admin/accountant/user nechaj všetky
      if (userRole === 'employee') {
        setCompanies(matchedCompanies);
      } else {
        setCompanies(companiesData);
      }

      if (foundEmployee && foundCompany) {
        const employeeId = foundEmployee.id;
        const companyId = foundCompany.id;
        setSelectedCompany(foundCompany);
        setEmployeeData(foundEmployee);
        
        // Načítanie žiadostí o dovolenku
        const leaveData = await hrService.getLeaveRequests(companyId, undefined, employeeId);
        setLeaveRequests(leaveData);
        
        // Načítanie dochádzky za posledných 30 dní
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const attendanceData = await hrService.getAttendance(
          companyId, 
          employeeId, 
          formatDate(thirtyDaysAgo)
        );
        setAttendance(attendanceData);

        // Načítanie počtu neprečítaných správ
        await loadUnreadMessagesCount();

        // Načítanie zmien pre zamestnanca
        const changesData = await hrService.getEmployeeChanges(employeeId);
        setEmployeeChanges(changesData);

        // Načítanie dochádzkových nastavení
        try {
          const settingsData = await hrService.getAttendanceSettings(employeeId);
          setAttendanceSettings(settingsData);
        } catch (error) {
          console.error('Chyba pri načítaní dochádzkových nastavení:', error);
        }

        // Načítanie pracovných pomerov z backendu a filtrovanie podľa zamestnanca
        try {
          const relations = await hrService.getEmploymentRelations(companyId);
          const employeeRelations = Array.isArray(relations) ? relations.filter((r: any) => r.employee_id === employeeId) : [];
          setEmploymentRelations(employeeRelations);
        } catch (e) {
          console.error('Chyba pri načítaní pracovných pomerov:', e);
          setEmploymentRelations([]);
        }
      }
    } catch (error) {
      console.error('Chyba pri načítaní dát:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRequestSuccess = () => {
    loadData();
  };

  const handleChangeRequest = (fieldName: string) => {
    setSelectedField(fieldName);
    setShowChangeRequestModal(true);
  };

  const handleChangeRequestSubmit = async (requestData: { field: string; currentValue: string; newValue: string; reason: string }) => {
    try {
      if (!employeeData || !selectedCompany) {
        alert('Chyba: Chýbajú údaje o zamestnancovi alebo firme');
        return;
      }

      await hrService.createEmployeeChange({
        employee_id: employeeData.id,
        field_name: requestData.field,
        current_value: requestData.currentValue,
        new_value: requestData.newValue,
        reason: requestData.reason,
        company_id: selectedCompany.id
      });
      
      alert('Požiadavka na zmenu bola úspešne odoslaná. Zamestnávateľ ju poskytne v najbližšom čase.');
      setShowChangeRequestModal(false);
      
      // Obnoviť dáta aby sa zobrazila zmena
      await loadData();
    } catch (error) {
      console.error('Chyba pri odosielaní požiadavky:', error);
      alert('Chyba pri odosielaní požiadavky');
    }
  };

  // Načítanie počtu neprečítaných správ
  const loadUnreadMessagesCount = async () => {
    try {
      const count = await apiService.getUnreadCount(userEmail);
      setUnreadMessagesCount(count);
    } catch (error) {
      console.error('Chyba pri načítaní počtu neprečítaných správ:', error);
      setUnreadMessagesCount(0);
    }
  };

  // Funkcia na získanie stavu zmeny pre pole
  const getFieldChangeStatus = (fieldName: string) => {
    // Hľadanie najnovšej pending zmeny (podľa ID alebo created_at)
    const pendingChanges = employeeChanges.filter(c => 
      c.field_name === fieldName && 
      c.status === 'pending'
    );
    
    if (pendingChanges.length > 0) {
      // Vrátiť najnovšiu pending zmenu (s najvyšším ID)
      const latestPendingChange = pendingChanges.reduce((latest, current) => 
        (current.id > latest.id) ? current : latest
      );
      
      return {
        status: 'pending',
        reason: latestPendingChange.reason,
        changeId: latestPendingChange.id,
        newValue: latestPendingChange.new_value
      };
    }
    
    // Hľadanie najnovšej approved zmeny
    const approvedChanges = employeeChanges.filter(c => 
      c.field_name === fieldName && 
      c.status === 'approved'
    );
    
    if (approvedChanges.length > 0) {
      const latestApprovedChange = approvedChanges.reduce((latest, current) => 
        (current.id > latest.id) ? current : latest
      );
      
      return {
        status: 'approved',
        reason: latestApprovedChange.reason,
        changeId: latestApprovedChange.id,
        newValue: latestApprovedChange.new_value
      };
    }
    
    return null;
  };

  // Pomocná funkcia na konverziu hodín na formát HH:MM
  const formatHoursToTime = (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Pomocná funkcia pre získanie aktuálnej hodnoty poľa
  const getCurrentFieldValue = (fieldName: string): string => {
    if (!employeeData) return '';
    
    switch (fieldName) {
      case 'name':
        return `${employeeData.first_name} ${employeeData.last_name}`;
      case 'first_name':
        return employeeData.first_name;
      case 'last_name':
        return employeeData.last_name;
      case 'birth_name':
        return employeeData.birth_name || '';
      case 'title_before':
        return employeeData.title_before || '';
      case 'title_after':
        return employeeData.title_after || '';
      case 'gender':
        return employeeData.gender || '';
      case 'birth_place':
        return employeeData.birth_place || '';
      case 'citizenship':
        return employeeData.citizenship || '';
      case 'marital_status':
        return employeeData.marital_status || '';
      case 'permanent_street':
        return employeeData.permanent_street || '';
      case 'permanent_number':
        return employeeData.permanent_number || '';
      case 'permanent_city':
        return employeeData.permanent_city || '';
      case 'permanent_zip':
        return employeeData.permanent_zip || '';
      case 'permanent_country':
        return employeeData.permanent_country || '';
      case 'contact_street':
        return employeeData.contact_street || '';
      case 'contact_number':
        return employeeData.contact_number || '';
      case 'contact_city':
        return employeeData.contact_city || '';
      case 'contact_zip':
        return employeeData.contact_zip || '';
      case 'contact_country':
        return employeeData.contact_country || '';
      case 'email':
        return employeeData.email;
      case 'phone':
        return employeeData.phone || '';
      case 'birth_date':
        return employeeData.birth_date ? new Date(employeeData.birth_date).toLocaleDateString('sk-SK') : '';
      case 'birth_number':
        return employeeData.birth_number || '';
      case 'permanent_address':
        return employeeData.permanent_street ? 
          `${employeeData.permanent_street} ${employeeData.permanent_number}, ${employeeData.permanent_zip} ${employeeData.permanent_city}` : '';
      case 'contact_address':
        return employeeData.contact_street ? 
          `${employeeData.contact_street} ${employeeData.contact_number}, ${employeeData.contact_zip} ${employeeData.contact_city}` : '';
      case 'nationality':
        return employeeData.nationality || '';
      case 'education':
        return employeeData.education || '';
      case 'position':
        return employeeData.position;
      case 'department':
        return employeeData.department || '';
      case 'employment_type':
        return hrService.getEmploymentTypeLabel(employeeData.employment_type);
      case 'employment_relation':
        return 'Pracovný pomer';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Načítavam dashboard..." />
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Zamestnanec nenájdený
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Vaše údaje nie sú v systéme zamestnancov. Kontaktujte administrátora.
        </p>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Vitajte sekcia */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Vitajte, {employeeData.first_name}!
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {employeeData.position} • {selectedCompany?.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Dnes je</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {new Date().toLocaleDateString('sk-SK', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Štatistiky */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 border-l-4 border-blue-500 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveTab('attendance')}
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <ClockIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Odpracované hodiny</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatHoursToTime(attendance.reduce((sum, att) => sum + (att.total_hours || 0), 0))}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Posledných 30 dní</p>
            </div>
          </div>
        </div>

        <div 
          className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 border-l-4 border-green-500 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveTab('leave')}
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Dovolenky</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {leaveRequests.filter(req => req.status === 'approved').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Schválené</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <BellIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Čakajúce žiadosti</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {leaveRequests.filter(req => req.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Na schválenie</p>
            </div>
          </div>
        </div>

        <div 
          className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 border-l-4 border-purple-500 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveTab('messages')}
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <EnvelopeIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Správy</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {unreadMessagesCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {unreadMessagesCount === 1 ? 'Nová správa' : 
                 unreadMessagesCount > 1 && unreadMessagesCount < 5 ? 'Nové správy' : 
                 'Nových správ'}
              </p>
            </div>
            {unreadMessagesCount > 0 && (
              <div className="ml-auto">
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                  {unreadMessagesCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rýchle akcie */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Rýchle akcie</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => setActiveTab('attendance')}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <ClockIcon className="w-6 h-6 text-gray-400 mr-2" />
            <span className="text-gray-600 dark:text-gray-300">Zaznamenať dochádzku</span>
          </button>
          <button 
            onClick={() => setShowLeaveRequestModal(true)}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <CalendarIcon className="w-6 h-6 text-gray-400 mr-2" />
            <span className="text-gray-600 dark:text-gray-300">Žiadosť o dovolenku</span>
          </button>
        </div>
      </div>

      {/* Posledná dochádzka */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Posledná dochádzka</h3>
        <div className="space-y-3">
          {attendance.slice(0, 5).map((att) => (
            <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(att.date).toLocaleDateString('sk-SK')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {att.check_in ? new Date(att.check_in).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }) : 'Nezaznamenané'} - 
                  {att.check_out ? new Date(att.check_out).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }) : 'Nezaznamenané'}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  att.status === 'present' 
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : att.status === 'late'
                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                }`}>
                  {hrService.getAttendanceStatusLabel(att.status)}
                </span>
                {att.total_hours && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatHoursToTime(att.total_hours)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mzdové informácie */}
      {employmentRelations.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Mzdové informácie</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employmentRelations.map((relation) => (
              <div key={relation.id} className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mzda</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{relation.salary} €</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Týždenné hodiny</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{relation.agreed_weekly_hours || relation.weekly_hours || 40} hodín</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dochádzka</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {relation.attendance_mode === 'automatic' ? 'Automatická' : 
                     relation.attendance_mode === 'manual' ? 'Manuálna' : 'Nenastavené'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pracovný čas</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {relation.work_start_time && relation.work_end_time ? 
                      `${relation.work_start_time} - ${relation.work_end_time}` : 'Nenastavené'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prestávka</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {relation.break_start_time && relation.break_end_time ? 
                      `${relation.break_start_time} - ${relation.break_end_time}` : 'Nenastavené'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Typ úväzku</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {relation.employment_type === 'full_time' ? 'Plný úväzok' :
                     relation.employment_type === 'part_time' ? 'Čiastočný úväzok' :
                     relation.employment_type === 'contract' ? 'Zmluva' :
                     relation.employment_type === 'intern' ? 'Stáž' :
                     relation.employment_type === 'dohoda' ? 'Dohoda' : relation.employment_type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Moja dochádzka</h2>
      </div>

      {/* Dochádzkový režim */}
      {attendanceSettings && (
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Dochádzkový režim</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Režim dochádzky:</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {attendanceSettings.attendance_mode === 'automatic' ? '🔄 Automatický' : '✏️ Manuálny'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pracovný čas:</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {attendanceSettings.work_start_time} - {attendanceSettings.work_end_time}
              </p>
            </div>
          </div>
          
          {attendanceSettings.attendance_mode === 'automatic' && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Automatický režim:</strong> Vaša dochádzka sa počíta automaticky na základe nastavených 
                pracovných hodín. Nemusíte manuálne označovať dochádzku.
              </p>
            </div>
          )}
        </div>
      )}

      {/* AttendanceTracker len pre manuálny režim */}
      {!!selectedCompany && (!attendanceSettings || attendanceSettings.attendance_mode === 'manual') && (
        <AttendanceTracker
          companyId={selectedCompany.id}
          employeeId={employeeData.id}
          employeeName={`${employeeData.first_name} ${employeeData.last_name}`}
          onSuccess={loadData}
        />
      )}

      {/* Prehľad dochádzky */}
      {!!selectedCompany && (
        <AttendanceOverview
          companyId={selectedCompany.id}
          employeeId={employeeData.id}
          employeeName={`${employeeData.first_name} ${employeeData.last_name}`}
          isCompanyView={false}
        />
      )}
    </div>
  );

  const renderLeave = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Moje dovolenky</h2>
        <button 
          onClick={() => setShowLeaveRequestModal(true)}
          className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center"
        >
          <CalendarIcon className="w-5 h-5 mr-2" />
          Nová žiadosť
        </button>
      </div>

      {/* Zoznam žiadostí o dovolenku */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Žiadosti o dovolenku</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Dôvod
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
              {leaveRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      request.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        : request.status === 'approved'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {request.status === 'pending' ? 'Čaká' : 
                       request.status === 'approved' ? 'Schválené' : 'Zamietnuté'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {request.reason || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leaveRequests.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Žiadne žiadosti o dovolenku</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderEmployment = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pracovné pomery</h2>
      </div>
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
        {employmentRelations.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">Žiadne pracovné pomery</p>
        ) : (
          <div className="space-y-4">
            {employmentRelations.map((relation) => (
              <div key={relation.id} className="border border-gray-200 dark:border-dark-600 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pracovisko</label>
                    <p className="text-gray-900 dark:text-white">{relation.workplace}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pozícia</label>
                    <p className="text-gray-900 dark:text-white">{relation.position_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mzda</label>
                    <p className="text-gray-900 dark:text-white">{relation.salary} €</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dátum nástupu</label>
                    <p className="text-gray-900 dark:text-white">{new Date(relation.employment_start_date).toLocaleDateString('sk-SK')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Typ úväzku</label>
                    <p className="text-gray-900 dark:text-white">
                      {relation.employment_type === 'full_time' ? 'Plný úväzok' :
                       relation.employment_type === 'part_time' ? 'Čiastočný úväzok' :
                       relation.employment_type === 'contract' ? 'Zmluva' :
                       relation.employment_type === 'intern' ? 'Stáž' :
                       relation.employment_type === 'dohoda' ? 'Dohoda' : relation.employment_type}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Týždenné hodiny</label>
                    <p className="text-gray-900 dark:text-white">{relation.agreed_weekly_hours || relation.weekly_hours || 40} hodín</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dochádzka</label>
                    <p className="text-gray-900 dark:text-white">
                      {relation.attendance_mode === 'automatic' ? 'Automatická' : 
                       relation.attendance_mode === 'manual' ? 'Manuálna' : 'Nenastavené'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pracovný čas</label>
                    <p className="text-gray-900 dark:text-white">
                      {relation.work_start_time && relation.work_end_time ? 
                        `${relation.work_start_time} - ${relation.work_end_time}` : 'Nenastavené'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prestávka</label>
                    <p className="text-gray-900 dark:text-white">
                      {relation.break_start_time && relation.break_end_time ? 
                        `${relation.break_start_time} - ${relation.break_end_time}` : 'Nenastavené'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <p className="text-gray-900 dark:text-white">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        relation.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {relation.status === 'active' ? 'Aktívny' : 'Neaktívny'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Môj profil</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => handleChangeRequest('general')}
            className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center"
          >
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            Nahlásiť zmenu
          </button>
        </div>
      </div>

      {/* Osobné údaje */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <UserIcon className="w-5 h-5 mr-2" />
          Osobné údaje
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Meno</label>
                <p className="text-gray-900 dark:text-white">{employeeData.first_name} {employeeData.last_name}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('name')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <p className="text-gray-900 dark:text-white">{employeeData.email}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('email')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefón</label>
                <p className="text-gray-900 dark:text-white">{employeeData.phone || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('phone')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            {employeeData.birth_date && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dátum narodenia</label>
                  <p className="text-gray-900 dark:text-white">{new Date(employeeData.birth_date).toLocaleDateString('sk-SK')}</p>
                </div>
                <button 
                  onClick={() => handleChangeRequest('birth_date')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {employeeData.birth_number && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rodné číslo</label>
                  <p className="text-gray-900 dark:text-white">{employeeData.birth_number}</p>
                </div>
                <button 
                  onClick={() => handleChangeRequest('birth_number')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {employeeData.permanent_street && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trvalý pobyt</label>
                  <p className="text-gray-900 dark:text-white">
                    {employeeData.permanent_street} {employeeData.permanent_number}<br />
                    {employeeData.permanent_zip} {employeeData.permanent_city}
                  </p>
                </div>
                <button 
                  onClick={() => handleChangeRequest('permanent_address')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {employeeData.contact_street && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kontaktná adresa</label>
                  <p className="text-gray-900 dark:text-white">
                    {employeeData.contact_street} {employeeData.contact_number}<br />
                    {employeeData.contact_zip} {employeeData.contact_city}
                  </p>
                </div>
                <button 
                  onClick={() => handleChangeRequest('contact_address')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {employeeData.nationality && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Národnosť</label>
                  <p className="text-gray-900 dark:text-white">{employeeData.nationality}</p>
                </div>
                <button 
                  onClick={() => handleChangeRequest('nationality')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {employeeData.education && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vzdelanie</label>
                  <p className="text-gray-900 dark:text-white">{employeeData.education}</p>
                </div>
                <button 
                  onClick={() => handleChangeRequest('education')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personálne údaje */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <UserIcon className="w-5 h-5 mr-2" />
          Personálne údaje
        </h3>
        
        {/* Základné údaje */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Základné údaje</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priezvisko</label>
                <p className="text-gray-900 dark:text-white">{employeeData.last_name}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('last_name')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Meno</label>
                <p className="text-gray-900 dark:text-white">{employeeData.first_name}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('first_name')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rodné priezvisko</label>
                <p className="text-gray-900 dark:text-white">{employeeData.birth_name || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('birth_name')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Titul pred</label>
                <p className="text-gray-900 dark:text-white">{employeeData.title_before || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('title_before')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Titul za</label>
                <p className="text-gray-900 dark:text-white">{employeeData.title_after || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('title_after')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pohlavie</label>
                <p className="text-gray-900 dark:text-white">{employeeData.gender || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('gender')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dátum narodenia</label>
                <p className="text-gray-900 dark:text-white">
                  {employeeData.birth_date ? new Date(employeeData.birth_date).toLocaleDateString('sk-SK') : 'Nezadané'}
                </p>
              </div>
              <button 
                onClick={() => handleChangeRequest('birth_date')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rodné číslo</label>
                <p className="text-gray-900 dark:text-white">{employeeData.birth_number || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('birth_number')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Miesto narodenia</label>
                <p className="text-gray-900 dark:text-white">{employeeData.birth_place || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('birth_place')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Národnosť</label>
                <p className="text-gray-900 dark:text-white">{employeeData.nationality || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('nationality')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Štát občianstvo</label>
                <p className="text-gray-900 dark:text-white">
                  {(() => {
                    const changeStatus = getFieldChangeStatus('citizenship');
                    if (changeStatus && changeStatus.status === 'pending') {
                      return changeStatus.newValue;
                    }
                    return employeeData.citizenship || 'Nezadané';
                  })()}
                </p>
              </div>
              <button 
                onClick={() => handleChangeRequest('citizenship')}
                className={`${
                  (() => {
                    const changeStatus = getFieldChangeStatus('citizenship');
                    if (changeStatus && changeStatus.status === 'pending') {
                      return 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300';
                    }
                    return 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300';
                  })()
                }`}
                title={(() => {
                  const changeStatus = getFieldChangeStatus('citizenship');
                  if (changeStatus && changeStatus.status === 'pending') {
                    return `🔄 Čakajúca zmena odoslaná zamestnávateľovi

📝 Dôvod: ${changeStatus.reason}
🆕 Nová hodnota: ${changeStatus.newValue}

Čaká sa na schválenie.`;
                  }
                  return 'Kliknite pre nahlásenie zmeny';
                })()}
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vzdelanie</label>
                <p className="text-gray-900 dark:text-white">{employeeData.education || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('education')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rodinný stav</label>
                <p className="text-gray-900 dark:text-white">{employeeData.marital_status || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('marital_status')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Partner</label>
                <p className="text-gray-900 dark:text-white">{employeeData.is_partner ? 'Áno' : 'Nie'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('is_partner')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Štatutárny zástupca</label>
                <p className="text-gray-900 dark:text-white">{employeeData.is_statutory ? 'Áno' : 'Nie'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('is_statutory')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Zamestnanecký bonus</label>
                <p className="text-gray-900 dark:text-white">{employeeData.employee_bonus ? 'Áno' : 'Nie'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('employee_bonus')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Počet mesiacov bonus</label>
                <p className="text-gray-900 dark:text-white">{employeeData.bonus_months || '0'} mesiacov</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('bonus_months')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cudzinec</label>
                <p className="text-gray-900 dark:text-white">{employeeData.is_foreigner ? 'Áno' : 'Nie'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('is_foreigner')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            {employeeData.is_foreigner && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Krajina cudzinca</label>
                  <p className="text-gray-900 dark:text-white">{employeeData.foreigner_country || 'Nezadané'}</p>
                </div>
                <button 
                  onClick={() => handleChangeRequest('foreigner_country')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Adresa trvalého pobytu */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Adresa trvalého pobytu</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ulica</label>
                <p className="text-gray-900 dark:text-white">{employeeData.permanent_street || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('permanent_street')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Číslo popisné</label>
                <p className="text-gray-900 dark:text-white">
                  {(() => {
                    const changeStatus = getFieldChangeStatus('permanent_number');
                    if (changeStatus && changeStatus.status === 'pending') {
                      return changeStatus.newValue;
                    }
                    return employeeData.permanent_number || 'Nezadané';
                  })()}
                </p>
              </div>
              <button 
                onClick={() => handleChangeRequest('permanent_number')}
                className={`${
                  (() => {
                    const changeStatus = getFieldChangeStatus('permanent_number');
                    if (changeStatus && changeStatus.status === 'pending') {
                      return 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300';
                    }
                    return 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300';
                  })()
                }`}
                title={(() => {
                  const changeStatus = getFieldChangeStatus('permanent_number');
                  if (changeStatus && changeStatus.status === 'pending') {
                    return `🔄 Čakajúca zmena odoslaná zamestnávateľovi

📝 Dôvod: ${changeStatus.reason}
🆕 Nová hodnota: ${changeStatus.newValue}

Čaká sa na schválenie.`;
                  }
                  return 'Kliknite pre nahlásenie zmeny';
                })()}
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Obec</label>
                <p className="text-gray-900 dark:text-white">{employeeData.permanent_city || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('permanent_city')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PSČ</label>
                <p className="text-gray-900 dark:text-white">{employeeData.permanent_zip || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('permanent_zip')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Štát</label>
                <p className="text-gray-900 dark:text-white">{employeeData.permanent_country || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('permanent_country')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Kontaktná adresa */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Kontaktná adresa</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ulica</label>
                <p className="text-gray-900 dark:text-white">{employeeData.contact_street || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('contact_street')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Číslo popisné</label>
                <p className="text-gray-900 dark:text-white">
                  {(() => {
                    const changeStatus = getFieldChangeStatus('contact_number');
                    if (changeStatus && changeStatus.status === 'pending') {
                      return changeStatus.newValue;
                    }
                    return employeeData.contact_number || 'Nezadané';
                  })()}
                </p>
              </div>
              <button 
                onClick={() => handleChangeRequest('contact_number')}
                className={`${
                  (() => {
                    const changeStatus = getFieldChangeStatus('contact_number');
                    if (changeStatus && changeStatus.status === 'pending') {
                      return 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300';
                    }
                    return 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300';
                  })()
                }`}
                title={(() => {
                  const changeStatus = getFieldChangeStatus('contact_number');
                  if (changeStatus && changeStatus.status === 'pending') {
                    return `🔄 Čakajúca zmena odoslaná zamestnávateľovi

📝 Dôvod: ${changeStatus.reason}
🆕 Nová hodnota: ${changeStatus.newValue}

Čaká sa na schválenie.`;
                  }
                  return 'Kliknite pre nahlásenie zmeny';
                })()}
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Obec</label>
                <p className="text-gray-900 dark:text-white">{employeeData.contact_city || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('contact_city')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PSČ</label>
                <p className="text-gray-900 dark:text-white">{employeeData.contact_zip || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('contact_zip')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Štát</label>
                <p className="text-gray-900 dark:text-white">{employeeData.contact_country || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('contact_country')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefón</label>
                <p className="text-gray-900 dark:text-white">{employeeData.phone || 'Nezadané'}</p>
              </div>
              <button 
                onClick={() => handleChangeRequest('phone')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
                <p className="text-gray-900 dark:text-white">{employeeData.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pracovné pomery - presunuté do samostatnej záložky */}

      {/* Informačný box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Informácia o zmenách údajov
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                Ak potrebujete zmeniť ktorékoľvek údaje v profile, kliknite na ikonu ceruzky vedľa príslušného poľa 
                alebo použite tlačidlo "Nahlásiť zmenu". Vaša požiadavka bude odoslaná administrátorovi na schválenie.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="space-y-6">
      <MessagesList
        userEmail={userEmail}
        userRole="employee"
        companyId={selectedCompany?.id}
        onMessageAction={() => {
          loadData();
          loadUnreadMessagesCount();
        }}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Personalistika a mzdy</h1>
          <p className="text-gray-600 dark:text-gray-300">Váš osobný priestor pre správu dochádzky a dovoleniek</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={selectedCompany?.id || ''}
            onChange={(e) => {
              const company = companies.find(c => c.id === parseInt(e.target.value));
              setSelectedCompany(company ?? null);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          >
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white dark:bg-dark-800 shadow rounded-lg">
        <div className="px-4">
          <div className="flex space-x-8">
            {[
              { id: 'overview', name: 'Prehľad', icon: ChartBarIcon },
              { id: 'attendance', name: 'Dochádzka', icon: ClockIcon },
              { id: 'leave', name: 'Dovolenky', icon: CalendarIcon },
              { id: 'employment', name: 'Pracovné pomery', icon: DocumentTextIcon },
              { id: 'profile', name: 'Profil', icon: UserIcon },
              { id: 'messages', name: 'Správy', icon: EnvelopeIcon }
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

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'attendance' && renderAttendance()}
        {activeTab === 'leave' && renderLeave()}
        {activeTab === 'employment' && renderEmployment()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'messages' && renderMessages()}
      </div>

      {/* Leave Request Modal */}
      <LeaveRequestModal
        isOpen={showLeaveRequestModal}
        onClose={() => setShowLeaveRequestModal(false)}
        companyId={selectedCompany?.id || 0}
        employeeId={employeeData?.id || 0}
        employeeName={employeeData ? `${employeeData.first_name} ${employeeData.last_name}` : ''}
        onSuccess={handleLeaveRequestSuccess}
      />

      {/* Change Request Modal */}
      {showChangeRequestModal && (
        <ChangeRequestModal
          isOpen={showChangeRequestModal}
          onClose={() => setShowChangeRequestModal(false)}
          field={selectedField}
                     currentValue={getCurrentFieldValue(selectedField)}
          onSubmit={handleChangeRequestSubmit}
        />
      )}
    </div>
  );
};



// Komponent pre modal požiadavky na zmenu
interface ChangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: string;
  currentValue: string;
  onSubmit: (data: { field: string; currentValue: string; newValue: string; reason: string }) => void;
}

const ChangeRequestModal: React.FC<ChangeRequestModalProps> = ({ isOpen, onClose, field, currentValue, onSubmit }) => {
  const [formData, setFormData] = useState({
    newValue: '',
    reason: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      field,
      currentValue,
      newValue: formData.newValue,
      reason: formData.reason
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Nahlásiť zmenu údajov
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aktuálna hodnota
            </label>
            <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-dark-700 p-2 rounded">
              {currentValue || 'Nezadané'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nová hodnota *
            </label>
            <input
              type="text"
              value={formData.newValue}
              onChange={(e) => setFormData({ ...formData, newValue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dôvod zmeny *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              Odoslať požiadavku
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
