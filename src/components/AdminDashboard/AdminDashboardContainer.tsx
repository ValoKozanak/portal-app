import React, { useState, useCallback, useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import { apiService } from '../../services/apiService';
import { taskService } from '../../services/taskService';
import { LoadingSpinner } from '../LoadingSpinner';
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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

type DashboardSection = 'overview' | 'users' | 'companies' | 'tasks' | 'documents' | 'settings';

interface AdminDashboardContainerProps {}

const AdminDashboardContainer: React.FC<AdminDashboardContainerProps> = () => {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null); // Used in task modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('active');

  // API hooks s caching
  const { data: users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useApi(
    () => apiService.getAllUsers(),
    [],
    'admin-users',
    2 * 60 * 1000 // 2 minúty cache
  );

  const { data: companies, loading: companiesLoading, error: companiesError, refetch: refetchCompanies } = useApi(
    () => apiService.getAllCompanies(),
    [],
    'admin-companies',
    2 * 60 * 1000
  );

  const { data: tasks, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useApi(
    () => taskService.getAllTasks(),
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
      tasks: tasks.length,
      activeTasks: tasks.filter(task => task.status === 'pending' || task.status === 'in_progress').length,
      completedTasks: tasks.filter(task => task.status === 'completed').length,
      documents: files.length,
      admins: users.filter(user => user.role === 'admin').length,
      reports: Math.floor(Math.random() * 50) + 10 // Placeholder
    };
  }, [users, companies, tasks, files]);

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
  }, [refetchUsers, refetchCompanies, refetchTasks, refetchFiles]);

  // Admin actions
  const handleUserAction = useCallback((action: 'view' | 'edit' | 'delete', user: any) => {
    setSelectedUser(user);
    switch (action) {
      case 'view':
        // Implement view user details
        break;
      case 'edit':
        setShowUserModal(true);
        break;
      case 'delete':
        if (window.confirm(`Naozaj chcete vymazať používateľa ${user.name}?`)) {
          // Implement delete user
          console.log('Deleting user:', user.id);
        }
        break;
    }
  }, []);

  const handleCompanyAction = useCallback((action: 'view' | 'edit' | 'delete', company: any) => {
    setSelectedCompany(company);
    switch (action) {
      case 'view':
        // Implement view company details
        break;
      case 'edit':
        setShowCompanyModal(true);
        break;
      case 'delete':
        if (window.confirm(`Naozaj chcete vymazať firmu ${company.name}?`)) {
          // Implement delete company
          console.log('Deleting company:', company.id);
        }
        break;
    }
  }, []);

  const handleTaskAction = useCallback((action: 'view' | 'edit' | 'delete', task: any) => {
    setSelectedTask(task);
    switch (action) {
      case 'view':
        // Implement view task details
        break;
      case 'edit':
        setShowTaskModal(true);
        break;
      case 'delete':
        if (window.confirm(`Naozaj chcete vymazať úlohu ${task.title}?`)) {
          // Implement delete task
          console.log('Deleting task:', task.id);
        }
        break;
    }
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  setTaskFilter('active');
                  setActiveSection('tasks');
                }}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer text-left"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <ClipboardDocumentListIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Aktívne úlohy</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeTasks}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Dokončené: {stats.completedTasks}</span>
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
                      {users.map((user) => (
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
              <button
                onClick={() => setShowCompanyModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Pridať firmu
              </button>
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
                      {companies.map((company) => (
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
                            {'accountantName' in company ? (company.accountantName as string) : 'Nepriradený'}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.companyName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignedTo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(task.dueDate).toLocaleDateString('sk-SK')}
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
                onClick={() => {/* Implement file upload */}}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Nahrať dokument
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              {filesLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" text="Načítavam dokumenty..." />
                </div>
              ) : files && files.length > 0 ? (
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
                      {files.map((file) => (
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
                                onClick={() => {/* Implement view file */}}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Zobraziť"
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
                  <p className="text-gray-500">Žiadne dokumenty</p>
                  <button
                    onClick={() => {/* Implement file upload */}}
                    className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  >
                    Nahrať prvý dokument
                  </button>
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
      default:
        return null;
    }
  };

  // Modal components
  const renderModals = () => (
    <>
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meno</label>
                <input
                  type="text"
                  defaultValue={selectedUser?.name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={selectedUser?.email || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rola</label>
                <select
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
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Zrušiť
              </button>
              <button
                onClick={() => {
                  // Implement save user
                  console.log('Saving user:', selectedUser);
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {selectedUser ? 'Uložiť' : 'Pridať'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedCompany ? 'Upraviť firmu' : 'Pridať firmu'}
              </h3>
              <button
                onClick={() => {
                  setShowCompanyModal(false);
                  setSelectedCompany(null);
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Názov firmy</label>
                <input
                  type="text"
                  defaultValue={selectedCompany?.name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IČO</label>
                <input
                  type="text"
                  defaultValue={selectedCompany?.ico || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresa</label>
                <input
                  type="text"
                  defaultValue={selectedCompany?.address || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kontaktná osoba</label>
                <input
                  type="text"
                  defaultValue={selectedCompany?.contactPerson || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={selectedCompany?.email || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  defaultValue={selectedCompany?.status || 'active'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="active">Aktívna</option>
                  <option value="inactive">Neaktívna</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCompanyModal(false);
                  setSelectedCompany(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Zrušiť
              </button>
              <button
                onClick={() => {
                  // Implement save company
                  console.log('Saving company:', selectedCompany);
                  setShowCompanyModal(false);
                  setSelectedCompany(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {selectedCompany ? 'Uložiť' : 'Pridať'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              {(['overview', 'users', 'companies', 'tasks', 'documents', 'settings'] as DashboardSection[]).map((section) => (
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
    </div>
  );
};

export default React.memo(AdminDashboardContainer);
