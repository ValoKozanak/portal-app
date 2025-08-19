import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { apiService } from '../../services/apiService';
import { LoadingSpinner } from '../LoadingSpinner';
import AssignCompanyModal from '../AssignCompanyModal';
import CompanyModal from '../CompanyModal';
import FilePreviewModal from '../FilePreviewModal';
import EmailTestModal from '../EmailTestModal';
import MessagesList from '../MessagesList';
import CalendarComponent from '../Calendar';
import TimeClock from '../TimeClock';
// import AttendanceReport from '../AttendanceReport';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  ClipboardDocumentListIcon, 
  DocumentIcon, 
  Cog6ToothIcon, 
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

type DashboardSection = 'overview' | 'users' | 'companies' | 'tasks' | 'documents' | 'settings' | 'messages' | 'calendar' | 'timeclock' | 'attendance-report';

interface AdminDashboardContainerProps {}

const AdminDashboardContainer: React.FC<AdminDashboardContainerProps> = () => {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null); // Used in task modal
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [showCompanyDetailModal, setShowCompanyDetailModal] = useState(false);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [showFileDetailModal, setShowFileDetailModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [showFilePreviewModal, setShowFilePreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [showAssignCompanyModal, setShowAssignCompanyModal] = useState(false);
  const [showEmailTestModal, setShowEmailTestModal] = useState(false);
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [fileFilter, setFileFilter] = useState<string>('all');
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [selectedCompanyForAttendance, setSelectedCompanyForAttendance] = useState<any>(null);

  // API hooks s caching
  const { data: users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useApi(
    () => apiService.getAllUsers(),
    [],
    'admin-users',
    2 * 60 * 1000 // 2 minúty cache
  );

  const { data: companies, loading: companiesLoading, error: companiesError, refetch: refetchCompanies } = useApi(
    () => apiService.getAllCompaniesForAdmin(),
    [],
    'admin-companies-all',
    2 * 60 * 1000
  );

  const { data: tasks, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useApi(
    () => apiService.getAllTasks(),
    [],
    'admin-tasks',
    1 * 60 * 1000 // 1 minúta cache
  );

  const { data: files, loading: filesLoading, error: filesError, refetch: refetchFiles } = useApi(
    () => apiService.getAllFiles(),
    [],
    'admin-files',
    5 * 60 * 1000 // 5 minút cache
  );

  // Načítanie počtu neprečítaných správ
  const loadUnreadMessagesCount = async () => {
    try {
      const unreadCount = await apiService.getUnreadCount('admin@portal.sk');
      setUnreadMessagesCount(unreadCount);
    } catch (error) {
      console.error('Chyba pri načítaní počtu neprečítaných správ:', error);
    }
  };

  // Funkcia pre vytvorenie novej firmy (používateľa)
  const handleCreateCompany = async (companyData: any) => {
    try {
      // Vytvoríme novú firmu pomocou API
      const response = await apiService.createCompany({
        email: companyData.contact_email,
        name: companyData.name,
        role: 'user',
        status: 'active',
        phone: companyData.contact_phone,
        ico: companyData.ico,
        company_name: companyData.name,
        address: companyData.address,
        business_registry: companyData.business_registry,
        vat_id: companyData.vat_id,
        tax_id: companyData.tax_id,
        authorized_person: companyData.authorized_person,
        contact_email: companyData.contact_email,
        contact_phone: companyData.contact_phone
      });

      // Obnovíme zoznam firiem
      refetchCompanies();
      refetchUsers();
      
      alert('Firma bola úspešne vytvorená!');
    } catch (error) {
      console.error('Chyba pri vytváraní firmy:', error);
      alert('Chyba pri vytváraní firmy: ' + (error as Error).message);
    }
  };

  // Memoizované štatistiky
  const stats = useMemo(() => {
    if (!users || !companies || !tasks || !files) {
      return {
        users: 0,
        companies: 0,
        tasks: 0,
        documents: 0,
        admins: 0,
        reports: 0
      };
    }

    return {
      users: users.length,
      companies: companies.length,
      tasks: tasks.length, // Všetky úlohy
      activeTasks: tasks.filter(task => task.status === 'pending' || task.status === 'in_progress').length,
      completedTasks: tasks.filter(task => task.status === 'completed').length,
      documents: files.length,
      admins: users.filter(user => user.role === 'admin').length,
      reports: Math.floor(Math.random() * 50) + 10 // Placeholder
    };
  }, [users, companies, tasks, files]);

  // Filtrovacie funkcie
  const filteredCompanies = companies?.filter(company => {
    if (companyFilter !== 'all') {
      if (companyFilter === 'active' && company.status !== 'active') return false;
      if (companyFilter === 'inactive' && company.status !== 'inactive') return false;
    }
    if (companySearchTerm) {
      const searchLower = companySearchTerm.toLowerCase();
      return (
        company.name.toLowerCase().includes(searchLower) ||
        (company.ico && company.ico.includes(searchLower)) ||
        company.email.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  const filteredTasks = tasks?.filter(task => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'active') return task.status === 'pending' || task.status === 'in_progress';
    if (taskFilter === 'completed') return task.status === 'completed';
    return true;
  }) || [];

  const filteredFiles = files?.filter(file => {
    // Filter by type
    if (fileFilter !== 'all') {
      if (fileFilter === 'pdf' && !file.file_type.includes('pdf')) return false;
      if (fileFilter === 'image' && !file.file_type.includes('image')) return false;
      if (fileFilter === 'document' && !file.file_type.includes('document') && !file.file_type.includes('word') && !file.file_type.includes('excel')) return false;
      if (fileFilter === 'other' && (file.file_type.includes('pdf') || file.file_type.includes('image') || file.file_type.includes('document') || file.file_type.includes('word') || file.file_type.includes('excel'))) return false;
    }
    
    // Filter by search term
    if (fileSearchTerm) {
      const searchLower = fileSearchTerm.toLowerCase();
      return (
        file.original_name.toLowerCase().includes(searchLower) ||
        file.company_name?.toLowerCase().includes(searchLower) ||
        file.uploaded_by?.toLowerCase().includes(searchLower) ||
        file.file_type.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  }) || [];

  // Callback funkcie
  const handleSectionChange = useCallback((section: DashboardSection) => {
    console.log('Zmena sekcie na:', section);
    setActiveSection(section);
  }, []);

  const handleRefresh = useCallback(() => {
    refetchUsers();
    refetchCompanies();
    refetchTasks();
    refetchFiles();
    loadUnreadMessagesCount();
  }, [refetchUsers, refetchCompanies, refetchTasks, refetchFiles]);

  // Načítanie počtu neprečítaných správ pri načítaní komponentu
  useEffect(() => {
    loadUnreadMessagesCount();
  }, []);

  // Admin actions
  const handleUserAction = useCallback((action: 'view' | 'edit' | 'delete', user: any) => {
    setSelectedUser(user);
    switch (action) {
      case 'view':
        setShowUserDetailModal(true);
        break;
      case 'edit':
        setShowUserModal(true);
        break;
      case 'delete':
        const isActive = user.status === 'active';
        const actionText = isActive ? 'zneaktívniť' : 'aktivovať';
        const successText = isActive ? 'Používateľ bol zneaktívnený.' : 'Používateľ bol aktivovaný.';
        const errorText = isActive ? 'Zneaktívnenie používateľa zlyhalo.' : 'Aktivácia používateľa zlyhala.';
        
        if (window.confirm(`Naozaj chcete ${actionText} používateľa ${user.name}?`)) {
          (async () => {
            try {
              await apiService.updateUser(user.id, { ...user, status: isActive ? 'inactive' : 'active' });
              await refetchUsers();
              alert(successText);
            } catch (e) {
              alert(errorText);
            }
          })();
        }
        break;
    }
  }, [refetchUsers]);

  const handleCompanyAction = useCallback((action: 'view' | 'edit' | 'delete', company: any) => {
    setSelectedCompany(company);
    switch (action) {
      case 'view':
        setShowCompanyDetailModal(true);
        break;
      case 'edit':
        setShowCompanyModal(true);
        break;
      case 'delete':
        const isActive = company.status === 'active';
        const actionText = isActive ? 'zneaktívniť' : 'aktivovať';
        const successText = isActive ? 'Firma bola zneaktívnená.' : 'Firma bola aktivovaná.';
        const errorText = isActive ? 'Zneaktívnenie firmy zlyhalo.' : 'Aktivácia firmy zlyhala.';
        
        if (window.confirm(`Naozaj chcete ${actionText} firmu ${company.name}?`)) {
          (async () => {
            try {
              console.log('Zmena statusu firmy:', { companyId: company.id, isActive, actionText });
              if (isActive) {
                console.log('Volám deactivateCompany...');
                await apiService.deactivateCompany(company.id);
                console.log('deactivateCompany úspešne dokončené');
              } else {
                console.log('Volám activateCompany...');
                await apiService.activateCompany(company.id);
                console.log('activateCompany úspešne dokončené');
              }
              console.log('Obnovujem zoznam firiem...');
              await refetchCompanies();
              console.log('Zoznam firiem obnovený');
              alert(successText);
            } catch (e) {
              console.error('Chyba pri zmene statusu firmy:', e);
              alert(errorText);
            }
          })();
        }
        break;
    }
  }, [refetchCompanies]);

  const handleTaskAction = useCallback((action: 'view' | 'edit' | 'delete', task: any) => {
    setSelectedTask(task);
    switch (action) {
      case 'view':
        setShowTaskDetailModal(true);
        break;
      case 'edit':
        setShowTaskModal(true);
        break;
      case 'delete':
        if (window.confirm(`Naozaj chcete vymazať úlohu ${task.title}?`)) {
          (async () => {
            try {
              await apiService.deleteTask(task.id);
              await refetchTasks();
              alert('Úloha bola vymazaná.');
            } catch (e) {
              alert('Vymazanie úlohy zlyhalo.');
            }
          })();
        }
        break;
    }
  }, [refetchTasks]);

  // Funkcia na priradenie účtovníkov k firme
  const handleAssignAccountants = useCallback(async (companyId: number, accountantEmails: string[]) => {
    try {
      await apiService.assignAccountantsToCompany(companyId, accountantEmails);
      await refetchCompanies();
      alert('Účtovníci boli úspešne priradení k firme.');
    } catch (error) {
      console.error('Chyba pri priradení účtovníkov:', error);
      alert('Chyba pri priradení účtovníkov k firme.');
    }
  }, [refetchCompanies]);

  // Funkcia pre preview súborov
  const handleFilePreview = useCallback((file: any) => {
    setPreviewFile(file);
    setShowFilePreviewModal(true);
  }, []);

  // Loading state
  if (usersLoading && companiesLoading && tasksLoading && filesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Načítavam dashboard..." />
      </div>
    );
  }

  // Error state
  if (usersError || companiesError || tasksError || filesError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Chyba pri načítaní dát</h3>
        <p className="text-gray-600 mb-4">Nepodarilo sa načítať dáta z servera.</p>
        <button
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Skúsiť znova
        </button>
      </div>
    );
  }

  // Render sekcie
  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard - Prehľad</h2>
              <button
                onClick={handleRefresh}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Obnoviť
              </button>
            </div>
            
            {/* Štatistiky karty */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Kliknutie na kartu používateľov');
                  setActiveSection('users');
                }}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer text-left"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Celkovo používateľov</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Adminov: {stats.admins}</span>
                  <div className="mt-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Kliknutie na zobraziť všetkých používateľov');
                        setActiveSection('users');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                      Zobraziť všetkých
                    </button>
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Kliknutie na kartu firiem');
                  setActiveSection('companies');
                }}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer text-left"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BuildingOfficeIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Registrované firmy</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.companies}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Aktívne: {companies ? companies.filter(company => company.status === 'active').length : 0}</span>
                  <div className="mt-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Kliknutie na zobraziť všetky firmy');
                        setActiveSection('companies');
                      }}
                      className="text-xs text-green-600 hover:text-green-700 underline"
                    >
                      Zobraziť všetky
                    </button>
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Kliknutie na kartu úloh');
                  setTaskFilter('all');
                  setActiveSection('tasks');
                }}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer text-left"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <ClipboardDocumentListIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Úlohy</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.tasks}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Aktívne: {stats.activeTasks} | Dokončené: {stats.completedTasks}</span>
                  <div className="mt-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Kliknutie na zobraziť všetky úlohy');
                        setActiveSection('tasks');
                      }}
                      className="text-xs text-yellow-600 hover:text-yellow-700 underline"
                    >
                      Zobraziť všetky
                    </button>
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Kliknutie na kartu dokumentov');
                  setActiveSection('documents');
                }}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer text-left"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DocumentIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Dokumenty</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.documents}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Nahrané dnes: {files ? files.filter(file => {
                    const today = new Date().toISOString().split('T')[0];
                    return file.created_at && file.created_at.startsWith(today);
                  }).length : 0}</span>
                  <div className="mt-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Kliknutie na zobraziť všetky dokumenty');
                        setActiveSection('documents');
                      }}
                      className="text-xs text-purple-600 hover:text-purple-700 underline"
                    >
                      Zobraziť všetky
                    </button>
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Kliknutie na kartu kalendára');
                  setActiveSection('calendar');
                }}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer text-left"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <CalendarIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Kalendár</p>
                    <p className="text-2xl font-bold text-gray-900">{tasks ? tasks.filter(task => task.due_date).length : 0}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Termíny a úlohy</span>
                  <div className="mt-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Kliknutie na zobraziť kalendár');
                        setActiveSection('calendar');
                      }}
                      className="text-xs text-orange-600 hover:text-orange-700 underline"
                    >
                      Zobraziť kalendár
                    </button>
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Kliknutie na kartu správ');
                  setActiveSection('messages');
                }}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer text-left"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <EnvelopeIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Správy</p>
                    <p className="text-2xl font-bold text-gray-900">{unreadMessagesCount}</p>
                    {unreadMessagesCount > 0 && (
                      <p className="text-sm text-indigo-600 font-medium">{unreadMessagesCount} neprečítaných</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Komunikácia</span>
                  <div className="mt-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Kliknutie na zobraziť všetky správy');
                        setActiveSection('messages');
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 underline"
                    >
                      Zobraziť všetky
                    </button>
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Kliknutie na kartu dochádzky');
                  setActiveSection('timeclock');
                }}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer text-left"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CalendarIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Dochádzka</p>
                    <p className="text-2xl font-bold text-gray-900">⏰</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Časová karta</span>
                  <div className="mt-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Kliknutie na zobraziť dochádzku');
                        setActiveSection('timeclock');
                      }}
                      className="text-xs text-emerald-600 hover:text-emerald-700 underline"
                    >
                      Zobraziť dochádzku
                    </button>
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Kliknutie na kartu reportu dochádzky');
                  setActiveSection('attendance-report');
                }}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer text-left"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ChartBarIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Report dochádzky</p>
                    <p className="text-2xl font-bold text-gray-900">📊</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Štatistiky</span>
                  <div className="mt-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Kliknutie na zobraziť report dochádzky');
                        setActiveSection('attendance-report');
                      }}
                      className="text-xs text-red-600 hover:text-red-700 underline"
                    >
                      Zobraziť report
                    </button>
                  </div>
                </div>
              </button>
            </div>

            {/* Rýchle akcie */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Rýchle akcie</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setActiveSection('users');
                      setShowUserModal(true);
                    }}
                    className="w-full bg-blue-50 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 flex items-center gap-2 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Pridať používateľa
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection('companies');
                      setShowCompanyModal(true);
                    }}
                    className="w-full bg-green-50 text-green-700 px-4 py-2 rounded-md hover:bg-green-100 flex items-center gap-2 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Pridať firmu
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection('tasks');
                      setShowTaskModal(true);
                    }}
                    className="w-full bg-yellow-50 text-yellow-700 px-4 py-2 rounded-md hover:bg-yellow-100 flex items-center gap-2 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Vytvoriť úlohu
                  </button>
              </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Systémový stav</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Server</span>
                    <span className="flex items-center text-green-600">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Online
                    </span>
              </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Databáza</span>
                    <span className="flex items-center text-green-600">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Aktívna
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Backup</span>
                    <button 
                      onClick={() => {
                        alert('Spúšťam automatické zálohovanie...');
                        // Tu by sa implementovala logika zálohovania
                      }}
                      className="flex items-center text-yellow-600 hover:text-yellow-700 transition-colors"
                    >
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      Potrebný
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cache</span>
                    <button 
                      onClick={() => {
                        handleRefresh();
                        alert('Cache vyčistený!');
                      }}
                      className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Vyčistiť
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Posledné aktivity</h3>
                <div className="space-y-2 text-sm">
                  <button 
                    onClick={() => setActiveSection('users')}
                    className="flex items-center gap-2 w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Nový používateľ registrovaný</span>
                  </button>
                  <button 
                    onClick={() => setActiveSection('companies')}
                    className="flex items-center gap-2 w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Firma aktualizovaná</span>
                  </button>
                  <button 
                    onClick={() => setActiveSection('tasks')}
                    className="flex items-center gap-2 w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
                  >
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-600">Úloha dokončená</span>
                  </button>
                  <button 
                    onClick={() => setActiveSection('documents')}
                    className="flex items-center gap-2 w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
                  >
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">Nový dokument nahraný</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Správa používateľov</h2>
              <button
                onClick={() => setShowUserModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Pridať používateľa
              </button>
            </div>
            
            {/* Filtre a vyhľadávanie */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Vyhľadávanie */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vyhľadávanie</label>
                  <input
                    type="text"
                    placeholder="Hľadať podľa mena alebo emailu..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Filter podľa statusu */}
                <div className="md:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Všetci ({users?.length || 0})</option>
                    <option value="active">Aktívni ({users?.filter(u => u.status === 'active').length || 0})</option>
                    <option value="inactive">Neaktívni ({users?.filter(u => u.status === 'inactive').length || 0})</option>
                  </select>
                </div>
                
                {/* Vyčistiť filtre */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setUserSearchTerm('');
                      setUserFilter('all');
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Vyčistiť filtre
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              {usersLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" text="Načítavam používateľov..." />
                </div>
              ) : users && users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Používateľ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rola</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posledné prihlásenie</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcie</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(users || [])
                        .filter(user => {
                          // Filter podľa statusu
                          if (userFilter === 'active' && user.status !== 'active') return false;
                          if (userFilter === 'inactive' && user.status !== 'inactive') return false;
                          
                          // Filter podľa vyhľadávania
                          if (userSearchTerm) {
                            const searchLower = userSearchTerm.toLowerCase();
                            const nameMatch = user.name?.toLowerCase().includes(searchLower);
                            const emailMatch = user.email?.toLowerCase().includes(searchLower);
                            if (!nameMatch && !emailMatch) return false;
                          }
                          
                          return true;
                        })
                        .map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">ID: {user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'accountant' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role === 'admin' ? 'Admin' :
                               user.role === 'accountant' ? 'Účtovník' : 'Používateľ'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status === 'active' ? 'Aktívny' : 'Neaktívny'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {'lastLogin' in user && user.lastLogin ? new Date(user.lastLogin as string).toLocaleDateString('sk-SK') : 'Nikdy'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleUserAction('view', user)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Zobraziť detaily"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUserAction('edit', user)}
                                className="text-yellow-600 hover:text-yellow-900 p-1"
                                title="Upraviť"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUserAction('delete', user)}
                                className={`p-1 ${user.status === 'active' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                                title={user.status === 'active' ? 'Zneaktívniť' : 'Aktivovať'}
                              >
                                {user.status === 'active' ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Žiadni používatelia</p>
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Pridať prvého používateľa
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case 'companies':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Správa firiem</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAssignCompanyModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <UsersIcon className="w-4 h-4" />
                  Priradiť účtovníkov
                </button>
                <button
                  onClick={() => setShowCompanyModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Pridať firmu
                </button>
              </div>
            </div>
            
            {/* Filtre a vyhľadávanie */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Vyhľadávanie */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vyhľadávanie</label>
                  <input
                    type="text"
                    placeholder="Hľadať podľa názvu firmy, IČO alebo adresy..."
                    value={companySearchTerm}
                    onChange={(e) => setCompanySearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                {/* Filter podľa statusu */}
                <div className="md:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">Všetky ({companies?.length || 0})</option>
                    <option value="active">Aktívne ({companies?.filter(c => c.status === 'active').length || 0})</option>
                    <option value="inactive">Neaktívne ({companies?.filter(c => c.status === 'inactive').length || 0})</option>
                  </select>
                </div>
                
                {/* Vyčistiť filtre */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setCompanySearchTerm('');
                      setCompanyFilter('all');
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Vyčistiť filtre
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              {companiesLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" text="Načítavam firmy..." />
                </div>
              ) : companies && companies.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Firma</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IČO</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Účtovník</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcie</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(companies || [])
                        .filter(company => {
                          // Filter podľa statusu
                          if (companyFilter === 'active' && company.status !== 'active') return false;
                          if (companyFilter === 'inactive' && company.status !== 'inactive') return false;
                          
                          // Filter podľa vyhľadávania
                          if (companySearchTerm) {
                            const searchLower = companySearchTerm.toLowerCase();
                            const nameMatch = company.name?.toLowerCase().includes(searchLower);
                            const icoMatch = company.ico?.toLowerCase().includes(searchLower);
                            const addressMatch = company.address?.toLowerCase().includes(searchLower);
                            if (!nameMatch && !icoMatch && !addressMatch) return false;
                          }
                          
                          return true;
                        })
                        .map((company) => (
                        <tr key={company.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                  <BuildingOfficeIcon className="w-5 h-5 text-green-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{company.name}</div>
                                <div className="text-sm text-gray-500">{company.address}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.ico}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{'contactPerson' in company ? (company.contactPerson as string) : 'N/A'}</div>
                            <div className="text-sm text-gray-500">{'email' in company ? (company.email as string) : 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              company.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {company.status === 'active' ? 'Aktívna' : 'Neaktívna'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {company.assignedToAccountants && company.assignedToAccountants.length > 0 ? (
                              <div>
                                {company.assignedToAccountants.map((email: string, index: number) => {
                                  const accountant = users?.find(user => user.email === email);
                                  return (
                                    <div key={email} className={index > 0 ? 'mt-1' : ''}>
                                      {accountant ? accountant.name : email}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              'Nepriradený'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleCompanyAction('view', company)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Zobraziť detaily"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCompanyAction('edit', company)}
                                className="text-yellow-600 hover:text-yellow-900 p-1"
                                title="Upraviť"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCompanyAction('delete', company)}
                                className={`p-1 ${company.status === 'active' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                                title={company.status === 'active' ? 'Zneaktívniť' : 'Aktivovať'}
                              >
                                {company.status === 'active' ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Žiadne firmy</p>
                  <button
                    onClick={() => setShowCompanyModal(true)}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Pridať prvú firmu
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case 'tasks':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Správa úloh</h2>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => setTaskFilter('all')}
                    className={`px-3 py-1 text-sm rounded-md ${
                      taskFilter === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Všetky ({tasks?.length || 0})
                  </button>
                  <button
                    onClick={() => setTaskFilter('active')}
                    className={`px-3 py-1 text-sm rounded-md ${
                      taskFilter === 'active' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Aktívne ({tasks?.filter(t => t.status !== 'completed').length || 0})
                  </button>
                  <button
                    onClick={() => setTaskFilter('completed')}
                    className={`px-3 py-1 text-sm rounded-md ${
                      taskFilter === 'completed' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Dokončené ({tasks?.filter(t => t.status === 'completed').length || 0})
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowTaskModal(true)}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Vytvoriť úlohu
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              {tasksLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" text="Načítavam úlohy..." />
                </div>
              ) : tasks && tasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Úloha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Firma</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priradené</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Termín</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorita</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcie</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(tasks || [])
                        .filter(task => {
                          if (taskFilter === 'all') return true;
                          if (taskFilter === 'active') return task.status === 'pending' || task.status === 'in_progress';
                          if (taskFilter === 'completed') return task.status === 'completed';
                          return true;
                        })
                        .map((task) => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                  <ClipboardDocumentListIcon className="w-5 h-5 text-yellow-600" />
                           </div>
                        </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                <div className="text-sm text-gray-500">{task.description?.substring(0, 50)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.company_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assigned_to}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString('sk-SK') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority === 'urgent' ? 'Urgentná' :
                             task.priority === 'high' ? 'Vysoká' :
                             task.priority === 'medium' ? 'Stredná' : 'Nízka'}
                          </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status === 'pending' ? 'Čakajúce' :
                               task.status === 'completed' ? 'Dokončené' :
                               task.status === 'in_progress' ? 'V spracovaní' : 'Zrušené'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleTaskAction('view', task)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Zobraziť detaily"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleTaskAction('edit', task)}
                                className="text-yellow-600 hover:text-yellow-900 p-1"
                                title="Upraviť"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleTaskAction('delete', task)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Vymazať"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                        </div>
                          </td>
                        </tr>
                  ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Žiadne úlohy</p>
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
                  >
                    Vytvoriť prvú úlohu
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case 'documents':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Správa dokumentov</h2>
              <button
                onClick={() => setShowFileUploadModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Nahrať dokument
              </button>
            </div>

            {/* File Filter */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vyhľadávanie</label>
                  <input
                    type="text"
                    placeholder="Hľadať podľa názvu, firmy, nahrateľa..."
                    value={fileSearchTerm}
                    onChange={(e) => setFileSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                {/* Type Filter */}
                <div className="lg:w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typ súboru</label>
                  <select
                    value={fileFilter}
                    onChange={(e) => setFileFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">Všetky typy</option>
                    <option value="pdf">PDF súbory</option>
                    <option value="image">Obrázky</option>
                    <option value="document">Dokumenty (Word, Excel)</option>
                    <option value="other">Ostatné</option>
                  </select>
                </div>
              </div>
              
              {/* Filter Summary */}
              <div className="mt-3 text-sm text-gray-600">
                Zobrazené {filteredFiles.length} z {files?.length || 0} dokumentov
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              {filesLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" text="Načítavam dokumenty..." />
                </div>
              ) : filteredFiles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dokument</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veľkosť</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Firma</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nahral</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dátum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcie</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                  <DocumentIcon className="w-5 h-5 text-purple-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{file.original_name}</div>
                                <div className="text-sm text-gray-500">ID: {file.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.file_type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(file.file_size / 1024).toFixed(1)} KB</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.company_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.uploaded_by}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {'uploaded_at' in file && file.uploaded_at ? new Date(file.uploaded_at as string).toLocaleDateString('sk-SK') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleFilePreview(file)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Náhľad"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {/* Implement download */}}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Stiahnuť"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {/* Implement delete */}}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Vymazať"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {files && files.length > 0 
                      ? 'Žiadne dokumenty nevyhovujú vybranému filtru' 
                      : 'Žiadne dokumenty'
                    }
                  </p>
                  {files && files.length > 0 ? (
                    <button
                      onClick={() => {
                        setFileFilter('all');
                        setFileSearchTerm('');
                      }}
                      className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                    >
                      Zobraziť všetky dokumenty
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowFileUploadModal(true)}
                      className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                    >
                      Nahrať prvý dokument
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Systémové nastavenia</h2>
              <button
                onClick={() => {/* Implement save settings */}}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Uložiť nastavenia
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Všeobecné nastavenia</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Názov aplikácie</label>
                    <input
                      type="text"
                      defaultValue="Accounting Portal"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximálna veľkosť súboru (MB)</label>
                    <input
                      type="number"
                      defaultValue="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cache TTL (minúty)</label>
                    <input
                      type="number"
                      defaultValue="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bezpečnosť</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Dvojfaktorová autentifikácia</span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700">
                      Povoliť
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Automatické zálohovanie</span>
                    <button className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700">
                      Aktívne
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Audit log</span>
                    <button className="bg-yellow-600 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-700">
                      Povoliť
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notifikácie</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Email notifikácie</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Push notifikácie</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">SMS notifikácie</span>
                    <input type="checkbox" className="rounded" />
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowEmailTestModal(true)}
                      className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center justify-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Test Emailov
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Systémové informácie</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verzia aplikácie:</span>
                    <span className="text-gray-900">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Posledná aktualizácia:</span>
                    <span className="text-gray-900">18.08.2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Databáza:</span>
                    <span className="text-green-600">Online</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">API Server:</span>
                    <span className="text-green-600">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'calendar':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Kalendár úloh - Admin Panel</h2>
              <button
                onClick={handleRefresh}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Obnoviť
              </button>
            </div>
            
            <CalendarComponent
              userEmail="admin@portal.sk"
              userRole="admin"
              tasks={tasks || []}
              companies={companies || []}
              onTaskUpdate={() => {
                refetchTasks();
                refetchCompanies();
              }}
            />
          </div>
        );
      case 'messages':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Správy - Admin Panel</h2>
              <button
                onClick={handleRefresh}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Obnoviť
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md">
              <MessagesList 
                userEmail="admin@portal.sk" 
                userRole="admin" 
                isAdmin={true} 
                onMessageAction={loadUnreadMessagesCount}
              />
            </div>
          </div>
        );
      case 'timeclock':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Dochádzka - Admin Panel</h2>
              <button
                onClick={handleRefresh}
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Obnoviť
              </button>
            </div>
            
            <div className="space-y-6">
              {companies && companies.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-center py-12">
                    <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne firmy</h3>
                    <p className="mt-1 text-sm text-gray-500 mb-4">Zatiaľ nie sú registrované žiadne firmy pre dochádzku.</p>
                  </div>
                </div>
              ) : companies && companies.length === 1 ? (
                <TimeClock 
                  companyId={companies[0].id} 
                  companyName={companies[0].name} 
                />
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Vyberte firmu pre dochádzku</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies && companies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => setSelectedCompanyForAttendance(company)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <BuildingOfficeIcon className="h-6 w-6 text-emerald-600" />
                          <div className="text-left">
                            <h3 className="font-medium text-gray-900">{company.name}</h3>
                            <p className="text-sm text-gray-500">IČO: {company.ico}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedCompanyForAttendance && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                          Dochádzka - {selectedCompanyForAttendance.name}
                        </h2>
                        <button
                          onClick={() => setSelectedCompanyForAttendance(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <TimeClock 
                        companyId={selectedCompanyForAttendance.id} 
                        companyName={selectedCompanyForAttendance.name} 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'attendance-report':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Report dochádzky - Admin Panel</h2>
              <button
                onClick={handleRefresh}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Obnoviť
              </button>
            </div>
            
            <div className="space-y-6">
              {companies && companies.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-center py-12">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne firmy</h3>
                    <p className="mt-1 text-sm text-gray-500 mb-4">Zatiaľ nie sú registrované žiadne firmy pre report dochádzky.</p>
                  </div>
                </div>
              ) : companies && companies.length === 1 ? (
                                {/* <AttendanceReport
                  companyId={companies[0].id}
                  companyName={companies[0].name}
                /> */}
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Vyberte firmu pre report dochádzky</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies && companies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => setSelectedCompanyForAttendance(company)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <ChartBarIcon className="h-6 w-6 text-red-600" />
                          <div className="text-left">
                            <h3 className="font-medium text-gray-900">{company.name}</h3>
                            <p className="text-sm text-gray-500">IČO: {company.ico}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedCompanyForAttendance && activeSection === 'attendance-report' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                          Report dochádzky - {selectedCompanyForAttendance.name}
                        </h2>
                        <button
                          onClick={() => setSelectedCompanyForAttendance(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                                            {/* <AttendanceReport
                        companyId={selectedCompanyForAttendance.id}  
                        companyName={selectedCompanyForAttendance.name}
                      /> */}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Modal components
  const renderModals = () => (
    <>
      {/* User Detail Modal */}
      {showUserDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Detail používateľa</h3>
              <button onClick={() => { setShowUserDetailModal(false); setSelectedUser(null); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">ID:</span><span className="text-gray-900">{selectedUser.id}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Meno:</span><span className="text-gray-900">{selectedUser.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Email:</span><span className="text-gray-900">{selectedUser.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Rola:</span><span className="text-gray-900">{selectedUser.role}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className="text-gray-900">{selectedUser.status}</span></div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => { setShowUserDetailModal(false); setSelectedUser(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Zavrieť</button>
            </div>
          </div>
        </div>
      )}

      {/* Company Detail Modal */}
      {showCompanyDetailModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Detail firmy</h3>
              <button onClick={() => { setShowCompanyDetailModal(false); setSelectedCompany(null); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Názov:</span><span className="text-gray-900">{selectedCompany.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">IČO:</span><span className="text-gray-900">{selectedCompany.ico}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Adresa:</span><span className="text-gray-900">{selectedCompany.address}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Obch. register:</span><span className="text-gray-900">{selectedCompany.business_registry || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">DIČ:</span><span className="text-gray-900">{selectedCompany.vat_id || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Daňové ID:</span><span className="text-gray-900">{selectedCompany.tax_id || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Oprávnená osoba:</span><span className="text-gray-900">{selectedCompany.authorized_person}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Kontakt email:</span><span className="text-gray-900">{selectedCompany.contact_email || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Kontakt telefón:</span><span className="text-gray-900">{selectedCompany.contact_phone || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Vlastník:</span><span className="text-gray-900">{selectedCompany.owner_email}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className="text-gray-900">{selectedCompany.status}</span></div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => { setShowCompanyDetailModal(false); setSelectedCompany(null); }} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Zavrieť</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Detail úlohy</h3>
              <button onClick={() => { setShowTaskDetailModal(false); setSelectedTask(null); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Názov:</span><span className="text-gray-900">{selectedTask.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Firma:</span><span className="text-gray-900">{selectedTask.company_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Priradené:</span><span className="text-gray-900">{selectedTask.assigned_to}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Termín:</span><span className="text-gray-900">{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString('sk-SK') : 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Priorita:</span><span className="text-gray-900">{selectedTask.priority}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className="text-gray-900">{selectedTask.status}</span></div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => { setShowTaskDetailModal(false); setSelectedTask(null); }} className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">Zavrieť</button>
            </div>
          </div>
        </div>
      )}

      {/* File Detail Modal */}
      {showFileDetailModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Detail dokumentu</h3>
              <button onClick={() => { setShowFileDetailModal(false); setSelectedFile(null); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Názov:</span><span className="text-gray-900">{selectedFile.original_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Typ:</span><span className="text-gray-900">{selectedFile.file_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Veľkosť:</span><span className="text-gray-900">{(selectedFile.file_size / 1024).toFixed(1)} KB</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Firma:</span><span className="text-gray-900">{selectedFile.company_name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Nahral:</span><span className="text-gray-900">{selectedFile.uploaded_by}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Dátum:</span><span className="text-gray-900">{'uploaded_at' in selectedFile && selectedFile.uploaded_at ? new Date(selectedFile.uploaded_at).toLocaleDateString('sk-SK') : 'N/A'}</span></div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => { setShowFileDetailModal(false); setSelectedFile(null); }} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">Zavrieť</button>
            </div>
          </div>
        </div>
      )}
      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedUser ? 'Upraviť používateľa' : 'Pridať používateľa'}
              </h3>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const userData = {
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                password: formData.get('password') as string,
                role: formData.get('role') as string,
                status: formData.get('status') as string
              };

              if (!userData.name || !userData.email || (!selectedUser && !userData.password)) {
                alert('Vyplňte všetky povinné polia');
                return;
              }

              const saveUser = async () => {
                try {
                  if (selectedUser) {
                    // Update existing user
                    const updateData = {
                      name: userData.name,
                      email: userData.email,
                      role: userData.role,
                      status: userData.status
                    };
                    await apiService.updateUser(selectedUser.id, updateData);
                    
                    // Update password if provided
                    if (userData.password) {
                      await apiService.changeUserPassword(selectedUser.id, userData.password);
                    }
                    
                    alert('Používateľ bol úspešne upravený');
                  } else {
                    // Create new user
                    await apiService.createUser(userData);
                    alert('Používateľ bol úspešne vytvorený');
                  }
                  setShowUserModal(false);
                  setSelectedUser(null);
                  // Refresh users list
                  refetchUsers();
                } catch (error) {
                  console.error('Chyba pri ukladaní používateľa:', error);
                  alert('Chyba pri ukladaní používateľa');
                }
              };

              saveUser();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meno *</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={selectedUser?.name || ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={selectedUser?.email || ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedUser ? 'Heslo (prázdne = nezmeniť)' : 'Heslo *'}
                  </label>
                  <input
                    name="password"
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={selectedUser ? 'Prázdne = nezmeniť' : 'Zadajte heslo'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rola</label>
                  <select
                    name="role"
                    defaultValue={selectedUser?.role || 'user'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">Používateľ</option>
                    <option value="accountant">Účtovník</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={selectedUser?.status || 'active'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Aktívny</option>
                    <option value="inactive">Neaktívny</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {selectedUser ? 'Uložiť' : 'Pridať'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company Modal */}
      <CompanyModal
        isOpen={showCompanyModal}
        onClose={() => {
          setShowCompanyModal(false);
          setSelectedCompany(null);
        }}
        onSave={handleCreateCompany}
        currentCompany={selectedCompany}
        isEditing={!!selectedCompany}
      />

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedTask ? 'Upraviť úlohu' : 'Vytvoriť úlohu'}
              </h3>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setSelectedTask(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Názov úlohy</label>
                <input
                  type="text"
                  defaultValue={selectedTask?.title || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Popis</label>
                <textarea
                  defaultValue={selectedTask?.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firma</label>
                <select
                  defaultValue={selectedTask?.companyId || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Vyberte firmu</option>
                  {companies?.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priradené</label>
                <select
                  defaultValue={selectedTask?.assignedTo || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Vyberte používateľa</option>
                  {users?.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Termín</label>
                <input
                  type="date"
                  defaultValue={selectedTask?.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorita</label>
                  <select
                    defaultValue={selectedTask?.priority || 'medium'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="low">Nízka</option>
                    <option value="medium">Stredná</option>
                    <option value="high">Vysoká</option>
                    <option value="urgent">Urgentná</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    defaultValue={selectedTask?.status || 'pending'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="pending">Čakajúce</option>
                    <option value="in_progress">V spracovaní</option>
                    <option value="completed">Dokončené</option>
                    <option value="cancelled">Zrušené</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setSelectedTask(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Zrušiť
              </button>
              <button
                onClick={() => {
                  // Implement save task
                  console.log('Saving task:', selectedTask);
                  setShowTaskModal(false);
                  setSelectedTask(null);
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                {selectedTask ? 'Uložiť' : 'Vytvoriť'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {(['overview', 'users', 'companies', 'tasks', 'documents', 'calendar', 'messages', 'settings'] as DashboardSection[]).map((section) => (
                <button
                  key={section}
                  onClick={() => {
                    console.log('Kliknutie na navigáciu:', section);
                    handleSectionChange(section);
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeSection === section
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {section === 'overview' && (
                    <>
                      <ChartBarIcon className="w-4 h-4" />
                      Prehľad
                    </>
                  )}
                  {section === 'users' && (
                    <>
                      <UsersIcon className="w-4 h-4" />
                      Používatelia
                    </>
                  )}
                  {section === 'companies' && (
                    <>
                      <BuildingOfficeIcon className="w-4 h-4" />
                      Firmy
                    </>
                  )}
                  {section === 'tasks' && (
                    <>
                      <ClipboardDocumentListIcon className="w-4 h-4" />
                      Úlohy
                    </>
                  )}
                  {section === 'documents' && (
                    <>
                      <DocumentIcon className="w-4 h-4" />
                      Dokumenty
                    </>
                  )}
                  {section === 'calendar' && (
                    <>
                      <CalendarIcon className="w-4 h-4" />
                      Kalendár
                    </>
                  )}
                  {section === 'messages' && (
                    <>
                      <EnvelopeIcon className="w-4 h-4" />
                      Správy
                    </>
                  )}
                  {section === 'timeclock' && (
                    <>
                      <CalendarIcon className="w-4 h-4" />
                      Dochádzka
                    </>
                  )}
                  {section === 'attendance-report' && (
                    <>
                      <ChartBarIcon className="w-4 h-4" />
                      Report dochádzky
                    </>
                  )}
                  {section === 'settings' && (
                    <>
                      <Cog6ToothIcon className="w-4 h-4" />
                      Nastavenia
                    </>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Admin Panel</span>
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Obnoviť dáta"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderSection()}
      </main>

      {/* Modals */}
      {renderModals()}
      
      {/* File Upload Modal */}
      {showFileUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Nahrať dokument</h3>
              <button
                onClick={() => setShowFileUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const file = formData.get('file') as File;
              const companyId = formData.get('companyId') as string;
              const category = formData.get('category') as string;
              const uploadedBy = formData.get('uploadedBy') as string;

              if (!file || !companyId || !uploadedBy) {
                alert('Vyplňte všetky povinné polia');
                return;
              }

              const uploadFile = async () => {
                try {
                  await apiService.uploadFile(file, parseInt(companyId), uploadedBy, category);
                  alert('Dokument bol úspešne nahraný');
                  setShowFileUploadModal(false);
                  // Refresh files list
                  refetchFiles();
                } catch (error) {
                  console.error('Chyba pri nahrávaní dokumentu:', error);
                  alert('Chyba pri nahrávaní dokumentu');
                }
              };

              uploadFile();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Súbor *</label>
                  <input
                    name="file"
                    type="file"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firma *</label>
                  <select
                    name="companyId"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Vyberte firmu</option>
                    {companies?.filter(company => company.status === 'active').map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name} ({company.ico})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategória</label>
                  <select
                    name="category"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Bez kategórie</option>
                    <option value="faktury">Faktúry</option>
                    <option value="doklady">Doklady</option>
                    <option value="zmluvy">Zmluvy</option>
                    <option value="vykazy">Výkazy</option>
                    <option value="ostatne">Ostatné</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nahral *</label>
                  <select
                    name="uploadedBy"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Vyberte používateľa</option>
                    {users?.filter(user => user.status === 'active').map(user => (
                      <option key={user.id} value={user.email}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowFileUploadModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Nahrať
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Assign Company Modal */}
      <AssignCompanyModal
        isOpen={showAssignCompanyModal}
        onClose={() => setShowAssignCompanyModal(false)}
        onAssign={handleAssignAccountants}
        companies={companies || []}
        accountants={users?.filter(user => user.role === 'accountant').map(user => ({
          id: user.id.toString(),
          name: user.name || '',
          email: user.email,
          role: user.role,
          department: 'Účtovníctvo' // Default department
        })) || []}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={showFilePreviewModal}
        onClose={() => {
          setShowFilePreviewModal(false);
          setPreviewFile(null);
        }}
        file={previewFile}
      />

      {/* Email Test Modal */}
      <EmailTestModal
        isOpen={showEmailTestModal}
        onClose={() => setShowEmailTestModal(false)}
      />
    </div>
  );
};

export default React.memo(AdminDashboardContainer);
