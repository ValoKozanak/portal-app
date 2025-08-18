import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UsersIcon, 
  DocumentTextIcon,
  CogIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import AddUserModal from '../components/AddUserModal';
import AdminCompaniesList from '../components/AdminCompaniesList';
import CompanyDashboard from '../components/CompanyDashboard';
import AssignCompanyModal from '../components/AssignCompanyModal';
import EditUserModal from '../components/EditUserModal';
import EditCompanyModal from '../components/EditCompanyModal';
import FileUploadModal from '../components/FileUploadModal';
import { taskService } from '../services/taskService';
import { Task } from '../components/TaskModal';
import { apiService, Company, FileData } from '../services/apiService';

const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'companies' | 'tasks' | 'documents' | 'settings'>('overview');
  const [stats, setStats] = useState({
    users: 0,
    documents: 0,
    tasks: 0,
    settings: 23,
    admins: 0,
    reports: 0,
    companies: 0
  });

  const [users, setUsers] = useState<any[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [inactiveCompanies, setInactiveCompanies] = useState<Company[]>([]);
  const [allCompaniesForAssign, setAllCompaniesForAssign] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactiveCompanies, setShowInactiveCompanies] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAssignCompanyModal, setShowAssignCompanyModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [selectedCompanyForEdit, setSelectedCompanyForEdit] = useState<any>(null);
  const [selectedCompanyForDashboard, setSelectedCompanyForDashboard] = useState<any>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [allFiles, setAllFiles] = useState<FileData[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);

  const [systemAlerts, setSystemAlerts] = useState([
    { id: 1, type: 'warning', message: 'Zálohovanie databázy sa nepodarilo', time: '1 hodinu' },
    { id: 2, type: 'info', message: 'Nová verzia systému je dostupná', time: '2 hodiny' },
    { id: 3, type: 'error', message: 'Kritická chyba v systéme', time: '30 minút' },
  ]);

  // Načítanie používateľov z API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await apiService.getAllUsers();
        const usersWithLastLogin = usersData.map(user => ({
          ...user,
          lastLogin: 'Nikdy'
        }));
        setUsers(usersWithLastLogin);
      } catch (error) {
        console.error('Chyba pri načítaní používateľov:', error);
      }
    };

    loadUsers();
  }, []);

  // Načítanie firiem z API
  const loadCompanies = async () => {
    try {
      setLoading(true);
      const [activeCompanies, inactiveCompaniesData, allCompaniesData] = await Promise.all([
        apiService.getAllCompanies(),
        apiService.getInactiveCompanies(),
        apiService.getAllCompaniesForAdmin()
      ]);
      
      setAllCompanies(activeCompanies);
      setInactiveCompanies(inactiveCompaniesData);
      setAllCompaniesForAssign(allCompaniesData);
    } catch (error: any) {
      console.error('Chyba pri načítaní firiem:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  // Automatické obnovenie firiem každých 30 sekúnd
  useEffect(() => {
    const interval = setInterval(() => {
      loadCompanies();
    }, 30000); // 30 sekúnd

    return () => clearInterval(interval);
  }, []);

  // Načítanie úloh
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoadingTasks(true);
        const tasks = await taskService.getAllTasks();
        setAllTasks(tasks);
      } catch (error) {
        console.error('Chyba pri načítaní úloh:', error);
      } finally {
        setLoadingTasks(false);
      }
    };

    loadTasks();
  }, []);

  // Načítanie všetkých súborov
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoadingFiles(true);
        const files = await apiService.getAllFiles();
        setAllFiles(files);
      } catch (error) {
        console.error('Chyba pri načítaní súborov:', error);
      } finally {
        setLoadingFiles(false);
      }
    };

    loadFiles();
  }, []);

  // Aktualizácia štatistík
  useEffect(() => {
    const adminUsers = users.filter(user => user.role === 'admin').length;
    const totalUsers = users.length;
    const totalTasks = allTasks.length;
    const totalCompanies = allCompanies.length;
    const totalAlerts = systemAlerts.length;
    const totalDocuments = allFiles.length;
    
    setStats({
      users: totalUsers,
      documents: totalDocuments,
      tasks: totalTasks,
      settings: 23,
      admins: adminUsers,
      reports: totalAlerts,
      companies: totalCompanies
    });
  }, [users, allTasks, allCompanies, allFiles, systemAlerts]);

  // Handler funkcie
  const handleDeleteUser = (userId: number) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  const handleAddUser = async (userData: { name: string; email: string; password: string; role: string; status: string; phone?: string }) => {
    try {
      const response = await apiService.createUser(userData);
      const newUser = {
        id: response.userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        phone: userData.phone || '',
        lastLogin: 'Nikdy'
      };
      setUsers(prev => [...prev, newUser]);
    } catch (error: any) {
      console.error('Chyba pri vytváraní používateľa:', error.message);
      alert(`Chyba pri vytváraní používateľa: ${error.message}`);
    }
  };

  const handleEditUser = async (userId: number, userData: any) => {
    try {
      await apiService.updateUser(userId, userData);
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...userData } : user
      ));
    } catch (error: any) {
      console.error('Chyba pri aktualizácii používateľa:', error.message);
      alert(`Chyba pri aktualizácii používateľa: ${error.message}`);
    }
  };

  const handleOpenEditUser = (user: any) => {
    setSelectedUserForEdit(user);
    setShowEditUserModal(true);
  };

  const handleDeleteCompany = async (companyId: number) => {
    try {
      await apiService.deleteCompany(companyId);
      setAllCompanies(prev => prev.filter(company => company.id !== companyId));
    } catch (error) {
      console.error('Chyba pri mazaní firmy:', error);
    }
  };

  const handleDeactivateCompany = async (companyId: number) => {
    try {
      await apiService.deactivateCompany(companyId);
      const deactivatedCompany = allCompanies.find(company => company.id === companyId);
      if (deactivatedCompany) {
        setAllCompanies(prev => prev.filter(company => company.id !== companyId));
        setInactiveCompanies(prev => [...prev, { ...deactivatedCompany, status: 'inactive' }]);
      }
    } catch (error) {
      console.error('Chyba pri deaktivácii firmy:', error);
    }
  };

  const handleActivateCompany = async (companyId: number) => {
    try {
      await apiService.activateCompany(companyId);
      const activatedCompany = inactiveCompanies.find(company => company.id === companyId);
      if (activatedCompany) {
        setInactiveCompanies(prev => prev.filter(company => company.id !== companyId));
        setAllCompanies(prev => [...prev, { ...activatedCompany, status: 'active' }]);
      }
    } catch (error) {
      console.error('Chyba pri aktivácii firmy:', error);
    }
  };

  const handleEditCompany = async (companyId: number, companyData: any) => {
    try {
      await apiService.updateCompany(companyId, companyData);
      setAllCompanies(prev => prev.map(company => 
        company.id === companyId ? { ...company, ...companyData } : company
      ));
    } catch (error: any) {
      console.error('Chyba pri aktualizácii firmy:', error.message);
      alert(`Chyba pri aktualizácii firmy: ${error.message}`);
    }
  };

  const handleOpenEditCompany = (company: any) => {
    setSelectedCompanyForEdit(company);
    setShowEditCompanyModal(true);
  };

  const handleOpenCompanyDashboard = (company: any) => {
    setSelectedCompanyForDashboard(company);
  };

  const handleAssignCompany = async (companyId: number, accountantEmails: string[]) => {
    try {
      await apiService.assignAccountantsToCompany(companyId, accountantEmails);
      setAllCompanies(prev => prev.map(company => 
        company.id === companyId 
          ? { ...company, assignedToAccountants: accountantEmails }
          : company
      ));
    } catch (error) {
      console.error('Chyba pri priraďovaní účtovníkov:', error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const updatedTask = await taskService.updateTask(taskId, { status: newStatus });
      if (updatedTask) {
        setAllTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
      }
    } catch (error) {
      console.error('Chyba pri aktualizácii úlohy:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Naozaj chcete vymazať túto úlohu?')) {
      try {
        const success = await taskService.deleteTask(taskId);
        if (success) {
          setAllTasks(prev => prev.filter(task => task.id !== taskId));
        }
      } catch (error) {
        console.error('Chyba pri mazaní úlohy:', error);
      }
    }
  };

  const handleDownloadFile = async (fileId: number, fileName: string) => {
    try {
      const blob = await apiService.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Chyba pri sťahovaní súboru:', error);
      alert('Chyba pri sťahovaní súboru');
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (window.confirm('Naozaj chcete vymazať tento súbor?')) {
      try {
        await apiService.deleteFile(fileId);
        setAllFiles(prev => prev.filter(file => file.id !== fileId));
      } catch (error) {
        console.error('Chyba pri mazaní súboru:', error);
        alert('Chyba pri mazaní súboru');
      }
    }
  };

  const handleFileUpload = (fileData: FileData) => {
    setAllFiles(prev => [fileData, ...prev]);
    setStats(prev => ({ ...prev, documents: prev.documents + 1 }));
  };

  // Helper funkcie pre badge
  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    const labels = {
      active: 'Aktívny',
      inactive: 'Neaktívny',
      pending: 'Čakajúci'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      accountant: 'bg-yellow-100 text-yellow-800',
      moderator: 'bg-yellow-100 text-yellow-800',
      user: 'bg-green-100 text-green-800'
    };
    const roleLabels = {
      admin: 'Admin',
      accountant: 'Účtovník',
      moderator: 'Moderátor',
      user: 'Používateľ'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {roleLabels[role as keyof typeof roleLabels] || role}
      </span>
    );
  };

  const getTaskStatusBadge = (status: string) => {
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        status === 'completed' ? 'bg-green-100 text-green-800' :
        status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
        status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {status === 'completed' ? 'Dokončené' :
         status === 'in_progress' ? 'V spracovaní' :
         status === 'pending' ? 'Čakajúce' :
         status === 'cancelled' ? 'Zrušené' : status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    const labels = {
      urgent: 'Urgentná',
      high: 'Vysoká',
      medium: 'Stredná',
      low: 'Nízka',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority as keyof typeof colors]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return '🖼️';
    } else if (fileType === 'application/pdf') {
      return '📄';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return '📝';
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return '📊';
    } else if (fileType === 'text/plain') {
      return '📄';
    } else {
      return '📎';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'info':
        return <BellIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Prehľad', icon: ChartBarIcon },
              { id: 'users', name: 'Používatelia', icon: UsersIcon },
              { id: 'companies', name: 'Firmy', icon: BuildingOfficeIcon },
              { id: 'tasks', name: 'Úlohy', icon: ClipboardDocumentListIcon },
              { id: 'documents', name: 'Dokumenty', icon: DocumentTextIcon },
              { id: 'settings', name: 'Nastavenia', icon: CogIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeSection === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Sections */}
        {activeSection === 'overview' && (
          <>
            {/* Štatistické karty */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <button 
                onClick={() => setActiveSection('users')}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Celkovo používateľov</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
                    <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setActiveSection('companies')}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BuildingOfficeIcon className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Celkovo firiem</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.companies}</p>
                    <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setActiveSection('tasks')}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClipboardDocumentListIcon className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Všetky úlohy</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.tasks}</p>
                    <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
                  </div>
                </div>
              </button>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Dokumenty</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.documents}</p>
                    <p className="text-xs text-gray-500 mt-1">Celkovo v systéme</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ďalšie informačné karty */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShieldCheckIcon className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Administrátori</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
                    <p className="text-xs text-gray-500 mt-1">Aktívni admini</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Systémové upozornenia</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.reports}</p>
                    <p className="text-xs text-gray-500 mt-1">Aktívne alerty</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CogIcon className="h-8 w-8 text-indigo-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Nastavenia</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.settings}</p>
                    <p className="text-xs text-gray-500 mt-1">Konfigurácie</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Systémové upozornenia */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Systémové upozornenia</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-md">
                      <div className="flex-shrink-0 mt-1">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                        <p className="text-sm text-gray-500">{alert.time}</p>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === 'users' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Správa používateľov</h2>
                  <p className="text-sm text-gray-600 mt-1">Celkovo {users.length} používateľov</p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Pridať používateľa</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Používateľ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rola
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posledné prihlásenie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akcie
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleOpenEditUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Upraviť používateľa"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Vymazať používateľa"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'companies' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Správa firiem</h2>
                  <p className="text-sm text-gray-600 mt-1">Celkovo {allCompanies.length} firiem</p>
                </div>
                <button
                  onClick={() => setShowAssignCompanyModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Priradiť účtovníka</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Načítavam firmy...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Aktívne firmy */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Aktívne firmy</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={loadCompanies}
                          className="text-sm text-green-600 hover:text-green-700 flex items-center"
                          title="Obnoviť zoznam firiem"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Obnoviť
                        </button>
                        <button
                          onClick={() => setShowInactiveCompanies(!showInactiveCompanies)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {showInactiveCompanies ? 'Skryť neaktívne' : 'Zobraziť neaktívne'}
                        </button>
                      </div>
                    </div>
                    <AdminCompaniesList 
                      companies={allCompanies} 
                      onDeactivateCompany={handleDeactivateCompany}
                      onActivateCompany={handleActivateCompany}
                      onOpenDashboard={handleOpenCompanyDashboard}
                      onEditCompany={handleOpenEditCompany}
                    />
                  </div>

                  {/* Neaktívne firmy */}
                  {showInactiveCompanies && inactiveCompanies.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Neaktívne firmy</h3>
                      <AdminCompaniesList 
                        companies={inactiveCompanies} 
                        onDeactivateCompany={handleDeactivateCompany}
                        onActivateCompany={handleActivateCompany}
                        onOpenDashboard={handleOpenCompanyDashboard}
                        onEditCompany={handleOpenEditCompany}
                        showInactive={true}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'tasks' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Všetky úlohy zo všetkých firiem</h2>
            </div>
            <div className="p-6">
              {loadingTasks ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Načítavam úlohy...</p>
                </div>
              ) : allTasks.length > 0 ? (
                <div className="space-y-4">
                  {allTasks.map((task) => (
                    <div key={task.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                              <span>{task.companyName}</span>
                            </div>
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-1" />
                              <span>Priradené: {task.assignedTo}</span>
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                <span>Termín: {new Date(task.dueDate).toLocaleDateString('sk-SK')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          {getTaskStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                          Vytvoril: {task.createdBy}
                        </div>
                        <div className="flex space-x-2">
                          {task.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Začať prácu
                            </button>
                          )}
                          {task.status === 'in_progress' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              Dokončiť
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Vymazať
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne úlohy</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Zatiaľ neboli vytvorené žiadne úlohy.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'documents' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Všetky dokumenty v portáli</h2>
                  <p className="text-sm text-gray-600 mt-1">Celkovo {allFiles.length} dokumentov</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowFileUploadModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Nahrať súbor
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    title="Obnoviť zoznam dokumentov"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Obnoviť
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {loadingFiles ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Načítavam dokumenty...</p>
                </div>
              ) : allFiles.length > 0 ? (
                <div className="space-y-4">
                  {allFiles.map((file) => (
                    <div key={file.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="text-2xl">
                            {getFileTypeIcon(file.file_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                              {file.original_name}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                              <span>Veľkosť: {formatFileSize(file.file_size)}</span>
                              <span>Typ: {file.file_type}</span>
                              {file.company_name && (
                                <span>Firma: {file.company_name}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Nahral: {file.uploaded_by}</span>
                              <span>Dátum: {new Date(file.created_at).toLocaleDateString('sk-SK')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleDownloadFile(file.id, file.original_name)}
                            className="text-blue-600 hover:text-blue-700 p-2 rounded-md hover:bg-blue-50"
                            title="Stiahnuť súbor"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-red-600 hover:text-red-700 p-2 rounded-md hover:bg-red-50"
                            title="Vymazať súbor"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne dokumenty</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Zatiaľ neboli nahrané žiadne dokumenty do portálu.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}



        {activeSection === 'settings' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Nastavenia systému</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600">Nastavenia systému budú dostupné v ďalšej verzii.</p>
            </div>
          </div>
        )}

        {/* Modálne okná */}
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onAddUser={handleAddUser}
        />

        <EditUserModal
          isOpen={showEditUserModal}
          onClose={() => {
            setShowEditUserModal(false);
            setSelectedUserForEdit(null);
          }}
          onSave={handleEditUser}
          user={selectedUserForEdit}
        />

        <EditCompanyModal
          isOpen={showEditCompanyModal}
          onClose={() => {
            setShowEditCompanyModal(false);
            setSelectedCompanyForEdit(null);
          }}
          onSave={handleEditCompany}
          company={selectedCompanyForEdit}
        />

        <AssignCompanyModal
          isOpen={showAssignCompanyModal}
          onClose={() => setShowAssignCompanyModal(false)}
          onAssign={handleAssignCompany}
          companies={allCompaniesForAssign}
          accountants={users.filter(user => user.role === 'accountant')}
        />

        {selectedCompanyForDashboard && (
          <CompanyDashboard
            company={selectedCompanyForDashboard}
            onClose={() => setSelectedCompanyForDashboard(null)}
          />
        )}

        {/* File Upload Modal */}
        {allCompanies.length > 0 && (
          <FileUploadModal
            isOpen={showFileUploadModal}
            onClose={() => setShowFileUploadModal(false)}
            companies={allCompanies}
            onFileUpload={handleFileUpload}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

